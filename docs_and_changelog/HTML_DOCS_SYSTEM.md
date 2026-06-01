# HTML business documentation system

Browsable business-logic docs for humans (and agents), kept aligned with code via a manifest + git hooks + Cursor skill.

## Open locally

Open in a browser:

`docs_and_changelog/html/index.html`

## One-time setup (per git clone)

```bash
./scripts/install-git-hooks.sh
```

This installs `post-commit` and `pre-commit` hooks that run `scripts/check-html-docs-sync.sh`.

## When code changes

1. Commit as usual.
2. If related source files changed but HTML did not, the hook prints a warning and writes `.cursor/docs-sync-reminder.json`.
3. In Cursor, ask: **"Sync HTML docs per the reminder"** (uses project skill **html-docs**, sync mode).

Optional strict pre-commit (blocks if docs stale):

```bash
DOCS_STRICT=1 git commit ...
```

## First-time / new feature

Ask the agent: **"Bootstrap HTML business docs"** (skill **html-docs**, bootstrap mode).

## Files

| Path | Role |
|------|------|
| `docs_and_changelog/html/` | HTML pages + `styles.css` |
| `docs_and_changelog/html/doc-manifest.json` | Feature → sources → doc mapping |
| `.cursor/skills/html-docs/SKILL.md` | Agent instructions (bootstrap + sync) |
| `scripts/check-html-docs-sync.sh` | Staleness detector |
| `.githooks/post-commit` | Runs check after commit |

## Reuse in other repos

Copy:

- `docs_and_changelog/html/` structure (or rename base path and update manifest)
- `doc-manifest.json` pattern
- `scripts/check-html-docs-sync.sh` (adjust `MANIFEST` path if needed)
- `.cursor/skills/html-docs/`
- `.githooks/` + `install-git-hooks.sh`
