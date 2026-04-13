# apps/students/urls/auth.py
from django.urls import path
from apps.students.views.auth import LoginView, LogoutView, MeView, ChangePasswordView, TokenRefreshView

urlpatterns = [
    path('login/', LoginView.as_view(), name='auth-login'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('me/', MeView.as_view(), name='auth-me'),
    path('change-password/', ChangePasswordView.as_view(), name='auth-change-password'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
]

from apps.students.views.auth import MyStudentProfileView
urlpatterns += [
    path('me/student/', MyStudentProfileView.as_view(), name='my-student-profile'),
]