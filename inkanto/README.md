# Inkanto ✨

*Il tuo laboratorio di storie* — a story-writing **coach** (not a story writer) for a creative young writer. Italian-first UI (it/es/en), mobile PWA, AI guardrails baked in: the coach asks questions and offers options; she writes every word herself.

Part of [the-idea-guy](../) monorepo. Architecture follows the Roger monolith pattern.

## Architecture

```
┌──────────────────────── one container (port 3400→80) ────────────────────────┐
│  nginx ──► static React SPA (frontend/, Vite + Tailwind, PWA)                │
│    │ /api                                                                    │
│    ▼                                                                         │
│  Go API :8080 (go-backend/, chi + SQLite + JWT)                              │
│    │ /coach (SSE)                                                            │
│    ▼                                                                         │
│  AI sidecar :8090 (ai-sidecar/, Node + Claude Agent SDK)                     │
│    └─ skills/*.md  ← coaching skills, Claude-Code-style markdown             │
│  supervisord runs all three                                                  │
└───────────────────────────────────────────────────────────────────────────────┘
```

- **Go owns all data** (stories, outline beats, chapters, story bible, coach history) in `/data/inkanto.sqlite3`.
- **The sidecar is stateless**: Go sends skill + story context + recent history; the sidecar composes the system prompt from `skills/*.md` and streams the reply via the **Claude Agent SDK**, authenticated with `CLAUDE_CODE_OAUTH_TOKEN` — i.e. your Claude subscription's monthly Agent SDK credit, no API key billing.
- **Skills** are markdown files with frontmatter (`skills/`): `_base.md` is the always-on guardrail (age-appropriate, never writes her story, Italian-first); the rest are coaching modes — `scintilla` (idea spark), `architetto` (outline), `intervista` (story-bible interviews), `e-poi` (unblocker), `dottore` (chapter feedback). Edit a file, restart the sidecar, done.

## Setup

```sh
just setup                 # go mod tidy + npm install (sidecar, frontend)
claude setup-token         # one-time: mint a 1-year subscription OAuth token
cp .env.example .env       # paste the token, set SECRET_KEY + FAMILY_CODE
```

## Dev

```sh
just dev    # Go API :4800 + sidecar :4700 + Vite :3400 (proxies /api)
just test   # Go integration tests
```

Registration requires the `FAMILY_CODE`, so only the family can create accounts.

## Deploy

```sh
just deploy   # single container on :3400, data persisted in ./data/
```

## Notes

- The Agent SDK draws from the subscription's **Agent SDK monthly credit** (separate from interactive Claude Code limits since June 2026). If the credit runs out the coach returns an error; the app keeps working for writing.
- The OAuth token lasts ~1 year and does **not** auto-rotate — re-run `claude setup-token` and update `.env` when it expires.
- Ports in the monorepo: Inkanto web **3400**, Go API **4800**, sidecar **4700** (rooms 3300/4500, secondbrain 3200/4501, website 3000, genproxy 4600).
