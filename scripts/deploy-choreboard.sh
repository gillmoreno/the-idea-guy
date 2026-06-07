#!/usr/bin/env bash
# Deploy ChoreBoard frontend (Cloudflare Pages) + backend (relay via Docker + tunnel).
#
# Usage:
#   ./scripts/deploy-choreboard.sh              # both
#   ./scripts/deploy-choreboard.sh --init         # first-time Pages setup + relay
#   ./scripts/deploy-choreboard.sh --frontend-only
#   ./scripts/deploy-choreboard.sh --backend-only
#
# Frontend: https://chores.the-idea-guy.com
# Backend:  https://relay.the-idea-guy.com/healthz
#
# Requires deploy/.env (see deploy/.env.example) for Cloudflare Pages upload.
# Backend needs Docker; uses relay-finish-setup.sh when Infrastructure/deployer is absent.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

log() { printf '→ %s\n' "$*"; }
die() { printf '✘ %s\n' "$*" >&2; exit 1; }

DO_FRONTEND=1
DO_BACKEND=1
FRONTEND_ARGS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --init) FRONTEND_ARGS+=(--init); shift ;;
    --frontend-only) DO_BACKEND=0; shift ;;
    --backend-only) DO_FRONTEND=0; shift ;;
    -h|--help)
      sed -n '2,14p' "$0"
      exit 0
      ;;
    *)
      FRONTEND_ARGS+=("$1")
      shift
      ;;
  esac
done

deploy_frontend() {
  log "━━━ Frontend → https://chores.the-idea-guy.com ━━━"
  if ((${#FRONTEND_ARGS[@]})); then
    "${ROOT}/scripts/deploy-chores.sh" "${FRONTEND_ARGS[@]}"
  else
    "${ROOT}/scripts/deploy-chores.sh"
  fi
}

deploy_backend() {
  log "━━━ Backend → https://relay.the-idea-guy.com ━━━"
  DEPLOYER="${DEPLOYER_SCRIPT:-$HOME/Infrastructure/deployer/deploy.sh}"
  if [[ -x "$DEPLOYER" || -f "$DEPLOYER" ]]; then
    "${ROOT}/scripts/deploy-relay.sh"
  else
    log "No Infrastructure deployer — using relay-finish-setup.sh"
    "${ROOT}/scripts/relay-finish-setup.sh"
  fi
}

verify() {
  log "━━━ Verify ━━━"
  local ok=1
  if [[ "$DO_FRONTEND" -eq 1 ]]; then
    if curl -sfI --max-time 10 "https://chores.the-idea-guy.com/" >/dev/null; then
      log "Frontend OK: https://chores.the-idea-guy.com/"
    else
      log "Frontend not responding yet — DNS/Pages may need a minute"
      ok=0
    fi
  fi
  if [[ "$DO_BACKEND" -eq 1 ]]; then
    if curl -sf --max-time 10 "https://relay.the-idea-guy.com/healthz" | grep -q ok; then
      log "Backend OK:  https://relay.the-idea-guy.com/healthz"
    else
      log "Backend not responding yet — check Docker and cloudflared tunnel"
      ok=0
    fi
  fi
  [[ "$ok" -eq 1 ]] || exit 1
}

[[ "$DO_FRONTEND" -eq 1 || "$DO_BACKEND" -eq 1 ]] || die "Nothing to deploy (use --frontend-only or --backend-only)"

if [[ "$DO_FRONTEND" -eq 1 ]]; then deploy_frontend; fi
if [[ "$DO_BACKEND" -eq 1 ]]; then deploy_backend; fi
verify
log "Done."
