import { Y } from "@the-idea-guy/room-kit";
import {
  ensureNestedMap,
  ensureTemplateBranch,
  readNestedMap,
  readTemplateBranch,
} from "@/lib/yjsTemplate";
import { writeRoomMeta } from "@/shell/roomMeta";
import type { ArenaSettings, Player, Tournament } from "./types";

export const BRACKET_TEMPLATE_ID = "bracket";

export function uid(prefix = ""): string {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export class BracketStore {
  readonly publicDoc: Y.Doc;
  readonly adminDoc: Y.Doc | null;

  constructor(publicDoc: Y.Doc, adminDoc: Y.Doc | null) {
    this.publicDoc = publicDoc;
    this.adminDoc = adminDoc;
  }

  private readArenaMap(): Y.Map<unknown> | null {
    const pub = readTemplateBranch(this.publicDoc, BRACKET_TEMPLATE_ID);
    return pub ? readNestedMap(pub, "arena") : null;
  }

  private readPlayersMap(): Y.Map<Player> | null {
    const pub = readTemplateBranch(this.publicDoc, BRACKET_TEMPLATE_ID);
    return pub ? readNestedMap<Player>(pub, "players") : null;
  }

  private readTournamentsMap(): Y.Map<Tournament> | null {
    const pub = readTemplateBranch(this.publicDoc, BRACKET_TEMPLATE_ID);
    return pub ? readNestedMap<Tournament>(pub, "tournaments") : null;
  }

  private readResultsMap(): Y.Map<string> | null {
    const pub = readTemplateBranch(this.publicDoc, BRACKET_TEMPLATE_ID);
    return pub ? readNestedMap<string>(pub, "results") : null;
  }

  isInitialized(): boolean {
    const arena = this.readArenaMap();
    return typeof arena?.get("name") === "string";
  }

  getArena(): ArenaSettings | null {
    const arena = this.readArenaMap();
    const name = arena?.get("name");
    if (typeof name !== "string") return null;
    return {
      name,
      game: (arena?.get("game") as string) ?? "",
      createdAt: (arena?.get("createdAt") as number) ?? Date.now(),
    };
  }

  initArena(settings: { name: string; game: string }) {
    this.publicDoc.transact(() => {
      writeRoomMeta(this.publicDoc, {
        templateKind: "builtin",
        templateId: BRACKET_TEMPLATE_ID,
        roomName: settings.name,
      });
      const pub = ensureTemplateBranch(this.publicDoc, BRACKET_TEMPLATE_ID);
      const arena = ensureNestedMap(pub, "arena");
      arena.set("name", settings.name.trim());
      arena.set("game", settings.game.trim());
      arena.set("createdAt", Date.now());
      ensureNestedMap<Player>(pub, "players");
      ensureNestedMap<Tournament>(pub, "tournaments");
      ensureNestedMap<string>(pub, "results");
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
      id: input.id ?? uid("bp_"),
      name: input.name.trim(),
      color: input.color,
      joinedAt: Date.now(),
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, BRACKET_TEMPLATE_ID);
      const players = ensureNestedMap<Player>(pub, "players");
      players.set(player.id, player);
    });
    return player;
  }

  /** All tournaments, newest first. */
  listTournaments(): Tournament[] {
    const tournaments = this.readTournamentsMap();
    if (!tournaments) return [];
    return [...tournaments.values()].sort((a, b) => b.createdAt - a.createdAt);
  }

  currentTournament(): Tournament | null {
    return this.listTournaments()[0] ?? null;
  }

  startTournament(input: { playerIds: string[]; startedById: string }): Tournament {
    const tournament: Tournament = {
      id: uid("t_"),
      playerIds: [...input.playerIds],
      createdAt: Date.now(),
      startedById: input.startedById,
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, BRACKET_TEMPLATE_ID);
      const tournaments = ensureNestedMap<Tournament>(pub, "tournaments");
      tournaments.set(tournament.id, tournament);
    });
    return tournament;
  }

  /** Winner reported for a match; pass null to clear. */
  reportResult(tournamentId: string, matchKey: string, winnerId: string | null) {
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, BRACKET_TEMPLATE_ID);
      const results = ensureNestedMap<string>(pub, "results");
      const key = `${tournamentId}:${matchKey}`;
      if (winnerId === null) results.delete(key);
      else results.set(key, winnerId);
    });
  }

  resultLookup(tournamentId: string): (matchKey: string) => string | undefined {
    const results = this.readResultsMap();
    return (key: string) => results?.get(`${tournamentId}:${key}`);
  }
}
