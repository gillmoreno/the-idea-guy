import { Y } from "@the-idea-guy/room-kit";
import {
  ensureNestedMap,
  ensureTemplateBranch,
  readNestedMap,
  readTemplateBranch,
} from "@/lib/yjsTemplate";
import { writeRoomMeta } from "@/shell/roomMeta";
import type { CrewSettings, Player, Session } from "./types";

export const GAMENIGHT_TEMPLATE_ID = "gamenight";

export function uid(prefix = ""): string {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function todayStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export class GameNightStore {
  readonly publicDoc: Y.Doc;
  readonly adminDoc: Y.Doc | null;

  constructor(publicDoc: Y.Doc, adminDoc: Y.Doc | null) {
    this.publicDoc = publicDoc;
    this.adminDoc = adminDoc;
  }

  private readCrewMap(): Y.Map<unknown> | null {
    const pub = readTemplateBranch(this.publicDoc, GAMENIGHT_TEMPLATE_ID);
    return pub ? readNestedMap(pub, "crew") : null;
  }

  private readPlayersMap(): Y.Map<Player> | null {
    const pub = readTemplateBranch(this.publicDoc, GAMENIGHT_TEMPLATE_ID);
    return pub ? readNestedMap<Player>(pub, "players") : null;
  }

  private readSessionsMap(): Y.Map<Session> | null {
    const pub = readTemplateBranch(this.publicDoc, GAMENIGHT_TEMPLATE_ID);
    return pub ? readNestedMap<Session>(pub, "sessions") : null;
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
      details: (crew?.get("details") as string) ?? "",
      createdAt: (crew?.get("createdAt") as number) ?? Date.now(),
    };
  }

  initCrew(settings: { name: string; details: string }) {
    this.publicDoc.transact(() => {
      writeRoomMeta(this.publicDoc, {
        templateKind: "builtin",
        templateId: GAMENIGHT_TEMPLATE_ID,
        roomName: settings.name,
      });
      const pub = ensureTemplateBranch(this.publicDoc, GAMENIGHT_TEMPLATE_ID);
      const crew = ensureNestedMap(pub, "crew");
      crew.set("name", settings.name.trim());
      crew.set("details", settings.details.trim());
      crew.set("createdAt", Date.now());
      ensureNestedMap<Player>(pub, "players");
      ensureNestedMap<Session>(pub, "sessions");
    });
  }

  listPlayers(): Player[] {
    const players = this.readPlayersMap();
    if (!players) return [];
    return [...players.values()].sort((a, b) => a.joinedAt - b.joinedAt);
  }

  getPlayer(id: string): Player | null {
    return this.readPlayersMap()?.get(id) ?? null;
  }

  addPlayer(input: { name: string; color: string; id?: string }): Player {
    const player: Player = {
      id: input.id ?? uid("gp_"),
      name: input.name.trim(),
      color: input.color,
      joinedAt: Date.now(),
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, GAMENIGHT_TEMPLATE_ID);
      const players = ensureNestedMap<Player>(pub, "players");
      players.set(player.id, player);
    });
    return player;
  }

  /** All sessions, newest first (by date, then created). */
  listSessions(): Session[] {
    const sessions = this.readSessionsMap();
    if (!sessions) return [];
    return [...sessions.values()].sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date);
      return dateCmp !== 0 ? dateCmp : b.createdAt - a.createdAt;
    });
  }

  addSession(input: {
    date?: string;
    game: string;
    winnerIds: string[];
    hostId?: string;
    note?: string;
    createdById: string;
  }): Session {
    const session: Session = {
      id: uid("gs_"),
      date: input.date ?? todayStr(),
      game: input.game.trim(),
      winnerIds: [...input.winnerIds],
      hostId: input.hostId,
      note: input.note?.trim() || undefined,
      createdAt: Date.now(),
      createdById: input.createdById,
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, GAMENIGHT_TEMPLATE_ID);
      const sessions = ensureNestedMap<Session>(pub, "sessions");
      sessions.set(session.id, session);
    });
    return session;
  }

  removeSession(id: string) {
    this.publicDoc.transact(() => {
      this.readSessionsMap()?.delete(id);
    });
  }
}
