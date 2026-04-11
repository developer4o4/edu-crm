from rest_framework import serializers
from apps.students.models import User, Student, Teacher
from apps.groups.models import GroupMembership


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role', 'phone', 'avatar']
        read_only_fields = ['role']


class TeacherSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    groups_count = serializers.SerializerMethodField()

    class Meta:
        model = Teacher
        fields = ['id', 'first_name', 'last_name', 'full_name', 'phone', 'subject',
                  'salary', 'salary_type', 'salary_percent', 'is_active', 'groups_count']

    def get_groups_count(self, obj):
        return obj.groups.filter(is_active=True).count()


class TeacherCreateSerializer(serializers.ModelSerializer):
    """O'qituvchi yaratish/tahrirlash uchun serializer"""

    class Meta:
        model = Teacher
        fields = ['id', 'first_name', 'last_name', 'phone', 'subject',
                  'salary', 'salary_type', 'salary_percent', 'is_active']

    def validate_phone(self, value):
        if Teacher.objects.filter(phone=value).exclude(id=self.instance.id if self.instance else None).exists():
            raise serializers.ValidationError("Bu telefon raqami allaqachon ro'yxatdan o'tgan")
        return value


class MembershipSerializer(serializers.ModelSerializer):
    group_name = serializers.ReadOnlyField(source='group.name')
    course_name = serializers.ReadOnlyField(source='group.course.name')
    teacher_name = serializers.SerializerMethodField()
    monthly_fee = serializers.ReadOnlyField(source='group.monthly_fee')
    monthly_fee_discounted = serializers.ReadOnlyField(source='monthly_fee_with_discount')
    schedule = serializers.SerializerMethodField()

    class Meta:
        model = GroupMembership
        fields = ['id', 'group', 'group_name', 'course_name', 'teacher_name',
                  'monthly_fee', 'monthly_fee_discounted', 'discount_percent',
                  'joined_at', 'is_active', 'schedule']

    def get_teacher_name(self, obj):
        if obj.group.teacher:
            return obj.group.teacher.full_name
        return None

    def get_schedule(self, obj):
        g = obj.group
        return {
            'day_type': g.get_day_type_display(),
            'start_time': g.start_time.strftime('%H:%M'),
            'end_time': g.end_time.strftime('%H:%M'),
            'payment_day': g.payment_day,
        }


class StudentSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    active_groups = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = ['id', 'first_name', 'last_name', 'full_name', 'phone',
                  'parent_phone', 'status', 'active_groups', 'created_at']

    def get_active_groups(self, obj):
        memberships = obj.group_memberships.filter(is_active=True).select_related('group')
        return [{'id': m.group.id, 'name': m.group.name} for m in memberships]


class StudentDetailSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    memberships = MembershipSerializer(source='group_memberships', many=True, read_only=True)
    total_paid = serializers.SerializerMethodField()
    total_debt = serializers.SerializerMethodField()
    attendance_summary = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = ['id', 'first_name', 'last_name', 'full_name', 'phone', 'parent_phone',
                  'date_of_birth', 'address', 'status', 'notes', 'memberships',
                  'total_paid', 'total_debt', 'attendance_summary', 'created_at']

    def get_total_paid(self, obj):
        from apps.payments.models import Payment
        from django.db.models import Sum
        total = Payment.objects.filter(student=obj, status=Payment.Status.PAID).aggregate(
            total=Sum('amount'))['total'] or 0
        return float(total)

    def get_total_debt(self, obj):
        return float(obj.total_debt)

    def get_attendance_summary(self, obj):
        from apps.attendance.models import Attendance
        records = Attendance.objects.filter(student=obj)
        total = records.count()
        present = records.filter(status='present').count()
        return {
            'total': total,
            'present': present,
            'absent': records.filter(status='absent').count(),
            'rate': round((present / total * 100) if total else 0, 1),
        }


class StudentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ['first_name', 'last_name', 'phone', 'parent_phone',
                  'date_of_birth', 'address', 'notes']

    def validate_phone(self, value):
        if Student.objects.filter(phone=value).exists():
            raise serializers.ValidationError("Bu telefon raqam allaqachon ro'yxatda bor")
        return value
