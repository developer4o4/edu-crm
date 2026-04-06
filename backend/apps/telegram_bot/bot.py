"""
Telegram Bot - O'quv markaz uchun
"""
import logging
from telegram import Update, ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton
from telegram.ext import (
    Application, CommandHandler, MessageHandler, CallbackQueryHandler,
    ConversationHandler, filters, ContextTypes
)
from django.conf import settings

logger = logging.getLogger(__name__)

# Conversation states
MENU, REGISTER_NAME, REGISTER_PHONE, REGISTER_COURSE, CONTACT = range(5)

MAIN_MENU = [
    ["📌 Ro'yxatdan o'tish", "📚 Kurslar"],
    ["📊 Mening hisobim", "📞 Aloqa"],
]

MENU_KEYBOARD = ReplyKeyboardMarkup(MAIN_MENU, resize_keyboard=True)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handler /start command"""
    from apps.telegram_bot.models import TelegramUser

    user = update.effective_user
    chat_id = update.effective_chat.id

    # Save or update Telegram user
    tg_user, created = TelegramUser.objects.update_or_create(
        telegram_id=user.id,
        defaults={
            'username': user.username or '',
            'first_name': user.first_name or '',
            'last_name': user.last_name or '',
            'chat_id': chat_id,
        }
    )

    welcome_text = (
        f"👋 Assalomu alaykum, {user.first_name}!\n\n"
        f"🏫 O'quv markazimizga xush kelibsiz!\n\n"
        f"Quyidagi menyu orqali bizning xizmatlarimizdan foydalaning:"
    )

    await update.message.reply_text(welcome_text, reply_markup=MENU_KEYBOARD)
    return MENU


async def menu_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Main menu handler"""
    text = update.message.text

    if text == "📌 Ro'yxatdan o'tish":
        return await start_registration(update, context)
    elif text == "📚 Kurslar":
        return await show_courses(update, context)
    elif text == "📊 Mening hisobim":
        return await show_my_account(update, context)
    elif text == "📞 Aloqa":
        return await show_contact(update, context)

    await update.message.reply_text("Menyu tugmalaridan foydalaning 👆", reply_markup=MENU_KEYBOARD)
    return MENU


