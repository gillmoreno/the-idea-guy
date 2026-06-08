import { Y } from "@the-idea-guy/room-kit";
import {
  ensureNestedMap,
  ensureTemplateBranch,
  readNestedMap,
  readTemplateBranch,
} from "@/lib/yjsTemplate";
import { writeRoomMeta } from "@/shell/roomMeta";
import type { ActivityType, CrewSettings, Member, MemberStats, Prize, WorkoutLog } from "./types";
import { computeStreakStats, localDayKey, startOfWeekMs } from "./streaks";

export const FITCREW_TEMPLATE_ID = "fitcrew";

export function uid(prefix = ""): string {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export class FitCrewStore {
  readonly publicDoc: Y.Doc;
  readonly adminDoc: Y.Doc | null;

  constructor(publicDoc: Y.Doc, adminDoc: Y.Doc | null) {
    this.publicDoc = publicDoc;
    this.adminDoc = adminDoc;
  }

  private branch() {
    return readTemplateBranch(this.publicDoc, FITCREW_TEMPLATE_ID);
  }

  private readCrewMap(): Y.Map<unknown> | null {
    const pub = this.branch();
    return pub ? readNestedMap(pub, "crew") : null;
  }

  private readMembersMap(): Y.Map<Member> | null {
    const pub = this.branch();
    return pub ? readNestedMap<Member>(pub, "members") : null;
  }

  private readLogsMap(): Y.Map<WorkoutLog> | null {
    const pub = this.branch();
    return pub ? readNestedMap<WorkoutLog>(pub, "logs") : null;
  }

  private readPrizesMap(): Y.Map<Prize> | null {
    const pub = this.branch();
    return pub ? readNestedMap<Prize>(pub, "prizes") : null;
  }

  isInitialized(): boolean {
    const crew = this.readCrewMap();
    return typeof crew?.get("name") === "string";
  }

  getCrew(): CrewSettings | null {
    const crew = this.readCrewMap();
    const name = crew?.get("name");
    if (typeof name !== "string") return null;
    return {
      name,
      createdAt: (crew?.get("createdAt") as number) ?? Date.now(),
    };
  }

  initCrew(settings: { name: string }) {
    this.publicDoc.transact(() => {
      writeRoomMeta(this.publicDoc, {
        templateKind: "builtin",
        templateId: FITCREW_TEMPLATE_ID,
        roomName: settings.name,
      });
      const pub = ensureTemplateBranch(this.publicDoc, FITCREW_TEMPLATE_ID);
      const crew = ensureNestedMap(pub, "crew");
      crew.set("name", settings.name.trim());
      crew.set("createdAt", Date.now());
      ensureNestedMap(pub, "members");
      ensureNestedMap(pub, "logs");
      ensureNestedMap(pub, "prizes");
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
      id: input.id ?? uid("m_"),
      name: input.name.trim(),
      color: input.color,
      joinedAt: Date.now(),
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, FITCREW_TEMPLATE_ID);
      const members = ensureNestedMap<Member>(pub, "members");
      members.set(member.id, member);
    });
    return member;
  }

  listLogs(): WorkoutLog[] {
    const logs = this.readLogsMap();
    if (!logs) return [];
    return [...logs.values()].sort((a, b) => b.loggedAt - a.loggedAt);
  }

  addLog(input: {
    memberId: string;
    activity: ActivityType;
    minutes?: number;
    note?: string;
    proofImage?: string;
  }): WorkoutLog {
    const now = Date.now();
    const log: WorkoutLog = {
      id: uid("w_"),
      memberId: input.memberId,
      activity: input.activity,
      minutes: input.minutes,
      note: input.note?.trim() || undefined,
      proofImage: input.proofImage?.trim() || undefined,
      dayKey: localDayKey(now),
      loggedAt: now,
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, FITCREW_TEMPLATE_ID);
      const logs = ensureNestedMap<WorkoutLog>(pub, "logs");
      logs.set(log.id, log);
    });
    return log;
  }

  memberDayKeys(memberId: string): string[] {
    return this.listLogs()
      .filter((l) => l.memberId === memberId)
      .map((l) => l.dayKey);
  }

  getMemberStats(memberId: string): MemberStats {
    const weekStart = startOfWeekMs();
    const logs = this.listLogs().filter((l) => l.memberId === memberId);
    const weeklyCount = logs.filter((l) => l.loggedAt >= weekStart).length;
    const { current, best } = computeStreakStats(logs.map((l) => l.dayKey));
    return { memberId, weeklyCount, currentStreak: current, bestStreak: best };
  }

  leaderboard(): MemberStats[] {
    return this.listMembers()
      .map((m) => this.getMemberStats(m.id))
      .sort((a, b) => {
        if (b.weeklyCount !== a.weeklyCount) return b.weeklyCount - a.weeklyCount;
        if (b.currentStreak !== a.currentStreak) return b.currentStreak - a.currentStreak;
        return b.bestStreak - a.bestStreak;
      });
  }

  listPrizes(): Prize[] {
    const prizes = this.readPrizesMap();
    if (!prizes) return [];
    return [...prizes.values()].sort((a, b) => b.createdAt - a.createdAt);
  }

  addPrize(input: {
    title: string;
    emoji: string;
    description?: string;
    createdById: string;
  }): Prize {
    const prize: Prize = {
      id: uid("p_"),
      title: input.title.trim(),
      emoji: input.emoji.trim() || "🏆",
      description: input.description?.trim() || undefined,
      createdById: input.createdById,
      createdAt: Date.now(),
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, FITCREW_TEMPLATE_ID);
      const prizes = ensureNestedMap<Prize>(pub, "prizes");
      prizes.set(prize.id, prize);
    });
    return prize;
  }

  awardPrize(prizeId: string, memberId: string) {
    const prize = this.readPrizesMap()?.get(prizeId);
    if (!prize) return;
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, FITCREW_TEMPLATE_ID);
      const prizes = ensureNestedMap<Prize>(pub, "prizes");
      prizes.set(prizeId, { ...prize, awardedToId: memberId });
    });
  }
}
