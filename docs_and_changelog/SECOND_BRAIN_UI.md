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

## Images in notes

- **Upload** — toolbar image button (max 4 MB per file)
- **Paste** — clipboard images from screenshots
- **Drop** — drag a file into the editor
- **URL** — link button next to upload inserts `https://` images
- **Storage** — images are embedded as base64 in note HTML (syncs encrypted with the vault); image bytes show in Settings and the editor meta row

## Storage visibility

Users can see how much local space their vault uses:

- **Per note** — byte size in the sidebar and editor meta row
- **Settings → Storage** — vault content total, on-device CRDT/sync size, browser origin quota (when available), and a ranked list of notes by size

Sizes are UTF-8 byte estimates of note text and metadata; sync data reflects the full Yjs document persisted to IndexedDB.

## Changelog

- **2026-06-07** — Storage stats in settings, sidebar, and editor
- **2026-06-07** — UI refresh: dark mode, toolbar, callouts, landing redesign, lucide icons.
