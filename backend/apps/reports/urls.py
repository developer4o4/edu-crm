from django.urls import path
from apps.reports.views import PaymentReportView, AttendanceReportView, MonthlyIncomeReportView

urlpatterns = [
    path('payments/', PaymentReportView.as_view(), name='report-payments'),
    path('attendance/', AttendanceReportView.as_view(), name='report-attendance'),
    path('income/', MonthlyIncomeReportView.as_view(), name='report-income'),
]
