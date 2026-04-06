# apps/groups/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.groups.views import GroupViewSet, CourseViewSet

router = DefaultRouter()
router.register('courses', CourseViewSet, basename='course')
router.register('', GroupViewSet, basename='group')

urlpatterns = [path('', include(router.urls))]
