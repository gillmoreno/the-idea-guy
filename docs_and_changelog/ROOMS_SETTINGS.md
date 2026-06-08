# Rooms — standard settings & feature flags

## Shared shell components

Room templates should reuse shell settings blocks instead of one-off copies:

| Component | Path | Purpose |
|-----------|------|---------|
| `RelaySettings` | `apps/rooms/web/src/shell/RelaySettings.tsx` | Custom sync relay URL |
| `RoomInviteSettings` | `apps/rooms/web/src/shell/RoomInviteSettings.tsx` | Invite mutual contacts (admin only) |
| `RoomCodeShare` | `apps/rooms/web/src/shell/RoomCodeShare.tsx` | Room code + join QR |
| `TopbarPersona` | `apps/rooms/web/src/shell/TopbarPersona.tsx` | Header avatar + link to home (`/`) |

Import in any template Settings tab:

```tsx
import { RelaySettings } from "@/shell/RelaySettings";
import { RoomInviteSettings } from "@/shell/RoomInviteSettings";
// …
<RelaySettings />
<RoomInviteSettings
  onReserveMembers={(slots) => {
    for (const slot of slots) {
      store.addMember({ id: slot.slotId, name: slot.name, color: slot.color });
    }
  }}
/>
```

`RoomInviteSettings` renders only when the user has **admin access** (`hasAdminAccess` — admin secret unlocked). Each template passes `onReserveMembers` to add reserved slots to its CRDT before inbox invites go out.

## Build-time flags (`roomFeatures.ts`)

Operator-controlled via `NEXT_PUBLIC_*` env vars at **build/deploy** (static export bakes them in).

| Variable | Default | Effect |
|----------|---------|--------|
| `NEXT_PUBLIC_RELAY_SETTINGS_ENABLED` | off | Shows **Settings → Sync relay** (custom URL + reconnect) |

Enable for self-hosters / power users:

```bash
# deploy/.env
NEXT_PUBLIC_RELAY_SETTINGS_ENABLED=true
```

And in `deploy/subdomains.json` under `rooms.build_env`:

```json
"NEXT_PUBLIC_RELAY_SETTINGS_ENABLED": "${NEXT_PUBLIC_RELAY_SETTINGS_ENABLED}"
```

Local dev:

```bash
cd apps/rooms/web
NEXT_PUBLIC_RELAY_SETTINGS_ENABLED=true npm run dev
```

## Changelog

- **2026-06-07** — `RelaySettings` moved to shell; gated by `NEXT_PUBLIC_RELAY_SETTINGS_ENABLED` (default off)
- **2026-06-07** — `RoomInviteSettings` shell block for admins across all room templates
- **2026-06-07** — `TopbarPersona` + `/profile` page (persona avatar in every room header)
- **2026-06-07** — **Look & feel** theme picker moved exclusively to `/profile` (still app-wide via `rooms.theme.v1`)
