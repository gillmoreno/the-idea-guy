# Idea Log & Tools Sections

## Overview

Two new homepage sections that extend the site from proof (builds) into public thinking and stealable setup.

| Section | Anchor | API |
|---------|--------|-----|
| Idea log | `#ideas` | `GET /api/ideas` |
| Tools & workflow | `#tools` | `GET /api/tools` |

## Idea log

Public list of ideas with status and why each matters.

```ts
type Idea = {
  id: string;
  title: string;
  why: string;
  status: "exploring" | "building" | "shipped" | "parked";
  link?: string;  // thread, build, or anchor
};
```

**Where content lives**

| Layer | Location |
|-------|----------|
| API | `backend/cmd/server/main.go` → `handleIdeas` |
| Frontend fallback | `frontend/src/components/IdeaLogSection.tsx` |

When an idea ships, update its status to `shipped` and add a `link` to the build or X thread.

## Tools & workflow

Three-part layout:

1. **Stack** — grouped tools (Frontend, Backend, Ship)
2. **Workflow** — numbered steps from idea to public teaching
3. **Cursor rules** — copy-paste principles for AI-assisted building

```ts
type ToolsData = {
  stack: { category: string; items: { name: string; role: string }[] }[];
  workflow: { step: number; title: string; description: string }[];
  cursorRules: { id: string; title: string; description: string }[];
};
```

**Where content lives**

| Layer | Location |
|-------|----------|
| API | `backend/cmd/server/main.go` → `handleTools` |
| Frontend fallback | `frontend/src/components/ToolsSection.tsx` |

This page is designed to be high steal-value — update it whenever your stack or rules change.

## Navigation

Header links: **Shipped** → **Ideas** → **Stack** → **Snippets** → **About**

## Roadmap

1. ~~What I've Shipped~~
2. ~~Idea log~~
3. ~~Tools & workflow~~
4. How-to guides (coming soon section)
5. Idea Validator interactive demo

See also: [BUILDS_SECTION.md](./BUILDS_SECTION.md)
