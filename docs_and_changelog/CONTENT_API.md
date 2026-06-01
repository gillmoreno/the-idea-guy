# Content API — JSON-backed knowledge base

## Overview

Site content lives in `backend/data/` as JSON files. The Go API loads them at request time — no database needed for v1.

## Data files

| File | Endpoint | Used by |
|------|----------|---------|
| `snippets.json` | `GET /api/snippets` | Snippets section |
| `builds.json` | `GET /api/builds` | Shipped builds section |
| `ideas.json` | `GET /api/ideas` | Idea log section |
| `tools.json` | `GET /api/tools` | Tools & workflow section |

## Editing content

1. Edit the JSON file in `backend/data/`
2. Restart the Go server (or rebuild Docker image for production)
3. Refresh the page — frontend fetches live from the API

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `CONTENT_DIR` | `data` | Path to JSON data directory |
| `API_ADDR` | `:8080` | Listen address |

In Docker, `CONTENT_DIR=/app/data` is set automatically.

## Local dev

```bash
make dev
```

- Next.js: http://localhost:3000
- Go API: http://localhost:8081

Dev uses `frontend/.env.development` (`NEXT_PUBLIC_API_BASE=http://localhost:8081`) so the browser talks directly to Go. In Docker, `NEXT_PUBLIC_API_BASE` is empty — requests use relative `/api/*` paths through nginx.

## Adding new content types

1. Add a JSON file under `backend/data/`
2. Add types + loader in `backend/internal/content/store.go`
3. Add handler in `backend/cmd/server/main.go`
4. Add nginx location if needed (existing `/api/` catch-all covers it)
5. Add a frontend section that fetches the new endpoint
