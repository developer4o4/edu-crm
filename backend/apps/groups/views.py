from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import serializers as drf_serializers

from apps.groups.models import Group, GroupMembership, Course
from utils.permissions import IsAdminUser


# ── Serializers ────────────────────────────────────────────────────────────────

class CourseSerializer(drf_serializers.ModelSerializer):
    groups_count = drf_serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = ['id', 'name', 'description', 'duration_months', 'is_active', 'groups_count']

    def get_groups_count(self, obj):
        return obj.groups.filter(is_active=True).count()


class GroupListSerializer(drf_serializers.ModelSerializer):
    course_name = drf_serializers.ReadOnlyField(source='course.name')
    teacher_name = drf_serializers.SerializerMethodField()
    student_count = drf_serializers.ReadOnlyField()
    schedule_display = drf_serializers.SerializerMethodField()
    is_full = drf_serializers.ReadOnlyField()

    class Meta:
        model = Group
        fields = ['id', 'name', 'course_name', 'teacher_name', 'student_count',
                  'max_students', 'is_full', 'monthly_fee', 'payment_day',
                  'schedule_display', 'is_active', 'start_date']

    def get_teacher_name(self, obj):
        return obj.teacher.full_name if obj.teacher else None

    def get_schedule_display(self, obj):
        return (
            f"{obj.get_day_type_display()} | "
            f"{obj.start_time.strftime('%H:%M')}-{obj.end_time.strftime('%H:%M')}"
        )


class GroupDetailSerializer(drf_serializers.ModelSerializer):
    course_name = drf_serializers.ReadOnlyField(source='course.name')
    teacher_name = drf_serializers.SerializerMethodField()
    student_count = drf_serializers.ReadOnlyField()
    students = drf_serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = ['id', 'name', 'course', 'course_name', 'teacher', 'teacher_name',
                  'day_type', 'start_time', 'end_time', 'monthly_fee', 'payment_day',
                  'start_date', 'end_date', 'is_active', 'max_students', 'student_count',
                  'room', 'students', 'created_at']

    def get_teacher_name(self, obj):
        return obj.teacher.full_name if obj.teacher else None

    def get_students(self, obj):
        memberships = obj.memberships.filter(is_active=True).select_related('student')
        return [
            {
                'id': m.student.id,
                'full_name': m.student.full_name,
                'phone': m.student.phone,
                'discount_percent': float(m.discount_percent),
                'joined_at': m.joined_at,
            }
            for m in memberships
        ]

    def get_teacher_name(self, obj):
        return obj.teacher.full_name if obj.teacher else None



class GroupCreateSerializer(drf_serializers.ModelSerializer):
    """Guruh yaratish va tahrirlash uchun serializer"""
    class Meta:
        model = Group
        fields = [
            'id', 'name', 'course', 'teacher', 'day_type',
            'start_time', 'end_time', 'monthly_fee', 'payment_day',
            'start_date', 'end_date', 'max_students', 'room', 'is_active'
        ]

    def validate_course(self, value):
        if value is None:
            raise drf_serializers.ValidationError("Kurs tanlanishi shart")
        return value


# ── Views ──────────────────────────────────────────────────────────────────────

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']


class GroupViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'course', 'teacher', 'day_type']
    search_fields = ['name']
    ordering_fields = ['name', 'created_at', 'student_count']
    ordering = ['name']

    def get_queryset(self):
        return Group.objects.select_related('course', 'teacher').all()

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return GroupCreateSerializer
        if self.action == 'retrieve':
            return GroupDetailSerializer
        return GroupListSerializer

    @action(detail=True, methods=['get'])
    def schedule(self, request, pk=None):
        """Guruh dars jadvali + so'nggi sessiyalar"""
        group = self.get_object()
        from apps.attendance.models import AttendanceSession

        sessions = AttendanceSession.objects.filter(group=group).order_by('-date')[:10]

        return Response({
            'group': group.name,
            'day_type': group.get_day_type_display(),
            'time': f"{group.start_time.strftime('%H:%M')}-{group.end_time.strftime('%H:%M')}",
            'room': group.room,
            'payment_day': group.payment_day,
            'recent_sessions': [
                {
                    'id': s.id,
                    'date': s.date,
                    'topic': s.topic,
                    'records_count': s.records.count(),
                }
                for s in sessions
            ],
        })

    @action(detail=True, methods=['post'])
    def send_sms_to_all(self, request, pk=None):
        """Guruhdagi barcha o'quvchilarga SMS yuborish"""
        from apps.sms.tasks import send_single_sms
        from apps.sms.models import SMSLog

        group = self.get_object()
        message = request.data.get('message', '').strip()

        if not message:
            return Response({'error': 'Xabar matni kiritilishi shart'}, status=400)

        if len(message) > 160:
            return Response({'error': 'Xabar 160 belgidan oshmasligi kerak'}, status=400)

        memberships = group.memberships.filter(is_active=True).select_related('student')
        sent_count = 0

        for membership in memberships:
            student = membership.student
            send_single_sms.delay(
                phone=student.phone,
                message=message,
                student_id=student.id,
                sent_by_id=request.user.id,
            )
            sent_count += 1

        return Response({
            'success': True,
            'message': f"{sent_count} ta o'quvchiga SMS yuborish navbatga qo'yildi",
        })