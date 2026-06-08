# Second Brain — AI-generated HTML pages (experimental)

Entire notes can be **full HTML + CSS pages** — not Tiptap rich text — designed by AI from your vault data.

## Note types

| `contentType` | Editor | Use case |
|---------------|--------|----------|
| `richtext` (default) | Tiptap | Normal notes, wiki links, callouts |
| `htmlPage` | Sandboxed full-page iframe | Dashboards, visual reports, landing-style posts |

## Create a page

1. Sidebar → **HTML page** (next to New note)
2. Starter layout loads in a full-height preview
3. **AI generate page** — opens the assistant with **suggestion chips** (click to fill the input). You write or edit the prompt, then send. Agent reads vault tools, then calls `set_html_page`.

## AI flow

```
User prompt → read tools (search_notes, get_note, …) → set_html_page({ html, css, title? })
```

- `html` — body markup only
- `css` — full stylesheet for the page
- Rendered in sandboxed iframe (no JS)
- Synced E2E like other note fields (`pageHtml`, `pageCss` on the note)

## Also works in chat

With any note open, ask: *"Turn this into a pull-up stats dashboard"* — the agent can call `set_html_page` on the active note (converts it to `htmlPage`).

## vs HTML blocks

| Feature | HTML block (Lab) | HTML page note |
|---------|------------------|----------------|
| Scope | One block inside a rich note | **Entire post** |
| Editor | Tiptap + iframe chip | Full-page preview + code pane |

## Changelog

- **2026-06-07** — `htmlPage` content type, `HtmlPageEditor`, `set_html_page` agent tool, `generatePage` mode
