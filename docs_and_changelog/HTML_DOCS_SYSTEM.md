# HTML business documentation system

Browsable business-logic docs for humans (and agents), kept aligned with code via a manifest + git hooks + agent skills (Claude Code `.claude/skills/html-docs`, legacy Cursor `.cursor/skills/html-docs`).

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
2. If related source files changed but HTML did not, the hook prints a warning and writes `.cursor/docs-sync-reminder.json` (path shared by both skills).
3. In Claude Code, say: **"sync the HTML docs"** (skill **html-docs**, sync mode). In Cursor: "Sync HTML docs per the reminder".

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
| `docs_and_changelog/html/backlog.html` | RICE-prioritized backlog (skill **rice-backlog**) |
| `.claude/skills/html-docs/SKILL.md` | Claude Code skill (bootstrap + sync) |
| `.claude/skills/rice-backlog/SKILL.md` | Claude Code skill (backlog scoring) |
| `.claude/agents/doc-page-writer.md` | Subagent that writes one page per conventions |
| `.cursor/skills/html-docs/SKILL.md` | Legacy Cursor skill (same manifest) |
| `scripts/check-html-docs-sync.sh` | Staleness detector |
| `.githooks/post-commit` | Runs check after commit |

## Reuse in other repos

Copy:

- `docs_and_changelog/html/` structure (or rename base path and update manifest)
- `doc-manifest.json` pattern
- `scripts/check-html-docs-sync.sh` (adjust `MANIFEST` path if needed)
- `.cursor/skills/html-docs/`
- `.githooks/` + `install-git-hooks.sh`
