from rest_framework import serializers
from apps.payments.models import Payment, PaymeTransaction
from django.utils import timezone


class PaymentListSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='student.full_name')
    student_phone = serializers.ReadOnlyField(source='student.phone')
    group_name = serializers.SerializerMethodField()
    payment_type_display = serializers.ReadOnlyField(source='get_payment_type_display')
    status_display = serializers.ReadOnlyField(source='get_status_display')

    class Meta:
        model = Payment
        fields = ['id', 'student_name', 'student_phone', 'group_name',
                  'amount', 'payment_type', 'payment_type_display',
                  'status', 'status_display', 'month', 'paid_at', 'created_at']

    def get_group_name(self, obj):
        return obj.group.name if obj.group else '—'


class PaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='student.full_name')
    group_name = serializers.SerializerMethodField()
    received_by_name = serializers.SerializerMethodField()
    payme_link = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = ['id', 'student', 'student_name', 'group', 'group_name',
                  'amount', 'payment_type', 'status', 'month', 'description',
                  'received_by', 'received_by_name', 'paid_at', 'payme_link', 'created_at']
        read_only_fields = ['received_by', 'paid_at']

    def get_group_name(self, obj):
        return obj.group.name if obj.group else None

    def get_received_by_name(self, obj):
        return obj.received_by.get_full_name() if obj.received_by else None

    def get_payme_link(self, obj):
        if obj.status == Payment.Status.PENDING and obj.payment_type == Payment.PaymentType.PAYME:
            from apps.payments.payme import generate_payme_link
            return generate_payme_link(obj)
        return None


class PaymentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['student', 'group', 'amount', 'payment_type', 'month', 'description']

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Summa 0 dan katta bo'lishi kerak")
        return value

    def validate_month(self, value):
        # Ensure month is first day of month
        return value.replace(day=1)

    def validate(self, data):
        # Check for duplicate payment same month + student + group
        student = data.get('student')
        group = data.get('group')
        month = data.get('month')

        if student and month:
            existing = Payment.objects.filter(
                student=student,
                group=group,
                month=month,
                status=Payment.Status.PAID,
            ).exists()
            if existing:
                raise serializers.ValidationError(
                    f"{month.strftime('%B %Y')} oyi uchun to'lov allaqachon amalga oshirilgan"
                )

        return data
