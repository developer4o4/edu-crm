"""
Payme Merchant API integration
Documentation: https://developer.paycom.uz/docs
"""
import base64
import hashlib
import json
import logging
from decimal import Decimal

from django.conf import settings
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.utils import timezone

from .models import Payment, PaymeTransaction

logger = logging.getLogger(__name__)

# Payme error codes
PARSE_ERROR = -32700
METHOD_NOT_FOUND = -32601
INVALID_PARAMS = -32600
INTERNAL_ERROR = -32603

ORDER_NOT_FOUND = -31001
ORDER_ALREADY_PAID = -31099
INVALID_AMOUNT = -31001
TRANSACTION_NOT_FOUND = -31003
TRANSACTION_CANCELLED = -31008
UNABLE_TO_COMPLETE = -31008
UNABLE_TO_CANCEL = -31007


@method_decorator(csrf_exempt, name='dispatch')
class PaymeCallbackView(View):
    """Payme Merchant API callback handler"""

    def post(self, request):
        try:
            # Verify authorization
            if not self._verify_auth(request):
                return self._error(INVALID_PARAMS, "Unauthorized", id=None)

            body = json.loads(request.body)
            method = body.get('method')
            params = body.get('params', {})
            req_id = body.get('id')

            handlers = {
                'CheckPerformTransaction': self.check_perform_transaction,
                'CreateTransaction': self.create_transaction,
                'PerformTransaction': self.perform_transaction,
                'CancelTransaction': self.cancel_transaction,
                'CheckTransaction': self.check_transaction,
                'GetStatement': self.get_statement,
            }

            handler = handlers.get(method)
            if not handler:
                return self._error(METHOD_NOT_FOUND, "Method not found", req_id)

            return handler(params, req_id)

        except json.JSONDecodeError:
            return self._error(PARSE_ERROR, "Parse error", None)
        except Exception as e:
            logger.exception("Payme callback error: %s", e)
            return self._error(INTERNAL_ERROR, "Internal error", None)

    def _verify_auth(self, request):
        """Verify Payme Basic Auth"""
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Basic '):
            return False
        try:
            decoded = base64.b64decode(auth_header[6:]).decode('utf-8')
            _, password = decoded.split(':', 1)
            expected = settings.PAYME_TEST_SECRET_KEY if settings.PAYME_TEST_MODE else settings.PAYME_SECRET_KEY
            return password == expected
        except Exception:
            return False

    def check_perform_transaction(self, params, req_id):
        """CheckPerformTransaction - validate order before payment"""
        account = params.get('account', {})
        payment_id = account.get('payment_id')
        amount = params.get('amount', 0)

        try:
            payment = Payment.objects.get(id=payment_id, status=Payment.Status.PENDING)
        except Payment.DoesNotExist:
            return self._error(ORDER_NOT_FOUND, "Payment not found", req_id)

        # Validate amount (Payme sends in tiyin, 1 UZS = 100 tiyin)
        expected_amount = int(payment.amount * 100)
        if amount != expected_amount:
            return self._error(INVALID_AMOUNT, "Invalid amount", req_id)

        return self._success({'allow': True}, req_id)

    def create_transaction(self, params, req_id):
        """CreateTransaction - create or return existing transaction"""
        account = params.get('account', {})
        payment_id = account.get('payment_id')
        transaction_id = params.get('id')
        amount = params.get('amount', 0)
        create_time = params.get('time')

        try:
            payment = Payment.objects.get(id=payment_id, status=Payment.Status.PENDING)
        except Payment.DoesNotExist:
            return self._error(ORDER_NOT_FOUND, "Payment not found", req_id)

        # Check if transaction already exists
        try:
            transaction = PaymeTransaction.objects.get(transaction_id=transaction_id)
            if transaction.state == PaymeTransaction.State.CANCELLED:
                return self._error(UNABLE_TO_COMPLETE, "Transaction cancelled", req_id)
        except PaymeTransaction.DoesNotExist:
            # Check if payment already has a completed transaction
            if hasattr(payment, 'payme_transaction'):
                existing = payment.payme_transaction
                if existing.state == PaymeTransaction.State.COMPLETED:
                    return self._error(ORDER_ALREADY_PAID, "Order already paid", req_id)

            transaction = PaymeTransaction.objects.create(
                transaction_id=transaction_id,
                payment=payment,
                amount=amount,
                state=PaymeTransaction.State.PENDING,
                create_time=create_time,
            )

        return self._success({
            'create_time': transaction.create_time,
            'transaction': str(transaction.transaction_id),
            'state': transaction.state,
        }, req_id)

    def perform_transaction(self, params, req_id):
        """PerformTransaction - mark payment as completed"""
        transaction_id = params.get('id')

        try:
            transaction = PaymeTransaction.objects.select_related('payment').get(
                transaction_id=transaction_id
            )
        except PaymeTransaction.DoesNotExist:
            return self._error(TRANSACTION_NOT_FOUND, "Transaction not found", req_id)

        if transaction.state == PaymeTransaction.State.COMPLETED:
            return self._success({
                'transaction': str(transaction.transaction_id),
                'perform_time': transaction.perform_time,
                'state': transaction.state,
            }, req_id)

        if transaction.state != PaymeTransaction.State.PENDING:
            return self._error(UNABLE_TO_COMPLETE, "Unable to complete", req_id)

        perform_time = int(timezone.now().timestamp() * 1000)
        transaction.state = PaymeTransaction.State.COMPLETED
        transaction.perform_time = perform_time
        transaction.save()

        # Mark payment as paid
        transaction.payment.mark_paid()

        logger.info("Payment %s completed via Payme", transaction.payment.id)

        return self._success({
            'transaction': str(transaction.transaction_id),
            'perform_time': perform_time,
            'state': PaymeTransaction.State.COMPLETED,
        }, req_id)

    def cancel_transaction(self, params, req_id):
        """CancelTransaction"""
        transaction_id = params.get('id')
        reason = params.get('reason')

        try:
            transaction = PaymeTransaction.objects.select_related('payment').get(
                transaction_id=transaction_id
            )
        except PaymeTransaction.DoesNotExist:
            return self._error(TRANSACTION_NOT_FOUND, "Transaction not found", req_id)

        cancel_time = int(timezone.now().timestamp() * 1000)

        if transaction.state == PaymeTransaction.State.PENDING:
            transaction.state = PaymeTransaction.State.CANCELLED
        elif transaction.state == PaymeTransaction.State.COMPLETED:
            transaction.state = PaymeTransaction.State.CANCELLED_AFTER_COMPLETE
            transaction.payment.status = Payment.Status.CANCELLED
            transaction.payment.save()
        else:
            return self._error(UNABLE_TO_CANCEL, "Unable to cancel", req_id)

        transaction.cancel_time = cancel_time
        transaction.reason = reason
        transaction.save()

        return self._success({
            'transaction': str(transaction.transaction_id),
            'cancel_time': cancel_time,
            'state': transaction.state,
        }, req_id)

    def check_transaction(self, params, req_id):
        """CheckTransaction"""
        transaction_id = params.get('id')

        try:
            transaction = PaymeTransaction.objects.get(transaction_id=transaction_id)
        except PaymeTransaction.DoesNotExist:
            return self._error(TRANSACTION_NOT_FOUND, "Transaction not found", req_id)

        return self._success({
            'create_time': transaction.create_time,
            'perform_time': transaction.perform_time,
            'cancel_time': transaction.cancel_time,
            'transaction': str(transaction.transaction_id),
            'state': transaction.state,
            'reason': transaction.reason,
        }, req_id)

    def get_statement(self, params, req_id):
        """GetStatement - list transactions in date range"""
        from_time = params.get('from', 0)
        to_time = params.get('to', 0)

        transactions = PaymeTransaction.objects.filter(
            create_time__gte=from_time,
            create_time__lte=to_time,
        ).select_related('payment')

        result = []
        for t in transactions:
            result.append({
                'id': str(t.transaction_id),
                'time': t.create_time,
                'amount': t.amount,
                'account': {'payment_id': str(t.payment.id)},
                'create_time': t.create_time,
                'perform_time': t.perform_time or 0,
                'cancel_time': t.cancel_time or 0,
                'transaction': str(t.transaction_id),
                'state': t.state,
                'reason': t.reason,
            })

        return self._success({'transactions': result}, req_id)

    @staticmethod
    def _success(result, req_id):
        return JsonResponse({'jsonrpc': '2.0', 'id': req_id, 'result': result})

    @staticmethod
    def _error(code, message, req_id):
        return JsonResponse({
            'jsonrpc': '2.0',
            'id': req_id,
            'error': {'code': code, 'message': {'uz': message, 'ru': message, 'en': message}},
        }, status=200)


def generate_payme_link(payment):
    """Generate Payme checkout link for student self-payment"""
    merchant_id = settings.PAYME_MERCHANT_ID
    amount = int(payment.amount * 100)  # Convert to tiyin
    account = f"payment_id={payment.id}"

    if settings.PAYME_TEST_MODE:
        base_url = "https://checkout.test.paycom.uz"
    else:
        base_url = "https://checkout.paycom.uz"

    params = f"m={merchant_id};ac.{account};a={amount}"
    encoded = base64.b64encode(params.encode()).decode()
    return f"{base_url}/{encoded}"
