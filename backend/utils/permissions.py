from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    """Admin yoki Super Admin"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('admin', 'super_admin')


class IsSuperAdmin(BasePermission):
    """Faqat Super Admin"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'super_admin'


class IsTeacherOrAdmin(BasePermission):
    """O'qituvchi, Admin yoki Super Admin"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in (
            'teacher', 'admin', 'super_admin'
        )


class IsAdminOrReadOnly(BasePermission):
    """Adminga to'liq, boshqalarga faqat o'qish"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return request.user.role in ('admin', 'super_admin')


class IsOwnerOrAdmin(BasePermission):
    """O'z obyektiga yoki admin"""
    def has_object_permission(self, request, view, obj):
        if request.user.role in ('admin', 'super_admin'):
            return True
        # Student can access their own data
        if hasattr(obj, 'student') and hasattr(request.user, 'student_profile'):
            return obj.student == request.user.student_profile
        if isinstance(obj, __import__('apps.students.models', fromlist=['Student']).Student):
            return hasattr(request.user, 'student_profile') and obj == request.user.student_profile
        return False
