import { Y } from "@the-idea-guy/room-kit";
import {
  ensureNestedMap,
  ensureTemplateBranch,
  readNestedMap,
  readTemplateBranch,
} from "@/lib/yjsTemplate";
import { writeRoomMeta } from "@/shell/roomMeta";
import type { CarEvent, CarEventKind, CarSettings, Driver } from "./types";

export const CARLOG_TEMPLATE_ID = "carlog";

export function uid(prefix = ""): string {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export interface Holder {
  driverId: string;
  at: number;
}

export class CarLogStore {
  readonly publicDoc: Y.Doc;
  readonly adminDoc: Y.Doc | null;

  constructor(publicDoc: Y.Doc, adminDoc: Y.Doc | null) {
    this.publicDoc = publicDoc;
    this.adminDoc = adminDoc;
  }

  private readCarMap(): Y.Map<unknown> | null {
    const pub = readTemplateBranch(this.publicDoc, CARLOG_TEMPLATE_ID);
    return pub ? readNestedMap(pub, "car") : null;
  }

  private readDriversMap(): Y.Map<Driver> | null {
    const pub = readTemplateBranch(this.publicDoc, CARLOG_TEMPLATE_ID);
    return pub ? readNestedMap<Driver>(pub, "drivers") : null;
  }

  private readEventsMap(): Y.Map<CarEvent> | null {
    const pub = readTemplateBranch(this.publicDoc, CARLOG_TEMPLATE_ID);
    return pub ? readNestedMap<CarEvent>(pub, "events") : null;
  }

  isInitialized(): boolean {
    const car = this.readCarMap();
    return typeof car?.get("name") === "string";
  }

  getCar(): CarSettings | null {
    const car = this.readCarMap();
    const name = car?.get("name");
    if (typeof name !== "string") return null;
    return {
      name,
      details: (car?.get("details") as string) ?? "",
      currency: (car?.get("currency") as string) ?? "USD",
      createdAt: (car?.get("createdAt") as number) ?? Date.now(),
    };
  }

  getHolder(): Holder | null {
    const car = this.readCarMap();
    const driverId = car?.get("holderId");
    if (typeof driverId !== "string" || !driverId) return null;
    return { driverId, at: (car?.get("holderAt") as number) ?? Date.now() };
  }

  takeCar(driverId: string) {
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, CARLOG_TEMPLATE_ID);
      const car = ensureNestedMap(pub, "car");
      car.set("holderId", driverId);
      car.set("holderAt", Date.now());
    });
  }

  initCar(settings: { name: string; details: string; currency: string }) {
    this.publicDoc.transact(() => {
      writeRoomMeta(this.publicDoc, {
        templateKind: "builtin",
        templateId: CARLOG_TEMPLATE_ID,
        roomName: settings.name,
      });
      const pub = ensureTemplateBranch(this.publicDoc, CARLOG_TEMPLATE_ID);
      const car = ensureNestedMap(pub, "car");
      car.set("name", settings.name.trim());
      car.set("details", settings.details.trim());
      car.set("currency", settings.currency);
      car.set("createdAt", Date.now());
      ensureNestedMap<Driver>(pub, "drivers");
      ensureNestedMap<CarEvent>(pub, "events");
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
      id: input.id ?? uid("cd_"),
      name: input.name.trim(),
      color: input.color,
      joinedAt: Date.now(),
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, CARLOG_TEMPLATE_ID);
      const drivers = ensureNestedMap<Driver>(pub, "drivers");
      drivers.set(driver.id, driver);
    });
    return driver;
  }

  /** All events, newest first. */
  listEvents(): CarEvent[] {
    const events = this.readEventsMap();
    if (!events) return [];
    return [...events.values()].sort((a, b) => b.at - a.at);
  }

  logEvent(input: {
    kind: CarEventKind;
    byId: string;
    odometer?: number;
    amountCents?: number;
    text?: string;
  }): CarEvent {
    const event: CarEvent = {
      id: uid("ce_"),
      kind: input.kind,
      at: Date.now(),
      byId: input.byId,
      odometer: input.odometer,
      amountCents: input.amountCents,
      text: input.text?.trim() || undefined,
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, CARLOG_TEMPLATE_ID);
      const events = ensureNestedMap<CarEvent>(pub, "events");
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
