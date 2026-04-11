from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count, Q
from django.utils import timezone

from apps.students.models import Student, Teacher, User
from apps.students.serializers import (
    StudentSerializer, StudentDetailSerializer,
    StudentCreateSerializer, TeacherSerializer, TeacherCreateSerializer
)
from utils.permissions import IsAdminOrReadOnly, IsAdminUser


def create_student_user(student):
    """
    O'quvchi uchun avtomatik User yaratish.
    Username: telefon raqami (+ belgisisiz)
    Parol: telefon oxirgi 4 raqami
    """
    # Username: +998901234567 -> 998901234567
    username = student.phone.replace('+', '').replace(' ', '')
    # Parol: oxirgi 4 raqam -> 4567
    password = username[-4:]

    # Agar bu username allaqachon bor bo'lsa, yangilamaymiz
    if User.objects.filter(username=username).exists():
        existing_user = User.objects.get(username=username)
        if not hasattr(existing_user, 'student_profile'):
            student.user = existing_user
            student.save()
        return existing_user, password

    user = User.objects.create_user(
        username=username,
        password=password,
        first_name=student.first_name,
        last_name=student.last_name,
        role=User.Role.STUDENT,
    )
    student.user = user
    student.save()
def create_teacher_user(teacher):
    """
    O'qituvchi uchun avtomatik User yaratish.
    Username: telefon raqami (+ belgisisiz)
    Parol: telefon oxirgi 4 raqami
    """
    # Username: +998901234567 -> 998901234567
    username = teacher.phone.replace('+', '').replace(' ', '')
    # Parol: oxirgi 4 raqam -> 4567
    password = username[-4:]

    # Agar bu username allaqachon bor bo'lsa, yangilamaymiz
    if User.objects.filter(username=username).exists():
        existing_user = User.objects.get(username=username)
        if not hasattr(existing_user, 'teacher_profile'):
            teacher.user = existing_user
            teacher.save()
        return existing_user, password

    user = User.objects.create_user(
        username=username,
        password=password,
        first_name=teacher.first_name,
        last_name=teacher.last_name,
        role=User.Role.TEACHER,
    )
    teacher.user = user
    teacher.save()
    return user, password


class StudentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'group_memberships__group']
    search_fields = ['first_name', 'last_name', 'phone']
    ordering_fields = ['last_name', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = Student.objects.all().prefetch_related(
            'group_memberships__group__course',
            'group_memberships__group__teacher',
        )
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

    def perform_create(self, serializer):
        """O'quvchi qo'shilganda avtomatik User yaratish"""
        student = serializer.save()
        user, password = create_student_user(student)

        # SMS orqali login/parol yuborish
        try:
            from apps.sms.models import send_sms_and_log, SMSLog
            username = student.phone.replace('+', '').replace(' ', '')
            message = (
                f"Hurmatli {student.first_name}, EduCRM tizimiga xush kelibsiz!\n"
                f"Login: {username}\n"
                f"Parol: {password}\n"
                f"Sayt: localhost:5173"
            )
            send_sms_and_log(
                phone=student.phone,
                message=message,
                sms_type=SMSLog.SMSType.WELCOME,
                student=student,
                sent_by=self.request.user,
            )
        except Exception:
            pass  # SMS xatosi bo'lsa ham o'quvchi yaratiladi

    @action(detail=True, methods=['get'])
    def payments(self, request, pk=None):
        from apps.payments.models import Payment
        from apps.payments.serializers import PaymentListSerializer

        student = self.get_object()
        payments = Payment.objects.filter(student=student).order_by('-created_at')
        total_paid = payments.filter(status=Payment.Status.PAID).aggregate(
            total=Sum('amount'))['total'] or 0

        return Response({
            'total_paid': float(total_paid),
            'payments': PaymentListSerializer(payments, many=True).data,
        })

    @action(detail=True, methods=['get'])
    def attendance(self, request, pk=None):
        from apps.attendance.models import Attendance

        student = self.get_object()
        records = Attendance.objects.filter(student=student).select_related('session__group')

        total = records.count()
        present = records.filter(status='present').count()
        absent = records.filter(status='absent').count()
        late = records.filter(status='late').count()

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
        """O'quvchini guruhga qo'shish + login/parol SMS yuborish"""
        from apps.groups.models import Group, GroupMembership
        from apps.sms.models import send_sms_and_log, SMSLog

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

        # User yo'q bo'lsa yaratish
        if not student.user:
            user, password = create_student_user(student)
        else:
            username = student.phone.replace('+', '').replace(' ', '')
            password = username[-4:]

        # Login/parol + xush kelibsiz SMS
        username = student.phone.replace('+', '').replace(' ', '')
        password = username[-4:]

        message = (
            f"Hurmatli {student.first_name}, {group.name} guruhiga xush kelibsiz!\n"
            f"Tizimga kirish uchun:\n"
            f"Login: {username}\n"
            f"Parol: {password}\n"
            f"O'quv markaz bilan muloqot: +998901234567"
        )

        send_sms_and_log(
            phone=student.phone,
            message=message,
            sms_type=SMSLog.SMSType.WELCOME,
            student=student,
            group=group,
            sent_by=request.user,
        )

        return Response({
            'success': True,
            'message': f"{student.full_name} {group.name} guruhiga qo'shildi",
            'credentials': {
                'username': username,
                'password': password,
            }
        })

    @action(detail=True, methods=['post'])
    def remove_from_group(self, request, pk=None):
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
    queryset = Teacher.objects.filter(is_active=True).select_related('user').order_by('-created_at')
    permission_classes = [IsAuthenticated, IsAdminUser]
    search_fields = ['first_name', 'last_name', 'phone']

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return TeacherCreateSerializer
        return TeacherSerializer

    def perform_create(self, serializer):
        """O'qituvchi qo'shilganda avtomatik User yaratish"""
        teacher = serializer.save()
        user, password = create_teacher_user(teacher)

        # SMS orqali login/parol yuborish
        try:
            from apps.sms.models import send_sms_and_log, SMSLog
            message = (
                f"Hurmatli {teacher.first_name}, EduCRM tizimiga xush kelibsiz!\n"
                f"Siz o'qituvchi sifatida ro'yxatdan o'tdingiz.\n"
                f"Login: {user.username}\n"
                f"Parol: {password}\n"
                f"Sayt: localhost:5173"
            )
            send_sms_and_log(
                phone=teacher.phone,
                message=message,
                sms_type=SMSLog.SMSType.WELCOME,
                teacher=teacher,
            )
        except Exception as e:
            print(f"SMS yuborishda xato: {e}")