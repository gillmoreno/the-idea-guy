# Avatar brick

**Date:** 2026-06-07  
**Status:** v1 shipped (persona onboarding)

---

## Shape

Serialized JSON (`AvatarValue`):

| Kind | Storage |
|------|---------|
| `emoji` | `{ "kind": "emoji", "emoji": "😊" }` |
| `image` | `{ "kind": "image", "image": <ImageValue> }` — inline WebP or https URL |

---

## Photo rules

- **Forced square crop** (center crop) via `processAvatarUpload`
- Max **256px** edge, **≤ 80 KB** WebP (tighter than full `image` brick)
- Rendered as **circle** in UI (`PersonaAvatar`)

---

## Components

| Piece | Path |
|-------|------|
| Types | `apps/rooms/web/src/lib/avatarValue.ts` |
| Compress | `apps/rooms/web/src/lib/processImage.ts` → `processAvatarUpload` |
| Form brick | `apps/rooms/web/src/components/AvatarField.tsx` |
| Display | `apps/rooms/web/src/components/PersonaAvatar.tsx` |

---

## Persona flow

- Onboarding: emoji (default 😊) or photo
- Stored on `PersonaRecord.avatar` in device vault
- Contact QR includes **emoji only**; photo avatars sync via inbox `fromAvatar` on friend request/accept

---

## Related

- [IMAGE_BRICK.md](./IMAGE_BRICK.md)
- [PERSONA_CONTACTS.md](./PERSONA_CONTACTS.md)
