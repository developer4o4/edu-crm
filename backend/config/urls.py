from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),

    # API v1
    path('api/v1/', include([
        path('auth/', include('apps.students.urls.auth')),
        path('students/', include('apps.students.urls.students')),
        path('groups/', include('apps.groups.urls')),
        path('courses/', include('apps.courses.urls')),
        path('payments/', include('apps.payments.urls')),
        path('attendance/', include('apps.attendance.urls')),
        path('sms/', include('apps.sms.urls')),
        path('reports/', include('apps.reports.urls')),
        path('dashboard/', include('apps.students.urls.dashboard')),
    ])),

    # Payme callback
    path('payme/', include('apps.payments.payme_urls')),

    # Telegram webhook
    path('telegram/webhook/', include('apps.telegram_bot.urls')),

    # API Docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)