import { Y } from "@the-idea-guy/room-kit";
import {
  ensureNestedMap,
  ensureTemplateBranch,
  readNestedMap,
  readTemplateBranch,
} from "@/lib/yjsTemplate";
import { writeRoomMeta } from "@/shell/roomMeta";
import {
  Chore,
  ChoreFrequencyLimit,
  ChoreProposal,
  Completion,
  Difficulty,
  Family,
  KidPermissions,
  Member,
  Payment,
  Recurrence,
  Role,
  Category,
} from "./types";
import { canMarkChoreDone, DEFAULT_FREQUENCY_LIMIT } from "./frequency";
import { DEFAULT_KID_PERMISSIONS, mergePermissions } from "./permissions";
import {
  completionSignPayload,
  signCompletion,
  verifyCompletionSignature,
} from "@the-idea-guy/room-kit";

export const CHOREBOARD_TEMPLATE_ID = "choreboard";

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
 * ChoreStore — split sync channels:
 * - **public** (family code): members, published catalog, completions, kid proposals
 * - **admin** (family + parent secret): settings, full chores, payments
 */
export class ChoreStore {
  readonly publicDoc: Y.Doc;
  readonly adminDoc: Y.Doc | null;
  readonly canAdmin: boolean;

  private family: Y.Map<unknown> | null = null;
  private members: Y.Map<Member> | null = null;
  private catalog: Y.Map<Chore> | null = null;
  private completions: Y.Map<Completion> | null = null;
  private proposals: Y.Map<ChoreProposal> | null = null;
  private permDefaults: Y.Map<unknown> | null = null;
  private permOverrides: Y.Map<Partial<KidPermissions>> | null = null;

  private adminFamily: Y.Map<unknown> | null = null;
  private adminPermDefaults: Y.Map<unknown> | null = null;
  private adminPermOverrides: Y.Map<Partial<KidPermissions>> | null = null;
  private chores: Y.Map<Chore> | null = null;
  private payments: Y.Map<Payment> | null = null;

  constructor(publicDoc: Y.Doc, adminDoc: Y.Doc | null) {
    this.publicDoc = publicDoc;
    this.adminDoc = adminDoc;
    this.canAdmin = adminDoc != null;
    this.bindPublicRefs();
    this.bindAdminRefs();
  }

  private bindPublicRefs() {
    const pub = readTemplateBranch(this.publicDoc, CHOREBOARD_TEMPLATE_ID);
    if (!pub) {
      this.family = null;
      this.members = null;
      this.catalog = null;
      this.completions = null;
      this.proposals = null;
      this.permDefaults = null;
      this.permOverrides = null;
      return;
    }
    this.family = readNestedMap(pub, "family");
    this.members = readNestedMap<Member>(pub, "members");
    this.catalog = readNestedMap<Chore>(pub, "catalog");
    this.completions = readNestedMap<Completion>(pub, "completions");
    this.proposals = readNestedMap<ChoreProposal>(pub, "proposals");
    this.permDefaults = readNestedMap(pub, "permDefaults");
    this.permOverrides = readNestedMap<Partial<KidPermissions>>(pub, "permOverrides");
  }

  private bindAdminRefs() {
    if (!this.adminDoc) {
      this.adminFamily = null;
      this.chores = null;
      this.payments = null;
      this.adminPermDefaults = null;
      this.adminPermOverrides = null;
      return;
    }
    const adm = readTemplateBranch(this.adminDoc, CHOREBOARD_TEMPLATE_ID);
    if (!adm) {
      this.adminFamily = null;
      this.chores = null;
      this.payments = null;
      this.adminPermDefaults = null;
      this.adminPermOverrides = null;
      return;
    }
    this.adminFamily = readNestedMap(adm, "family");
    this.chores = readNestedMap<Chore>(adm, "chores");
    this.payments = readNestedMap<Payment>(adm, "payments");
    this.adminPermDefaults = readNestedMap(adm, "permDefaults");
    this.adminPermOverrides = readNestedMap<Partial<KidPermissions>>(adm, "permOverrides");
  }

