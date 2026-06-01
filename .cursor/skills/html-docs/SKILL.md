---
name: html-docs
description: >-
  Bootstrap or sync business-logic HTML documentation from doc-manifest.json.
  Use when creating HTML feature docs, updating docs after code changes,
  when .cursor/docs-sync-reminder.json exists, or when the user mentions
  HTML documentation, business logic docs, or doc sync hooks.
disable-model-invocation: true
---

# HTML business documentation

Project docs live in **`docs_and_changelog/html/`** — simple HTML, sidebar nav, business logic (decisions + behavior), not line-by-line code reference.

The **manifest** (`docs_and_changelog/html/doc-manifest.json`) maps each feature to:
- `doc` — HTML file to maintain
- `sources` — code/markdown paths that should trigger a doc review when changed

Git hook writes **`.cursor/docs-sync-reminder.json`** when sources change but HTML does not.

---

## Mode: bootstrap

Use when HTML docs are missing or a **new feature** was added to the manifest.

1. Read `docs_and_changelog/html/doc-manifest.json`.
2. Read `docs_and_changelog/html/how-docs-work.html` for conventions.
3. For each feature in the manifest (or one feature if user specified):
   - Read all `sources` (skip `node_modules`, `.next`, `out`).
   - Write or rewrite `doc` as standalone HTML:
     - Same layout as existing pages: `styles.css`, left `<nav>`, `<main><article>`.
     - Copy nav links from `index.html`; set `class="active"` on current page.
     - Sections: what it is, why we built it this way, behavior users see, tradeoffs, pointer to key code paths (paths only, not full API).
4. Update `index.html` nav if new pages were added.
5. Add new feature entry to manifest if user added a new product area.
6. Delete `.cursor/docs-sync-reminder.json` when done.
7. Tell user to open `docs_and_changelog/html/index.html` in a browser.

---

## Mode: sync

Use after commits when reminder exists, or user says "sync HTML docs".

1. Read `.cursor/docs-sync-reminder.json` if present; else run `./scripts/check-html-docs-sync.sh --staged` and read reminder if created.
2. For each stale entry (`id`, `title`, `doc`):
   - Read current HTML `doc`.
   - Read changed `sources` from manifest for that `id`.
   - Update only sections that are wrong or outdated; keep tone and structure.
   - Do not expand into full code documentation.
3. If behavior unchanged, add a one-line HTML comment `<!-- sync: no content change YYYY-MM-DD -->` at top of `<article>` and note in response.
4. Remove `.cursor/docs-sync-reminder.json` when all stale items addressed.
5. If manifest `sources` lists are wrong after refactor, fix manifest too.

---

## HTML page template

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>FEATURE — ChoreBoard</title>
  <link rel="stylesheet" href="../styles.css" />
</head>
<body>
  <div class="layout">
    <nav><!-- same links as sibling pages; active on this page --></nav>
    <main><article>
      <h1>Title</h1>
      <p class="lead">One sentence.</p>
      <h2>Section</h2>
      <p>...</p>
    </article></main>
  </div>
</body>
</html>
```

---

## Adding a new feature to the manifest

```json
{
  "id": "my-feature",
  "title": "Human title",
  "doc": "docs_and_changelog/html/my-feature/page.html",
  "sources": ["path/to/code/", "path/to/spec.md"]
}
```

Then bootstrap that feature's HTML page.

---

## Do not

- Replace markdown specs in `docs_and_changelog/*.md` — HTML is the friendly business layer; MD can stay for agents/build notes.
- Auto-run on every file save (only git hook + explicit agent sync).
- Document every function; focus on product and architecture decisions.

---

## User commands (examples)

- "Bootstrap HTML business docs"
- "Sync HTML docs from the reminder"
- "Add HTML doc for feature X and update manifest"
