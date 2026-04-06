# apps/sms/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import serializers as drf_serializers, status
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics

from apps.sms.models import SMSLog
from apps.sms.tasks import send_single_sms
from utils.permissions import IsAdminUser


class SMSLogSerializer(drf_serializers.ModelSerializer):
    student_name = drf_serializers.SerializerMethodField()
    sms_type_display = drf_serializers.ReadOnlyField(source='get_sms_type_display')
    status_display = drf_serializers.ReadOnlyField(source='get_status_display')

    class Meta:
        model = SMSLog
        fields = ['id', 'phone', 'message', 'sms_type', 'sms_type_display',
                  'status', 'status_display', 'student_name', 'sent_at', 'created_at']

    def get_student_name(self, obj):
        return obj.student.full_name if obj.student else None


class SMSLogListView(generics.ListAPIView):
    """SMS tarixi"""
    serializer_class = SMSLogSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'sms_type', 'student']

    def get_queryset(self):
        return SMSLog.objects.select_related('student', 'sent_by').order_by('-created_at')


class SendManualSMSView(APIView):
    """Qo'lda SMS yuborish"""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        phone = request.data.get('phone', '').strip()
        message = request.data.get('message', '').strip()
        student_id = request.data.get('student_id')

        if not phone or not message:
            return Response({'error': 'Telefon va xabar kiritilishi shart'}, status=400)

        if len(message) > 160:
            return Response({'error': 'Xabar 160 belgidan oshmasligi kerak'}, status=400)

        task = send_single_sms.delay(
            phone=phone,
            message=message,
            student_id=student_id,
            sent_by_id=request.user.id,
        )

        return Response({
            'success': True,
            'message': 'SMS navbatga qo\'yildi',
            'task_id': task.id,
        })


# apps/sms/urls.py
from django.urls import path

urlpatterns = [
    path('logs/', SMSLogListView.as_view(), name='sms-logs'),
    path('send/', SendManualSMSView.as_view(), name='sms-send'),
]
