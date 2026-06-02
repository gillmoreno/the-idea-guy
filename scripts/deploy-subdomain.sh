#!/usr/bin/env bash
# Deploy a static mini-app from deploy/subdomains.json to Cloudflare Pages + custom subdomain.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MANIFEST="${ROOT}/deploy/subdomains.json"
ENV_FILE="${ROOT}/deploy/.env"

usage() {
  cat <<'EOF'
Usage: ./scripts/deploy-subdomain.sh <site-id> [options]

Deploy a configured static site to Cloudflare Pages on a the-idea-guy.com subdomain.

Options:
  --init          Create Pages project and attach custom domain (first-time setup)
  --skip-build    Upload existing output_dir without rebuilding
  --dry-run       Print actions without calling Cloudflare
  -h, --help      Show this help

Examples:
  ./scripts/deploy-subdomain.sh chores --init
  ./scripts/deploy-subdomain.sh chores

Environment (deploy/.env or shell):
  CLOUDFLARE_API_TOKEN   Required
  CLOUDFLARE_ACCOUNT_ID  Required for --init and domain API calls
  CHORES_RELAY_URL       Optional build-time env for the chores site (see deploy/.env.example)

Sites are defined in deploy/subdomains.json.
EOF
}

log() { printf '→ %s\n' "$*"; }
die() { printf '✘ %s\n' "$*" >&2; exit 1; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

cf_api() {
  local method="$1"
  local path="$2"
  local data="${3:-}"
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

expand_env_value() {
  # Expands ${VAR} placeholders using the current shell environment.
  local template="$1"
  local result="$template"
  local var
  while [[ "$result" =~ \$\{([A-Za-z_][A-Za-z0-9_]*)\} ]]; do
    var="${BASH_REMATCH[1]}"
    result="${result//\$\{${var}\}/${!var:-}}"
  done
  printf '%s' "$result"
}

get_production_branch() {
  if git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    git -C "$ROOT" branch --show-current
  else
    printf '%s' "main"
  fi
}

get_zone_id() {
  local apex="$1"
  cf_api GET "/zones?name=${apex}&status=active" | jq -r '.result[0].id // empty'
}

get_pages_subdomain() {
  local project="$1"
  cf_api GET "/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${project}" \
    | jq -r '.result.subdomain // empty'
}

ensure_dns_cname() {
  local zone_id="$1"
  local record_name="$2"
  local target="$3"
  local existing
  existing="$(cf_api GET "/zones/${zone_id}/dns_records?type=CNAME&name=${record_name}" \
    | jq -r '.result[0].id // empty')"
  if [[ -n "$existing" ]]; then
    log "DNS CNAME already exists for ${record_name}"
    return 0
  fi
  log "Creating DNS CNAME ${record_name} → ${target}"
  cf_api POST "/zones/${zone_id}/dns_records" \
    "{\"type\":\"CNAME\",\"name\":\"${record_name}\",\"content\":\"${target}\",\"proxied\":true}" \
    >/dev/null
}

SITE_ID=""
DO_INIT=0
SKIP_BUILD=0
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help) usage; exit 0 ;;
    --init) DO_INIT=1; shift ;;
    --skip-build) SKIP_BUILD=1; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    -*) die "Unknown option: $1" ;;
    *)
      [[ -z "$SITE_ID" ]] || die "Unexpected argument: $1"
      SITE_ID="$1"
      shift
      ;;
  esac
done

[[ -n "$SITE_ID" ]] || { usage; exit 1; }

require_cmd jq
require_cmd curl
require_cmd wrangler

[[ -f "$MANIFEST" ]] || die "Manifest not found: $MANIFEST"

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a
  source "$ENV_FILE"
  set +a
fi

[[ -n "${CLOUDFLARE_API_TOKEN:-}" ]] || die "Set CLOUDFLARE_API_TOKEN (see deploy/.env.example)"

SITE_JSON="$(jq -c --arg id "$SITE_ID" '.sites[$id]' "$MANIFEST")"
[[ "$SITE_JSON" != "null" ]] || die "Unknown site id '$SITE_ID'. Known: $(jq -r '.sites | keys | join(", ")' "$MANIFEST")"

APEX_DOMAIN="$(jq -r '.apex_domain' "$MANIFEST")"
PROJECT_NAME="$(jq -r '.project_name' <<<"$SITE_JSON")"
SUBDOMAIN="$(jq -r '.subdomain' <<<"$SITE_JSON")"
BUILD_DIR="$(jq -r '.build_dir' <<<"$SITE_JSON")"
OUTPUT_DIR="$(jq -r '.output_dir' <<<"$SITE_JSON")"
BUILD_COMMAND="$(jq -r '.build_command' <<<"$SITE_JSON")"
TITLE="$(jq -r '.title' <<<"$SITE_JSON")"
SITE_FQDN="${SUBDOMAIN}.${APEX_DOMAIN}"

