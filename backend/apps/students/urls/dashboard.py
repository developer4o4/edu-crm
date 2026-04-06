from django.urls import path
from apps.students.views.dashboard import DashboardStatsView, RecentActivityView

urlpatterns = [
    path('stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('activity/', RecentActivityView.as_view(), name='dashboard-activity'),
]
