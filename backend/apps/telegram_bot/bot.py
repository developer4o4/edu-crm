"""
Telegram Bot - O'quv markaz uchun
"""
import logging
from asgiref.sync import sync_to_async
from telegram import (
    Update,
    ReplyKeyboardMarkup,
    KeyboardButton,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
)
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    ConversationHandler,
    filters,
    ContextTypes,
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

# ── DB helpers (sync_to_async) ─────────────────────────────────────────────

@sync_to_async
def db_get_or_create_tg_user(telegram_id, defaults):
    from apps.telegram_bot.models import TelegramUser
    obj, created = TelegramUser.objects.update_or_create(
        telegram_id=telegram_id, defaults=defaults
    )
    return obj, created


@sync_to_async
def db_get_tg_user_with_student(telegram_id):
    from apps.telegram_bot.models import TelegramUser
    return (
        TelegramUser.objects
        .filter(telegram_id=telegram_id)
        .select_related("student")
        .first()
    )


@sync_to_async
def db_get_active_courses():
    from apps.groups.models import Course
    return list(Course.objects.filter(is_active=True))


@sync_to_async
def db_get_course(course_id):
    from apps.groups.models import Course
    return Course.objects.filter(id=course_id, is_active=True).first()


@sync_to_async
def db_create_student(first_name, last_name, phone, notes):
    from apps.students.models import Student
    return Student.objects.create(
        first_name=first_name,
        last_name=last_name,
        phone=phone,
        status=Student.Status.ACTIVE,
        notes=notes,
    )


@sync_to_async
def db_link_student_to_tg_user(telegram_id, student):
    from apps.telegram_bot.models import TelegramUser
    tg_user = TelegramUser.objects.filter(telegram_id=telegram_id).first()
    if tg_user:
        tg_user.student = student
        tg_user.save(update_fields=["student"])


@sync_to_async
def db_get_student_groups(student):
    return list(
        student.group_memberships
        .filter(is_active=True)
        .select_related("group", "group__teacher")
    )


@sync_to_async
def db_count_absences(student, group):
    return student.attendance_records.filter(
        session__group=group, status="absent"
    ).count()


# ── Handlers ───────────────────────────────────────────────────────────────

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handler /start command"""
    user = update.effective_user

    await db_get_or_create_tg_user(
        telegram_id=user.id,
        defaults={
            "username": user.username or "",
            "first_name": user.first_name or "",
            "last_name": user.last_name or "",
            "chat_id": update.effective_chat.id,
        },
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

    handlers = {
        "📌 Ro'yxatdan o'tish": start_registration,
        "📚 Kurslar": show_courses,
        "📊 Mening hisobim": show_my_account,
        "📞 Aloqa": show_contact,
    }

    handler = handlers.get(text)
    if handler:
        return await handler(update, context)

    await update.message.reply_text(
        "Menyu tugmalaridan foydalaning 👆", reply_markup=MENU_KEYBOARD
    )
    return MENU


async def start_registration(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start registration flow"""
    tg_user = await db_get_tg_user_with_student(update.effective_user.id)

    if tg_user and tg_user.student:
        await update.message.reply_text(
            f"✅ Siz allaqachon ro'yxatdan o'tgansiz!\n"
            f"📛 Ism: {tg_user.student.full_name}\n"
            f"📱 Telefon: {tg_user.student.phone}",
            reply_markup=MENU_KEYBOARD,
        )
        return MENU

    await update.message.reply_text(
        "📝 Ro'yxatdan o'tish\n\nIsm va familiyangizni kiriting:\n(Masalan: Aliyev Jasur)",
        reply_markup=ReplyKeyboardMarkup([["❌ Bekor qilish"]], resize_keyboard=True),
    )
    return REGISTER_NAME


