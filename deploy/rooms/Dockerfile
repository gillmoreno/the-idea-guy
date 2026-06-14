# Rooms bundle: static Next.js export + Go relay behind one nginx.
# Build context is the repo root (see docker-compose.yml) so the
# apps/rooms/web → packages/room-kit file: link keeps its relative path.

# ---- stage 1: web (Next.js static export) ----
FROM node:22-slim AS web-build
WORKDIR /repo
COPY packages/room-kit/package*.json packages/room-kit/
RUN npm --prefix packages/room-kit ci
COPY apps/rooms/web/package*.json apps/rooms/web/
RUN npm --prefix apps/rooms/web ci
COPY packages/room-kit packages/room-kit
COPY apps/rooms/web apps/rooms/web
ARG NEXT_PUBLIC_APP_URL=https://rooms.the-idea-guy.com
ARG NEXT_PUBLIC_RELAY_URL=wss://rooms.the-idea-guy.com
# Build version stamped into the bundle, version.json and sw.js (update detection).
# .git isn't in the build image, so redeploy.sh passes the git sha; empty falls
# back to a timestamp in compute-version.mjs so every build still differs.
ARG APP_BUILD_VERSION=
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_RELAY_URL=$NEXT_PUBLIC_RELAY_URL \
    APP_BUILD_VERSION=$APP_BUILD_VERSION
RUN npm --prefix apps/rooms/web run build

# ---- stage 2: relay (static Go binary) ----
FROM golang:1.25-alpine AS relay-build
WORKDIR /src
COPY relay/go.mod relay/go.sum ./
RUN go mod download
COPY relay/ ./
RUN CGO_ENABLED=0 go build -o /out/relay .

# ---- final: nginx serves the export, proxies /sync + /healthz to the relay ----
# debian-slim like inkanto/Dockerfile.deploy — supervisor is broken on alpine/musl.
FROM debian:bookworm-slim
RUN apt-get update \
 && apt-get install -y --no-install-recommends nginx supervisor ca-certificates \
 && rm -rf /var/lib/apt/lists/*
COPY --from=web-build /repo/apps/rooms/web/out /usr/share/nginx/html
COPY --from=relay-build /out/relay /usr/local/bin/relay
COPY deploy/rooms/nginx.conf /etc/nginx/conf.d/default.conf
RUN rm -f /etc/nginx/sites-enabled/default
COPY deploy/rooms/supervisord.conf /etc/supervisord.conf
RUN mkdir -p /data

ENV RELAY_ADDR=:4500 \
    RELAY_DATA_DIR=/data

EXPOSE 80
CMD ["supervisord", "-c", "/etc/supervisord.conf"]
