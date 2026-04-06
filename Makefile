.PHONY: up down build logs migrate createsuperuser shell restart

# === Docker Commands ===

up:
	docker-compose up -d

down:
	docker-compose down

build:
	docker-compose build

logs:
	docker-compose logs -f

restart:
	docker-compose restart backend celery_worker celery_beat

# === Django ===

migrate:
	docker-compose exec backend python manage.py migrate

makemigrations:
	docker-compose exec backend python manage.py makemigrations

createsuperuser:
	docker-compose exec backend python manage.py createsuperuser

shell:
	docker-compose exec backend python manage.py shell

collectstatic:
	docker-compose exec backend python manage.py collectstatic --noinput

# === Development ===

dev-backend:
	cd backend && python manage.py runserver 0.0.0.0:8000

dev-frontend:
	cd frontend && npm run dev

dev-celery:
	cd backend && celery -A config worker -l info

dev-beat:
	cd backend && celery -A config beat -l info

# === Database ===

db-shell:
	docker-compose exec db psql -U educrm_user -d educrm

db-backup:
	docker-compose exec db pg_dump -U educrm_user educrm > backup_$(shell date +%Y%m%d_%H%M%S).sql

# === Testing ===

test:
	docker-compose exec backend python manage.py test

# === Setup ===

setup: build
	docker-compose up -d db redis
	sleep 5
	docker-compose up -d backend celery_worker celery_beat
	$(MAKE) migrate
	docker-compose up -d
	@echo "✅ EduCRM Pro ishga tushdi! http://localhost"
	@echo "📚 API docs: http://localhost/api/docs/"
