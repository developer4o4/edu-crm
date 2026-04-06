"""
Avtomatik SMS yuborish tasklari (Celery)
"""
import logging
from celery import shared_task
from django.utils import timezone
from django.utils.formats import date_format

logger = logging.getLogger(__name__)


@shared_task(name='apps.sms.tasks.send_payment_reminders', bind=True, max_retries=3)
def send_payment_reminders(self):
    """
    Har kuni 09:00 da ishga tushadi.
    Bugun to'lov sanasi bo'lgan guruhlardagi o'quvchilarga SMS yuboradi.
    """
    from apps.groups.models import Group, GroupMembership
    from apps.payments.models import Payment
    from apps.sms.models import send_sms_and_log, SMSLog, payment_reminder_message

    today = timezone.now().date()
    current_month_str = today.strftime('%B %Y')  # "Aprel 2026"

    # Find groups where today is payment day
    groups_due_today = Group.objects.filter(
        is_active=True,
        payment_day=today.day,
    ).prefetch_related('memberships__student')

    sent_count = 0
    error_count = 0

    for group in groups_due_today:
        active_memberships = group.memberships.filter(is_active=True).select_related('student')

        for membership in active_memberships:
            student = membership.student

            # Check if payment already made this month
            already_paid = Payment.objects.filter(
                student=student,
                group=group,
                month__year=today.year,
                month__month=today.month,
                status=Payment.Status.PAID,
            ).exists()

            if already_paid:
                continue

            # Send SMS
            message = payment_reminder_message(
                student.first_name,
                student.last_name,
                current_month_str,
            )

            try:
                send_sms_and_log(
                    phone=student.phone,
                    message=message,
                    sms_type=SMSLog.SMSType.PAYMENT_REMINDER,
                    student=student,
                    group=group,
                )
                sent_count += 1
            except Exception as e:
                logger.error("Failed to send payment reminder to %s: %s", student, e)
                error_count += 1

    logger.info(
        "Payment reminders: sent=%d, errors=%d, date=%s",
        sent_count, error_count, today
    )
    return {'sent': sent_count, 'errors': error_count}


@shared_task(name='apps.sms.tasks.send_debt_reminders', bind=True, max_retries=3)
def send_debt_reminders(self):
    """
    Qarzdor o'quvchilarga eslatma yuboradi.
    Har kuni 10:00 da ishga tushadi.
    """
    from apps.students.models import Student
    from apps.payments.models import Payment
    from apps.sms.models import send_sms_and_log, SMSLog, debt_reminder_message
    from django.db.models import Sum

    sent_count = 0

    students_with_debt = Student.objects.filter(
        status=Student.Status.ACTIVE,
        group_memberships__is_active=True,
    ).distinct()

    for student in students_with_debt:
        paid_total = Payment.objects.filter(
            student=student,
            status=Payment.Status.PAID,
        ).aggregate(total=Sum('amount'))['total'] or 0

        due_total = student.calculate_total_due()
        debt = due_total - paid_total

        if debt <= 0:
            continue

        # Calculate months overdue
        months_overdue = 0
        for membership in student.group_memberships.filter(is_active=True):
            today = timezone.now().date()
            from dateutil.relativedelta import relativedelta
            delta = relativedelta(today, membership.joined_at)
            months_enrolled = delta.months + delta.years * 12

            paid_months = Payment.objects.filter(
                student=student,
                group=membership.group,
                status=Payment.Status.PAID,
            ).count()

            months_overdue += max(0, months_enrolled - paid_months)

        if months_overdue >= 1:
            message = debt_reminder_message(
                student.first_name,
                student.last_name,
                int(debt),
                months_overdue,
            )

            try:
                send_sms_and_log(
                    phone=student.phone,
                    message=message,
                    sms_type=SMSLog.SMSType.DEBT_REMINDER,
                    student=student,
                )
                sent_count += 1
            except Exception as e:
                logger.error("Debt reminder failed for %s: %s", student, e)

    logger.info("Debt reminders sent: %d", sent_count)
    return {'sent': sent_count}


@shared_task(name='apps.sms.tasks.send_single_sms')
def send_single_sms(phone: str, message: str, student_id=None, sent_by_id=None):
    """Bitta SMS yuborish (admin qo'lda yuborish uchun)"""
    from apps.sms.models import send_sms_and_log, SMSLog
    from apps.students.models import Student, User

    student = Student.objects.filter(id=student_id).first() if student_id else None
    sent_by = User.objects.filter(id=sent_by_id).first() if sent_by_id else None

    log = send_sms_and_log(
        phone=phone,
        message=message,
        sms_type=SMSLog.SMSType.MANUAL,
        student=student,
        sent_by=sent_by,
    )
    return {'log_id': log.id, 'status': log.status}
