import { Y } from "@the-idea-guy/room-kit";
import {
  ensureNestedMap,
  ensureTemplateBranch,
  readNestedMap,
  readTemplateBranch,
} from "@/lib/yjsTemplate";
import { writeRoomMeta } from "@/shell/roomMeta";
import type { Drive, Driver, RotaSettings } from "./types";

export const CARPOOL_TEMPLATE_ID = "carpool";

export function uid(prefix = ""): string {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export class CarpoolStore {
  readonly publicDoc: Y.Doc;
  readonly adminDoc: Y.Doc | null;

  constructor(publicDoc: Y.Doc, adminDoc: Y.Doc | null) {
    this.publicDoc = publicDoc;
    this.adminDoc = adminDoc;
  }

  private readRotaMap(): Y.Map<unknown> | null {
    const pub = readTemplateBranch(this.publicDoc, CARPOOL_TEMPLATE_ID);
    return pub ? readNestedMap(pub, "rota") : null;
  }

  private readDriversMap(): Y.Map<Driver> | null {
    const pub = readTemplateBranch(this.publicDoc, CARPOOL_TEMPLATE_ID);
    return pub ? readNestedMap<Driver>(pub, "drivers") : null;
  }

  private readDrivesMap(): Y.Map<Drive> | null {
    const pub = readTemplateBranch(this.publicDoc, CARPOOL_TEMPLATE_ID);
    return pub ? readNestedMap<Drive>(pub, "drives") : null;
  }

  isInitialized(): boolean {
    const rota = this.readRotaMap();
    return typeof rota?.get("name") === "string";
  }

  getRota(): RotaSettings | null {
    const rota = this.readRotaMap();
    const name = rota?.get("name");
    if (typeof name !== "string") return null;
    return {
      name,
      details: (rota?.get("details") as string) ?? "",
      createdAt: (rota?.get("createdAt") as number) ?? Date.now(),
    };
  }

  initRota(settings: { name: string; details: string }) {
    this.publicDoc.transact(() => {
      writeRoomMeta(this.publicDoc, {
        templateKind: "builtin",
        templateId: CARPOOL_TEMPLATE_ID,
        roomName: settings.name,
      });
      const pub = ensureTemplateBranch(this.publicDoc, CARPOOL_TEMPLATE_ID);
      const rota = ensureNestedMap(pub, "rota");
      rota.set("name", settings.name.trim());
      rota.set("details", settings.details.trim());
      rota.set("createdAt", Date.now());
      ensureNestedMap<Driver>(pub, "drivers");
      ensureNestedMap<Drive>(pub, "drives");
    });
  }

  listDrivers(): Driver[] {
    const drivers = this.readDriversMap();
    if (!drivers) return [];
    return [...drivers.values()].sort((a, b) => a.joinedAt - b.joinedAt);
  }

  getDriver(id: string): Driver | null {
    return this.readDriversMap()?.get(id) ?? null;
  }

  addDriver(input: { name: string; color: string; id?: string }): Driver {
    const driver: Driver = {
      id: input.id ?? uid("dr_"),
      name: input.name.trim(),
      color: input.color,
      joinedAt: Date.now(),
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, CARPOOL_TEMPLATE_ID);
      const drivers = ensureNestedMap<Driver>(pub, "drivers");
      drivers.set(driver.id, driver);
    });
    return driver;
  }

  /** All drives, newest first. */
  listDrives(): Drive[] {
    const drives = this.readDrivesMap();
    if (!drives) return [];
    return [...drives.values()].sort((a, b) => b.at - a.at);
  }

  logDrive(input: { driverId: string; loggedById: string; note?: string }): Drive {
    const drive: Drive = {
      id: uid("dv_"),
      driverId: input.driverId,
      at: Date.now(),
      note: input.note?.trim() || undefined,
      loggedById: input.loggedById,
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, CARPOOL_TEMPLATE_ID);
      const drives = ensureNestedMap<Drive>(pub, "drives");
      drives.set(drive.id, drive);
    });
    return drive;
  }

  removeDrive(id: string) {
    this.publicDoc.transact(() => {
      this.readDrivesMap()?.delete(id);
    });
  }
}
