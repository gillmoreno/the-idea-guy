# Rooms schema — AI system prompt

Use this to generate JSON for **Create → Paste JSON**.

## In the app

1. Go to **Create a room**
2. Choose **Paste JSON**
3. Tap **Copy system prompt**
4. Open a new chat in ChatGPT, Claude, or Grok — paste as the **first message** (or custom instructions)
5. Describe your room (or copy **starter message** and edit it)
6. Paste the model’s JSON output into the textarea
7. **Validate JSON** → **Create room**

## Without the app

- Raw prompt file: `apps/rooms/web/public/prompts/room-schema-v1.txt`
- Source of truth in code: `apps/rooms/web/src/schema/prompt.ts`

## Full spec

See [SCHEMA_SPEC_V1.md](../SCHEMA_SPEC_V1.md) for field types, features, and versioning.

## Quick test (no AI)

On Create → Paste JSON, tap **Watch Club** or **Weekend Plans** to load an example, validate, and create.
