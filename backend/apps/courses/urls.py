from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.groups.views import CourseViewSet

router = DefaultRouter()
router.register('', CourseViewSet, basename='course')

urlpatterns = [path('', include(router.urls))]
