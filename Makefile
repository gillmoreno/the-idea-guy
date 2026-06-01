.PHONY: build up down logs dev dev-frontend dev-backend

build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

dev:
	@echo "Starting Go API on :8081 and Next.js on :3000..."
	@trap 'kill 0' EXIT; \
	cd backend && API_ADDR=:8081 go run ./cmd/server & \
	cd frontend && npm run dev

dev-frontend:
	cd frontend && npm install && npm run dev

dev-backend:
	cd backend && API_ADDR=:8081 go run ./cmd/server
