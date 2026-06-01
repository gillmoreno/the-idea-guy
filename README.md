# The Idea Guy

**It's time for the idea.** A personal brand and knowledge base exploring what one person can build with AI that's actually useful.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15 (static export) |
| Backend | Go 1.22 |
| Gateway | nginx (single entry point) |
| Deploy | One Docker image via Docker Compose |

## Architecture

```
Browser
   │
   ▼
nginx :80  ──►  /          → static Next.js files
           ──►  /api/*     → Go API :8080 (internal)
           ──►  /health    → Go health check
```

Everything runs in **one container**: nginx serves the static site and reverse-proxies API calls to the Go process on localhost.

## Quick start

```bash
# Build and run the monolith
docker compose up --build

# Open http://localhost:8080
```

Or with Make:

```bash
make build
make up
```

## Local development

Run both servers:

```bash
make dev
```

- Next.js: http://localhost:3000
- Go API: http://localhost:8081

The frontend uses `NEXT_PUBLIC_API_BASE=http://localhost:8081` in dev (see `frontend/.env.development`). In Docker/production, requests go to `/api/*` via nginx — no env var needed.

Or run separately:

```bash
make dev-frontend   # Next.js on :3000
make dev-backend    # Go API on :8081
```

## Project layout

```
the-idea-guy/
├── frontend/          Next.js static site
├── backend/           Go API
├── nginx/             nginx config for the monolith
├── docker/            entrypoint script
├── Dockerfile         multi-stage monolith build
├── docker-compose.yml
└── docs_and_changelog/
```

## API

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Service health |
| `GET /api/snippets` | Knowledge snippets |
| `GET /api/builds` | Shipped builds / experiments |
| `GET /api/ideas` | Public idea log |
| `GET /api/tools` | Stack, workflow, and Cursor rules |

## What's next

- GitHub repos linked from snippets
- How-to guides and tutorials
- Idea log / blog posts
- X/Twitter integration for sharing
