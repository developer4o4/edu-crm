from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count, Q
from django.utils import timezone

from apps.students.models import Student, Teacher
from apps.students.serializers import (
    StudentSerializer, StudentDetailSerializer,
    StudentCreateSerializer, TeacherSerializer
)
from utils.permissions import IsAdminOrReadOnly, IsAdminUser


class StudentViewSet(viewsets.ModelViewSet):
    """
    O'quvchilar CRUD + qo'shimcha endpointlar
    GET    /api/v1/students/           - ro'yxat
    POST   /api/v1/students/           - yangi qo'shish
    GET    /api/v1/students/{id}/      - batafsil
    PUT    /api/v1/students/{id}/      - tahrirlash
    DELETE /api/v1/students/{id}/      - o'chirish
    GET    /api/v1/students/{id}/payments/   - to'lovlar
    GET    /api/v1/students/{id}/attendance/ - davomat
    POST   /api/v1/students/{id}/add_to_group/ - guruhga qo'shish
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'group_memberships__group']
    search_fields = ['first_name', 'last_name', 'phone']
    ordering_fields = ['last_name', 'created_at']
    ordering = ['last_name']

    def get_queryset(self):
        qs = Student.objects.all().prefetch_related(
            'group_memberships__group__course',
            'group_memberships__group__teacher',
        )

        # Filter: faqat qarzdorlar
        if self.request.query_params.get('debtors_only') == 'true':
            today = timezone.now().date()
            paid_ids = __import__('apps.payments.models', fromlist=['Payment']).Payment.objects.filter(
                status='paid',
                month__year=today.year,
                month__month=today.month,
            ).values_list('student_id', flat=True)
            qs = qs.filter(
                status=Student.Status.ACTIVE,
                group_memberships__is_active=True,
            ).exclude(id__in=paid_ids).distinct()

        return qs

    def get_serializer_class(self):
        if self.action == 'create':
            return StudentCreateSerializer
        if self.action in ('retrieve', 'update', 'partial_update'):
            return StudentDetailSerializer
        return StudentSerializer

    @action(detail=True, methods=['get'])
    def payments(self, request, pk=None):
        """O'quvchining to'lovlar tarixi"""
        from apps.payments.models import Payment
        from apps.payments.serializers import PaymentListSerializer

        student = self.get_object()
        payments = Payment.objects.filter(student=student).order_by('-created_at')

        # Summary
        total_paid = payments.filter(status=Payment.Status.PAID).aggregate(
            total=Sum('amount'))['total'] or 0

        return Response({
            'total_paid': float(total_paid),
            'payments': PaymentListSerializer(payments, many=True).data,
        })

    @action(detail=True, methods=['get'])
    def attendance(self, request, pk=None):
        """O'quvchining davomat statistikasi"""
        from apps.attendance.models import Attendance

        student = self.get_object()
        records = Attendance.objects.filter(student=student).select_related('session__group')

        total = records.count()
        present = records.filter(status='present').count()
        absent = records.filter(status='absent').count()
        late = records.filter(status='late').count()

        # By group
        from apps.groups.models import Group
        by_group = []
        for membership in student.group_memberships.filter(is_active=True):
            group = membership.group
            group_records = records.filter(session__group=group)
            by_group.append({
                'group': group.name,
                'total': group_records.count(),
                'present': group_records.filter(status='present').count(),
                'absent': group_records.filter(status='absent').count(),
                'late': group_records.filter(status='late').count(),
            })

        return Response({
            'summary': {
                'total': total,
                'present': present,
                'absent': absent,
                'late': late,
                'attendance_rate': round((present / total * 100) if total else 0, 1),
            },
            'by_group': by_group,
        })

    @action(detail=True, methods=['post'])
    def add_to_group(self, request, pk=None):
        """O'quvchini guruhga qo'shish"""
        from apps.groups.models import Group, GroupMembership
        from apps.sms.models import send_sms_and_log, SMSLog, welcome_message

        student = self.get_object()
        group_id = request.data.get('group_id')
        discount = request.data.get('discount_percent', 0)

        try:
            group = Group.objects.get(id=group_id, is_active=True)
        except Group.DoesNotExist:
            return Response({'error': 'Guruh topilmadi'}, status=404)

        if group.is_full:
            return Response({'error': 'Guruh to\'la'}, status=400)

        membership, created = GroupMembership.objects.get_or_create(
            student=student,
            group=group,
            is_active=True,
            defaults={'discount_percent': discount}
        )

        if not created:
            return Response({'error': 'O\'quvchi bu guruhda allaqachon bor'}, status=400)

        # Welcome SMS
        send_sms_and_log(
            phone=student.phone,
            message=welcome_message(student.first_name, group.name),
            sms_type=SMSLog.SMSType.WELCOME,
            student=student,
            group=group,
            sent_by=request.user,
        )

        return Response({'success': True, 'message': f"{student.full_name} {group.name} guruhiga qo'shildi"})

    @action(detail=True, methods=['post'])
    def remove_from_group(self, request, pk=None):
        """Guruhdan chiqarish"""
        from apps.groups.models import GroupMembership

        student = self.get_object()
        group_id = request.data.get('group_id')

        membership = GroupMembership.objects.filter(
            student=student, group_id=group_id, is_active=True
        ).first()

        if not membership:
            return Response({'error': 'Guruh a\'zoligi topilmadi'}, status=404)

        membership.leave()
        return Response({'success': True})


class TeacherViewSet(viewsets.ModelViewSet):
    queryset = Teacher.objects.filter(is_active=True).select_related('user')
    serializer_class = TeacherSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    search_fields = ['first_name', 'last_name', 'phone']