  private ensurePublicRefs() {
    const pub = ensureTemplateBranch(this.publicDoc, CHOREBOARD_TEMPLATE_ID);
    this.family = ensureNestedMap(pub, "family");
    this.members = ensureNestedMap<Member>(pub, "members");
    this.catalog = ensureNestedMap<Chore>(pub, "catalog");
    this.completions = ensureNestedMap<Completion>(pub, "completions");
    this.proposals = ensureNestedMap<ChoreProposal>(pub, "proposals");
    this.permDefaults = ensureNestedMap(pub, "permDefaults");
    this.permOverrides = ensureNestedMap<Partial<KidPermissions>>(pub, "permOverrides");
  }

  private ensureAdminRefs() {
    if (!this.adminDoc) return;
    const adm = ensureTemplateBranch(this.adminDoc, CHOREBOARD_TEMPLATE_ID);
    this.adminFamily = ensureNestedMap(adm, "family");
    this.chores = ensureNestedMap<Chore>(adm, "chores");
    this.payments = ensureNestedMap<Payment>(adm, "payments");
    this.adminPermDefaults = ensureNestedMap(adm, "permDefaults");
    this.adminPermOverrides = ensureNestedMap<Partial<KidPermissions>>(adm, "permOverrides");
  }

  private txPublic(fn: () => void) {
    this.publicDoc.transact(() => {
      this.ensurePublicRefs();
      fn();
    });
  }

  private txAdmin(fn: () => void) {
    if (!this.adminDoc) return;
    this.adminDoc.transact(() => {
      this.ensureAdminRefs();
      fn();
    });
  }

  // --- family ---
  isInitialized(): boolean {
    return this.family?.get("createdAt") != null;
  }

  getFamily(): Family | null {
    if (!this.isInitialized() || !this.family) return null;
    return {
      name: (this.family!.get("name") as string) ?? "Our family",
      currency: (this.family!.get("currency") as string) ?? "USD",
      paydayWeekday: (this.family!.get("paydayWeekday") as number) ?? 0,
      createdAt: this.family!.get("createdAt") as number,
    };
  }

  initFamily(input: { name: string; currency: string; paydayWeekday: number }) {
    const stamp = Date.now();
    this.setKidDefaults(DEFAULT_KID_PERMISSIONS);
    this.txPublic(() => {
      writeRoomMeta(this.publicDoc, {
        templateKind: "builtin",
        templateId: CHOREBOARD_TEMPLATE_ID,
        roomName: input.name,
      });
      this.family!.set("name", input.name);
      this.family!.set("currency", input.currency);
      this.family!.set("paydayWeekday", input.paydayWeekday);
      if (this.family!.get("createdAt") == null) this.family!.set("createdAt", stamp);
    });
    this.txAdmin(() => {
      if (!this.adminFamily) return;
      this.adminFamily.set("name", input.name);
      this.adminFamily.set("currency", input.currency);
      this.adminFamily.set("paydayWeekday", input.paydayWeekday);
      if (this.adminFamily.get("createdAt") == null) this.adminFamily.set("createdAt", stamp);
    });
  }

  updateFamily(patch: Partial<Family>) {
    this.txPublic(() => {
      for (const [k, v] of Object.entries(patch)) this.family!.set(k, v);
    });
    this.txAdmin(() => {
      if (!this.adminFamily) return;
      for (const [k, v] of Object.entries(patch)) this.adminFamily.set(k, v);
    });
  }

  getKidDefaults(): KidPermissions {
    const raw = this.permDefaults!.get("kid") as KidPermissions | undefined;
    return raw ? mergePermissions(DEFAULT_KID_PERMISSIONS, raw) : DEFAULT_KID_PERMISSIONS;
  }

  getKidOverride(memberId: string): Partial<KidPermissions> | undefined {
    return this.permOverrides!.get(memberId);
  }

