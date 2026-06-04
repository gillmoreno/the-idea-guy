#!/usr/bin/env bash
# Create relay.the-idea-guy.com CNAME on the correct zone (cloudflared CLI only works for aigil.dev here).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT}/deploy/.env"
APEX="${RELAY_APEX_DOMAIN:-the-idea-guy.com}"
HOSTNAME="${RELAY_DNS_HOSTNAME:-relay.${APEX}}"
TUNNEL_ID="${CHOREBOARD_RELAY_TUNNEL_ID:-f3e1a2ac-d0e8-4be6-a246-6c0d76cfe8c8}"
TARGET="${TUNNEL_ID}.cfargotunnel.com"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

[[ -n "${CLOUDFLARE_API_TOKEN:-}" ]] || {
  echo "Set CLOUDFLARE_API_TOKEN in deploy/.env (same token as deploy-subdomain.sh)." >&2
  exit 1
}

cf_api() {
  local method="$1" path="$2" data="${3:-}"
  local url="https://api.cloudflare.com/client/v4${path}"
  if [[ -n "$data" ]]; then
    curl -sfS -X "$method" "$url" \
      -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
      -H "Content-Type: application/json" \
      --data "$data"
  else
    curl -sfS -X "$method" "$url" \
      -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
      -H "Content-Type: application/json"
  fi
}

ZONE_ID="$(cf_api GET "/zones?name=${APEX}&status=active" | jq -r '.result[0].id // empty')"
[[ -n "$ZONE_ID" ]] || { echo "Zone not found: ${APEX}" >&2; exit 1; }

existing="$(cf_api GET "/zones/${ZONE_ID}/dns_records?type=CNAME&name=${HOSTNAME}" \
  | jq -r '.result[0].id // empty')"

if [[ -n "$existing" ]]; then
  echo "DNS CNAME already exists for ${HOSTNAME}"
  exit 0
fi

echo "Creating CNAME ${HOSTNAME} → ${TARGET} (proxied)"
cf_api POST "/zones/${ZONE_ID}/dns_records" \
  "{\"type\":\"CNAME\",\"name\":\"relay\",\"content\":\"${TARGET}\",\"proxied\":true}" \
  >/dev/null
echo "Done."
