#!/usr/bin/env bash
# Install repo git hooks from .githooks/
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOOKS_SRC="$ROOT/.githooks"
GIT_HOOKS="$(git -C "$ROOT" rev-parse --git-dir 2>/dev/null)"

if [[ -z "$GIT_HOOKS" ]]; then
  echo "Not a git repository: $ROOT" >&2
  exit 1
fi

GIT_HOOKS="$(cd "$ROOT/$GIT_HOOKS" && pwd)"

for hook in post-commit pre-commit; do
  if [[ -f "$HOOKS_SRC/$hook" ]]; then
    cp "$HOOKS_SRC/$hook" "$GIT_HOOKS/$hook"
    chmod +x "$GIT_HOOKS/$hook"
    echo "Installed $hook"
  fi
done

echo "Done. Hooks run scripts/check-html-docs-sync.sh after commits."
