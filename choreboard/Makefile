.PHONY: dev dev-relay dev-web build relay-build web-build

RELAY_ADDR ?= :4500
WEB_PORT ?= 3100

# Run relay + Next.js dev together (two terminals worth, one command)
dev:
	@echo "Starting relay on $(RELAY_ADDR) and web on :$(WEB_PORT)…"
	@trap 'kill 0' EXIT; \
		(cd relay && RELAY_ADDR=$(RELAY_ADDR) go run .) & \
		(cd web && NEXT_PUBLIC_RELAY_URL=ws://localhost:4500 npm run dev -- -p $(WEB_PORT)) & \
		wait

dev-relay:
	cd relay && RELAY_ADDR=$(RELAY_ADDR) go run .

dev-web:
	cd web && NEXT_PUBLIC_RELAY_URL=ws://localhost:4500 npm run dev -- -p $(WEB_PORT)

relay-build:
	cd relay && go build -o bin/relay .

web-build:
	cd web && npm run build

build: relay-build web-build
