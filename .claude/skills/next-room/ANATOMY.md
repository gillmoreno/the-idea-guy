# Room template anatomy — authoring reference

How to actually build a room, both kinds. Verified against the codebase 2026-06-11; if a
path here is missing, trust the code over this file and fix this file.

## Two kinds of rooms — pick the cheapest that fits

| Kind | What it is | Build cost | When |
|------|-----------|-----------|------|
| **Declarative** | JSON `RoomSchema` added to `apps/rooms/web/public/catalog/v1.json`, rendered by the shared SchemaEngine | ~minutes | Idea fits collections of records + fields (text, textarea, tags, emoji, image) + features (votes, status) |
| **Builtin** | Custom React app + Yjs store under `apps/rooms/web/src/templates/<id>/` | ~one focused session | Needs computed logic (settlement math, rotations, streaks), custom views, per-member secrets, or novel interactions |

**Default to declarative.** Go builtin only when the schema engine genuinely can't express
the core value of the idea.

## Hard rules (from CLAUDE.md — never violate)

- Import `Y` from `@the-idea-guy/room-kit`, **never** from `yjs` directly (duplicate Yjs corrupts CRDT state).
- The relay stays dumb: opaque encrypted blobs only.
- Invite codes live in the URL **hash** only.

## A) Declarative template checklist

1. Write the `RoomSchema` (shape: `apps/rooms/web/src/schema/types.ts`):
   `schemaVersion: 1`, `engineVersion: 1`, slug `id` (`[a-z][a-z0-9-]{0,47}`), `name`,
   `description`, `emoji`, `accent`, `collections[]` (each: slug `id`, `label`,
   `singular`, `fields[]`, `views`, `permissions`), optional `features[]`
   (`votes` / `status`).
2. Append it to `templates` in `apps/rooms/web/public/catalog/v1.json` (entry: `id`,
   `name`, `description`, `emoji`, `accent`, `schema`). Existing entries (`potluck`,
   `idea-pool`) are the style guide.
3. Validate: the schema must pass `validateRoomSchema()` (`src/schema/validate.ts`) —
   the catalog loader (`src/templates/catalog.ts`) drops invalid entries silently, so
   load the create-room page and confirm the template appears.
4. Run `npm run qa:schema-ui` in `apps/rooms/web` (mandatory after touching `src/schema/`;
   cheap insurance even for catalog-only changes).

New **field types** or **feature types** extend the engine for every declarative room —
that's a Lego-brick win. Keep forward compat: older engines must ignore unknown types
gracefully (they already do — preserve that).

## B) Builtin template checklist

File layout (copy the shape of `tripsplit/`, the canonical example):

```
apps/rooms/web/src/templates/<id>/
├── <Pascal>App.tsx          # root state machine (see lifecycle below)
├── components/
│   ├── Setup.tsx            # owner-only first-run config → store.init()
│   ├── ProfilePicker.tsx    # member picks/creates their profile
│   ├── MainView.tsx         # the app itself (BottomNav if 3–5 sections)
│   └── ui.tsx               # template-local styled bits
└── lib/
    ├── types.ts             # data model interfaces
    ├── store.ts             # <Pascal>Store class — ALL Yjs reads/writes
    └── use<Pascal>Store.ts  # hook: new Store(docs.publicDoc, docs.adminDoc) on docs/version change
```

Registration (two touch points):

1. `src/templates/registry.ts` — add to `BUILTIN_TEMPLATES`:
   `{ kind: "builtin", id, name, description, emoji, accent }` (+ `ownerOnly` if applicable).
2. `src/templates/TemplateApp.tsx` — add a `lazy(() => import(...))` and a `case` in the
   `BuiltinLoader` switch.

Store rules:

- Reads via `readTemplateBranch(doc, templateId)` / `readNestedMap(parent, key)`;
  writes via `ensureTemplateBranch` / `ensureNestedMap` **inside `doc.transact()`**
  (helpers: `src/lib/yjsTemplate.ts`).
- Public data → `publicDoc`; owner-only data → `adminDoc` (may be null for members).

App root lifecycle (every builtin follows this exact ladder):

```tsx
const { mounted, roomCode, hasAdminAccess, isOwner, sync, currentMemberId } = useRoomSession();
const store = useXStore();
if (!mounted || !roomCode || !store || !sync.localLoaded) return <RoomLoading … />;
if (!store.isInitialized())
  return isOwner && hasAdminAccess ? <Setup /> : <RoomConnecting … />;
if (!currentMemberId || !store.getMember(currentMemberId)) return <ProfilePicker />;
return <MainView memberId={currentMemberId} />;
```

## Standard chrome (uniformity convention, not a hard rule)

Every room should feel like the same product:

- **Bottom nav** — `BottomNav` / `BottomNavItem` from `src/shell/BottomNav.tsx` when the
  app has 3–5 sections; last tab is **Settings**.
- **Settings tab** — always include `RoomInviteSettings` and `RoomDangerZone`
  (`src/shell/RoomInviteSettings.tsx`): invites, and delete-room for the owner.
- **Home/main view first** — land members on the useful screen, not a menu.
- Style with the shared CSS custom properties (`--accent`, `--muted`, …) from
  `app/globals.css`; the room's `accent` should drive its look.

## Shared Lego bricks — reuse before building

- `src/components/`: `EmojiPicker`, `AvatarField`, `ImageField`, `AccentColorField`,
  `PersonaAvatar`, `QRScanner`, `RoomMemberInviteField`, `TemplateIcon`, …
- `src/shell/`: `BottomNav`, `RoomInviteSettings` (+ `RoomDangerZone`), `RoomLoading`,
  `RoomConnecting`, `RoomSessionProvider`.
- `packages/room-kit`: `Y`, crypto, vault, invite-link builders, sync (`LocalFirstDoc`).
- Template logic worth stealing: `tripsplit/lib/balances.ts` (settlement math),
  `fitcrew` (streaks), `backlog` (votes + owner status).

If you build something a second room could use, put it in `src/components/` (or extend
the schema engine), not inside the template folder — that's the whole point of the loop.

## QA before shipping

From `apps/rooms/web`:

```bash
npx tsc --noEmit          # typecheck
npm run build             # the deploy does a static export; catch build breaks now
npm run qa:schema-ui      # mandatory if src/schema/ changed
```

## Deploy

```bash
./deploy/rooms/redeploy.sh   # docker compose up -d --build + healthz check
```

Live at https://rooms.the-idea-guy.com (tunnel: choreboard-relay).
