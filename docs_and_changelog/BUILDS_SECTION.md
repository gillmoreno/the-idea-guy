# What I've Shipped — Builds Section

## Overview

Homepage section (`#builds`) that turns the site from manifesto into proof. Each card shows a real experiment with stack, key learning, and links to demo / X thread / repo.

## Data model

```ts
type Build = {
  id: string;
  title: string;
  description: string;      // one-liner
  tags: string[];           // tech stack
  learning?: string;        // key takeaway
  links?: {
    demo?: string;
    thread?: string;
    repo?: string;
  };
  shippedAt?: string;       // e.g. "2026-05"
  status: "live" | "shipped" | "building" | "archived";
};
```

## Where content lives

| Layer | Location |
|-------|----------|
| API (source of truth when running) | `backend/cmd/server/main.go` → `handleBuilds` |
| Frontend fallback | `frontend/src/components/BuildsSection.tsx` → `fallbackBuilds` |

Keep both in sync when adding builds. The frontend falls back to defaults when the API is unreachable (e.g. during `next dev` without the Go server).

## Adding a new build

1. Add an entry to `handleBuilds` in `main.go`
2. Mirror it in `fallbackBuilds` in `BuildsSection.tsx`
3. Rebuild and deploy the monolith

Example entry:

```go
{
  ID:          "my-project",
  Title:       "My Project",
  Description: "One-line description of what it does.",
  Tags:        []string{"cursor", "nextjs"},
  Learning:    "The single most useful thing you learned shipping this.",
  Links: &BuildLinks{
    Demo:   "https://example.com",
    Thread: "https://x.com/you/status/123",
    Repo:   "https://github.com/you/repo",
  },
  ShippedAt: "2026-06",
  Status:    "live",
},
```

## API

| Endpoint | Description |
|----------|-------------|
| `GET /api/builds` | JSON array of builds |

## UI

- Section sits between **Snippets** and **Coming soon**
- Nav link: **Shipped** → `#builds`
- Hero primary CTA: **See what I've shipped** → `#builds`
- Cards reuse the existing `.card` / `.grid-3` pattern with build-specific styles for status badges, key learning callout, and footer links

## Roadmap (next sections)

1. ~~What I've Shipped~~
2. ~~Idea log~~
3. ~~Tools & workflow~~
4. Interactive demo (e.g. Idea Validator API)
