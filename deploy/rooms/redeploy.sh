#!/usr/bin/env bash
# Rebuild and restart the Rooms bundle (static web + relay in one container).
# Frontend and relay always ship together — no protocol skew possible.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
docker compose up -d --build
sleep 3
curl -sfS http://localhost:4510/healthz >/dev/null && echo "✓ healthz ok"
echo "✓ live at https://rooms.the-idea-guy.com (tunnel: choreboard-relay)"
