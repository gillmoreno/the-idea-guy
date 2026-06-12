import { Y } from "@the-idea-guy/room-kit";
import {
  ensureNestedMap,
  ensureTemplateBranch,
  readNestedMap,
  readTemplateBranch,
} from "@/lib/yjsTemplate";
import { writeRoomMeta } from "@/shell/roomMeta";
import type {
  ExpenseSplit,
  HubSettings,
  KidExpense,
  MoneyConfig,
  MonthSettlement,
  Parent,
  Stay,
  Update,
} from "./types";

export const COPARENT_TEMPLATE_ID = "coparent";

export function uid(prefix = ""): string {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function todayStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export class CoParentStore {
  readonly publicDoc: Y.Doc;
  readonly adminDoc: Y.Doc | null;

  constructor(publicDoc: Y.Doc, adminDoc: Y.Doc | null) {
    this.publicDoc = publicDoc;
    this.adminDoc = adminDoc;
  }

  private readHubMap(): Y.Map<unknown> | null {
    const pub = readTemplateBranch(this.publicDoc, COPARENT_TEMPLATE_ID);
    return pub ? readNestedMap(pub, "hub") : null;
  }

  private readParentsMap(): Y.Map<Parent> | null {
    const pub = readTemplateBranch(this.publicDoc, COPARENT_TEMPLATE_ID);
    return pub ? readNestedMap<Parent>(pub, "parents") : null;
  }

  private readStaysMap(): Y.Map<Stay> | null {
    const pub = readTemplateBranch(this.publicDoc, COPARENT_TEMPLATE_ID);
    return pub ? readNestedMap<Stay>(pub, "stays") : null;
  }

  private readUpdatesMap(): Y.Map<Update> | null {
    const pub = readTemplateBranch(this.publicDoc, COPARENT_TEMPLATE_ID);
    return pub ? readNestedMap<Update>(pub, "updates") : null;
  }

  private readExpensesMap(): Y.Map<KidExpense> | null {
    const pub = readTemplateBranch(this.publicDoc, COPARENT_TEMPLATE_ID);
    return pub ? readNestedMap<KidExpense>(pub, "expenses") : null;
  }

  private readSettlementsMap(): Y.Map<MonthSettlement> | null {
    const pub = readTemplateBranch(this.publicDoc, COPARENT_TEMPLATE_ID);
    return pub ? readNestedMap<MonthSettlement>(pub, "settlements") : null;
  }

  isInitialized(): boolean {
    const hub = this.readHubMap();
    return typeof hub?.get("kidsLabel") === "string";
  }

  getHub(): HubSettings | null {
    const hub = this.readHubMap();
    const kidsLabel = hub?.get("kidsLabel");
    if (typeof kidsLabel !== "string") return null;
    return {
      kidsLabel,
      notes: (hub?.get("notes") as string) ?? "",
      createdAt: (hub?.get("createdAt") as number) ?? Date.now(),
    };
  }

  initHub(settings: { kidsLabel: string; notes: string }) {
    this.publicDoc.transact(() => {
      writeRoomMeta(this.publicDoc, {
        templateKind: "builtin",
        templateId: COPARENT_TEMPLATE_ID,
        roomName: `${settings.kidsLabel.trim()} · co-parenting`,
      });
      const pub = ensureTemplateBranch(this.publicDoc, COPARENT_TEMPLATE_ID);
      const hub = ensureNestedMap(pub, "hub");
      hub.set("kidsLabel", settings.kidsLabel.trim());
      hub.set("notes", settings.notes.trim());
      hub.set("createdAt", Date.now());
      ensureNestedMap<Parent>(pub, "parents");
      ensureNestedMap<Stay>(pub, "stays");
      ensureNestedMap<Update>(pub, "updates");
      ensureNestedMap<KidExpense>(pub, "expenses");
      ensureNestedMap<MonthSettlement>(pub, "settlements");
    });
  }

  listParents(): Parent[] {
    const parents = this.readParentsMap();
    if (!parents) return [];
    return [...parents.values()].sort((a, b) => a.joinedAt - b.joinedAt);
  }

  getParent(id: string): Parent | null {
    return this.readParentsMap()?.get(id) ?? null;
  }

  addParent(input: { name: string; color: string; id?: string }): Parent {
    const parent: Parent = {
      id: input.id ?? uid("pp_"),
      name: input.name.trim(),
      color: input.color,
      joinedAt: Date.now(),
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, COPARENT_TEMPLATE_ID);
      const parents = ensureNestedMap<Parent>(pub, "parents");
      parents.set(parent.id, parent);
    });
    return parent;
  }

  /** All stays sorted by start date ascending. */
  listStays(): Stay[] {
    const stays = this.readStaysMap();
    if (!stays) return [];
    return [...stays.values()].sort((a, b) => {
      const startCmp = a.start.localeCompare(b.start);
      return startCmp !== 0 ? startCmp : a.createdAt - b.createdAt;
    });
  }

  addStay(input: { start: string; end: string; parentId: string; note?: string }): Stay {
    const stay: Stay = {
      id: uid("st_"),
      start: input.start,
      end: input.end,
      parentId: input.parentId,
      note: input.note?.trim() || undefined,
      createdAt: Date.now(),
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, COPARENT_TEMPLATE_ID);
      const stays = ensureNestedMap<Stay>(pub, "stays");
      stays.set(stay.id, stay);
    });
    return stay;
  }

  removeStay(id: string) {
    this.publicDoc.transact(() => {
      this.readStaysMap()?.delete(id);
    });
  }

  /** All updates, newest first. */
  listUpdates(): Update[] {
    const updates = this.readUpdatesMap();
    if (!updates) return [];
    return [...updates.values()].sort((a, b) => b.at - a.at);
  }

  addUpdate(input: { text: string; byId: string }): Update {
    const update: Update = {
      id: uid("u_"),
      text: input.text.trim(),
      at: Date.now(),
      byId: input.byId,
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, COPARENT_TEMPLATE_ID);
      const updates = ensureNestedMap<Update>(pub, "updates");
      updates.set(update.id, update);
    });
    return update;
  }

  removeUpdate(id: string) {
    this.publicDoc.transact(() => {
      this.readUpdatesMap()?.delete(id);
    });
  }

  /** Money config lives on the hub map; defaults to no support, EUR. */
  getMoneyConfig(): MoneyConfig {
    const hub = this.readHubMap();
    return {
      currency: (hub?.get("moneyCurrency") as string) ?? "EUR",
      supportCents: (hub?.get("supportCents") as number) ?? 0,
      supportFromId: (hub?.get("supportFromId") as string) ?? "",
      supportToId: (hub?.get("supportToId") as string) ?? "",
    };
  }

  setMoneyConfig(config: MoneyConfig) {
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, COPARENT_TEMPLATE_ID);
      const hub = ensureNestedMap(pub, "hub");
      hub.set("moneyCurrency", config.currency);
      hub.set("supportCents", config.supportCents);
      hub.set("supportFromId", config.supportFromId);
      hub.set("supportToId", config.supportToId);
    });
  }

  /** All expenses, newest date first. */
  listExpenses(): KidExpense[] {
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
    split: ExpenseSplit;
    date?: string;
  }): KidExpense {
    const expense: KidExpense = {
      id: uid("ke_"),
      description: input.description.trim(),
      amountCents: input.amountCents,
      paidById: input.paidById,
      split: input.split,
      date: input.date ?? todayStr(),
      createdAt: Date.now(),
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, COPARENT_TEMPLATE_ID);
      const expenses = ensureNestedMap<KidExpense>(pub, "expenses");
      expenses.set(expense.id, expense);
    });
    return expense;
  }

  removeExpense(id: string) {
    this.publicDoc.transact(() => {
      this.readExpensesMap()?.delete(id);
    });
  }

  getSettlement(monthKey: string): MonthSettlement | null {
    return this.readSettlementsMap()?.get(monthKey) ?? null;
  }

  settleMonth(input: {
    monthKey: string;
    amountCents: number;
    fromId: string;
    toId: string;
    byId: string;
  }) {
    const settlement: MonthSettlement = {
      monthKey: input.monthKey,
      amountCents: input.amountCents,
      fromId: input.fromId,
      toId: input.toId,
      at: Date.now(),
      byId: input.byId,
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, COPARENT_TEMPLATE_ID);
      const settlements = ensureNestedMap<MonthSettlement>(pub, "settlements");
      settlements.set(settlement.monthKey, settlement);
    });
  }

  unsettleMonth(monthKey: string) {
    this.publicDoc.transact(() => {
      this.readSettlementsMap()?.delete(monthKey);
    });
  }
}
