# Cloudflared across multiple zones (aigil.dev + the-idea-guy.com)

**Date:** 2026-06-04

## What went wrong

`cloudflared tunnel route dns choreboard-relay relay.the-idea-guy.com` created:

`relay.the-idea-guy.com.aigil.dev`

because `~/.cloudflared/cert.pem` was issued when you ran `cloudflared tunnel login` and chose **aigil.dev**. That certificate only authorizes DNS changes under that zone ([Cloudflare docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/local-management/create-local-tunnel/) — step 2).

You do **not** need a second Cloudflare account. You need either DNS via the **API**, a **second origin cert** for `the-idea-guy.com`, or the **Zero Trust dashboard**.

## Recommended: API DNS (no second login)

Same token as ChoreBoard Pages deploy (`deploy/.env`):

```bash
./scripts/relay-route-dns.sh
```

Creates a proxied CNAME on **the-idea-guy.com**:

`relay` → `f3e1a2ac-d0e8-4be6-a246-6c0d76cfe8c8.cfargotunnel.com`

The tunnel connector (`config-choreboard-relay.yml` + `*.json` credentials) is unchanged. Only DNS was missing.

Delete the mistaken record on **aigil.dev** if you want: `relay.the-idea-guy.com.aigil.dev`.

## Option B: Second origin cert (CLI DNS for Idea Guy)

Keep **aigil.dev** cert at `~/.cloudflared/cert.pem`. Add a **separate** cert for Idea Guy using `TUNNEL_ORIGIN_CERT`:

```bash
mkdir -p ~/.cloudflared-the-idea-guy

# Browser opens — log in and select zone: the-idea-guy.com (not aigil.dev)
TUNNEL_ORIGIN_CERT="$HOME/.cloudflared-the-idea-guy/cert.pem" \
  cloudflared tunnel login
```

Route DNS with the Idea Guy cert:

```bash
TUNNEL_ORIGIN_CERT="$HOME/.cloudflared-the-idea-guy/cert.pem" \
  cloudflared tunnel route dns -f choreboard-relay relay.the-idea-guy.com
```

You should see: `Added CNAME relay.the-idea-guy.com` (no `.aigil.dev` suffix).

**Running tunnels:** `cloudflared tunnel run` uses per-tunnel `*.json` credentials, not `cert.pem`. Your existing aigil.dev launchd services keep working. `cert.pem` is mainly for **creating** tunnels and **CLI DNS** routes.

**Do not** replace `~/.cloudflared/cert.pem` unless you are OK with `tunnel route dns` for **new** aigil.dev hostnames appending `.aigil.dev` wrongly. Back up first:

```bash
cp ~/.cloudflared/cert.pem ~/.cloudflared/cert.pem.aigil.dev.bak
```

## Option C: Zero Trust dashboard (no cert scope issue)

1. [Cloudflare Zero Trust](https://one.dash.cloudflare.com/) → **Networks** → **Connectors** → **Cloudflare Tunnels**
2. Open tunnel **choreboard-relay**
3. **Public Hostname** → add `relay.the-idea-guy.com` → `http://localhost:4500`
4. Save (dashboard creates DNS on the correct zone)

## Summary

| Approach | aigil.dev CLI DNS | the-idea-guy.com DNS | Extra setup |
|----------|-------------------|----------------------|-------------|
| `./scripts/relay-route-dns.sh` | unchanged | API token | `deploy/.env` |
| Second cert + `TUNNEL_ORIGIN_CERT` | unchanged | `tunnel route dns` with Idea Guy cert | One browser login |
| Replace `cert.pem` (re-login) | breaks CLI DNS pattern | works | Not recommended |
| Dashboard public hostname | unchanged | works | Click UI |

For ChoreBoard relay, prefer **API script** (same credentials as Pages) or **dashboard**; use **second cert** only if you want everything on the CLI.
