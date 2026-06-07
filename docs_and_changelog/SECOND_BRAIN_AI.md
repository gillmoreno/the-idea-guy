# Second Brain — per-vault AI keys

> AI is owned by the user, not the relay operator.

## Model

| Piece | Role |
|-------|------|
| **Vault `settings.ai`** | `apiKey` + `model` in the Yjs doc — synced E2E encrypted across devices |
| **Web client** | Builds prompts from keyword-matched note excerpts only |
| **Relay `/ai/forward`** | Optional dumb CORS tunnel — forwards `Authorization: Bearer <user-key>` to OpenAI; **no server-side API key** |

The relay never reads note content and never stores OpenAI credentials. Operators run sync only; users bring their own keys.

## User flow

1. **Settings → AI** — paste OpenAI API key, pick model, save
2. Key syncs to other devices on the same vault (encrypted)
3. **AI panel** — chat / summarize using excerpts retrieved locally

## Data shape

```typescript
// Y.Map "settings" → key "ai"
interface AiSettings {
  provider: "openai";
  apiKey: string;
  model: string; // default gpt-4o-mini
}
```

## Security notes

- Key is inside the E2E-encrypted CRDT blob on the wire
- Anyone with the vault invite code can decrypt the doc — treat the invite code like a family secret
- The forward endpoint sees the Bearer token in transit (HTTPS); self-host the relay if you want zero third-party hops

## Changelog

- **2026-06-07** — Moved API keys from relay env to per-vault settings; relay `/ai/chat` → `/ai/forward` pass-through
