"""
Eskiz.uz SMS API integration
Documentation: https://eskiz.uz/api
"""
import logging
import requests
from django.conf import settings
from django.db import models
from django.utils import timezone

logger = logging.getLogger(__name__)


class SMSLog(models.Model):
    """SMS yuborish tarixi"""

    class Status(models.TextChoices):
        PENDING = 'pending', 'Kutilmoqda'
        SENT = 'sent', 'Yuborildi'
        DELIVERED = 'delivered', 'Yetkazildi'
        FAILED = 'failed', 'Xato'

    class SMSType(models.TextChoices):
        PAYMENT_REMINDER = 'payment_reminder', "To'lov eslatma"
        DEBT_REMINDER = 'debt_reminder', 'Qarz eslatma'
        MANUAL = 'manual', 'Qo\'lda yuborilgan'
        WELCOME = 'welcome', 'Xush kelibsiz'
        CUSTOM = 'custom', 'Boshqa'

    phone = models.CharField(max_length=13)
    message = models.TextField()
    sms_type = models.CharField(max_length=30, choices=SMSType.choices, default=SMSType.CUSTOM)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    student = models.ForeignKey(
        'students.Student', on_delete=models.SET_NULL, null=True, blank=True, related_name='sms_logs'
    )
    group = models.ForeignKey(
        'groups.Group', on_delete=models.SET_NULL, null=True, blank=True
    )
    sent_by = models.ForeignKey(
        'students.User', on_delete=models.SET_NULL, null=True, blank=True
    )
    provider_message_id = models.CharField(max_length=100, blank=True)
    error_message = models.TextField(blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "SMS tarixi"
        verbose_name_plural = "SMS tarixi"
        ordering = ['-created_at']


class EskizSMSService:
    """Eskiz.uz SMS service"""

    BASE_URL = "https://notify.eskiz.uz/api"
    _token = None
    _token_expires = None

    @classmethod
    def get_token(cls):
        """Get or refresh auth token"""
        if cls._token and cls._token_expires and timezone.now() < cls._token_expires:
            return cls._token

        response = requests.post(f"{cls.BASE_URL}/auth/login", data={
            'email': settings.ESKIZ_EMAIL,
            'password': settings.ESKIZ_PASSWORD,
        }, timeout=10)

        if response.status_code == 200:
            data = response.json()
            cls._token = data['data']['token']
            # Token expires in 30 days, refresh every 25 days
            from datetime import timedelta
            cls._token_expires = timezone.now() + timedelta(days=25)
            return cls._token

        logger.error("Eskiz auth failed: %s", response.text)
        raise Exception("SMS service authentication failed")

    @classmethod
    def send_sms(cls, phone: str, message: str) -> dict:
        """Send single SMS"""
        token = cls.get_token()
        # Normalize phone: remove +, add 998 prefix
        normalized_phone = phone.replace('+', '').replace(' ', '')

        response = requests.post(
            f"{cls.BASE_URL}/message/sms/send",
            headers={'Authorization': f'Bearer {token}'},
            data={
                'mobile_phone': normalized_phone,
                'message': message,
                'from': settings.ESKIZ_FROM,
                'callback_url': '',
            },
            timeout=15
        )

        if response.status_code == 200:
            data = response.json()
            return {
                'success': True,
                'message_id': data.get('data', {}).get('id', ''),
            }

        logger.error("SMS send failed for %s: %s", phone, response.text)
        return {'success': False, 'error': response.text}

    @classmethod
    def send_bulk_sms(cls, messages: list[dict]) -> list[dict]:
        """Send bulk SMS - messages = [{'phone': '...', 'message': '...'}]"""
        results = []
        for msg in messages:
            result = cls.send_sms(msg['phone'], msg['message'])
            results.append({**msg, **result})
        return results


def send_sms_and_log(
    phone: str,
    message: str,
    sms_type: str = SMSLog.SMSType.CUSTOM,
    student=None,
    group=None,
    sent_by=None,
) -> SMSLog:
    """Send SMS and save to log"""
    log = SMSLog.objects.create(
        phone=phone,
        message=message,
        sms_type=sms_type,
        student=student,
        group=group,
        sent_by=sent_by,
        status=SMSLog.Status.PENDING,
    )

    try:
        result = EskizSMSService.send_sms(phone, message)
        if result['success']:
            log.status = SMSLog.Status.SENT
            log.provider_message_id = result.get('message_id', '')
            log.sent_at = timezone.now()
        else:
            log.status = SMSLog.Status.FAILED
            log.error_message = result.get('error', '')
    except Exception as e:
        log.status = SMSLog.Status.FAILED
        log.error_message = str(e)
        logger.exception("SMS sending exception: %s", e)

    log.save()
    return log


# SMS Templates
def payment_reminder_message(first_name: str, last_name: str, month: str) -> str:
    return (
        f"Hurmatli {last_name} {first_name}, {month} oyi uchun "
        f"kurs to'lovini amalga oshirishingizni so'raymiz. "
        f"To'lov uchun: educrm.uz/pay"
    )


def debt_reminder_message(first_name: str, last_name: str, debt_amount: int, months_count: int) -> str:
    return (
        f"Hurmatli {last_name} {first_name}, sizning {months_count} oylik "
        f"to'lovingiz ({debt_amount:,} UZS) hali amalga oshirilmagan. "
        f"Iltimos, qarzni to'lang. Aloqa: +998901234567"
    )


def welcome_message(first_name: str, group_name: str) -> str:
    return (
        f"Hurmatli {first_name}, o'quv markazimizga xush kelibsiz! "
        f"Siz {group_name} guruhiga qo'shildingiz. Muvaffaqiyatlar!"
    )
