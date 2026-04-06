from django.db import models
from django.utils import timezone


class AttendanceSession(models.Model):
    """Dars sessiyasi"""

    group = models.ForeignKey('groups.Group', on_delete=models.CASCADE, related_name='sessions')
    date = models.DateField(default=timezone.now)
    topic = models.CharField(max_length=300, blank=True, verbose_name="Dars mavzusi")
    created_by = models.ForeignKey(
        'students.User', on_delete=models.SET_NULL, null=True, related_name='created_sessions'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.group.name} - {self.date}"

    class Meta:
        verbose_name = "Dars sessiyasi"
        verbose_name_plural = "Dars sessiyalari"
        unique_together = ['group', 'date']
        ordering = ['-date']


class Attendance(models.Model):
    """Davomat yozuvi"""

    class AttendanceStatus(models.TextChoices):
        PRESENT = 'present', 'Keldi'
        ABSENT = 'absent', 'Kelmadi'
        LATE = 'late', 'Kech keldi'
        EXCUSED = 'excused', "Uzrli sabab"

    session = models.ForeignKey(AttendanceSession, on_delete=models.CASCADE, related_name='records')
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='attendance_records')
    status = models.CharField(max_length=20, choices=AttendanceStatus.choices, default=AttendanceStatus.PRESENT)
    note = models.CharField(max_length=200, blank=True)
    marked_by = models.ForeignKey(
        'students.User', on_delete=models.SET_NULL, null=True, related_name='marked_attendances'
    )
    marked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Davomat"
        verbose_name_plural = "Davomatlar"
        unique_together = ['session', 'student']

    def __str__(self):
        return f"{self.student} - {self.session.date} - {self.get_status_display()}"