BUILD_DIR_ABS="${ROOT}/${BUILD_DIR}"
OUTPUT_DIR_ABS="${ROOT}/${OUTPUT_DIR}"

log "Site: $SITE_ID ($TITLE)"
log "Target: https://${SITE_FQDN}/"
log "Project: $PROJECT_NAME"

if [[ "$SKIP_BUILD" -eq 0 ]]; then
  log "Building in ${BUILD_DIR}…"
  if [[ "$DRY_RUN" -eq 1 ]]; then
    log "[dry-run] would run: $BUILD_COMMAND (with build_env from manifest)"
  else
    cd "$BUILD_DIR_ABS"
    while IFS=$'\t' read -r key template; do
      [[ -n "$key" && "$key" != "null" ]] || continue
      value="$(expand_env_value "$template")"
      if [[ "$template" == *'${'* && -z "$value" ]]; then
        log "Note: $key is empty — using code default for $key"
      fi
      export "$key=$value"
    done < <(jq -r '.build_env // {} | to_entries[] | [.key, .value] | @tsv' <<<"$SITE_JSON")
    eval "$BUILD_COMMAND"
    cd "$ROOT"
  fi
else
  log "Skipping build (--skip-build)"
fi

[[ "$DRY_RUN" -eq 1 || -d "$OUTPUT_DIR_ABS" ]] || die "Build output missing: $OUTPUT_DIR_ABS"

if [[ "$DO_INIT" -eq 1 ]]; then
  [[ -n "${CLOUDFLARE_ACCOUNT_ID:-}" ]] || die "Set CLOUDFLARE_ACCOUNT_ID for --init"

  PRODUCTION_BRANCH="$(get_production_branch)"
  [[ -n "$PRODUCTION_BRANCH" ]] || die "Could not detect git branch for production deploy"

  if wrangler pages project list 2>/dev/null | grep -qF "${PROJECT_NAME}"; then
    log "Pages project '$PROJECT_NAME' already exists"
  elif [[ "$DRY_RUN" -eq 1 ]]; then
    log "[dry-run] would create Pages project: $PROJECT_NAME"
  else
    log "Creating Pages project '${PROJECT_NAME}' (production branch: ${PRODUCTION_BRANCH})…"
    wrangler pages project create "$PROJECT_NAME" --production-branch="$PRODUCTION_BRANCH"
  fi

  if [[ "$DRY_RUN" -eq 1 ]]; then
    log "[dry-run] would attach custom domain: $SITE_FQDN"
  else
    log "Attaching custom domain ${SITE_FQDN}…"
    if cf_api POST "/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/domains" \
      "{\"name\":\"${SITE_FQDN}\"}" >/dev/null 2>&1; then
      log "Custom domain registered on Pages project"
    else
      log "Domain may already be attached (or check token permissions: Pages Edit + DNS Edit)"
    fi

    ZONE_ID="$(get_zone_id "$APEX_DOMAIN")"
    [[ -n "$ZONE_ID" ]] || die "Cloudflare zone not found for ${APEX_DOMAIN}"
    PAGES_TARGET="$(get_pages_subdomain "$PROJECT_NAME")"
    [[ -n "$PAGES_TARGET" ]] || die "Could not resolve Pages subdomain for ${PROJECT_NAME}"
    ensure_dns_cname "$ZONE_ID" "$SITE_FQDN" "$PAGES_TARGET"
  fi
fi

if [[ "$DRY_RUN" -eq 1 ]]; then
  log "[dry-run] would deploy: wrangler pages deploy $OUTPUT_DIR --project-name=$PROJECT_NAME"
  exit 0
fi

log "Deploying static assets to Cloudflare Pages…"
PRODUCTION_BRANCH="$(get_production_branch)"
[[ -n "$PRODUCTION_BRANCH" ]] || die "Could not detect git branch for production deploy"
log "Production branch: ${PRODUCTION_BRANCH}"
wrangler pages deploy "$OUTPUT_DIR_ABS" \
  --project-name="$PROJECT_NAME" \
  --branch="$PRODUCTION_BRANCH" \
  --commit-dirty=true

log "Done. Open https://${SITE_FQDN}/ (DNS may take a minute on first --init)."
