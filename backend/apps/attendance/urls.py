# apps/attendance/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.attendance.views import AttendanceSessionViewSet, AttendanceViewSet

router = DefaultRouter()
router.register('sessions', AttendanceSessionViewSet, basename='attendance-session')
router.register('records', AttendanceViewSet, basename='attendance-record')

urlpatterns = [path('', include(router.urls))]
