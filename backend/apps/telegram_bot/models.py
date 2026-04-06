from django.db import models


class TelegramUser(models.Model):
    """Telegram foydalanuvchisi"""

    telegram_id = models.BigIntegerField(unique=True, verbose_name="Telegram ID")
    chat_id = models.BigIntegerField(verbose_name="Chat ID")
    username = models.CharField(max_length=100, blank=True)
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    student = models.OneToOneField(
        'students.Student',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='telegram_user'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.username or str(self.telegram_id)

    def __str__(self):
        return self.full_name

    class Meta:
        verbose_name = "Telegram foydalanuvchi"
        verbose_name_plural = "Telegram foydalanuvchilar"
        ordering = ['-created_at']
