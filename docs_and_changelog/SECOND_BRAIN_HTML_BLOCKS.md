# Second Brain — HTML blocks (experimental)

Embed **custom HTML + CSS** inside notes — mini pages with their own styles, rendered in a **sandboxed iframe**.

## Why iframe?

| Approach | Issue |
|----------|--------|
| Raw HTML in the editor DOM | Breaks Tiptap schema; XSS risk to the app |
| `dangerouslySetInnerHTML` | Custom CSS leaks into the vault UI |
| **Sandboxed iframe (`srcDoc`)** | Styles stay inside the block; scripts disabled by default |

## Usage

1. Open a note → toolbar **Lab** → **HTML block** (`</>` icon)
2. A starter card is inserted with example HTML + CSS
3. Click **Edit** → change **HTML** and **CSS** textareas → **Apply**
4. Preview renders live in the iframe below

Blocks sync via Yjs like other note content (collaborative, E2E encrypted).

## Data model

Tiptap atom node `htmlBlock` with attributes:

- `html` — body markup (no `<html>` wrapper needed)
- `css` — rules injected into a `<style>` in the iframe

Search / AI tools index plain text stripped from the `html` attribute.

## Security

- iframe `sandbox=""` — no scripts, no navigation, no form submit to parent
- Suitable for layout, cards, charts as static HTML/CSS
- **Not** for arbitrary JS widgets yet (future opt-in `allow-scripts` if needed)

## AI (future)

Possible extensions:

- Vault tool `insert_html_block` / `update_html_block`
- AI panel action: “Generate a dashboard for my pull-up stats”
- Prompt returns `{ html, css }` → inserts block in active note

## Changelog

- **2026-06-07** — Initial HTML block node, edit UI, toolbar under Lab
