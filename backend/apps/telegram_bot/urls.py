from django.urls import path
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import json
import logging

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name='dispatch')
class TelegramWebhookView(View):
    """Telegram webhook handler (production mode)"""

    def post(self, request):
        try:
            from telegram import Update
            from apps.telegram_bot.bot import create_bot_application
            import asyncio

            body = json.loads(request.body)
            app = create_bot_application()

            async def process():
                await app.initialize()
                update = Update.de_json(body, app.bot)
                await app.process_update(update)

            asyncio.run(process())
            return JsonResponse({'ok': True})

        except Exception as e:
            logger.exception("Webhook error: %s", e)
            return JsonResponse({'ok': False, 'error': str(e)}, status=500)


urlpatterns = [
    path('', TelegramWebhookView.as_view(), name='telegram-webhook'),
]
