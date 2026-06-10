# Room AI — generation contract (v1)

Locks the decisions from `business-plan-and-next-steps.html` §03 and `pricing-and-operating-costs.html` before code. Two AI workloads exist; this spec covers **generation** (the hero moment). The ambient helper is out of scope here (later spec).

## The two workloads (never conflate)

| | Generation | Operation (ambient helper, later) |
|---|---|---|
| What | One sentence → `RoomSchema` JSON | Digests, weekly suggestions |
| Touches private room data? | **No** — app descriptions only | Yes — reads room content |
| Frequency / cost | Once per room + retries, ~$0.0004 | Recurring per room |
| Who pays | Subsidized free tier (capped) | BYOK / Plus only |

**The privacy boundary:** a generation prompt is an *app description the user chooses to send to AI* ("a chore app where roommates vote") — never E2E room content. The relay stays dumb and is untouched by any of this.

## Architecture

```
Rooms PWA ── encrypted blobs ──▶ RELAY (dumb, ciphertext only)        :4500
Rooms PWA ── "make a chore app" ─▶ GENPROXY (stateless, platform key) :4600
                ◀── RoomSchema JSON ──┘
```

`genproxy/` is a separate Go service. It holds the upstream AI key, the system
prompt, and the abuse rails. It has **no database and stores no user content**;
its only state is an operational monthly-spend counter (small JSON file).

## Proxy contract

`POST /generate` with `{"description": "<≤500 chars>"}` →

- `200 {"schema": { ...RoomSchema... }}` — parsed, fence-stripped, sanity-checked
  (full validation stays client-side in `apps/rooms/web/src/schema/validate.ts`).
- `400 {"error":"bad_request", ...}` — empty/too-long description, bad JSON.
- `429 {"error":"rate_limited"}` — per-IP budget hit; retry later.
- `429 {"error":"budget_exhausted"}` — monthly platform spend cap reached.
  **Clients must degrade gracefully** to the copy-paste prompt flow (and BYOK
  when it exists). Generation is an enhancement, never a dependency.
- `502 {"error":"generation_failed"}` — upstream or unparseable output; client may retry.

`GET /healthz` → `ok`.

Hard rules:

- The **system prompt lives in the proxy**, server-controlled. Clients send only
  the description. Combined with JSON-only output and a low `max_tokens` cap,
  the proxy is useless as a free general-purpose LLM.
- Canonical prompt: `apps/rooms/web/src/schema/prompt.ts` — the proxy embeds an
  API-adapted copy (`genproxy/prompt.txt`); keep them in sync when the schema
  spec evolves.
- Stateless: no accounts, no logs of descriptions, no stored outputs.

## Upstream (swappable by design)

Two providers, switched by env. **Default is `anthropic`** — the official Go
SDK against the Claude Messages API with `claude-haiku-4-5` (~$1/$5 per 1M ⇒
~$0.0035/generation; the $10 budget buys ≈2,800 generations). The `openai`
provider speaks to any OpenAI-compatible chat-completions endpoint (e.g.
OpenCode Zen with `deepseek-v4-flash`, ~$0.0004/generation — requires a funded
Zen balance).

**Phase-0 lane (no API billing): the claude-sidecar.** `genproxy/claude-sidecar/`
applies the Inkanto pattern (`inkanto/ai-sidecar/`): a tiny localhost Node
service wrapping the Claude Agent SDK, authenticated with
`CLAUDE_CODE_OAUTH_TOKEN` from `claude setup-token` — generation draws from the
Claude subscription's monthly Agent SDK credit. It exposes the OpenAI shape on
`127.0.0.1:4601`, so genproxy uses it via the `openai` provider with zeroed $
prices (the subscription credit is the real meter; per-IP limits still apply).
The token lasts ~1 year and lives in `claude-sidecar/.env` (gitignored). For
public launch, switch to a real API key — subscription tokens are personal.

| Variable | Default | Notes |
|----------|---------|-------|
| `GENPROXY_ADDR` | `:4600` | Listen address |
| `GENPROXY_PROVIDER` | `anthropic` | `anthropic` (Claude SDK) or `openai` (OpenAI-compatible) |
| `GENPROXY_API_KEY` | (required) | Platform key; never reaches clients. With `anthropic`, falls back to `ANTHROPIC_API_KEY` |
| `GENPROXY_MODEL` | `claude-haiku-4-5` / `deepseek-v4-flash` | Per-provider default |
| `GENPROXY_UPSTREAM_URL` | `https://opencode.ai/zen/v1/chat/completions` | `openai` provider only |
| `GENPROXY_MAX_TOKENS` | `1600` | Output cap |
| `GENPROXY_MAX_DESC_CHARS` | `500` | Input cap |
| `GENPROXY_GENS_PER_IP_HOUR` | `20` | Token bucket, `0` = unlimited |
| `GENPROXY_MONTHLY_BUDGET_USD` | `10` | Hard spend cap → `budget_exhausted` |
| `GENPROXY_PRICE_IN_USD` / `GENPROXY_PRICE_OUT_USD` | `1.00`/`5.00` or `0.14`/`0.28` | $ per 1M tokens for the spend counter, per-provider default |
| `GENPROXY_DATA_DIR` | (empty) | Persist the monthly counter across restarts |
| `GENPROXY_ALLOW_ORIGIN` | `*` | CORS for the PWA origin |

## Client behavior (apps/rooms/web)

- Create → "Describe it": textarea → `POST /generate` → result lands in the
  existing JSON box → existing `parseAndValidateJson` → existing create flow.
  The paste-JSON path stays untouched underneath as the universal fallback.
- Proxy URL: `NEXT_PUBLIC_GENPROXY_URL` (defaults to `http://localhost:4600` in
  dev, **feature hidden when unset in prod builds**).
- **Free spells, v1:** a device-local counter (15) in `localStorage` — honest-
  majority enforcement; the proxy's per-IP and global caps are the real rails.
  Persona-signed requests (per-key limits, viral refills per
  `pricing-and-operating-costs.html` §04) are v2, after personas ship signing.

## Not in v1

- Streaming (schemas are small; spinner is fine)
- BYOK in-app generation (the copy-paste flow already serves power users)
- Persona-signed requests and viral spell refills
- The ambient helper (separate spec when its time comes)
