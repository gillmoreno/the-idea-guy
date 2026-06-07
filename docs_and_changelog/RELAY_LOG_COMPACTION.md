# Relay log compaction

**Date:** 2026-06-07  
**Scope:** `choreboard/relay/` + Local-First Kit `sync.ts`

## Problem

The relay stored every encrypted Yjs update forever (append-only). Each reconnect also pushed a full document snapshot, so logs could grow faster than daily chore traffic alone.

## Solution

**Checkpoint compaction** — after a client catches up on the backlog, it sends a **checkpoint** frame (merged Yjs state). The relay **replaces** the room log with that single frame and rewrites the on-disk `.log` file.

Incremental edits still use **update** frames (append until the next checkpoint).

## Wire protocol (1-byte prefix, not encrypted)

| Byte | Direction | Meaning |
|------|-----------|---------|
| `0x00` | Client → relay | Update — append to log |
| `0x01` | Client → relay | Checkpoint — compact log to this frame |
| `0xFE` | Relay → client | Sync end — backlog replay finished |

Legacy clients/entries without a prefix still work (treated as append-only updates).

## Client flow

1. Connect → relay replays room log
2. Relay sends `0xFE` (sync end)
3. Client applies backlog + local IndexedDB → merged doc
4. Client sends checkpoint (`0x01` + encrypted `encodeStateAsUpdate`)
5. Relay compacts to one entry; other peers receive the checkpoint

Old relays without `0xFE`: client falls back to sending a checkpoint ~1.5s after connect.

## Downsides (acceptable)

- Brief disk rewrite on compact (one small file per room)
- Compaction runs when a device connects — not continuous background GC
- Forensic history on relay is reduced to latest checkpoint + any updates since (by design)

## Deploy

Relay and web app must ship together for best results. Deploy both:

```bash
./scripts/deploy-choreboard.sh
```
