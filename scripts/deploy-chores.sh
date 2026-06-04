#!/usr/bin/env bash
# Build ChoreBoard web and deploy to https://chores.the-idea-guy.com (Cloudflare Pages).
#
# First time (Pages project + custom domain — run once):
#   ./scripts/deploy-chores.sh --init
#
# Every release (build + upload):
#   ./scripts/deploy-chores.sh
#
# Requires deploy/.env — copy from deploy/.env.example:
#   CLOUDFLARE_API_TOKEN
#   CLOUDFLARE_ACCOUNT_ID  (only for --init)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT}/deploy/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing ${ENV_FILE}" >&2
  echo "Copy deploy/.env.example → deploy/.env and set CLOUDFLARE_API_TOKEN." >&2
  echo "Create a token: https://dash.cloudflare.com/profile/api-tokens" >&2
  echo "  Permissions: Pages Edit, Zone DNS Edit, Zone Read" >&2
  exit 1
fi

exec "${ROOT}/scripts/deploy-subdomain.sh" chores "$@"
