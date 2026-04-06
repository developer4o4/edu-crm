from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.shortcuts import get_object_or_404

from apps.attendance.models import AttendanceSession, Attendance
from apps.attendance.serializers import (
    AttendanceSessionSerializer, AttendanceSerializer, BulkAttendanceSerializer
)
from utils.permissions import IsTeacherOrAdmin


class AttendanceSessionViewSet(viewsets.ModelViewSet):
    """
    Dars sessiyasi + davomat belgilash
    POST /api/v1/attendance/sessions/                  - yangi sessiya ochish
    POST /api/v1/attendance/sessions/{id}/bulk_mark/   - ommaviy davomat belgilash
    GET  /api/v1/attendance/sessions/{id}/stats/       - sessiya statistikasi
    """
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['group', 'date']
    ordering = ['-date']

    def get_queryset(self):
        qs = AttendanceSession.objects.select_related('group', 'created_by')

        # Teachers only see their groups
        user = self.request.user
        if user.role == 'teacher' and hasattr(user, 'teacher_profile'):
            qs = qs.filter(group__teacher=user.teacher_profile)

        return qs

    def get_serializer_class(self):
        return AttendanceSessionSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def bulk_mark(self, request, pk=None):
        """
        Bir dars uchun barcha o'quvchilarning davomat belgilash
        Body: {
            "records": [
                {"student_id": 1, "status": "present"},
                {"student_id": 2, "status": "absent"},
                ...
            ]
        }
        """
        session = self.get_object()
        records_data = request.data.get('records', [])

        if not records_data:
            return Response({'error': 'records bo\'sh'}, status=400)

        created = []
        updated = []
        errors = []

        for rec in records_data:
            student_id = rec.get('student_id')
            att_status = rec.get('status', 'present')
            note = rec.get('note', '')

            if att_status not in dict(Attendance.AttendanceStatus.choices):
                errors.append({'student_id': student_id, 'error': 'Noto\'g\'ri status'})
                continue

            obj, is_created = Attendance.objects.update_or_create(
                session=session,
                student_id=student_id,
                defaults={
                    'status': att_status,
                    'note': note,
                    'marked_by': request.user,
                }
            )

            if is_created:
                created.append(student_id)
            else:
                updated.append(student_id)

        return Response({
            'success': True,
            'created': len(created),
            'updated': len(updated),
            'errors': errors,
        })

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Sessiya statistikasi"""
        session = self.get_object()
        records = Attendance.objects.filter(session=session).select_related('student')

        total = records.count()
        present = records.filter(status='present').count()
        absent = records.filter(status='absent').count()
        late = records.filter(status='late').count()
        excused = records.filter(status='excused').count()

        return Response({
            'session': {
                'id': session.id,
                'group': session.group.name,
                'date': session.date,
                'topic': session.topic,
            },
            'stats': {
                'total': total,
                'present': present,
                'absent': absent,
                'late': late,
                'excused': excused,
                'attendance_rate': round((present / total * 100) if total else 0, 1),
            },
            'records': AttendanceSerializer(records, many=True).data,
        })

    @action(detail=False, methods=['get'])
    def today(self, request):
        """Bugungi barcha sessiyalar"""
        today = timezone.now().date()
        sessions = self.get_queryset().filter(date=today)
        return Response(AttendanceSessionSerializer(sessions, many=True).data)


class AttendanceViewSet(viewsets.ModelViewSet):
    """Individual davomat yozuvlari"""
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['session', 'student', 'status']
    serializer_class = AttendanceSerializer

    def get_queryset(self):
        return Attendance.objects.select_related('session__group', 'student', 'marked_by')
