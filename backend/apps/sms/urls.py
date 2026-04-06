from django.urls import path
from apps.sms.views import SMSLogListView, SendManualSMSView

urlpatterns = [
    path('logs/', SMSLogListView.as_view(), name='sms-logs'),
    path('send/', SendManualSMSView.as_view(), name='sms-send'),
]
