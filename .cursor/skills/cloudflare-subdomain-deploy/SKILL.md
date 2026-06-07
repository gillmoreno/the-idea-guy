---
name: cloudflare-subdomain-deploy
description: >-
  Deploy static mini-apps from this repo to Cloudflare Pages on
  the-idea-guy.com subdomains using deploy/subdomains.json and
  scripts/deploy-subdomain.sh. Use when the user asks to deploy a subdomain,
  Cloudflare Pages, wrangler, or publish ChoreBoard/chores to production.
disable-model-invocation: true
---

# Cloudflare subdomain deploy (the-idea-guy.com)

Static mini-apps (Next.js `output: "export"`) ship to **Cloudflare Pages** on subdomains of **`the-idea-guy.com`**. DNS is already on Cloudflare — Pages + a custom domain is the right fit.

## Quick reference

| Item | Location |
|------|----------|
| Site registry | `deploy/subdomains.json` |
| Deploy script | `scripts/deploy-chores.sh` (wraps `scripts/deploy-subdomain.sh`) |
| Secrets template | `deploy/.env.example` → copy to `deploy/.env` |
| Full guide | `docs_and_changelog/CLOUDFLARE_SUBDOMAIN_DEPLOY.md` |

## First-time setup (once per machine)

1. Copy `deploy/.env.example` → `deploy/.env`
2. Set `CLOUDFLARE_API_TOKEN` (Pages Edit + DNS Edit + Zone Read)
3. Set `CLOUDFLARE_ACCOUNT_ID` (from `wrangler whoami` or dashboard URL)
4. Default relay is `wss://relay.the-idea-guy.com` (baked in at build). Self-hosters override in **Settings → Sync relay**.

## Deploy ChoreBoard (chores subdomain)

```bash
chmod +x scripts/deploy-chores.sh   # once
./scripts/deploy-chores.sh --init   # first time: project + domain
./scripts/deploy-chores.sh          # later: build + upload only
```

Result: **https://chores.the-idea-guy.com/**

## Add a new subdomain later

1. Add an entry under `sites` in `deploy/subdomains.json`:
   - `project_name` — unique Cloudflare Pages project id (e.g. `the-idea-guy-docs`)
   - `subdomain` — DNS label (e.g. `docs` → `docs.the-idea-guy.com`)
   - `build_dir`, `output_dir`, `build_command`
   - optional `build_env` with `${ENV_VAR}` placeholders
2. Run `./scripts/deploy-subdomain.sh <site-id> --init`
3. Document the app in `docs_and_changelog/` if it is a new product area

## Agent checklist

When user asks to deploy:

- [ ] Confirm site id exists in `deploy/subdomains.json`
- [ ] Ensure `deploy/.env` has token + account id (never commit secrets)
- [ ] Run build locally if user wants verification before upload
- [ ] First deploy: use `--init`; repeat deploys: omit `--init`
- [ ] Remind: **relay** is separate — use skill **`choreboard-relay-deploy`** (`./scripts/deploy-relay.sh`) or `docs_and_changelog/CHOREBOARD_RELAY.md`

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Unknown site id` | Add site to `deploy/subdomains.json` |
| `CLOUDFLARE_API_TOKEN` missing | Create `deploy/.env` from example |
| Domain/pages.dev shows nothing | Preview vs production mismatch — deploy must use the project's production branch (script uses current git branch) |
| Domain not resolving | Re-run with `--init`; check Cloudflare DNS for CNAME to `*.pages.dev` |
| Sync broken in prod | Rebuild with `CHORES_RELAY_URL=wss://your-relay` in `deploy/.env` |
| `wrangler pages project create` fails | Project name taken — pick a new `project_name` in manifest |

## What wrangler does vs API

- **Wrangler**: create project, upload static files (`wrangler pages deploy`)
- **Cloudflare API** (in script): attach custom domain to Pages project on first `--init`
- Custom domain CLI for Pages is not in wrangler yet — the script uses the REST API instead
