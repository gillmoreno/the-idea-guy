# Positioning — The Lens

## Core positioning

The Idea Guy sees real problems, deeply explains how people currently solve them
(with data, charts, context), and then shows how one person with modern AI can do
it better — simpler, more beautiful, more useful, or more powerful.

**No more scattered fronts. One clear lens.**

## The four-step lens

1. **Spot the problem** — find something people actually struggle with today.
2. **Explain how it's solved now** — map current solutions richly, with data, charts, and context; show where they fall short.
3. **Ship a meaningfully better approach** — use modern AI as leverage to build something simpler, more beautiful, more useful, or more powerful.
4. **Teach the process publicly** — share the problem, the research, the build, and the lessons.

This replaces the earlier three "principles" framing. The values still hold
(useful over hype, one person full stack, teach in public) but are now expressed
as a single repeatable method rather than separate fronts.

## Where it lives on the site

| Element | Location | Notes |
|---------|----------|-------|
| Hero copy | `frontend/src/app/page.tsx` | Restated as the lens |
| The lens section | `frontend/src/app/page.tsx` → `method[]`, `#method` | 4 numbered steps (reuses `.pillars` styling) |
| Nav label | `frontend/src/components/SiteHeader.tsx` | "The lens" → `#method` |
| Metadata | `frontend/src/app/layout.tsx` | Title + description match the lens |

## How it should shape builds (next step)

Each entry in the **Shipped** section should ideally tell the full lens story:

- **Problem** — what people struggle with
- **How it's solved today** — current tools/approaches + their gaps (data/visuals)
- **The better approach** — what was shipped and why it's better
- **Lesson** — already captured as `learning`

Extending the `Build` model with `problem` and `betterApproach` fields (frontend
`BuildsSection.tsx` + Go `handleBuilds`) would make every build a proof of the lens.
