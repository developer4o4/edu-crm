import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.students.models import Student

students = [
    ("Abdullo",       "O'ktamjonov",      "+998932251700"),
    ("Husanboy",      "Akramov",          "+998881332307"),
    ("Sirojiddin",    "Boburbekov",       "+998914854002"),
    ("Umidillo",      "Gayratjonov",      "+998930622200"),
    ("Abdulhamid",    "Sharobiddinov",    "+998930658557"),
    ("Dostonbek",     "Yusufjonov",       "+998931325391"),
    ("Ilhomjon",      "Ibrohimov",        "+998902062800"),
    ("Jamshidbek",    "Fazliddinov",      "+998938809929"),
    ("Muhammadrizo",  "Fozilov",          "+998949764121"),
    ("Islombek",      "Hakimjonov",       "+998931000384"),
]

created = 0
skipped = 0

for first_name, last_name, phone in students:
    if Student.objects.filter(phone=phone).exists():
        print(f"  SKIP (already exists): {last_name} {first_name}")
        skipped += 1
        continue

    Student.objects.create(
        first_name=first_name,
        last_name=last_name,
        phone=phone,
        parent_phone=phone,   # ota-ona teli ham o'zi
        address="Paxtaobod tuman",
        status="active",
    )
    print(f"  OK: {last_name} {first_name} — {phone}")
    created += 1

print(f"\nJami: {created} ta yaratildi, {skipped} ta o'tkazib yuborildi")
print(f"DB dagi jami o'quvchilar: {Student.objects.count()} ta")