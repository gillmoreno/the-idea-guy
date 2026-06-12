import { Y } from "@the-idea-guy/room-kit";
import {
  ensureNestedMap,
  ensureTemplateBranch,
  readNestedMap,
  readTemplateBranch,
} from "@/lib/yjsTemplate";
import { writeRoomMeta } from "@/shell/roomMeta";
import type { Contribution, FundSettings, Saver } from "./types";

export const GROUPFUND_TEMPLATE_ID = "groupfund";

export function uid(prefix = ""): string {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export class GroupFundStore {
  readonly publicDoc: Y.Doc;
  readonly adminDoc: Y.Doc | null;

  constructor(publicDoc: Y.Doc, adminDoc: Y.Doc | null) {
    this.publicDoc = publicDoc;
    this.adminDoc = adminDoc;
  }

  private readFundMap(): Y.Map<unknown> | null {
    const pub = readTemplateBranch(this.publicDoc, GROUPFUND_TEMPLATE_ID);
    return pub ? readNestedMap(pub, "fund") : null;
  }

  private readSaversMap(): Y.Map<Saver> | null {
    const pub = readTemplateBranch(this.publicDoc, GROUPFUND_TEMPLATE_ID);
    return pub ? readNestedMap<Saver>(pub, "savers") : null;
  }

  private readContributionsMap(): Y.Map<Contribution> | null {
    const pub = readTemplateBranch(this.publicDoc, GROUPFUND_TEMPLATE_ID);
    return pub ? readNestedMap<Contribution>(pub, "contributions") : null;
  }

  isInitialized(): boolean {
    const fund = this.readFundMap();
    return typeof fund?.get("name") === "string";
  }

  getFund(): FundSettings | null {
    const fund = this.readFundMap();
    const name = fund?.get("name");
    if (typeof name !== "string") return null;
    return {
      name,
      details: (fund?.get("details") as string) ?? "",
      targetCents: (fund?.get("targetCents") as number) ?? 0,
      currency: (fund?.get("currency") as string) ?? "EUR",
      createdAt: (fund?.get("createdAt") as number) ?? Date.now(),
    };
  }

  initFund(settings: { name: string; details: string; targetCents: number; currency: string }) {
    this.publicDoc.transact(() => {
      writeRoomMeta(this.publicDoc, {
        templateKind: "builtin",
        templateId: GROUPFUND_TEMPLATE_ID,
        roomName: settings.name,
      });
      const pub = ensureTemplateBranch(this.publicDoc, GROUPFUND_TEMPLATE_ID);
      const fund = ensureNestedMap(pub, "fund");
      fund.set("name", settings.name.trim());
      fund.set("details", settings.details.trim());
      fund.set("targetCents", settings.targetCents);
      fund.set("currency", settings.currency);
      fund.set("createdAt", Date.now());
      ensureNestedMap<Saver>(pub, "savers");
      ensureNestedMap<Contribution>(pub, "contributions");
    });
  }

  listSavers(): Saver[] {
    const savers = this.readSaversMap();
    if (!savers) return [];
    return [...savers.values()].sort((a, b) => a.joinedAt - b.joinedAt);
  }

  getSaver(id: string): Saver | null {
    return this.readSaversMap()?.get(id) ?? null;
  }

  addSaver(input: { name: string; color: string; id?: string }): Saver {
    const saver: Saver = {
      id: input.id ?? uid("sv_"),
      name: input.name.trim(),
      color: input.color,
      joinedAt: Date.now(),
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, GROUPFUND_TEMPLATE_ID);
      const savers = ensureNestedMap<Saver>(pub, "savers");
      savers.set(saver.id, saver);
    });
    return saver;
  }

  /** All contributions, newest first. */
  listContributions(): Contribution[] {
    const contributions = this.readContributionsMap();
    if (!contributions) return [];
    return [...contributions.values()].sort((a, b) => b.at - a.at);
  }

  addContribution(input: { amountCents: number; byId: string; note?: string }): Contribution {
    const contribution: Contribution = {
      id: uid("ct_"),
      amountCents: input.amountCents,
      byId: input.byId,
      note: input.note?.trim() || undefined,
      at: Date.now(),
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, GROUPFUND_TEMPLATE_ID);
      const contributions = ensureNestedMap<Contribution>(pub, "contributions");
      contributions.set(contribution.id, contribution);
    });
    return contribution;
  }

  removeContribution(id: string) {
    this.publicDoc.transact(() => {
      this.readContributionsMap()?.delete(id);
    });
  }
}
