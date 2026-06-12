import { Y } from "@the-idea-guy/room-kit";
import {
  ensureNestedMap,
  ensureTemplateBranch,
  readNestedMap,
  readTemplateBranch,
} from "@/lib/yjsTemplate";
import { writeRoomMeta } from "@/shell/roomMeta";
import type { CoopSettings, Family, Sit } from "./types";

export const SITCOOP_TEMPLATE_ID = "sitcoop";

export function uid(prefix = ""): string {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function todayStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export class SitCoopStore {
  readonly publicDoc: Y.Doc;
  readonly adminDoc: Y.Doc | null;

  constructor(publicDoc: Y.Doc, adminDoc: Y.Doc | null) {
    this.publicDoc = publicDoc;
    this.adminDoc = adminDoc;
  }

  private readCoopMap(): Y.Map<unknown> | null {
    const pub = readTemplateBranch(this.publicDoc, SITCOOP_TEMPLATE_ID);
    return pub ? readNestedMap(pub, "coop") : null;
  }

  private readFamiliesMap(): Y.Map<Family> | null {
    const pub = readTemplateBranch(this.publicDoc, SITCOOP_TEMPLATE_ID);
    return pub ? readNestedMap<Family>(pub, "families") : null;
  }

  private readSitsMap(): Y.Map<Sit> | null {
    const pub = readTemplateBranch(this.publicDoc, SITCOOP_TEMPLATE_ID);
    return pub ? readNestedMap<Sit>(pub, "sits") : null;
  }

  isInitialized(): boolean {
    const coop = this.readCoopMap();
    return typeof coop?.get("name") === "string";
  }

  getCoop(): CoopSettings | null {
    const coop = this.readCoopMap();
    const name = coop?.get("name");
    if (typeof name !== "string") return null;
    return {
      name,
      details: (coop?.get("details") as string) ?? "",
      createdAt: (coop?.get("createdAt") as number) ?? Date.now(),
    };
  }

  initCoop(settings: { name: string; details: string }) {
    this.publicDoc.transact(() => {
      writeRoomMeta(this.publicDoc, {
        templateKind: "builtin",
        templateId: SITCOOP_TEMPLATE_ID,
        roomName: settings.name,
      });
      const pub = ensureTemplateBranch(this.publicDoc, SITCOOP_TEMPLATE_ID);
      const coop = ensureNestedMap(pub, "coop");
      coop.set("name", settings.name.trim());
      coop.set("details", settings.details.trim());
      coop.set("createdAt", Date.now());
      ensureNestedMap<Family>(pub, "families");
      ensureNestedMap<Sit>(pub, "sits");
    });
  }

  listFamilies(): Family[] {
    const families = this.readFamiliesMap();
    if (!families) return [];
    return [...families.values()].sort((a, b) => a.joinedAt - b.joinedAt);
  }

  getFamily(id: string): Family | null {
    return this.readFamiliesMap()?.get(id) ?? null;
  }

  addFamily(input: { name: string; color: string; id?: string }): Family {
    const family: Family = {
      id: input.id ?? uid("fm_"),
      name: input.name.trim(),
      color: input.color,
      joinedAt: Date.now(),
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, SITCOOP_TEMPLATE_ID);
      const families = ensureNestedMap<Family>(pub, "families");
      families.set(family.id, family);
    });
    return family;
  }

  /** All sits, newest first. */
  listSits(): Sit[] {
    const sits = this.readSitsMap();
    if (!sits) return [];
    return [...sits.values()].sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date);
      return dateCmp !== 0 ? dateCmp : b.createdAt - a.createdAt;
    });
  }

  logSit(input: {
    sitterId: string;
    forId: string;
    minutes: number;
    date?: string;
    note?: string;
    loggedById: string;
  }): Sit {
    const sit: Sit = {
      id: uid("sit_"),
      sitterId: input.sitterId,
      forId: input.forId,
      minutes: input.minutes,
      date: input.date ?? todayStr(),
      note: input.note?.trim() || undefined,
      createdAt: Date.now(),
      loggedById: input.loggedById,
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, SITCOOP_TEMPLATE_ID);
      const sits = ensureNestedMap<Sit>(pub, "sits");
      sits.set(sit.id, sit);
    });
    return sit;
  }

  removeSit(id: string) {
    this.publicDoc.transact(() => {
      this.readSitsMap()?.delete(id);
    });
  }
}
