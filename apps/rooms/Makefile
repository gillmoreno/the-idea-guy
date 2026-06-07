.PHONY: dev dev-relay dev-relay-docker dev-docker dev-web build relay-build web-build web-build-local preview preview-all deploy

RELAY_ADDR ?= :4500
WEB_PORT ?= 3300
PREVIEW_PORT ?= 3300
PREVIEW_URL ?= http://localhost:$(PREVIEW_PORT)

dev:
	@echo "Starting relay on $(RELAY_ADDR) and Rooms web on :$(WEB_PORT)…"
	@trap 'kill 0' EXIT; \
		(cd ../../relay && RELAY_ADDR=$(RELAY_ADDR) go run .) & \
		(cd web && NEXT_PUBLIC_RELAY_URL=ws://localhost:4500 npm run dev -- -p $(WEB_PORT)) & \
		wait

dev-relay:
	cd ../../relay && RELAY_ADDR=$(RELAY_ADDR) go run .

dev-relay-docker:
	cd ../../relay && docker compose up --build

dev-docker:
	@echo "Docker relay on $(RELAY_ADDR) + Rooms web on :$(WEB_PORT)…"
	@trap 'kill 0' EXIT; \
		(cd ../../relay && docker compose up --build) & \
		sleep 2; \
		(cd web && NEXT_PUBLIC_RELAY_URL=ws://localhost:4500 npm run dev -- -p $(WEB_PORT)) & \
		wait

dev-web:
	cd web && NEXT_PUBLIC_RELAY_URL=ws://localhost:4500 npm run dev -- -p $(WEB_PORT)

relay-build:
	cd ../../relay && go build -o bin/relay .

web-build:
	cd web && npm run build

# Static export with local relay + app URL baked in (matches production build, no next dev).
web-build-local:
	cd web && \
		NEXT_PUBLIC_RELAY_URL=ws://localhost:4500 \
		NEXT_PUBLIC_APP_URL=$(PREVIEW_URL) \
		npm run build

# Serve web/out after web-build-local. Run make dev-relay in another terminal, or use preview-all.
preview: web-build-local
	@echo "Static site: $(PREVIEW_URL)  (output: web/out)"
	@echo "Relay should be running at ws://localhost:4500 — use 'make dev-relay' or 'make preview-all'"
	cd web && npx --yes serve out -l $(PREVIEW_PORT)

# Relay + static preview in one command (production-like local test).
preview-all:
	@echo "Relay ws://localhost:4500 + static app $(PREVIEW_URL)"
	@trap 'kill 0' EXIT; \
		(cd ../../relay && RELAY_ADDR=$(RELAY_ADDR) go run .) & \
		sleep 1; \
		$(MAKE) preview; \
		wait

build: relay-build web-build

deploy:
	../../scripts/deploy-rooms.sh
