from django.db.models import Sum, Count, Q
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from datetime import timedelta
import calendar


class DashboardStatsView(APIView):
    """Admin dashboard uchun barcha statistikalar"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.students.models import Student
        from apps.groups.models import Group
        from apps.payments.models import Payment

        today = timezone.now().date()
        current_month_start = today.replace(day=1)
        year_start = today.replace(month=1, day=1)

        # --- O'quvchilar ---
        total_students = Student.objects.count()
        active_students = Student.objects.filter(status=Student.Status.ACTIVE).count()

        # Qarzdorlar: aktiv, lekin bu oy to'lamagan
        paid_this_month_ids = Payment.objects.filter(
            status=Payment.Status.PAID,
            month__year=today.year,
            month__month=today.month,
        ).values_list('student_id', flat=True).distinct()

        debtors_count = Student.objects.filter(
            status=Student.Status.ACTIVE,
            group_memberships__is_active=True,
        ).exclude(id__in=paid_this_month_ids).distinct().count()

        # --- To'lovlar ---
        today_payments = Payment.objects.filter(
            status=Payment.Status.PAID,
            paid_at__date=today,
        ).aggregate(total=Sum('amount'), count=Count('id'))

        monthly_income = Payment.objects.filter(
            status=Payment.Status.PAID,
            paid_at__year=today.year,
            paid_at__month=today.month,
        ).aggregate(total=Sum('amount'))['total'] or 0

        yearly_income = Payment.objects.filter(
            status=Payment.Status.PAID,
            paid_at__year=today.year,
        ).aggregate(total=Sum('amount'))['total'] or 0

        # --- Guruhlar ---
        total_groups = Group.objects.filter(is_active=True).count()
        groups_today = Group.objects.filter(is_active=True).count()  # simplified

        # --- Oylik daromad grafigi (oxirgi 12 oy) ---
        monthly_chart = []
        for i in range(11, -1, -1):
            month_date = today.replace(day=1) - timedelta(days=i * 30)
            month_income = Payment.objects.filter(
                status=Payment.Status.PAID,
                paid_at__year=month_date.year,
                paid_at__month=month_date.month,
            ).aggregate(total=Sum('amount'))['total'] or 0

            monthly_chart.append({
                'month': month_date.strftime('%b %Y'),
                'month_num': month_date.month,
                'year': month_date.year,
                'income': float(month_income),
            })

        # --- Yangi o'quvchilar grafigi (oxirgi 6 oy) ---
        new_students_chart = []
        for i in range(5, -1, -1):
            month_date = today.replace(day=1) - timedelta(days=i * 30)
            count = Student.objects.filter(
                created_at__year=month_date.year,
                created_at__month=month_date.month,
            ).count()
            new_students_chart.append({
                'month': month_date.strftime('%b'),
                'count': count,
            })

        # --- So'nggi to'lovlar ---
        from apps.payments.serializers import PaymentListSerializer
        recent_payments = Payment.objects.filter(
            status=Payment.Status.PAID,
        ).select_related('student', 'group').order_by('-paid_at')[:10]

        # --- To'lov turi statistikasi ---
        payment_types = Payment.objects.filter(
            status=Payment.Status.PAID,
            paid_at__year=today.year,
            paid_at__month=today.month,
        ).values('payment_type').annotate(
            total=Sum('amount'),
            count=Count('id'),
        )

        return Response({
            'summary': {
                'total_students': total_students,
                'active_students': active_students,
                'debtors_count': debtors_count,
                'today_payments_amount': float(today_payments['total'] or 0),
                'today_payments_count': today_payments['count'] or 0,
                'monthly_income': float(monthly_income),
                'yearly_income': float(yearly_income),
                'total_groups': total_groups,
            },
            'monthly_chart': monthly_chart,
            'new_students_chart': new_students_chart,
            'payment_types': list(payment_types),
            'recent_payments': PaymentListSerializer(recent_payments, many=True).data,
        })


class RecentActivityView(APIView):
    """So'nggi faoliyat lentasi"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.payments.models import Payment
        from apps.students.models import Student
        from apps.sms.models import SMSLog

        activities = []
        today = timezone.now()

        # Recent payments
        for p in Payment.objects.filter(status=Payment.Status.PAID).order_by('-paid_at')[:5]:
            activities.append({
                'type': 'payment',
                'icon': 'green',
                'text': f"{p.student.full_name} — {int(p.amount):,} UZS to'ladi ({p.get_payment_type_display()})",
                'time': p.paid_at,
            })

        # New students
        for s in Student.objects.order_by('-created_at')[:3]:
            activities.append({
                'type': 'new_student',
                'icon': 'blue',
                'text': f"{s.full_name} — yangi o'quvchi ro'yxatga olindi",
                'time': s.created_at,
            })

        # SMS logs
        for sms in SMSLog.objects.order_by('-created_at')[:3]:
            activities.append({
                'type': 'sms',
                'icon': 'amber',
                'text': f"SMS yuborildi: {sms.get_sms_type_display()}",
                'time': sms.created_at,
            })

        # Sort by time
        activities.sort(key=lambda x: x['time'] if x['time'] else today, reverse=True)

        # Format times
        for a in activities:
            if a['time']:
                delta = today - (a['time'] if timezone.is_aware(a['time']) else timezone.make_aware(a['time']))
                if delta.days == 0:
                    a['time_display'] = f"Bugun, {a['time'].strftime('%H:%M')}"
                elif delta.days == 1:
                    a['time_display'] = f"Kecha, {a['time'].strftime('%H:%M')}"
                else:
                    a['time_display'] = a['time'].strftime('%d.%m.%Y %H:%M')
                del a['time']

        return Response({'activities': activities[:15]})
