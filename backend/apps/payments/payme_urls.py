from django.urls import path
from apps.payments.payme import PaymeCallbackView

urlpatterns = [
    path('', PaymeCallbackView.as_view(), name='payme-callback'),
]
