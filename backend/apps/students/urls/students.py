from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.students.views.students import StudentViewSet, TeacherViewSet

router = DefaultRouter()
router.register('students', StudentViewSet, basename='student')

teacher_router = DefaultRouter()
teacher_router.register('teachers', TeacherViewSet, basename='teacher')

urlpatterns = [
    path('', include(teacher_router.urls)),
    path('', include(router.urls)),
]
