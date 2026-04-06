from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.utils import timezone


phone_validator = RegexValidator(
    regex=r'^\+998\d{9}$',
    message="Telefon raqam +998XXXXXXXXX formatida bo'lishi kerak"
)


class User(AbstractUser):
    """Custom user with role-based access"""

    class Role(models.TextChoices):
        SUPER_ADMIN = 'super_admin', 'Super Admin'
        ADMIN = 'admin', 'Admin'
        TEACHER = 'teacher', "O'qituvchi"
        STUDENT = 'student', "O'quvchi"

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.STUDENT)
    phone = models.CharField(max_length=13, validators=[phone_validator], blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def is_super_admin(self):
        return self.role == self.Role.SUPER_ADMIN

    @property
    def is_admin(self):
        return self.role in (self.Role.SUPER_ADMIN, self.Role.ADMIN)

    @property
    def is_teacher(self):
        return self.role == self.Role.TEACHER

    class Meta:
        verbose_name = "Foydalanuvchi"
        verbose_name_plural = "Foydalanuvchilar"
        ordering = ['-created_at']


class Student(models.Model):
    """O'quvchi profili"""

    class Status(models.TextChoices):
        ACTIVE = 'active', 'Aktiv'
        INACTIVE = 'inactive', 'Faol emas'
        GRADUATED = 'graduated', 'Bitirgan'
        EXPELLED = 'expelled', "Chiqarib yuborilgan"

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile', null=True, blank=True)
    first_name = models.CharField(max_length=100, verbose_name="Ism")
    last_name = models.CharField(max_length=100, verbose_name="Familiya")
    phone = models.CharField(max_length=13, validators=[phone_validator], verbose_name="Telefon")
    parent_phone = models.CharField(max_length=13, validators=[phone_validator], blank=True, verbose_name="Ota-ona telefoni")
    date_of_birth = models.DateField(null=True, blank=True)
    address = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    notes = models.TextField(blank=True, verbose_name="Izohlar")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def full_name(self):
        return f"{self.last_name} {self.first_name}"

    @property
    def active_groups(self):
        return self.group_memberships.filter(is_active=True).select_related('group')

    @property
    def total_debt(self):
        from apps.payments.models import Payment
        paid = Payment.objects.filter(student=self, status=Payment.Status.PAID).aggregate(
            total=models.Sum('amount'))['total'] or 0
        # Sum of all group monthly fees * months enrolled
        return max(0, self.calculate_total_due() - paid)

    def calculate_total_due(self):
        total = 0
        for membership in self.group_memberships.filter(is_active=True):
            months = membership.months_enrolled
            total += membership.group.monthly_fee * months
        return total

    def __str__(self):
        return self.full_name

    class Meta:
        verbose_name = "O'quvchi"
        verbose_name_plural = "O'quvchilar"
        ordering = ['last_name', 'first_name']


class Teacher(models.Model):
    """O'qituvchi profili"""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='teacher_profile')
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=13, validators=[phone_validator])
    subject = models.CharField(max_length=200, blank=True, verbose_name="Fan/yo'nalish")
    salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    salary_type = models.CharField(max_length=20, choices=[
        ('fixed', 'Belgilangan'),
        ('percent', 'Foiz asosida'),
    ], default='fixed')
    salary_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text="Foiz asosida bo'lsa")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def full_name(self):
        return f"{self.last_name} {self.first_name}"

    def __str__(self):
        return self.full_name

    class Meta:
        verbose_name = "O'qituvchi"
        verbose_name_plural = "O'qituvchilar"
