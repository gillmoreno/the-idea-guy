import { Y } from "@the-idea-guy/room-kit";
import {
  ensureNestedMap,
  ensureTemplateBranch,
  readNestedMap,
  readTemplateBranch,
} from "@/lib/yjsTemplate";
import { writeRoomMeta } from "@/shell/roomMeta";
import type { DiarySettings, Entry, Observer } from "./types";

export const SYMPTOMDIARY_TEMPLATE_ID = "symptomdiary";

export function uid(prefix = ""): string {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export class SymptomDiaryStore {
  readonly publicDoc: Y.Doc;
  readonly adminDoc: Y.Doc | null;

  constructor(publicDoc: Y.Doc, adminDoc: Y.Doc | null) {
    this.publicDoc = publicDoc;
    this.adminDoc = adminDoc;
  }

  private readDiaryMap(): Y.Map<unknown> | null {
    const pub = readTemplateBranch(this.publicDoc, SYMPTOMDIARY_TEMPLATE_ID);
    return pub ? readNestedMap(pub, "diary") : null;
  }

  private readObserversMap(): Y.Map<Observer> | null {
    const pub = readTemplateBranch(this.publicDoc, SYMPTOMDIARY_TEMPLATE_ID);
    return pub ? readNestedMap<Observer>(pub, "observers") : null;
  }

  private readEntriesMap(): Y.Map<Entry> | null {
    const pub = readTemplateBranch(this.publicDoc, SYMPTOMDIARY_TEMPLATE_ID);
    return pub ? readNestedMap<Entry>(pub, "entries") : null;
  }

  isInitialized(): boolean {
    const diary = this.readDiaryMap();
    return typeof diary?.get("patientName") === "string";
  }

  getDiary(): DiarySettings | null {
    const diary = this.readDiaryMap();
    const patientName = diary?.get("patientName");
    if (typeof patientName !== "string") return null;
    return {
      patientName,
      notes: (diary?.get("notes") as string) ?? "",
      createdAt: (diary?.get("createdAt") as number) ?? Date.now(),
    };
  }

  initDiary(settings: { patientName: string; notes: string }) {
    this.publicDoc.transact(() => {
      writeRoomMeta(this.publicDoc, {
        templateKind: "builtin",
        templateId: SYMPTOMDIARY_TEMPLATE_ID,
        roomName: `${settings.patientName.trim()} · symptom diary`,
      });
      const pub = ensureTemplateBranch(this.publicDoc, SYMPTOMDIARY_TEMPLATE_ID);
      const diary = ensureNestedMap(pub, "diary");
      diary.set("patientName", settings.patientName.trim());
      diary.set("notes", settings.notes.trim());
      diary.set("createdAt", Date.now());
      ensureNestedMap<Observer>(pub, "observers");
      ensureNestedMap<Entry>(pub, "entries");
    });
  }

  listObservers(): Observer[] {
    const observers = this.readObserversMap();
    if (!observers) return [];
    return [...observers.values()].sort((a, b) => a.joinedAt - b.joinedAt);
  }

  getObserver(id: string): Observer | null {
    return this.readObserversMap()?.get(id) ?? null;
  }

  addObserver(input: { name: string; color: string; id?: string }): Observer {
    const observer: Observer = {
      id: input.id ?? uid("ob_"),
      name: input.name.trim(),
      color: input.color,
      joinedAt: Date.now(),
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, SYMPTOMDIARY_TEMPLATE_ID);
      const observers = ensureNestedMap<Observer>(pub, "observers");
      observers.set(observer.id, observer);
    });
    return observer;
  }

  /** All entries, newest first. */
  listEntries(): Entry[] {
    const entries = this.readEntriesMap();
    if (!entries) return [];
    return [...entries.values()].sort((a, b) => b.at - a.at);
  }

  logEntry(input: { symptom: string; severity: number; note?: string; byId: string }): Entry {
    const entry: Entry = {
      id: uid("se_"),
      symptom: input.symptom.trim(),
      severity: Math.min(5, Math.max(1, Math.round(input.severity))),
      note: input.note?.trim() || undefined,
      at: Date.now(),
      byId: input.byId,
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, SYMPTOMDIARY_TEMPLATE_ID);
      const entries = ensureNestedMap<Entry>(pub, "entries");
      entries.set(entry.id, entry);
    });
    return entry;
  }

  removeEntry(id: string) {
    this.publicDoc.transact(() => {
      this.readEntriesMap()?.delete(id);
    });
  }
}
