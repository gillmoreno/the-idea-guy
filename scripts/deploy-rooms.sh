#!/usr/bin/env bash
# Build Rooms meta-app and deploy to https://rooms.the-idea-guy.com (Cloudflare Pages).
#
# First time:
#   ./scripts/deploy-rooms.sh --init
#
# Every release:
#   ./scripts/deploy-rooms.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT}/deploy/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing ${ENV_FILE}" >&2
  echo "Copy deploy/.env.example → deploy/.env and set CLOUDFLARE_API_TOKEN." >&2
  exit 1
fi

exec "${ROOT}/scripts/deploy-subdomain.sh" rooms "$@"
