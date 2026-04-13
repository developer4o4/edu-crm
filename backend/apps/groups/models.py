from django.db import models
from django.utils import timezone
from dateutil.relativedelta import relativedelta


class Course(models.Model):
    """Kurs"""

    name = models.CharField(max_length=200, verbose_name="Kurs nomi")
    description = models.TextField(blank=True)
    duration_months = models.PositiveIntegerField(default=3, verbose_name="Davomiyligi (oy)")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Kurs"
        verbose_name_plural = "Kurslar"
        ordering = ['-created_at']


class Group(models.Model):
    """Guruh"""

    class DayType(models.TextChoices):
        ODD = 'odd', 'Toq kunlar (Du,Cho,Ju)'
        EVEN = 'even', 'Juft kunlar (Se,Pa,Sha)'
        DAILY = 'daily', 'Har kuni'
        WEEKEND = 'weekend', 'Dam olish kunlari'

    name = models.CharField(max_length=100, verbose_name="Guruh nomi")
    course = models.ForeignKey(Course, on_delete=models.PROTECT, related_name='groups')
    teacher = models.ForeignKey(
        'students.Teacher', on_delete=models.SET_NULL, null=True, related_name='groups'
    )
    day_type = models.CharField(max_length=20, choices=DayType.choices, default=DayType.ODD)
    start_time = models.TimeField(verbose_name="Dars boshlanish vaqti",default="16:00:00")
    end_time = models.TimeField(verbose_name="Dars tugash vaqti",default="18:00:00")
    monthly_fee = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Oylik to'lov (UZS)")
    payment_day = models.PositiveIntegerField(
        default=1,
        verbose_name="Har oyning necha-sanasida to'lov",
        help_text="1-28 oralig'ida"
    )
    start_date = models.DateField(verbose_name="Guruh boshlanish sanasi")
    end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    max_students = models.PositiveIntegerField(default=15)
    room = models.CharField(max_length=50, blank=True, verbose_name="Xona")
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def student_count(self):
        return self.memberships.filter(is_active=True).count()

    @property
    def is_full(self):
        return self.student_count >= self.max_students

    def __str__(self):
        return f"{self.name} ({self.course.name})"

    class Meta:
        verbose_name = "Guruh"
        verbose_name_plural = "Guruhlar"
        ordering = ['name']


class GroupMembership(models.Model):
    """O'quvchi-guruh bog'lanishi"""

    student = models.ForeignKey(
        'students.Student', on_delete=models.CASCADE, related_name='group_memberships'
    )
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='memberships')
    joined_at = models.DateField(default=timezone.now)
    left_at = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name="Chegirma %")
    notes = models.TextField(blank=True)

    @property
    def months_enrolled(self):
        end = self.left_at or timezone.now().date()
        delta = relativedelta(end, self.joined_at)
        return max(1, delta.months + delta.years * 12)

    @property
    def monthly_fee_with_discount(self):
        fee = self.group.monthly_fee
        if self.discount_percent:
            fee = fee * (1 - self.discount_percent / 100)
        return fee

    def leave(self):
        self.is_active = False
        self.left_at = timezone.now().date()
        self.save()

    class Meta:
        verbose_name = "Guruh a'zoligi"
        verbose_name_plural = "Guruh a'zoliklari"
        unique_together = ['student', 'group', 'is_active']