  setKidDefaults(perms: KidPermissions) {
    this.txAdmin(() => this.adminPermDefaults?.set("kid", perms));
    this.publishPermissions();
  }

  setKidOverride(memberId: string, patch: Partial<KidPermissions>) {
    this.txAdmin(() => {
      if (!this.adminPermOverrides) return;
      const existing = this.adminPermOverrides.get(memberId) ?? {};
      this.adminPermOverrides.set(memberId, { ...existing, ...patch });
    });
    this.publishPermissions();
  }

  clearKidOverride(memberId: string) {
    this.txAdmin(() => this.adminPermOverrides?.delete(memberId));
    this.publishPermissions();
  }

  listKidOverrides(): { memberId: string; patch: Partial<KidPermissions> }[] {
    return [...this.permOverrides!.entries()].map(([memberId, patch]) => ({
      memberId,
      patch,
    }));
  }

  /** Copy permission policy admin → public (parent only). */
  publishPermissions() {
    if (!this.adminPermDefaults || !this.adminPermOverrides) return;
    const kid = this.adminPermDefaults.get("kid") as KidPermissions | undefined;
    const overrides = [...this.adminPermOverrides.entries()];
    this.txPublic(() => {
      if (kid) this.permDefaults!.set("kid", kid);
      for (const id of [...this.permOverrides!.keys()]) this.permOverrides!.delete(id);
      for (const [id, patch] of overrides) this.permOverrides!.set(id, patch);
    });
  }

  /** Copy active chores from admin → public catalog (parent only). */
  publishCatalog() {
    if (!this.chores) return;
    const active = [...this.chores.values()].filter((c) => c.status === "active");
    this.txPublic(() => {
      for (const id of [...this.catalog!.keys()]) this.catalog!.delete(id);
      for (const c of active) this.catalog!.set(c.id, { ...c });
    });
  }

  // --- members (public) ---
  listMembers(): Member[] {
    return [...this.members!.values()].sort((a, b) => a.createdAt - b.createdAt);
  }

  getMember(id: string): Member | undefined {
    return this.members!.get(id);
  }

  addMember(input: { name: string; role: Role; color: string; pin?: string; id?: string }): Member {
    const { id: presetId, ...rest } = input;
    const m: Member = { id: presetId ?? uid("m_"), createdAt: Date.now(), ...rest };
    this.txPublic(() => this.members!.set(m.id, m));
    return m;
  }

  updateMember(id: string, patch: Partial<Member>) {
    const existing = this.members!.get(id);
    if (!existing) return;
    this.txPublic(() => this.members!.set(id, { ...existing, ...patch }));
  }

  removeMember(id: string) {
    this.txPublic(() => this.members!.delete(id));
  }

  // --- chores (admin) / catalog (everyone reads) ---
  listChores(opts?: { status?: Chore["status"] }): Chore[] {
    if (this.canAdmin && this.chores) {
      let list = [...this.chores.values()];
      if (opts?.status) list = list.filter((c) => c.status === opts.status);
      return list.sort((a, b) => a.createdAt - b.createdAt);
    }
    return [...this.catalog!.values()].sort((a, b) => a.createdAt - b.createdAt);
  }

  listProposals(): ChoreProposal[] {
    return [...this.proposals!.values()].sort((a, b) => b.createdAt - a.createdAt);
  }

  getChore(id: string): Chore | undefined {
    return this.catalog!.get(id) ?? this.chores?.get(id);
  }

  addChore(input: {
    title: string;
    description?: string;
    category: Category;
    difficulty: Difficulty;
    reward: number;
    recurrence?: Recurrence;
    frequencyLimit?: ChoreFrequencyLimit;
    requiresApproval: boolean;
  }): Chore | null {
    if (!this.chores) return null;
    const frequencyLimit = input.frequencyLimit ?? DEFAULT_FREQUENCY_LIMIT;
    const c: Chore = {
      id: uid("c_"),
      title: input.title,
      description: input.description ?? "",
      category: input.category,
      difficulty: input.difficulty,
      reward: input.reward,
      recurrence: input.recurrence ?? recurrenceFromLimit(frequencyLimit),
      frequencyLimit,
      requiresApproval: input.requiresApproval,
      status: "active",
      createdAt: Date.now(),
    };
    this.txAdmin(() => this.chores!.set(c.id, c));
    this.publishCatalog();
    return c;
  }

