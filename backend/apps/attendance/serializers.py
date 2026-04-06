from rest_framework import serializers
from apps.attendance.models import AttendanceSession, Attendance


class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='student.full_name')
    status_display = serializers.ReadOnlyField(source='get_status_display')
    marked_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Attendance
        fields = ['id', 'session', 'student', 'student_name', 'status',
                  'status_display', 'note', 'marked_by', 'marked_by_name', 'marked_at']
        read_only_fields = ['marked_by', 'marked_at']

    def get_marked_by_name(self, obj):
        return obj.marked_by.get_full_name() if obj.marked_by else None


class AttendanceSessionSerializer(serializers.ModelSerializer):
    group_name = serializers.ReadOnlyField(source='group.name')
    records_count = serializers.SerializerMethodField()
    present_count = serializers.SerializerMethodField()
    absent_count = serializers.SerializerMethodField()
    records = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceSession
        fields = ['id', 'group', 'group_name', 'date', 'topic',
                  'records_count', 'present_count', 'absent_count',
                  'records', 'created_at']
        read_only_fields = ['created_by', 'created_at']

    def get_records_count(self, obj):
        return obj.records.count()

    def get_present_count(self, obj):
        return obj.records.filter(status='present').count()

    def get_absent_count(self, obj):
        return obj.records.filter(status='absent').count()

    def get_records(self, obj):
        # Only include records in detail view
        if self.context.get('include_records', False):
            return AttendanceSerializer(obj.records.all(), many=True).data
        return None


class BulkAttendanceSerializer(serializers.Serializer):
    records = serializers.ListField(
        child=serializers.DictField(),
        min_length=1
    )
