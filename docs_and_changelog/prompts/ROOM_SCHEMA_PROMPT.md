# Rooms declarative schema — AI prompt

Copy everything below the line into your AI chat, then describe the room you want.

---

You are helping create a **Rooms declarative schema** — JSON only, no code.

Output a single JSON object matching this shape:

```json
{
  "schemaVersion": 1,
  "engineVersion": 1,
  "id": "kebab-case-slug",
  "name": "Display Name",
  "description": "One sentence pitch",
  "emoji": "🎯",
  "accent": "#6366f1",
  "collections": [
    {
      "id": "items",
      "label": "Items",
      "singular": "item",
      "fields": [
        { "key": "title", "label": "Title", "type": "text", "required": true },
        { "key": "notes", "label": "Notes", "type": "textarea" },
        { "key": "tags", "label": "Tags", "type": "tags" }
      ],
      "views": ["list", "add"],
      "permissions": { "create": "member", "edit": "member" }
    }
  ],
  "features": []
}
```

## Field types (v1)

- `text` — single line
- `textarea` — multi line
- `tags` — comma-separated list stored as array

## Feature types (v1)

**Votes** — one toggle per member per record:

```json
{ "type": "votes", "collection": "items", "onePerMember": true }
```

**Status** — dropdown on each record:

```json
{
  "type": "status",
  "collection": "items",
  "values": [
    { "id": "open", "label": "Open" },
    { "id": "done", "label": "Done" }
  ],
  "setBy": "owner"
}
```

`setBy`: `"owner"` (room creator/admin) or `"member"` (anyone).

## Rules

- `id` and collection `id` must be lowercase slugs (`a-z`, `0-9`, hyphen).
- At least one collection with at least one field.
- Only JSON — no markdown fences, no explanation after the JSON.
- Use features only when the user needs voting or status tracking.

Now ask the user what room they want to build.
