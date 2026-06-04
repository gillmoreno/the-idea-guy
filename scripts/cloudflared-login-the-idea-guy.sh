#!/usr/bin/env bash
# Issue a cloudflared origin cert scoped to the-idea-guy.com (keeps ~/.cloudflared/cert.pem for aigil.dev).
set -euo pipefail

CERT_DIR="${CLOUDFLARED_IDEA_GUY_DIR:-$HOME/.cloudflared-the-idea-guy}"
CERT_FILE="${CERT_DIR}/cert.pem"

mkdir -p "$CERT_DIR"

echo "Opening Cloudflare login in your browser."
echo "When prompted, select zone: the-idea-guy.com (NOT aigil.dev)."
echo "Certificate will be saved to: ${CERT_FILE}"
echo ""

# Isolated HOME avoids cloudflared refusing login when ~/.cloudflared/cert.pem exists (aigil.dev).
env HOME="$CERT_DIR" TUNNEL_ORIGIN_CERT="$CERT_FILE" cloudflared tunnel login

echo ""
echo "Done. Route relay DNS with:"
echo "  TUNNEL_ORIGIN_CERT=\"${CERT_FILE}\" cloudflared tunnel route dns -f choreboard-relay relay.the-idea-guy.com"
echo ""
echo "Or skip CLI DNS and run: ./scripts/relay-route-dns.sh (uses API token in deploy/.env)"
