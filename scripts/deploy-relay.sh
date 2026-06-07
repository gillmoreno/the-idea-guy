#!/usr/bin/env bash
# Deploy ChoreBoard relay to relay.the-idea-guy.com via cloudflared + Docker.
# Requires: Docker, cloudflared login, sudo for launchd tunnel install.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEPLOYER="${DEPLOYER_SCRIPT:-$HOME/Infrastructure/deployer/deploy.sh}"
RELAY_DIR="${REPO_ROOT}/relay"
TUNNEL_NAME="${CHOREBOARD_RELAY_TUNNEL:-choreboard-relay}"
SUBDOMAIN="${CHOREBOARD_RELAY_SUBDOMAIN:-relay}"
PORT="${CHOREBOARD_RELAY_PORT:-4500}"
DOMAIN="${DEPLOY_DOMAIN:-the-idea-guy.com}"

if [[ ! -x "$DEPLOYER" && ! -f "$DEPLOYER" ]]; then
  echo "Deploy script not found: $DEPLOYER" >&2
  echo "Set DEPLOYER_SCRIPT to your Infrastructure/deployer/deploy.sh path." >&2
  exit 1
fi

export DEPLOY_DOMAIN="$DOMAIN"

if ! "$DEPLOYER" deploy "$TUNNEL_NAME" "$SUBDOMAIN" "$PORT" "$RELAY_DIR"; then
  echo ""
  echo "Deployer may have stopped at sudo (launchd). Finishing Docker + tunnel + DNS…" >&2
  (cd "$RELAY_DIR" && docker compose up -d --build)
  TUNNEL_ID="$(/opt/homebrew/bin/cloudflared tunnel list 2>/dev/null | awk -v n="$TUNNEL_NAME" '$0 ~ n {print $1; exit}')"
  if [[ -n "$TUNNEL_ID" ]]; then
    export CHOREBOARD_RELAY_TUNNEL_ID="$TUNNEL_ID"
    "${REPO_ROOT}/scripts/relay-route-dns.sh" || true
    if ! pgrep -f "config-${TUNNEL_NAME}.yml" >/dev/null 2>&1; then
      nohup /opt/homebrew/bin/cloudflared tunnel --config "$HOME/.cloudflared/config-${TUNNEL_NAME}.yml" run \
        >> "$HOME/.cloudflared/${TUNNEL_NAME}.log" 2>&1 &
      echo "Started cloudflared in background (until you install launchd with sudo)." >&2
    fi
  fi
  exit 1
fi

# cloudflared CLI DNS only works for the aigil.dev login cert; fix the-idea-guy.com via API.
"${REPO_ROOT}/scripts/relay-route-dns.sh" || true
