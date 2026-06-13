import { Y } from "@the-idea-guy/room-kit";
import {
  ensureNestedMap,
  ensureTemplateBranch,
  readNestedMap,
  readTemplateBranch,
} from "@/lib/yjsTemplate";
import { writeRoomMeta } from "@/shell/roomMeta";
import type { Expense, Traveler, TripSettings } from "./types";

export const TRIPSPLIT_TEMPLATE_ID = "tripsplit";

export function uid(prefix = ""): string {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function todayStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Return a shares map to persist, or undefined for a plain equal split. Only
 * uneven splits get a stored map — keeps equal splits as clean data and lets
 * the math fall back to its weight-1 default.
 */
function normalizeShares(
  splitAmongIds: string[],
  shares?: Record<string, number>,
): Record<string, number> | undefined {
  if (!shares) return undefined;
  const vals = splitAmongIds.map((id) => shares[id] ?? 1);
  if (vals.length === 0 || vals.every((w) => w === vals[0])) return undefined;
  return Object.fromEntries(splitAmongIds.map((id) => [id, shares[id] ?? 1]));
}

export class TripSplitStore {
  readonly publicDoc: Y.Doc;
  readonly adminDoc: Y.Doc | null;

  constructor(publicDoc: Y.Doc, adminDoc: Y.Doc | null) {
    this.publicDoc = publicDoc;
    this.adminDoc = adminDoc;
  }

  private readTripMap(): Y.Map<unknown> | null {
    const pub = readTemplateBranch(this.publicDoc, TRIPSPLIT_TEMPLATE_ID);
    return pub ? readNestedMap(pub, "trip") : null;
  }

  private readTravelersMap(): Y.Map<Traveler> | null {
    const pub = readTemplateBranch(this.publicDoc, TRIPSPLIT_TEMPLATE_ID);
    return pub ? readNestedMap<Traveler>(pub, "travelers") : null;
  }

  private readExpensesMap(): Y.Map<Expense> | null {
    const pub = readTemplateBranch(this.publicDoc, TRIPSPLIT_TEMPLATE_ID);
    return pub ? readNestedMap<Expense>(pub, "expenses") : null;
  }

  isInitialized(): boolean {
    const trip = this.readTripMap();
    return typeof trip?.get("name") === "string";
  }

  getTrip(): TripSettings | null {
    const trip = this.readTripMap();
    const name = trip?.get("name");
    if (typeof name !== "string") return null;
    return {
      name,
      currency: (trip?.get("currency") as string) ?? "USD",
      createdAt: (trip?.get("createdAt") as number) ?? Date.now(),
    };
  }

  initTrip(settings: { name: string; currency: string }) {
    this.publicDoc.transact(() => {
      writeRoomMeta(this.publicDoc, {
        templateKind: "builtin",
        templateId: TRIPSPLIT_TEMPLATE_ID,
        roomName: settings.name,
      });
      const pub = ensureTemplateBranch(this.publicDoc, TRIPSPLIT_TEMPLATE_ID);
      const trip = ensureNestedMap(pub, "trip");
      trip.set("name", settings.name.trim());
      trip.set("currency", settings.currency);
      trip.set("createdAt", Date.now());
      ensureNestedMap<Traveler>(pub, "travelers");
      ensureNestedMap<Expense>(pub, "expenses");
    });
  }

  listTravelers(): Traveler[] {
    const travelers = this.readTravelersMap();
    if (!travelers) return [];
    return [...travelers.values()].sort((a, b) => a.joinedAt - b.joinedAt);
  }

  getTraveler(id: string): Traveler | null {
    return this.readTravelersMap()?.get(id) ?? null;
  }

  addTraveler(input: { name: string; color: string; id?: string }): Traveler {
    const traveler: Traveler = {
      id: input.id ?? uid("t_"),
      name: input.name.trim(),
      color: input.color,
      joinedAt: Date.now(),
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, TRIPSPLIT_TEMPLATE_ID);
      const travelers = ensureNestedMap<Traveler>(pub, "travelers");
      travelers.set(traveler.id, traveler);
    });
    return traveler;
  }

  listExpenses(): Expense[] {
    const expenses = this.readExpensesMap();
    if (!expenses) return [];
    return [...expenses.values()].sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date);
      return dateCmp !== 0 ? dateCmp : b.createdAt - a.createdAt;
    });
  }

  addExpense(input: {
    description: string;
    amountCents: number;
    paidById: string;
    splitAmongIds: string[];
    /** Per-traveler weights; omit (or pass equal weights) for a plain equal split. */
    shares?: Record<string, number>;
    date?: string;
    createdById: string;
  }): Expense {
    const expense: Expense = {
      id: uid("e_"),
      description: input.description.trim(),
      amountCents: input.amountCents,
      paidById: input.paidById,
      splitAmongIds: [...input.splitAmongIds],
      date: input.date ?? todayStr(),
      createdAt: Date.now(),
      createdById: input.createdById,
    };
    const shares = normalizeShares(input.splitAmongIds, input.shares);
    if (shares) expense.shares = shares;
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, TRIPSPLIT_TEMPLATE_ID);
      const expenses = ensureNestedMap<Expense>(pub, "expenses");
      expenses.set(expense.id, expense);
    });
    return expense;
  }

  /**
   * Overwrite an existing expense's editable fields (description, amount,
   * payer, split, shares, date). Identity fields — id, createdAt, createdById —
   * are preserved. No-op if the id is unknown.
   */
  updateExpense(
    id: string,
    patch: {
      description: string;
      amountCents: number;
      paidById: string;
      splitAmongIds: string[];
      shares?: Record<string, number>;
      date?: string;
    },
  ): Expense | null {
    const existing = this.readExpensesMap()?.get(id);
    if (!existing) return null;
    const next: Expense = {
      ...existing,
      description: patch.description.trim(),
      amountCents: patch.amountCents,
      paidById: patch.paidById,
      splitAmongIds: [...patch.splitAmongIds],
      date: patch.date ?? existing.date,
    };
    const shares = normalizeShares(patch.splitAmongIds, patch.shares);
    if (shares) next.shares = shares;
    else delete next.shares;
    this.publicDoc.transact(() => {
      const expenses = this.readExpensesMap();
      expenses?.set(id, next);
    });
    return next;
  }

  removeExpense(id: string) {
    this.publicDoc.transact(() => {
      const expenses = this.readExpensesMap();
      expenses?.delete(id);
    });
  }
}
