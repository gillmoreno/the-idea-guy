---
name: rice-backlog
description: >-
  Maintain the RICE-prioritized backlog at docs_and_changelog/html/backlog.html.
  Use when the user wants to add/remove/rescore an idea, asks "what should I
  build next", mentions the backlog, prioritization, or RICE, or when an idea
  ships and its row should be retired.
---

# RICE backlog

The prioritized backlog lives at **`docs_and_changelog/html/backlog.html`** — one table, sorted by score descending, covering all three products (Rooms, Second Brain, Website).

## The formula

**Score = (Reach × Impact × Confidence) ÷ Effort**

| Factor | Scale |
|--------|-------|
| Reach | 1–10, relative share of audience touched in first ~3 months (pre-launch guesses; once the public Backlog room is live, use real vote counts for template ideas) |
| Impact | 0.25 minimal · 0.5 low · 1 medium · 2 high · 3 massive |
| Confidence | 0.5 low · 0.7 medium · 0.8 good · 0.9–1.0 high |
| Effort | person-weeks, solo + AI-assisted |

Tiers: Score ≥ 8 → **Now** · 3–8 → **Next** · < 3 → **Later**.
Override rule (**ship beats features**): while an app is not deployed, deploy-adjacent items outrank features regardless of score, because undeployed features have zero real reach.

## Adding or rescoring an idea

1. Read `backlog.html`.
2. Score the idea with the user if they gave R/I/C/E; otherwise propose scores with a one-line rationale each and let the table show them.
3. Insert the row in score order, renumber the `#` column, set the tier badge (`tier tier-now|tier-next|tier-later`), use `class="num"` on numeric cells and `<span class="score">` on the score.
4. Keep the row's idea cell format: `<strong>Name</strong> — one-line pitch` and a Project column (Rooms / Second Brain / Website / combinations).
5. Update the `Last synced` date in the footer.

## When an idea ships

Remove its row, renumber, and mention the shipped feature in the matching doc page (html-docs skill territory). If it was a seeded Rooms-template idea, also reflect status in `docs_and_changelog/BACKLOG.md` thinking if relevant.

## Sources of new ideas

- `docs_and_changelog/BACKLOG.md` (seeded room ideas + future section)
- `docs_and_changelog/IDEA_LOG_AND_TOOLS.md` (website roadmap)
- `docs_and_changelog/business-plan-and-next-steps.html`
- The live Backlog room votes, once deployed
