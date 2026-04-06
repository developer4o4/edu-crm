from django.db import models
from django.utils import timezone
import uuid


class Payment(models.Model):
    """To'lov"""

    class Status(models.TextChoices):
        PENDING = 'pending', 'Kutilmoqda'
        PAID = 'paid', "To'langan"
        CANCELLED = 'cancelled', 'Bekor qilingan'
        REFUNDED = 'refunded', 'Qaytarilgan'

    class PaymentType(models.TextChoices):
        CASH = 'cash', 'Naqd'
        CARD = 'card', 'Karta'
        PAYME = 'payme', 'Payme'
        TRANSFER = 'transfer', "O'tkazma"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        'students.Student', on_delete=models.PROTECT, related_name='payments'
    )
    group = models.ForeignKey(
        'groups.Group', on_delete=models.PROTECT, related_name='payments', null=True, blank=True
    )
    amount = models.DecimalField(max_digits=14, decimal_places=2, verbose_name="Summa (UZS)")
    payment_type = models.CharField(max_length=20, choices=PaymentType.choices, default=PaymentType.CASH)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    month = models.DateField(verbose_name="Qaysi oy uchun", help_text="YYYY-MM-01 formatida")
    description = models.TextField(blank=True)
    received_by = models.ForeignKey(
        'students.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='received_payments'
    )
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def mark_paid(self, received_by=None):
        self.status = self.Status.PAID
        self.paid_at = timezone.now()
        if received_by:
            self.received_by = received_by
        self.save()

    class Meta:
        verbose_name = "To'lov"
        verbose_name_plural = "To'lovlar"
        ordering = ['-created_at']


class PaymeTransaction(models.Model):
    """Payme tranzaksiya"""

    class State(models.IntegerChoices):
        PENDING = 1, 'Kutilmoqda'
        COMPLETED = 2, 'Bajarilgan'
        CANCELLED = -1, 'Bekor qilingan'
        CANCELLED_AFTER_COMPLETE = -2, "Bajarilgandan so'ng bekor qilingan"

    transaction_id = models.CharField(max_length=255, unique=True, verbose_name="Payme transaction ID")
    payment = models.OneToOneField(Payment, on_delete=models.PROTECT, related_name='payme_transaction')
    amount = models.BigIntegerField(verbose_name="Summa (tiyin)")  # Payme sends in tiyin
    state = models.IntegerField(choices=State.choices, default=State.PENDING)
    create_time = models.BigIntegerField(null=True, blank=True)
    perform_time = models.BigIntegerField(null=True, blank=True)
    cancel_time = models.BigIntegerField(null=True, blank=True)
    reason = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Payme tranzaksiya"
        verbose_name_plural = "Payme tranzaksiyalar"
