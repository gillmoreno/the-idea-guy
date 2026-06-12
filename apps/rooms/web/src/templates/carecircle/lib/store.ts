import { Y } from "@the-idea-guy/room-kit";
import {
  ensureNestedMap,
  ensureTemplateBranch,
  readNestedMap,
  readTemplateBranch,
} from "@/lib/yjsTemplate";
import { writeRoomMeta } from "@/shell/roomMeta";
import type { Carer, CircleSettings, Note, Visit } from "./types";

export const CARECIRCLE_TEMPLATE_ID = "carecircle";

export function uid(prefix = ""): string {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export class CareCircleStore {
  readonly publicDoc: Y.Doc;
  readonly adminDoc: Y.Doc | null;

  constructor(publicDoc: Y.Doc, adminDoc: Y.Doc | null) {
    this.publicDoc = publicDoc;
    this.adminDoc = adminDoc;
  }

  private readCircleMap(): Y.Map<unknown> | null {
    const pub = readTemplateBranch(this.publicDoc, CARECIRCLE_TEMPLATE_ID);
    return pub ? readNestedMap(pub, "circle") : null;
  }

  private readCarersMap(): Y.Map<Carer> | null {
    const pub = readTemplateBranch(this.publicDoc, CARECIRCLE_TEMPLATE_ID);
    return pub ? readNestedMap<Carer>(pub, "carers") : null;
  }

  private readVisitsMap(): Y.Map<Visit> | null {
    const pub = readTemplateBranch(this.publicDoc, CARECIRCLE_TEMPLATE_ID);
    return pub ? readNestedMap<Visit>(pub, "visits") : null;
  }

  private readNotesMap(): Y.Map<Note> | null {
    const pub = readTemplateBranch(this.publicDoc, CARECIRCLE_TEMPLATE_ID);
    return pub ? readNestedMap<Note>(pub, "notes") : null;
  }

  isInitialized(): boolean {
    const circle = this.readCircleMap();
    return typeof circle?.get("recipientName") === "string";
  }

  getCircle(): CircleSettings | null {
    const circle = this.readCircleMap();
    const recipientName = circle?.get("recipientName");
    if (typeof recipientName !== "string") return null;
    return {
      recipientName,
      notes: (circle?.get("notes") as string) ?? "",
      createdAt: (circle?.get("createdAt") as number) ?? Date.now(),
    };
  }

  initCircle(settings: { recipientName: string; notes: string }) {
    this.publicDoc.transact(() => {
      writeRoomMeta(this.publicDoc, {
        templateKind: "builtin",
        templateId: CARECIRCLE_TEMPLATE_ID,
        roomName: `${settings.recipientName.trim()} · care`,
      });
      const pub = ensureTemplateBranch(this.publicDoc, CARECIRCLE_TEMPLATE_ID);
      const circle = ensureNestedMap(pub, "circle");
      circle.set("recipientName", settings.recipientName.trim());
      circle.set("notes", settings.notes.trim());
      circle.set("createdAt", Date.now());
      ensureNestedMap<Carer>(pub, "carers");
      ensureNestedMap<Visit>(pub, "visits");
      ensureNestedMap<Note>(pub, "notes");
    });
  }

  listCarers(): Carer[] {
    const carers = this.readCarersMap();
    if (!carers) return [];
    return [...carers.values()].sort((a, b) => a.joinedAt - b.joinedAt);
  }

  getCarer(id: string): Carer | null {
    return this.readCarersMap()?.get(id) ?? null;
  }

  addCarer(input: { name: string; color: string; id?: string }): Carer {
    const carer: Carer = {
      id: input.id ?? uid("cc_"),
      name: input.name.trim(),
      color: input.color,
      joinedAt: Date.now(),
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, CARECIRCLE_TEMPLATE_ID);
      const carers = ensureNestedMap<Carer>(pub, "carers");
      carers.set(carer.id, carer);
    });
    return carer;
  }

  /** All visits, newest first. */
  listVisits(): Visit[] {
    const visits = this.readVisitsMap();
    if (!visits) return [];
    return [...visits.values()].sort((a, b) => b.at - a.at);
  }

  logVisit(input: { carerId: string; note?: string }): Visit {
    const visit: Visit = {
      id: uid("v_"),
      carerId: input.carerId,
      at: Date.now(),
      note: input.note?.trim() || undefined,
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, CARECIRCLE_TEMPLATE_ID);
      const visits = ensureNestedMap<Visit>(pub, "visits");
      visits.set(visit.id, visit);
    });
    return visit;
  }

  /** All notes, newest first. */
  listNotes(): Note[] {
    const notes = this.readNotesMap();
    if (!notes) return [];
    return [...notes.values()].sort((a, b) => b.at - a.at);
  }

  addNote(input: { text: string; byId: string }): Note {
    const note: Note = {
      id: uid("n_"),
      text: input.text.trim(),
      at: Date.now(),
      byId: input.byId,
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, CARECIRCLE_TEMPLATE_ID);
      const notes = ensureNestedMap<Note>(pub, "notes");
      notes.set(note.id, note);
    });
    return note;
  }

  removeNote(id: string) {
    this.publicDoc.transact(() => {
      this.readNotesMap()?.delete(id);
    });
  }
}
