from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.students.views.students import StudentViewSet, TeacherViewSet

router = DefaultRouter()

router.register(r'teachers', TeacherViewSet, basename='teacher')
router.register(r'', StudentViewSet, basename='student')

urlpatterns = [
    path('', include(router.urls)),
]