  publishAll() {
    this.publishCatalog();
    this.publishPermissions();
  }

  proposeChore(input: {
    title: string;
    description?: string;
    category: Category;
    difficulty: Difficulty;
    reward: number;
    proposedBy: string;
  }): ChoreProposal {
    const p: ChoreProposal = {
      id: uid("p_"),
      title: input.title,
      description: input.description ?? "",
      category: input.category,
      difficulty: input.difficulty,
      reward: input.reward,
      proposedBy: input.proposedBy,
      createdAt: Date.now(),
    };
    this.txPublic(() => this.proposals!.set(p.id, p));
    return p;
  }

  approveProposal(proposalId: string): Chore | null {
    const p = this.proposals!.get(proposalId);
    if (!p || !this.chores) return null;
    const c = this.addChore({
      title: p.title,
      description: p.description,
      category: p.category,
      difficulty: p.difficulty,
      reward: p.reward,
      frequencyLimit: DEFAULT_FREQUENCY_LIMIT,
      requiresApproval: true,
    });
    this.txPublic(() => this.proposals!.delete(proposalId));
    return c;
  }

  dismissProposal(proposalId: string) {
    this.txPublic(() => this.proposals!.delete(proposalId));
  }

  updateChore(id: string, patch: Partial<Chore> & { frequencyLimit?: ChoreFrequencyLimit }) {
    if (!this.chores) return;
    const existing = this.chores.get(id);
    if (!existing) return;
    const next = { ...existing, ...patch };
    if (patch.frequencyLimit) {
      next.recurrence = recurrenceFromLimit(patch.frequencyLimit);
    }
    this.txAdmin(() => this.chores!.set(id, next));
    this.publishCatalog();
  }

  archiveChore(id: string) {
    this.updateChore(id, { status: "archived" });
  }

  // --- completions (public) ---
  listCompletions(filter?: {
    memberId?: string;
    status?: Completion["status"];
  }): Completion[] {
    let list = [...this.completions!.values()];
    if (filter?.memberId) list = list.filter((c) => c.memberId === filter.memberId);
    if (filter?.status) list = list.filter((c) => c.status === filter.status);
    return list.sort((a, b) => b.createdAt - a.createdAt);
  }

  canMarkDone(choreId: string, memberId: string) {
    const chore = this.catalog!.get(choreId);
    if (!chore) return { ok: false, remaining: 0, used: 0, limit: null as ChoreFrequencyLimit | null };
    return canMarkChoreDone(chore, memberId, [...this.completions!.values()]);
  }

  async markDone(
    choreId: string,
    memberId: string,
    memberSecret: string | null,
  ): Promise<Completion | null> {
    const chore = this.catalog!.get(choreId);
    if (!chore) return null;
    if (!this.canMarkDone(choreId, memberId).ok) return null;
    const comp: Completion = {
      id: uid("k_"),
      choreId,
      label: chore.title,
      memberId,
      date: todayStr(),
      kind: "reward",
      status: chore.requiresApproval ? "pending" : "approved",
      amount: chore.reward,
      approvedBy: chore.requiresApproval ? undefined : "auto",
      createdAt: Date.now(),
    };
    if (memberSecret) {
      comp.sig = await signCompletion(
        memberSecret,
        completionSignPayload(comp),
      );
    }
    this.txPublic(() => this.completions!.set(comp.id, comp));
    return comp;
  }

  async verifyCompletion(
    c: Completion,
    memberSecret: string | null,
  ): Promise<boolean> {
    if (c.kind === "penalty" || c.approvedBy === "auto") return true;
    if (!memberSecret) return !c.sig;
    return verifyCompletionSignature(
      memberSecret,
      completionSignPayload(c),
      c.sig,
    );
  }

