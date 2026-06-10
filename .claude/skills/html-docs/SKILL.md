---
name: html-docs
description: >-
  Bootstrap or sync the technical HTML documentation site in
  docs_and_changelog/html/ from doc-manifest.json. Use when the user asks to
  sync/update/bootstrap HTML docs, after commits when
  .cursor/docs-sync-reminder.json exists, when adding a new feature that needs
  a doc page, or when the user mentions technical documentation or doc sync.
---

# Technical HTML documentation

Project docs live in **`docs_and_changelog/html/`** — standalone HTML pages, shared sidebar nav, business/technical logic (decisions + user-visible behavior), not line-by-line code reference. Open `docs_and_changelog/html/index.html` in a browser to view.

The **manifest** (`docs_and_changelog/html/doc-manifest.json`) maps each feature to:
- `doc` — the HTML file to maintain
- `sources` — code/markdown paths that should trigger a doc review when changed

The post-commit git hook (`scripts/check-html-docs-sync.sh`) writes **`.cursor/docs-sync-reminder.json`** when sources changed but the HTML did not. (Shared with the legacy Cursor skill — keep the path.)

For writing or rewriting whole pages, prefer delegating to the **doc-page-writer** subagent (`.claude/agents/doc-page-writer.md`) — one agent per page, in parallel when several pages are stale.

---

## Mode: sync (default after commits)

1. Read `.cursor/docs-sync-reminder.json` if present; else run `./scripts/check-html-docs-sync.sh` (or `--staged`) and read the reminder if created.
2. For each stale entry (`id`, `title`, `doc`):
   - Read the current HTML `doc` and the changed `sources` from the manifest.
   - Update only sections that are wrong or outdated; keep tone and structure.
   - Update the `Last synced` date in the page's `.footer`.
3. If behavior is unchanged, add `<!-- sync: no content change YYYY-MM-DD -->` at the top of `<article>` and say so.
4. Delete `.cursor/docs-sync-reminder.json` when all stale items are addressed.
5. If manifest `sources` are wrong after a refactor, fix the manifest too.

## Mode: bootstrap (new feature or missing page)

1. Add the feature to `doc-manifest.json`:
   ```json
   {
     "id": "my-feature",
     "title": "Human title",
     "doc": "docs_and_changelog/html/<section>/my-feature.html",
     "sources": ["path/to/code/", "docs_and_changelog/SPEC.md"]
   }
   ```
2. Write the page (or delegate to doc-page-writer) following the conventions below.
3. Add the page link to the nav of **every** existing page and to `_nav.html` (the canonical nav fragment — mind the `../` prefixes for subfolder pages).
4. Tell the user to open `docs_and_changelog/html/index.html`.

---

## Page conventions

- Stylesheet: `styles.css` (root pages) or `../styles.css` (subfolder pages).
- Structure: `<div class="layout">` → `<nav>` (copy from `_nav.html`, fix `../` prefixes, set `class="active"` on the current page) → `<main><article>`.
- `<h1>` then `<p class="lead">one sentence</p>`, then `<h2>` sections: what it is, why built this way, behavior users see, tradeoffs, key code paths (paths only).
- Use `.card` divs for highlight boxes; tables for enumerable facts.
- End with: `<p class="footer">Sources: <code>…</code> · Last synced YYYY-MM-DD</p>`

## Do not

- Do not duplicate full API/spec content — link to `docs_and_changelog/*.md` instead.
- Do not document the legacy standalone `choreboard/` app — templates live in `apps/rooms/web/src/templates/`.
- Do not edit `docs_and_changelog/html/backlog.html` here — that page belongs to the **rice-backlog** skill.
