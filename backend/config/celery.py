import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('educrm')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Scheduled tasks
app.conf.beat_schedule = {
    # Every day at 09:00 Tashkent time — check payment due dates and send SMS
    'daily-payment-reminder': {
        'task': 'apps.sms.tasks.send_payment_reminders',
        'schedule': crontab(hour=9, minute=0),
    },
    # Every day at 10:00 — send debt reminders
    'daily-debt-reminder': {
        'task': 'apps.sms.tasks.send_debt_reminders',
        'schedule': crontab(hour=10, minute=0),
    },
    # Every month on 1st — generate monthly reports
    'monthly-report': {
        'task': 'apps.reports.tasks.generate_monthly_report',
        'schedule': crontab(day_of_month=1, hour=7, minute=0),
    },
}

app.conf.task_routes = {
    'apps.sms.tasks.*': {'queue': 'sms'},
    'apps.payments.tasks.*': {'queue': 'payments'},
    '*': {'queue': 'default'},
}
