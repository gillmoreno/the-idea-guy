import {
  APP_ID,
  DEFAULT_BACKGROUND_SYNC_PARALLEL,
  loadVault,
  patchVaultRoom,
  pullRoomPublicChannel,
  type VaultRoom,
} from "@the-idea-guy/room-kit";

export type BackgroundSyncStatus = "idle" | "syncing" | "done" | "error";

export interface BackgroundSyncProgress {
  status: BackgroundSyncStatus;
  completed: number;
  total: number;
  /** Room codes with newly detected remote updates this run. */
  updatedRoomCodes: string[];
}

function hasRemoteActivity(
  room: VaultRoom,
  stateHash: string,
  relayChangedDoc: boolean,
): boolean {
  if (room.lastSeenStateHash !== undefined) {
    return stateHash !== room.lastSeenStateHash;
  }
  return relayChangedDoc;
}

async function runPool<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  if (items.length === 0) return;
  let index = 0;

  async function next(): Promise<void> {
    while (index < items.length) {
      const i = index++;
      await worker(items[i]!);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => next());
  await Promise.all(workers);
}

export class BackgroundRoomSyncManager {
  private running = false;
  private destroyed = false;

  constructor(
    private readonly relayUrl: string,
    private readonly onProgress: (progress: BackgroundSyncProgress) => void,
    private readonly onVaultChange: () => void,
    private readonly maxParallel = DEFAULT_BACKGROUND_SYNC_PARALLEL,
  ) {}

  get isRunning(): boolean {
    return this.running;
  }

  async syncRooms(rooms: VaultRoom[], excludeRoomCode?: string): Promise<void> {
    if (this.destroyed || this.running) return;

    const targets = rooms.filter((r) => r.roomCode !== excludeRoomCode?.trim());
    if (targets.length === 0) {
      this.onProgress({ status: "done", completed: 0, total: 0, updatedRoomCodes: [] });
      return;
    }

    this.running = true;
    const updatedRoomCodes: string[] = [];
    let completed = 0;

    this.onProgress({ status: "syncing", completed: 0, total: targets.length, updatedRoomCodes });

    try {
      await runPool(targets, this.maxParallel, async (room) => {
        if (this.destroyed) return;

        const result = await pullRoomPublicChannel({
          appId: APP_ID,
          roomCode: room.roomCode,
          relayUrl: this.relayUrl,
          passphrase: room.roomPassphrase,
        });

        if (result.connected && result.stateHash) {
          const vault = loadVault();
          const current = vault.rooms[room.roomCode] ?? room;
          const remoteActivity = hasRemoteActivity(
            current,
            result.stateHash,
            result.relayChangedDoc,
          );
          const hasRemoteUpdates = !!current.hasRemoteUpdates || remoteActivity;

          patchVaultRoom(vault, room.roomCode, {
            lastBackgroundSyncedAt: Date.now(),
            hasRemoteUpdates,
          });

          if (hasRemoteUpdates && !current.hasRemoteUpdates) {
            updatedRoomCodes.push(room.roomCode);
          }

          this.onVaultChange();
        }

        completed += 1;
        this.onProgress({
          status: "syncing",
          completed,
          total: targets.length,
          updatedRoomCodes: [...updatedRoomCodes],
        });
      });

      this.onProgress({
        status: "done",
        completed: targets.length,
        total: targets.length,
        updatedRoomCodes,
      });
    } catch {
      this.onProgress({
        status: "error",
        completed,
        total: targets.length,
        updatedRoomCodes,
      });
    } finally {
      this.running = false;
    }
  }

  destroy() {
    this.destroyed = true;
  }
}