  addPenalty(input: { memberId: string; label: string; amount: number; by: string }): Completion | null {
    if (!this.canAdmin) return null;
    const comp: Completion = {
      id: uid("k_"),
      label: input.label,
      memberId: input.memberId,
      date: todayStr(),
      kind: "penalty",
      status: "approved",
      amount: -Math.abs(input.amount),
      approvedBy: input.by,
      createdAt: Date.now(),
    };
    this.txPublic(() => this.completions!.set(comp.id, comp));
    return comp;
  }

  setCompletionStatus(id: string, status: Completion["status"], by?: string) {
    const existing = this.completions!.get(id);
    if (!existing) return;
    this.txPublic(() =>
      this.completions!.set(id, {
        ...existing,
        status,
        approvedBy: by ?? existing.approvedBy,
      }),
    );
  }

  balanceFor(memberId: string): number {
    return this.listCompletions({ memberId })
      .filter((c) => c.status === "approved")
      .reduce((sum, c) => sum + c.amount, 0);
  }

  pendingTotalFor(memberId: string): number {
    return this.listCompletions({ memberId })
      .filter((c) => c.status === "pending")
      .reduce((sum, c) => sum + c.amount, 0);
  }

  earnedInRange(memberId: string, startStr: string, endStr: string): number {
    return this.listCompletions({ memberId })
      .filter(
        (c) =>
          (c.status === "approved" || c.status === "paid") &&
          c.date >= startStr &&
          c.date <= endStr,
      )
      .reduce((sum, c) => sum + c.amount, 0);
  }

  markPaid(memberId: string, by: string): Payment | null {
    if (!this.payments) return null;
    const approved = this.listCompletions({ memberId }).filter((c) => c.status === "approved");
    if (approved.length === 0) return null;
    const total = approved.reduce((sum, c) => sum + c.amount, 0);
    const dates = approved.map((c) => c.date).sort();
    const payment: Payment = {
      id: uid("p_"),
      memberId,
      periodStart: dates[0],
      periodEnd: todayStr(),
      total,
      completionIds: approved.map((c) => c.id),
      paidDate: todayStr(),
      createdAt: Date.now(),
    };
    this.txAdmin(() => this.payments!.set(payment.id, payment));
    this.txPublic(() => {
      for (const c of approved) {
        this.completions!.set(c.id, { ...c, status: "paid" });
      }
    });
    return payment;
  }

  listPayments(memberId?: string): Payment[] {
    if (!this.payments) return [];
    let list = [...this.payments.values()];
    if (memberId) list = list.filter((p) => p.memberId === memberId);
    return list.sort((a, b) => b.createdAt - a.createdAt);
  }

  /** Wipe completions, payments, and proposals — keeps chores, members, and settings. */
  resetHistory(): boolean {
    if (!this.canAdmin) return false;
    this.txPublic(() => {
      for (const id of [...this.completions!.keys()]) this.completions!.delete(id);
      for (const id of [...this.proposals!.keys()]) this.proposals!.delete(id);
    });
    this.txAdmin(() => {
      if (!this.payments) return;
      for (const id of [...this.payments.keys()]) this.payments.delete(id);
    });
    return true;
  }
}

export function recurrenceFromLimit(limit: ChoreFrequencyLimit): Recurrence {
  if (limit.maxCompletions <= 0) return "anytime";
  if (limit.period === "ever") return "one-off";
  if (limit.period === "week" && limit.maxCompletions === 1) return "weekly";
  if (limit.period === "day" && limit.maxCompletions === 1) return "daily";
  return "daily";
}

export function weekRange(d = new Date()): { start: string; end: string } {
  const day = d.getDay();
  const diffToMon = (day + 6) % 7;
  const start = new Date(d);
  start.setDate(d.getDate() - diffToMon);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: todayStr(start), end: todayStr(end) };
}
