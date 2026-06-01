#!/usr/bin/env bash
# Detect HTML business docs that may be stale after code changes.
# Usage:
#   ./scripts/check-html-docs-sync.sh           # last commit
#   ./scripts/check-html-docs-sync.sh --staged  # staged files (pre-commit)
#   ./scripts/check-html-docs-sync.sh --commit abc123
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MANIFEST="$ROOT/docs_and_changelog/html/doc-manifest.json"
REMINDER="$ROOT/.cursor/docs-sync-reminder.json"

MODE="last"
COMMIT="HEAD"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --staged) MODE="staged"; shift ;;
    --commit) MODE="commit"; COMMIT="${2:?}"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

if [[ ! -f "$MANIFEST" ]]; then
  echo "doc-manifest.json not found" >&2
  exit 0
fi

collect_changed() {
  case "$MODE" in
    staged)
      git -C "$ROOT" diff --cached --name-only --diff-filter=ACMR 2>/dev/null || true
      ;;
    commit)
      git -C "$ROOT" diff-tree --no-commit-id --name-only -r "$COMMIT" 2>/dev/null || true
      ;;
    last)
      # No commit yet
      if ! git -C "$ROOT" rev-parse HEAD >/dev/null 2>&1; then
        return
      fi
      git -C "$ROOT" diff-tree --no-commit-id --name-only -r HEAD 2>/dev/null || true
      ;;
  esac
}

# Simple glob match: manifest uses paths like choreboard/web/src/** — we convert to prefix checks
path_matches_source() {
  local file="$1"
  local source="$2"
  # Strip trailing ** or *
  local prefix="${source%%\*\*}"
  prefix="${prefix%%\*}"
  [[ "$file" == "$source" ]] && return 0
  [[ "$file" == "$prefix"* ]] && return 0
  return 1
}

CHANGED_FILES="$(collect_changed)"
if [[ -z "${CHANGED_FILES// }" ]]; then
  exit 0
fi

STALE=()
DOCS_TOUCHED=()

while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  [[ "$f" == docs_and_changelog/html/* ]] && DOCS_TOUCHED+=("$f")
done <<< "$CHANGED_FILES"

# Parse manifest with python3 (available on macOS)
export ROOT CHANGED_FILES
RESULT="$(python3 << 'PY'
import json, os, sys

root = os.environ["ROOT"]
changed = [l.strip() for l in os.environ.get("CHANGED_FILES", "").splitlines() if l.strip()]
manifest_path = os.path.join(root, "docs_and_changelog/html/doc-manifest.json")
with open(manifest_path) as f:
    data = json.load(f)

stale = []
for feat in data.get("features", []):
    doc = feat.get("doc", "")
    sources = feat.get("sources", [])
    hit_source = False
    hit_doc = False
    for c in changed:
        if c == doc or c.startswith(doc.rsplit("/", 1)[0] + "/"):
            hit_doc = True
        for s in sources:
            s = s.rstrip("/")
            if s.endswith("**") or s.endswith("*"):
                pref = s.rstrip("*").rstrip("/")
                if c == pref or c.startswith(pref + "/"):
                    hit_source = True
            elif c == s or c.startswith(s + "/"):
                hit_source = True
    if hit_source and not hit_doc:
        stale.append({"id": feat["id"], "title": feat["title"], "doc": doc})

print(json.dumps(stale))
PY
)"

if [[ "$RESULT" == "[]" ]]; then
  rm -f "$REMINDER"
  exit 0
fi

mkdir -p "$(dirname "$REMINDER")"
COMMIT_SHA="$(git -C "$ROOT" rev-parse HEAD 2>/dev/null || echo "none")"
cat > "$REMINDER" << EOF
{
  "commit": "$COMMIT_SHA",
  "mode": "$MODE",
  "stale": $RESULT,
  "instruction": "Run the html-docs skill in sync mode: read each stale doc path, read listed sources, update HTML business logic to match."
}
EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  HTML business docs may be out of date"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
python3 -c "import json; d=json.load(open('$REMINDER')); [print(f\"  • {x['title']}\n    → {x['doc']}\") for x in d['stale']]"
echo ""
echo "  Reminder: .cursor/docs-sync-reminder.json"
echo "  Fix: In Cursor, ask to sync HTML docs (html-docs skill, sync mode)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Pre-commit: soft exit 1 only with DOCS_STRICT=1
if [[ "$MODE" == "staged" && "${DOCS_STRICT:-}" == "1" ]]; then
  exit 1
fi
exit 0
