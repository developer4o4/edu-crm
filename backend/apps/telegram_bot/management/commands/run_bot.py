"""
python manage.py run_bot
"""
import asyncio
import logging
from django.core.management.base import BaseCommand

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Telegram botni ishga tushirish (polling rejimida)"

    def handle(self, *args, **options):
        from apps.telegram_bot.bot import create_bot_application

        self.stdout.write(self.style.SUCCESS("Telegram bot ishga tushmoqda..."))
        app = create_bot_application()
        app.run_polling(allowed_updates=["message", "callback_query"])
