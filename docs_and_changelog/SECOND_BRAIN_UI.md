# Second Brain — UI refresh

Visual upgrade for the HTML knowledge vault (June 2026).

## What changed

- **Typography** — Fraunces (display) + DM Sans (UI) via `next/font`
- **Dark mode** — toggle in welcome, vault topbar, and setup; persisted to `localStorage` (`secondbrain.theme`)
- **Glass surfaces** — backdrop blur, gradient mesh backgrounds, elevated note "paper" card
- **Editor toolbar** — headings, bold/italic, lists, code, quotes, and **callout blocks** (info / tip / warning / success)
- **Callout extension** — custom Tiptap node (`lib/calloutExtension.ts`); stored as `<div data-callout>` in HTML
- **Icons** — `lucide-react` across sidebar, topbar, AI panel, graph, and landing
- **Polish** — animated landing, relative timestamps in sidebar, theme-aware graph glow, improved search/AI/modals

## Using callouts

1. Select text in the editor (or place the cursor in a paragraph)
2. Click a callout button in the toolbar (✦ info, 💡 tip, ⚠ warning, ✓ success)
3. Or insert callouts in HTML when seeding notes (see `Setup.tsx` welcome template)

## Dev

```bash
cd secondbrain && make dev
# http://localhost:3200 — hard-refresh if styles look stale
```

## Changelog

- **2026-06-07** — UI refresh: dark mode, toolbar, callouts, landing redesign, lucide icons.
