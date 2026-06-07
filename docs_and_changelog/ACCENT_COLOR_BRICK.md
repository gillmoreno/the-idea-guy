# Accent color brick

**Date:** 2026-06-07  
**Status:** v1 shipped (persona onboarding)

---

## Shape

Stored on `PersonaRecord.color` as a CSS **background** value (backward compatible with plain hex):

| Kind | Example |
|------|---------|
| Solid | `#4f46e5` |
| Gradient | `linear-gradient(135deg, #4f46e5 0%, #ec4899 100%)` |

Parse/serialize helpers live in `accentValue.ts` (`parseAccentCss`, `accentToCss`).

---

## Picker UX

- **Preview bar** — wide swatch of the current accent
- **Solid** — 40 curated swatches (5×8 grid + custom) + native color picker for any hex
- **Gradient** — 16 one-tap presets (no angle/stop sliders in v1)

---

## Components

| Piece | Path |
|-------|------|
| Types & palette | `apps/rooms/web/src/lib/accentValue.ts` |
| Form brick | `apps/rooms/web/src/components/AccentColorField.tsx` |

`PersonaAvatar` uses `background: color` for initials and photo ring — gradients render correctly.

---

## Related

- [AVATAR_BRICK.md](./AVATAR_BRICK.md)
- [PERSONA_CONTACTS.md](./PERSONA_CONTACTS.md)
