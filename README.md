# 🎓 EduCRM Pro — O'quv markaz boshqaruv tizimi

> O'quv markazlarni 100% avtomatlashtiradigan CRM + LMS + Billing + Automation tizimi

---

## 🚀 Tizim imkoniyatlari

| Modul | Funksiya |
|-------|----------|
| 👥 O'quvchilar | To'liq profil, guruhlar, to'lovlar, davomat |
| 📚 Guruhlar | Jadval, o'qituvchi, oylik to'lov sanasi |
| 💰 To'lovlar | Naqd, karta, Payme online |
| 📅 Davomat | Har dars uchun BOR/YO'Q, statistika |
| 📩 SMS | Eskiz.uz avtomatik va qo'lda |
| 🤖 Telegram Bot | Ro'yxatdan o'tish, kurslar, shaxsiy kabinet |
| 📊 Hisobotlar | Excel export, oylik/yillik daromad |
| 🔐 Rollar | Super Admin, Admin, O'qituvchi, O'quvchi |

---

## ⚙️ Texnologiya steki

```
Backend:   Django 5 + DRF + Celery + Redis
Frontend:  React 18 + Tailwind CSS + Recharts
Database:  PostgreSQL 16
Queue:     Celery + Redis
SMS:       Eskiz.uz API
Payment:   Payme Merchant API
Bot:       python-telegram-bot
Deploy:    Docker Compose + Nginx
```

---

## 🛠️ O'rnatish

### 1. Loyihani klonlash

```bash
git clone https://github.com/yourname/educrm.git
cd educrm
```

### 2. Environment faylini sozlash

```bash
cp .env.example .env
# .env faylini tahrirlang
nano .env
```

Muhim o'zgaruvchilar:
```env
SECRET_KEY=your-very-long-secret-key
DB_PASSWORD=strong_database_password
ESKIZ_EMAIL=your@email.com
ESKIZ_PASSWORD=your_eskiz_password
PAYME_MERCHANT_ID=your_merchant_id
PAYME_SECRET_KEY=your_secret_key
TELEGRAM_BOT_TOKEN=your_bot_token
```

### 3. Docker bilan ishga tushirish

```bash
# Barcha servislarni build qilish va ishga tushirish
make setup

# Yoki qo'lda:
docker-compose build
docker-compose up -d
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
```

### 4. Brauzerda ochish

```
Frontend:  http://localhost
API docs:  http://localhost/api/docs/
Admin:     http://localhost/admin/
```

---

## 📁 Loyiha strukturasi

```
educrm/
├── backend/
│   ├── apps/
│   │   ├── students/     # O'quvchi, O'qituvchi, Foydalanuvchi
│   │   ├── groups/       # Guruh, Kurs, Guruh a'zoligi
│   │   ├── payments/     # To'lov, Payme integratsiya
│   │   ├── attendance/   # Davomat sessiya va yozuvlari
│   │   ├── sms/          # Eskiz.uz, SMS log, Celery tasks
│   │   ├── reports/      # Excel hisobotlar
│   │   └── telegram_bot/ # Telegram bot
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── celery.py
│   └── utils/            # Permissions, pagination
│
├── frontend/
│   └── src/
│       ├── pages/        # Barcha sahifalar
│       ├── components/   # UI komponentlar
│       ├── store/        # Zustand store
│       └── utils/        # API client
│
├── nginx/nginx.conf
├── docker-compose.yml
├── Makefile
└── .env.example
```

---

## 🔐 Rollar va ruxsatlar

| Ruxsat | Super Admin | Admin | O'qituvchi | O'quvchi |
|--------|-------------|-------|------------|----------|
| Dashboard | ✅ | ✅ | ❌ | ❌ |
| O'quvchilar CRUD | ✅ | ✅ | 👁️ | ❌ |
| Guruhlar CRUD | ✅ | ✅ | 👁️ | ❌ |
| To'lovlar | ✅ | ✅ | ❌ | 👁️ |
| Davomat belgilash | ✅ | ✅ | ✅ | ❌ |
| SMS yuborish | ✅ | ✅ | ❌ | ❌ |
| Hisobotlar | ✅ | ✅ | ❌ | ❌ |
| Sozlamalar | ✅ | ❌ | ❌ | ❌ |

---

## 💳 Payme integratsiya

```python
# To'lov havolasi yaratish
POST /api/v1/payments/{id}/generate_payme_link/

# Response:
{
  "payme_link": "https://checkout.paycom.uz/...",
  "amount": 500000
}
```

Payme callback URL (Payme developer panelida ro'yxatdan o'tkazing):
```
https://yourdomain.com/payme/
```

---

## 📩 SMS avtomatizatsiya (Celery)

```
09:00 — To'lov sanasi bo'lgan guruhlarga eslatma SMS
10:00 — Qarzdorlarga eslatma SMS  
01-sana — Oylik hisobot yaratish
```

---

## 🤖 Telegram Bot buyruqlari

```
/start    — Boshlash va asosiy menyu
📌 Ro'yxatdan o'tish  — Yangi o'quvchi qo'shish
📚 Kurslar            — Mavjud kurslar ro'yxati
📊 Mening hisobim     — Shaxsiy ma'lumotlar
📞 Aloqa              — Bog'lanish ma'lumotlari
```

---

## 📊 API endpointlar

```
GET  /api/v1/dashboard/stats/        — Dashboard statistika
GET  /api/v1/students/               — O'quvchilar ro'yxati
POST /api/v1/students/               — Yangi o'quvchi
GET  /api/v1/students/{id}/payments/ — O'quvchi to'lovlari
GET  /api/v1/groups/                 — Guruhlar
POST /api/v1/payments/               — Yangi to'lov
GET  /api/v1/payments/debtors/       — Qarzdorlar
POST /api/v1/attendance/sessions/    — Yangi dars sessiyasi
GET  /api/v1/reports/income/?export=excel — Excel hisobot
POST /api/v1/sms/send/               — SMS yuborish
```

Swagger UI: `http://localhost/api/docs/`

---

## 🛠️ Tez-tez ishlatiladigan buyruqlar

```bash
# Loglarni ko'rish
make logs

# Migratsiya
make migrate

# Super admin yaratish
make createsuperuser

# Django shell
make shell

# Database backup
make db-backup

# Test
make test
```

---

## 📦 Production deploy

1. `.env` da `DEBUG=False` qilib qo'ying
2. `ALLOWED_HOSTS` va `CORS_ALLOWED_ORIGINS` ni to'ldiring
3. SSL sertifikat oling (Let's Encrypt)
4. Nginx SSL konfiguratsiyasini sozlang
5. Payme dashboard'da callback URL'ni ro'yxatdan o'tkazing

---

© 2026 EduCRM Pro | Barcha huquqlar himoyalangan
