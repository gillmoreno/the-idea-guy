import { Y } from "@the-idea-guy/room-kit";
import {
  ensureNestedMap,
  ensureTemplateBranch,
  readNestedMap,
  readTemplateBranch,
} from "@/lib/yjsTemplate";
import { writeRoomMeta } from "@/shell/roomMeta";
import type { Carer, CareSettings, DoseEvent, Med } from "./types";

export const DOSELOG_TEMPLATE_ID = "doselog";

export function uid(prefix = ""): string {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export class DoseLogStore {
  readonly publicDoc: Y.Doc;
  readonly adminDoc: Y.Doc | null;

  constructor(publicDoc: Y.Doc, adminDoc: Y.Doc | null) {
    this.publicDoc = publicDoc;
    this.adminDoc = adminDoc;
  }

  private readCareMap(): Y.Map<unknown> | null {
    const pub = readTemplateBranch(this.publicDoc, DOSELOG_TEMPLATE_ID);
    return pub ? readNestedMap(pub, "care") : null;
  }

  private readCarersMap(): Y.Map<Carer> | null {
    const pub = readTemplateBranch(this.publicDoc, DOSELOG_TEMPLATE_ID);
    return pub ? readNestedMap<Carer>(pub, "carers") : null;
  }

  private readMedsMap(): Y.Map<Med> | null {
    const pub = readTemplateBranch(this.publicDoc, DOSELOG_TEMPLATE_ID);
    return pub ? readNestedMap<Med>(pub, "meds") : null;
  }

  private readEventsMap(): Y.Map<DoseEvent> | null {
    const pub = readTemplateBranch(this.publicDoc, DOSELOG_TEMPLATE_ID);
    return pub ? readNestedMap<DoseEvent>(pub, "events") : null;
  }

  isInitialized(): boolean {
    const care = this.readCareMap();
    return typeof care?.get("recipientName") === "string";
  }

  getCare(): CareSettings | null {
    const care = this.readCareMap();
    const recipientName = care?.get("recipientName");
    if (typeof recipientName !== "string") return null;
    return {
      recipientName,
      notes: (care?.get("notes") as string) ?? "",
      createdAt: (care?.get("createdAt") as number) ?? Date.now(),
    };
  }

  initCare(settings: { recipientName: string; notes: string }) {
    this.publicDoc.transact(() => {
      writeRoomMeta(this.publicDoc, {
        templateKind: "builtin",
        templateId: DOSELOG_TEMPLATE_ID,
        roomName: `${settings.recipientName.trim()} · meds`,
      });
      const pub = ensureTemplateBranch(this.publicDoc, DOSELOG_TEMPLATE_ID);
      const care = ensureNestedMap(pub, "care");
      care.set("recipientName", settings.recipientName.trim());
      care.set("notes", settings.notes.trim());
      care.set("createdAt", Date.now());
      ensureNestedMap<Carer>(pub, "carers");
      ensureNestedMap<Med>(pub, "meds");
      ensureNestedMap<DoseEvent>(pub, "events");
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
      id: input.id ?? uid("c_"),
      name: input.name.trim(),
      color: input.color,
      joinedAt: Date.now(),
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, DOSELOG_TEMPLATE_ID);
      const carers = ensureNestedMap<Carer>(pub, "carers");
      carers.set(carer.id, carer);
    });
    return carer;
  }

  listMeds(): Med[] {
    const meds = this.readMedsMap();
    if (!meds) return [];
    return [...meds.values()].sort((a, b) => a.createdAt - b.createdAt);
  }

  addMed(input: {
    name: string;
    doseLabel: string;
    scheduleLabel: string;
    minIntervalHours?: number;
    createdById: string;
  }): Med {
    const med: Med = {
      id: uid("m_"),
      name: input.name.trim(),
      doseLabel: input.doseLabel.trim(),
      scheduleLabel: input.scheduleLabel.trim(),
      minIntervalHours:
        input.minIntervalHours && input.minIntervalHours > 0 ? input.minIntervalHours : undefined,
      createdAt: Date.now(),
      createdById: input.createdById,
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, DOSELOG_TEMPLATE_ID);
      const meds = ensureNestedMap<Med>(pub, "meds");
      meds.set(med.id, med);
    });
    return med;
  }

  removeMed(id: string) {
    this.publicDoc.transact(() => {
      this.readMedsMap()?.delete(id);
    });
  }

  /** All dose events, newest first. */
  listEvents(): DoseEvent[] {
    const events = this.readEventsMap();
    if (!events) return [];
    return [...events.values()].sort((a, b) => b.at - a.at);
  }

  lastEventForMed(medId: string): DoseEvent | null {
    let last: DoseEvent | null = null;
    this.readEventsMap()?.forEach((e) => {
      if (e.medId === medId && (!last || e.at > last.at)) last = e;
    });
    return last;
  }

  logDose(input: { med: Med; byId: string; note?: string }): DoseEvent {
    const event: DoseEvent = {
      id: uid("d_"),
      medId: input.med.id,
      medName: input.med.name,
      at: Date.now(),
      byId: input.byId,
      note: input.note?.trim() || undefined,
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, DOSELOG_TEMPLATE_ID);
      const events = ensureNestedMap<DoseEvent>(pub, "events");
      events.set(event.id, event);
    });
    return event;
  }

  removeEvent(id: string) {
    this.publicDoc.transact(() => {
      this.readEventsMap()?.delete(id);
    });
  }
}
