export interface CarSettings {
  name: string;
  /** Plate, parking spot, quirks — free text. */
  details: string;
  currency: string;
  createdAt: number;
}

export interface Driver {
  id: string;
  name: string;
  color: string;
  joinedAt: number;
}

export type CarEventKind = "fuel" | "service" | "note";

export interface CarEvent {
  id: string;
  kind: CarEventKind;
  at: number;
  byId: string;
  /** Odometer reading at the time, if noted. */
  odometer?: number;
  /** Fuel or service cost in integer cents. */
  amountCents?: number;
  text?: string;
}

export const DRIVER_COLORS = [
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#ef4444",
  "#84cc16",
];

/** Latest odometer reading across events, if any. */
export function latestOdometer(events: CarEvent[]): number | null {
  let best: { odo: number; at: number } | null = null;
  for (const e of events) {
    if (e.odometer === undefined) continue;
    if (!best || e.at > best.at) best = { odo: e.odometer, at: e.at };
  }
  return best?.odo ?? null;
}
