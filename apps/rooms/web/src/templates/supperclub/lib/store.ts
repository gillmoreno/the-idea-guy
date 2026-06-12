import { Y, isYMap } from "@the-idea-guy/room-kit";
import {
  ensureNestedMap,
  ensureTemplateBranch,
  readNestedMap,
  readTemplateBranch,
} from "@/lib/yjsTemplate";
import { writeRoomMeta } from "@/shell/roomMeta";
import type { ClubSettings, Dinner, Member, ThemeIdea } from "./types";

export const SUPPERCLUB_TEMPLATE_ID = "supperclub";

export function uid(prefix = ""): string {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function todayStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export class SupperClubStore {
  readonly publicDoc: Y.Doc;
  readonly adminDoc: Y.Doc | null;

  constructor(publicDoc: Y.Doc, adminDoc: Y.Doc | null) {
    this.publicDoc = publicDoc;
    this.adminDoc = adminDoc;
  }

  private readClubMap(): Y.Map<unknown> | null {
    const pub = readTemplateBranch(this.publicDoc, SUPPERCLUB_TEMPLATE_ID);
    return pub ? readNestedMap(pub, "club") : null;
  }

  private readMembersMap(): Y.Map<Member> | null {
    const pub = readTemplateBranch(this.publicDoc, SUPPERCLUB_TEMPLATE_ID);
    return pub ? readNestedMap<Member>(pub, "members") : null;
  }

  private readDinnersMap(): Y.Map<Dinner> | null {
    const pub = readTemplateBranch(this.publicDoc, SUPPERCLUB_TEMPLATE_ID);
    return pub ? readNestedMap<Dinner>(pub, "dinners") : null;
  }

  private readThemesMap(): Y.Map<ThemeIdea> | null {
    const pub = readTemplateBranch(this.publicDoc, SUPPERCLUB_TEMPLATE_ID);
    return pub ? readNestedMap<ThemeIdea>(pub, "themes") : null;
  }

  private readVoteBucket(themeId: string): Y.Map<number> | null {
    const pub = readTemplateBranch(this.publicDoc, SUPPERCLUB_TEMPLATE_ID);
    if (!pub) return null;
    const votes = readNestedMap(pub, "themeVotes");
    if (!votes) return null;
    const bucket = votes.get(themeId);
    return isYMap(bucket) ? (bucket as Y.Map<number>) : null;
  }

  isInitialized(): boolean {
    const club = this.readClubMap();
    return typeof club?.get("name") === "string";
  }

  getClub(): ClubSettings | null {
    const club = this.readClubMap();
    const name = club?.get("name");
    if (typeof name !== "string") return null;
    return {
      name,
      details: (club?.get("details") as string) ?? "",
      createdAt: (club?.get("createdAt") as number) ?? Date.now(),
    };
  }

  initClub(settings: { name: string; details: string }) {
    this.publicDoc.transact(() => {
      writeRoomMeta(this.publicDoc, {
        templateKind: "builtin",
        templateId: SUPPERCLUB_TEMPLATE_ID,
        roomName: settings.name,
      });
      const pub = ensureTemplateBranch(this.publicDoc, SUPPERCLUB_TEMPLATE_ID);
      const club = ensureNestedMap(pub, "club");
      club.set("name", settings.name.trim());
      club.set("details", settings.details.trim());
      club.set("createdAt", Date.now());
      ensureNestedMap<Member>(pub, "members");
      ensureNestedMap<Dinner>(pub, "dinners");
      ensureNestedMap<ThemeIdea>(pub, "themes");
      ensureNestedMap(pub, "themeVotes");
    });
  }

  listMembers(): Member[] {
    const members = this.readMembersMap();
    if (!members) return [];
    return [...members.values()].sort((a, b) => a.joinedAt - b.joinedAt);
  }

  getMember(id: string): Member | null {
    return this.readMembersMap()?.get(id) ?? null;
  }

  addMember(input: { name: string; color: string; id?: string }): Member {
    const member: Member = {
      id: input.id ?? uid("mb_"),
      name: input.name.trim(),
      color: input.color,
      joinedAt: Date.now(),
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, SUPPERCLUB_TEMPLATE_ID);
      const members = ensureNestedMap<Member>(pub, "members");
      members.set(member.id, member);
    });
    return member;
  }

  /** All dinners, newest date first. */
  listDinners(): Dinner[] {
    const dinners = this.readDinnersMap();
    if (!dinners) return [];
    return [...dinners.values()].sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date);
      return dateCmp !== 0 ? dateCmp : b.createdAt - a.createdAt;
    });
  }

  logDinner(input: {
    date?: string;
    hostId: string;
    theme?: string;
    note?: string;
    loggedById: string;
  }): Dinner {
    const dinner: Dinner = {
      id: uid("dn_"),
      date: input.date ?? todayStr(),
      hostId: input.hostId,
      theme: input.theme?.trim() || undefined,
      note: input.note?.trim() || undefined,
      createdAt: Date.now(),
      loggedById: input.loggedById,
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, SUPPERCLUB_TEMPLATE_ID);
      const dinners = ensureNestedMap<Dinner>(pub, "dinners");
      dinners.set(dinner.id, dinner);
    });
    return dinner;
  }

  removeDinner(id: string) {
    this.publicDoc.transact(() => {
      this.readDinnersMap()?.delete(id);
    });
  }

  listThemes(): ThemeIdea[] {
    const themes = this.readThemesMap();
    if (!themes) return [];
    return [...themes.values()].sort(
      (a, b) =>
        this.themeVoteCount(b.id) - this.themeVoteCount(a.id) || b.createdAt - a.createdAt,
    );
  }

  addTheme(input: { title: string; byId: string }): ThemeIdea {
    const theme: ThemeIdea = {
      id: uid("th_"),
      title: input.title.trim(),
      byId: input.byId,
      createdAt: Date.now(),
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, SUPPERCLUB_TEMPLATE_ID);
      const themes = ensureNestedMap<ThemeIdea>(pub, "themes");
      themes.set(theme.id, theme);
    });
    return theme;
  }

  removeTheme(id: string) {
    this.publicDoc.transact(() => {
      this.readThemesMap()?.delete(id);
    });
  }

  themeVoteCount(themeId: string): number {
    return this.readVoteBucket(themeId)?.size ?? 0;
  }

  hasVotedTheme(themeId: string, memberId: string): boolean {
    return this.readVoteBucket(themeId)?.has(memberId) ?? false;
  }

  toggleThemeVote(themeId: string, memberId: string) {
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, SUPPERCLUB_TEMPLATE_ID);
      const votes = ensureNestedMap(pub, "themeVotes");
      let bucket = votes.get(themeId);
      if (!isYMap(bucket)) {
        bucket = new Y.Map();
        votes.set(themeId, bucket);
      }
      const b = bucket as Y.Map<number>;
      if (b.has(memberId)) b.delete(memberId);
      else b.set(memberId, Date.now());
    });
  }
}
