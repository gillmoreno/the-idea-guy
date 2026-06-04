#!/usr/bin/env bash
# Finish ChoreBoard relay: DNS on the-idea-guy.com + verify (run after login or with deploy/.env).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TUNNEL_NAME="${CHOREBOARD_RELAY_TUNNEL:-choreboard-relay}"
TUNNEL_ID="${CHOREBOARD_RELAY_TUNNEL_ID:-f3e1a2ac-d0e8-4be6-a246-6c0d76cfe8c8}"
IDEA_CERT="${CLOUDFLARED_IDEA_GUY_CERT:-}"
if [[ -z "$IDEA_CERT" ]]; then
  for c in "$HOME/.cloudflared-the-idea-guy/.cloudflared/cert.pem" \
           "$HOME/.cloudflared-the-idea-guy/cert.pem"; do
    [[ -f "$c" ]] && IDEA_CERT="$c" && break
  done
fi
IDEA_CERT="${IDEA_CERT:-$HOME/.cloudflared-the-idea-guy/.cloudflared/cert.pem}"
RELAY_DIR="${ROOT}/choreboard/relay"

log() { printf '→ %s\n' "$*"; }

# 1. Docker relay
log "Starting relay container…"
(cd "$RELAY_DIR" && docker compose up -d --build)

# 2. LaunchAgent tunnel (no sudo)
USER_UID="$(id -u)"
PLIST="$HOME/Library/LaunchAgents/com.cloudflare.cloudflared.${TUNNEL_NAME}.plist"
if [[ -f "$PLIST" ]]; then
  launchctl bootout "gui/${USER_UID}/com.cloudflare.cloudflared.${TUNNEL_NAME}" 2>/dev/null || true
  launchctl bootstrap "gui/${USER_UID}" "$PLIST"
  launchctl kickstart -k "gui/${USER_UID}/com.cloudflare.cloudflared.${TUNNEL_NAME}" 2>/dev/null || true
  log "Tunnel LaunchAgent loaded"
fi

# 3. DNS on the-idea-guy.com
if [[ -f "${ROOT}/deploy/.env" ]]; then
  log "Creating DNS via API…"
  "${ROOT}/scripts/relay-route-dns.sh"
elif [[ -f "$IDEA_CERT" ]]; then
  log "Creating DNS via cloudflared (Idea Guy cert)…"
  TUNNEL_ORIGIN_CERT="$IDEA_CERT" cloudflared tunnel route dns -f "$TUNNEL_NAME" relay.the-idea-guy.com
else
  log "Skip DNS: run ./scripts/cloudflared-login-the-idea-guy.sh OR add deploy/.env"
  log "Manual CNAME: relay → ${TUNNEL_ID}.cfargotunnel.com (proxied)"
fi

# 4. Remove mistaken aigil.dev record if Idea Guy cert exists
if [[ -f "$IDEA_CERT" ]]; then
  TUNNEL_ORIGIN_CERT="$IDEA_CERT" cloudflared tunnel route dns -f "$TUNNEL_NAME" relay.the-idea-guy.com 2>/dev/null || true
fi

log "Local health:"
curl -sf "http://localhost:4500/healthz" && echo ""

log "Public health (may take ~1 min after DNS):"
for _ in 1 2 3 4 5; do
  if curl -sf --max-time 8 "https://relay.the-idea-guy.com/healthz" 2>/dev/null; then
    echo ""
    log "Relay is online at https://relay.the-idea-guy.com"
    exit 0
  fi
  sleep 5
done

echo "Public URL not up yet — complete DNS (login or deploy/.env) then re-run this script." >&2
exit 1
