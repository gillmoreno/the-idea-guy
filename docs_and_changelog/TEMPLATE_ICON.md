# Template icon brick

**Date:** 2026-06-07  
**Status:** v1 shipped

---

## Design

Dual-emoji template strings (e.g. `📚☕`) render as **app tiles**, not stacked text:

- **Primary** glyph centered on a squircle tile tinted with `--template-accent`
- **Secondary** glyph in a small corner badge (when present)
- Single emoji uses the tile only

---

## Usage

```tsx
<TemplateIcon emoji={template.emoji} size="sm" style={{ "--template-accent": accent }} />
```

Registry `emoji` field unchanged — `splitEmojiGlyphs()` parses graphemes.

---

## Surfaces

Create picker, home room list, loading screens, room invites, declarative top bar.

Single-emoji `emoji-orb` remains for record rows (ideas, prizes).
