.PHONY: dev dev-relay dev-web build relay-build web-build typecheck

RELAY_ADDR ?= :4501
WEB_PORT ?= 3200

# Run relay + Next.js dev together
dev:
	@echo "Starting relay on $(RELAY_ADDR) and web on :$(WEB_PORT)…"
	@trap 'kill 0' EXIT; \
		(cd relay && RELAY_ADDR=$(RELAY_ADDR) go run .) & \
		(cd web && NEXT_PUBLIC_RELAY_URL=ws://localhost:4501 NEXT_PUBLIC_AI_URL=http://localhost:4501 npm run dev -- -p $(WEB_PORT)) & \
		wait

dev-relay:
	cd relay && RELAY_ADDR=$(RELAY_ADDR) go run .

dev-web:
	cd web && NEXT_PUBLIC_RELAY_URL=ws://localhost:4501 NEXT_PUBLIC_AI_URL=http://localhost:4501 npm run dev -- -p $(WEB_PORT)

relay-build:
	cd relay && go build -o bin/relay .

web-build:
	cd web && NEXT_PUBLIC_RELAY_URL=ws://localhost:4501 NEXT_PUBLIC_AI_URL=http://localhost:4501 npm run build

web-typecheck:
	cd web && npm run typecheck

build: relay-build web-build

typecheck: web-typecheck