async def register_name(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Save name, ask for phone"""
    if update.message.text == "❌ Bekor qilish":
        await update.message.reply_text("Bekor qilindi.", reply_markup=MENU_KEYBOARD)
        return MENU

    name = update.message.text.strip()
    if len(name) < 3:
        await update.message.reply_text(
            "❗ Iltimos, to'liq ism va familiyangizni kiriting:"
        )
        return REGISTER_NAME

    context.user_data["full_name"] = name

    phone_button = KeyboardButton("📱 Telefon raqamni yuborish", request_contact=True)
    keyboard = ReplyKeyboardMarkup(
        [[phone_button], ["❌ Bekor qilish"]], resize_keyboard=True
    )
    await update.message.reply_text(
        f"✅ Ism saqlandi: {name}\n\n📱 Endi telefon raqamingizni yuboring:",
        reply_markup=keyboard,
    )
    return REGISTER_PHONE


async def register_phone(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Save phone, show course selection"""
    if update.message.text == "❌ Bekor qilish":
        await update.message.reply_text("Bekor qilindi.", reply_markup=MENU_KEYBOARD)
        return MENU

    if update.message.contact:
        phone = update.message.contact.phone_number
        if not phone.startswith("+"):
            phone = "+" + phone
    else:
        phone = update.message.text.strip().replace(" ", "").replace("-", "")
        if phone.startswith("0"):
            phone = "+998" + phone[1:]
        elif phone.startswith("998"):
            phone = "+" + phone
        elif not phone.startswith("+"):
            phone = "+998" + phone

    context.user_data["phone"] = phone

    courses = await db_get_active_courses()
    if not courses:
        await update.message.reply_text(
            "❗ Hozircha faol kurslar mavjud emas. Keyinroq urinib ko'ring.",
            reply_markup=MENU_KEYBOARD,
        )
        return MENU

    buttons = [
        [InlineKeyboardButton(c.name, callback_data=f"course_{c.id}")]
        for c in courses
    ]
    buttons.append([InlineKeyboardButton("❌ Bekor qilish", callback_data="cancel")])

    await update.message.reply_text(
        "📚 Qaysi kursga qiziqasiz?",
        reply_markup=InlineKeyboardMarkup(buttons),
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

    if not query.data.startswith("course_"):
        return REGISTER_COURSE

    try:
        course_id = int(query.data.split("_")[1])
    except (IndexError, ValueError):
        await query.edit_message_text("❗ Xatolik yuz berdi. Qaytadan urinib ko'ring.")
        return MENU

    course = await db_get_course(course_id)
    if not course:
        await query.edit_message_text("❗ Kurs topilmadi.")
        await query.message.reply_text("Asosiy menyu:", reply_markup=MENU_KEYBOARD)
        return MENU

    full_name = context.user_data.get("full_name", "")
    phone = context.user_data.get("phone", "")

    parts = full_name.strip().split(" ", 1)
    last_name = parts[0]
    first_name = parts[1] if len(parts) > 1 else ""

    try:
        student = await db_create_student(
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            notes=f"Telegram orqali ro'yxatdan o'tdi. Kurs: {course.name}",
        )
    except Exception as e:
        logger.error(f"Student yaratishda xatolik: {e}")
        await query.edit_message_text(
            "❗ Ro'yxatdan o'tishda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring."
        )
        await query.message.reply_text("Asosiy menyu:", reply_markup=MENU_KEYBOARD)
        return MENU

    await db_link_student_to_tg_user(query.from_user.id, student)
    context.user_data.clear()

    success_text = (
        f"✅ Muvaffaqiyatli ro'yxatdan o'tdingiz!\n\n"
        f"📛 Ism: {student.full_name}\n"
        f"📱 Telefon: {phone}\n"
        f"📚 Tanlangan kurs: {course.name}\n\n"
        f"📞 Tez orada administratorimiz siz bilan bog'lanadi!"
    )
    await query.edit_message_text(success_text)
    await query.message.reply_text("Asosiy menyu:", reply_markup=MENU_KEYBOARD)
    return MENU


async def show_courses(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show available courses"""
    courses = await db_get_active_courses()

    if not courses:
        await update.message.reply_text(
            "Hozircha kurslar mavjud emas.", reply_markup=MENU_KEYBOARD
        )
        return MENU

    text = "📚 *Mavjud kurslar:*\n\n"
    for course in courses:
        text += f"• *{course.name}*\n"
        if course.description:
            text += f"  {course.description[:100]}\n"
        text += f"  ⏱ Davomiyligi: {course.duration_months} oy\n\n"

    await update.message.reply_text(
        text, parse_mode="Markdown", reply_markup=MENU_KEYBOARD
    )
    return MENU


async def show_my_account(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show student's personal account info"""
    tg_user = await db_get_tg_user_with_student(update.effective_user.id)

    if not tg_user or not tg_user.student:
        await update.message.reply_text(
            "❌ Siz hali ro'yxatdan o'tmagansiz.\n"
            "'📌 Ro'yxatdan o'tish' tugmasini bosing.",
            reply_markup=MENU_KEYBOARD,
        )
        return MENU

    student = tg_user.student
    memberships = await db_get_student_groups(student)

    text = f"👤 *{student.full_name}*\n"
    text += f"📱 {student.phone}\n\n"

    if memberships:
        for membership in memberships:
            group = membership.group
            missed = await db_count_absences(student, group)
            teacher_name = group.teacher.full_name if group.teacher else "—"
            text += f"📚 *{group.name}*\n"
            text += f"  👨‍🏫 O'qituvchi: {teacher_name}\n"
            text += f"  ⏰ Dars: {group.start_time.strftime('%H:%M')} - {group.end_time.strftime('%H:%M')}\n"
            text += f"  ❌ Qoldirilgan darslar: {missed}\n\n"
    else:
        text += "_Hozircha hech qaysi guruhda emas_\n"

    await update.message.reply_text(
        text, parse_mode="Markdown", reply_markup=MENU_KEYBOARD
    )
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
    await update.message.reply_text(
        text, parse_mode="Markdown", reply_markup=MENU_KEYBOARD
    )
    return MENU


async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE):
    """Log errors"""
    logger.error("Xatolik:", exc_info=context.error)


def create_bot_application() -> Application:
    """Create and configure bot application"""
    token = getattr(settings, "TELEGRAM_BOT_TOKEN", None)
    if not token:
        raise ValueError("TELEGRAM_BOT_TOKEN sozlamasi topilmadi!")

    app = Application.builder().token(token).build()

    conv_handler = ConversationHandler(
        entry_points=[CommandHandler("start", start)],
        states={
            MENU: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, menu_handler)
            ],
            REGISTER_NAME: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, register_name)
            ],
            REGISTER_PHONE: [
                MessageHandler(
                    filters.CONTACT | (filters.TEXT & ~filters.COMMAND),
                    register_phone,
                )
            ],
            REGISTER_COURSE: [CallbackQueryHandler(register_course)],
        },
        fallbacks=[CommandHandler("start", start)],
        per_user=True,
        allow_reentry=True,
    )

    app.add_handler(conv_handler)
    app.add_error_handler(error_handler)
    return app