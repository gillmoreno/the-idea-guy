# Emoji picker (Rooms)

Shared UI for choosing emojis anywhere in Rooms — schema `emoji` fields, Backlog “Propose an idea”, and future surfaces.

## Component

- `apps/rooms/web/src/components/EmojiPicker.tsx` — trigger + popover, click-outside / Escape to close
- `apps/rooms/web/src/components/EmojiPickerPanel.tsx` — full picker (lazy-loaded client-only)
- `apps/rooms/web/src/lib/emoji.ts` — `DEFAULT_RECORD_EMOJI` (`📌`)

## Library

[`emoji-picker-react`](https://github.com/ealush/emoji-picker-react) v4:

- Full Unicode emoji set (native system glyphs)
- Search, category tabs, recently used, skin tones
- Theme follows Rooms (`classic` / `paper` → light; `glow` / `signal` → dark)

## Usage

```tsx
import { EmojiPicker } from "@/components/EmojiPicker";

<EmojiPicker value={emoji} onChange={setEmoji} fallback="💡" />
```

`fallback` is shown in the trigger when `value` is empty.

## Consumers

| Surface | File |
|---------|------|
| Declarative schema forms | `schema/engine/FieldInput.tsx` (`type: "emoji"`) |
| Backlog propose idea | `templates/backlog/components/AddIdea.tsx` |