async def start_registration(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start registration flow"""
    from apps.telegram_bot.models import TelegramUser

    tg_user = TelegramUser.objects.filter(telegram_id=update.effective_user.id).first()

    if tg_user and tg_user.student:
        await update.message.reply_text(
            f"✅ Siz allaqachon ro'yxatdan o'tgansiz!\n"
            f"📛 Ism: {tg_user.student.full_name}\n"
            f"📱 Telefon: {tg_user.student.phone}",
            reply_markup=MENU_KEYBOARD
        )
        return MENU

    await update.message.reply_text(
        "📝 Ro'yxatdan o'tish\n\nIsm va familiyangizni kiriting:\n(Masalan: Aliyev Jasur)",
        reply_markup=ReplyKeyboardMarkup([["❌ Bekor qilish"]], resize_keyboard=True)
    )
    return REGISTER_NAME


async def register_name(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Save name, ask for phone"""
    if update.message.text == "❌ Bekor qilish":
        await update.message.reply_text("Bekor qilindi.", reply_markup=MENU_KEYBOARD)
        return MENU

    context.user_data['full_name'] = update.message.text

    phone_button = KeyboardButton("📱 Telefon raqamni yuborish", request_contact=True)
    keyboard = ReplyKeyboardMarkup([[phone_button], ["❌ Bekor qilish"]], resize_keyboard=True)

    await update.message.reply_text(
        f"✅ Ism saqlandi: {update.message.text}\n\n"
        "📱 Endi telefon raqamingizni yuboring:",
        reply_markup=keyboard
    )
    return REGISTER_PHONE


async def register_phone(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Save phone, show course selection"""
    from apps.courses.models import Course

    if update.message.text == "❌ Bekor qilish":
        await update.message.reply_text("Bekor qilindi.", reply_markup=MENU_KEYBOARD)
        return MENU

    # Get phone from contact or text
    if update.message.contact:
        phone = update.message.contact.phone_number
        if not phone.startswith('+'):
            phone = '+' + phone
    else:
        phone = update.message.text
        if not phone.startswith('+'):
            phone = '+998' + phone.lstrip('0')

    context.user_data['phone'] = phone

    # Show available courses
    courses = Course.objects.filter(is_active=True)
    buttons = [[InlineKeyboardButton(c.name, callback_data=f"course_{c.id}")] for c in courses]
    buttons.append([InlineKeyboardButton("❌ Bekor qilish", callback_data="cancel")])

    await update.message.reply_text(
        "📚 Qaysi kursga qiziqasiz?",
        reply_markup=InlineKeyboardMarkup(buttons)
    )
    return REGISTER_COURSE


async def register_course(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Complete registration"""
    query = update.callback_query
    await query.answer()

    if query.data == "cancel":
        await query.edit_message_text("Bekor qilindi.")
        await query.message.reply_text("Asosiy menyu:", reply_markup=MENU_KEYBOARD)
        return MENU

    from apps.courses.models import Course
    from apps.telegram_bot.models import TelegramUser
    from apps.students.models import Student, User

    course_id = int(query.data.split('_')[1])
    course = Course.objects.filter(id=course_id).first()

    full_name = context.user_data.get('full_name', '')
    phone = context.user_data.get('phone', '')
    parts = full_name.strip().split(' ', 1)
    last_name = parts[0]
    first_name = parts[1] if len(parts) > 1 else ''

    # Create student record
    student = Student.objects.create(
        first_name=first_name,
        last_name=last_name,
        phone=phone,
        status=Student.Status.ACTIVE,
        notes=f"Telegram orqali ro'yxatdan o'tdi. Kurs: {course.name if course else 'Noma\'lum'}",
    )

    # Link to telegram user
    tg_user = TelegramUser.objects.filter(telegram_id=query.from_user.id).first()
    if tg_user:
        tg_user.student = student
        tg_user.save()

    success_text = (
        f"✅ Muvaffaqiyatli ro'yxatdan o'tdingiz!\n\n"
        f"📛 Ism: {student.full_name}\n"
        f"📱 Telefon: {phone}\n"
        f"📚 Tanlangan kurs: {course.name if course else '—'}\n\n"
        f"📞 Tez orada administratorimiz siz bilan bog'lanadi!"
    )

    await query.edit_message_text(success_text)
    await query.message.reply_text("Asosiy menyu:", reply_markup=MENU_KEYBOARD)
    return MENU


async def show_courses(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show available courses"""
    from apps.courses.models import Course

    courses = Course.objects.filter(is_active=True)

    if not courses.exists():
        await update.message.reply_text("Hozircha kurslar mavjud emas.", reply_markup=MENU_KEYBOARD)
        return MENU

    text = "📚 *Mavjud kurslar:*\n\n"
    for course in courses:
        text += f"• *{course.name}*\n"
        if course.description:
            text += f"  {course.description[:100]}\n"
        text += f"  ⏱ Davomiyligi: {course.duration_months} oy\n\n"

    await update.message.reply_text(text, parse_mode='Markdown', reply_markup=MENU_KEYBOARD)
    return MENU


async def show_my_account(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show student's personal account info"""
    from apps.telegram_bot.models import TelegramUser
    from apps.payments.models import Payment

    tg_user = TelegramUser.objects.filter(
        telegram_id=update.effective_user.id
    ).select_related('student').first()

    if not tg_user or not tg_user.student:
        await update.message.reply_text(
            "❌ Siz hali ro'yxatdan o'tmagansiz.\n'📌 Ro'yxatdan o'tish' tugmasini bosing.",
            reply_markup=MENU_KEYBOARD
        )
        return MENU

    student = tg_user.student
    groups = student.group_memberships.filter(is_active=True).select_related('group')

    text = f"👤 *{student.full_name}*\n"
    text += f"📱 {student.phone}\n\n"

    for membership in groups:
        group = membership.group
        # Count missed classes
        missed = student.attendance_records.filter(
            session__group=group,
            status='absent'
        ).count()

        text += f"📚 *{group.name}*\n"
        text += f"  👨‍🏫 O'qituvchi: {group.teacher.full_name if group.teacher else '—'}\n"
        text += f"  ⏰ Dars: {group.start_time.strftime('%H:%M')} - {group.end_time.strftime('%H:%M')}\n"
        text += f"  ❌ Qoldirilgan darslar: {missed}\n\n"

    if not groups.exists():
        text += "_Hozircha hech qaysi guruhda emas_\n"

    await update.message.reply_text(text, parse_mode='Markdown', reply_markup=MENU_KEYBOARD)
    return MENU


async def show_contact(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show contact info"""
    text = (
        "📞 *Bog'lanish*\n\n"
        "🏢 O'quv markaz\n"
        "📍 Toshkent sh., ...\n"
        "📱 +998 90 123 45 67\n"
        "🕐 Ish vaqti: 9:00 - 20:00\n\n"
        "📩 Telegram: @educrm_admin"
    )
    await update.message.reply_text(text, parse_mode='Markdown', reply_markup=MENU_KEYBOARD)
    return MENU


def create_bot_application():
    """Create and configure bot application"""
    app = Application.builder().token(settings.TELEGRAM_BOT_TOKEN).build()

    conv_handler = ConversationHandler(
        entry_points=[CommandHandler('start', start)],
        states={
            MENU: [MessageHandler(filters.TEXT & ~filters.COMMAND, menu_handler)],
            REGISTER_NAME: [MessageHandler(filters.TEXT & ~filters.COMMAND, register_name)],
            REGISTER_PHONE: [
                MessageHandler(filters.CONTACT | (filters.TEXT & ~filters.COMMAND), register_phone)
            ],
            REGISTER_COURSE: [CallbackQueryHandler(register_course)],
        },
        fallbacks=[CommandHandler('start', start)],
        per_user=True,
    )

    app.add_handler(conv_handler)
    return app
