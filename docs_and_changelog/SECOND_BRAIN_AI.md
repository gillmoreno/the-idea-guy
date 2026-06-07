# Second Brain — per-vault AI keys

> AI is owned by the user, not the relay operator.

## Model

| Piece | Role |
|-------|------|
| **Vault `settings.ai`** | `apiKey` + `model` in the Yjs doc — synced E2E encrypted across devices |
| **Web client** | Thin **agent** with local **vault tools** (search, count, dates, links) — tools run in the browser |
| **Relay `/ai/forward`** | Optional dumb CORS tunnel — passthrough OpenAI/Ollama chat completions (incl. `tool_calls`); **no server-side API key** |

The relay never reads note content and never stores OpenAI credentials. Operators run sync only; users bring their own keys.

## User flow

1. **Settings → AI** — choose **OpenAI** (API key) or **Ollama** (local URL + model name)
2. Settings sync to other devices on the same vault (encrypted)
3. **AI panel** — agentic chat with local tools; summarize current note

## Vault agent & tools

The assistant does **not** guess from random excerpts. It calls **read-only tools** against `NoteStore` + MiniSearch in the browser, then sends compact JSON results to the model.

| Tool | Purpose |
|------|---------|
| `count_notes` | "How many notes/posts do I have?" |
| `list_notes` | Browse by folder, tag, or date range |
| `search_notes` | Keyword search + optional `since_ms` / `until_ms` (e.g. "pizza idea ~two weeks ago") |
| `get_note` | Read one note by id or title |
| `list_folders` / `list_tags` | Vault structure |
| `get_links` | Backlinks and outgoing wiki-links |
| `vault_summary` | High-level stats |

**Example:** "I had a pizza idea about two weeks ago" → model calls `search_notes({ query: "pizza", since_ms, until_ms })` → MiniSearch + date filter → answer with cited titles.

Tools never hit the relay. The model only sees tool outputs you choose to send. Use models with **tool calling** support (OpenAI; Ollama models such as llama3.1+, qwen2.5).

**Citations:** Each answer lists clickable source chips (note id + title from tools). Clicking opens that note in the editor while keeping the AI panel open. Note titles mentioned in the answer body (e.g. `**Excercise**`) are also linkified when they match a source.

**Markdown:** Assistant replies render as GFM markdown (bold, lists, code blocks, etc.) via `react-markdown`.

### Ollama (local)

1. Install [Ollama](https://ollama.com) and run `ollama serve`
2. Pull a model: `ollama pull llama3.2`
3. In Second Brain **Settings → AI** → **Ollama (local)**
4. URL: `http://127.0.0.1:11434` (default)
5. Model: pick from the **auto-detected dropdown** (Settings probes `GET /api/tags` when Ollama is selected)

No API key needed. The browser talks to Ollama directly when CORS allows; otherwise the relay forwards to localhost only.

## Data shape

```typescript
// Y.Map "settings" → key "ai"
interface AiSettings {
  provider: "openai" | "ollama";
  apiKey: string;       // openai only
  baseUrl: string;      // ollama, default http://127.0.0.1:11434
  model: string;
}
```

## Security notes

- Key is inside the E2E-encrypted CRDT blob on the wire
- Anyone with the vault invite code can decrypt the doc — treat the invite code like a family secret
- The forward endpoint sees the Bearer token in transit (HTTPS); self-host the relay if you want zero third-party hops

## Changelog

- **2026-06-07** — Search/AI/sidebar read live text from Y.XmlFragment (fixes stale `plainText` mismatches vs editor)
- **2026-06-07** — Vault agent with read-only tools (search, count, dates, links); relay passthrough for `tool_calls`
- **2026-06-07** — Added Ollama local provider (OpenAI-compatible `/v1/chat/completions`)
- **2026-06-07** — Moved API keys from relay env to per-vault settings; relay `/ai/chat` → `/ai/forward` pass-through
