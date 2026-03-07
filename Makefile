run-frontend:
	cd frontend && npm run dev

run-backend:
	bash -c "source ./backend/.venv/bin/activate && uvicorn backend.main:app --reload"

docker-build:
	docker-compose build

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down