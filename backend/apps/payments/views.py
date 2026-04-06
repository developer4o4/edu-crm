from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count
from django.utils import timezone

from apps.payments.models import Payment
from apps.payments.serializers import PaymentSerializer, PaymentListSerializer, PaymentCreateSerializer
from utils.permissions import IsAdminUser


class PaymentViewSet(viewsets.ModelViewSet):
    """
    To'lovlar CRUD
    GET  /api/v1/payments/           - ro'yxat
    POST /api/v1/payments/           - yangi to'lov qo'shish (naqd/karta)
    GET  /api/v1/payments/summary/   - oylik/yillik umumiy
    GET  /api/v1/payments/debtors/   - qarzdorlar ro'yxati
    POST /api/v1/payments/{id}/generate_payme_link/ - Payme havolasi
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'payment_type', 'student', 'group']
    search_fields = ['student__first_name', 'student__last_name', 'student__phone']
    ordering_fields = ['created_at', 'amount', 'paid_at']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = Payment.objects.select_related('student', 'group', 'received_by')

        # Date range filter
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)

        # Month filter
        month = self.request.query_params.get('month')  # YYYY-MM
        if month:
            try:
                year, mon = map(int, month.split('-'))
                qs = qs.filter(month__year=year, month__month=mon)
            except (ValueError, AttributeError):
                pass

        return qs

    def get_serializer_class(self):
        if self.action == 'create':
            return PaymentCreateSerializer
        if self.action in ('list',):
            return PaymentListSerializer
        return PaymentSerializer

    def perform_create(self, serializer):
        payment = serializer.save(received_by=self.request.user)
        # If cash/card payment, mark as paid immediately
        if payment.payment_type in (Payment.PaymentType.CASH, Payment.PaymentType.CARD):
            payment.mark_paid(received_by=self.request.user)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """To'lovlar xulosasi"""
        today = timezone.now().date()

        today_data = Payment.objects.filter(
            status=Payment.Status.PAID,
            paid_at__date=today,
        ).aggregate(total=Sum('amount'), count=Count('id'))

        monthly_data = Payment.objects.filter(
            status=Payment.Status.PAID,
            paid_at__year=today.year,
            paid_at__month=today.month,
        ).aggregate(total=Sum('amount'), count=Count('id'))

        yearly_data = Payment.objects.filter(
            status=Payment.Status.PAID,
            paid_at__year=today.year,
        ).aggregate(total=Sum('amount'), count=Count('id'))

        # By payment type (this month)
        by_type = Payment.objects.filter(
            status=Payment.Status.PAID,
            paid_at__year=today.year,
            paid_at__month=today.month,
        ).values('payment_type').annotate(
            total=Sum('amount'),
            count=Count('id'),
        )

        return Response({
            'today': {
                'amount': float(today_data['total'] or 0),
                'count': today_data['count'] or 0,
            },
            'monthly': {
                'amount': float(monthly_data['total'] or 0),
                'count': monthly_data['count'] or 0,
            },
            'yearly': {
                'amount': float(yearly_data['total'] or 0),
                'count': yearly_data['count'] or 0,
            },
            'by_type': [
                {
                    'type': item['payment_type'],
                    'label': dict(Payment.PaymentType.choices)[item['payment_type']],
                    'amount': float(item['total'] or 0),
                    'count': item['count'],
                }
                for item in by_type
            ],
        })

    @action(detail=False, methods=['get'])
    def debtors(self, request):
        """Qarzdorlar ro'yxati"""
        from apps.students.models import Student

        today = timezone.now().date()

        paid_this_month = Payment.objects.filter(
            status=Payment.Status.PAID,
            month__year=today.year,
            month__month=today.month,
        ).values_list('student_id', flat=True).distinct()

        debtors = Student.objects.filter(
            status=Student.Status.ACTIVE,
            group_memberships__is_active=True,
        ).exclude(id__in=paid_this_month).distinct().prefetch_related(
            'group_memberships__group'
        )

        result = []
        for student in debtors:
            groups = [m.group.name for m in student.group_memberships.filter(is_active=True)]
            result.append({
                'id': student.id,
                'full_name': student.full_name,
                'phone': student.phone,
                'groups': groups,
                'months_unpaid': 1,  # simplification
            })

        return Response({'count': len(result), 'debtors': result})

    @action(detail=True, methods=['post'])
    def generate_payme_link(self, request, pk=None):
        """Payme to'lov havolasi generatsiya qilish"""
        from apps.payments.payme import generate_payme_link

        payment = self.get_object()
        if payment.status == Payment.Status.PAID:
            return Response({'error': 'Bu to\'lov allaqachon amalga oshirilgan'}, status=400)

        link = generate_payme_link(payment)
        return Response({
            'payment_id': str(payment.id),
            'amount': float(payment.amount),
            'payme_link': link,
        })
