from django.contrib import admin
from apps.groups.models import Course, Group, GroupMembership


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['name', 'duration_months', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name']


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'course', 'teacher', 'day_type', 'monthly_fee', 'payment_day', 'student_count', 'is_active']
    list_filter = ['is_active', 'day_type', 'course']
    search_fields = ['name']
    ordering = ['name']
    readonly_fields = ['created_at']


@admin.register(GroupMembership)
class GroupMembershipAdmin(admin.ModelAdmin):
    list_display = ['student', 'group', 'joined_at', 'is_active', 'discount_percent']
    list_filter = ['is_active', 'group']
    search_fields = ['student__first_name', 'student__last_name', 'group__name']
    ordering = ['-joined_at']