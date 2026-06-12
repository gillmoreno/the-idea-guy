import { Y } from "@the-idea-guy/room-kit";
import {
  ensureNestedMap,
  ensureTemplateBranch,
  readNestedMap,
  readTemplateBranch,
} from "@/lib/yjsTemplate";
import { writeRoomMeta } from "@/shell/roomMeta";
import type { Game, PadSettings, Player, Round } from "./types";

export const SCOREPAD_TEMPLATE_ID = "scorepad";

export function uid(prefix = ""): string {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export class ScorePadStore {
  readonly publicDoc: Y.Doc;
  readonly adminDoc: Y.Doc | null;

  constructor(publicDoc: Y.Doc, adminDoc: Y.Doc | null) {
    this.publicDoc = publicDoc;
    this.adminDoc = adminDoc;
  }

  private readPadMap(): Y.Map<unknown> | null {
    const pub = readTemplateBranch(this.publicDoc, SCOREPAD_TEMPLATE_ID);
    return pub ? readNestedMap(pub, "pad") : null;
  }

  private readPlayersMap(): Y.Map<Player> | null {
    const pub = readTemplateBranch(this.publicDoc, SCOREPAD_TEMPLATE_ID);
    return pub ? readNestedMap<Player>(pub, "players") : null;
  }

  private readGamesMap(): Y.Map<Game> | null {
    const pub = readTemplateBranch(this.publicDoc, SCOREPAD_TEMPLATE_ID);
    return pub ? readNestedMap<Game>(pub, "games") : null;
  }

  private readRoundsMap(): Y.Map<Round> | null {
    const pub = readTemplateBranch(this.publicDoc, SCOREPAD_TEMPLATE_ID);
    return pub ? readNestedMap<Round>(pub, "rounds") : null;
  }

  isInitialized(): boolean {
    const pad = this.readPadMap();
    return typeof pad?.get("name") === "string";
  }

  getPad(): PadSettings | null {
    const pad = this.readPadMap();
    const name = pad?.get("name");
    if (typeof name !== "string") return null;
    return {
      name,
      game: (pad?.get("game") as string) ?? "",
      createdAt: (pad?.get("createdAt") as number) ?? Date.now(),
    };
  }

  initPad(settings: { name: string; game: string }) {
    this.publicDoc.transact(() => {
      writeRoomMeta(this.publicDoc, {
        templateKind: "builtin",
        templateId: SCOREPAD_TEMPLATE_ID,
        roomName: settings.name,
      });
      const pub = ensureTemplateBranch(this.publicDoc, SCOREPAD_TEMPLATE_ID);
      const pad = ensureNestedMap(pub, "pad");
      pad.set("name", settings.name.trim());
      pad.set("game", settings.game.trim());
      pad.set("createdAt", Date.now());
      ensureNestedMap<Player>(pub, "players");
      ensureNestedMap<Game>(pub, "games");
      ensureNestedMap<Round>(pub, "rounds");
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
      id: input.id ?? uid("sp_"),
      name: input.name.trim(),
      color: input.color,
      joinedAt: Date.now(),
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, SCOREPAD_TEMPLATE_ID);
      const players = ensureNestedMap<Player>(pub, "players");
      players.set(player.id, player);
    });
    return player;
  }

  /** All games, newest first. */
  listGames(): Game[] {
    const games = this.readGamesMap();
    if (!games) return [];
    return [...games.values()].sort((a, b) => b.startedAt - a.startedAt);
  }

  currentGame(): Game | null {
    const newest = this.listGames()[0] ?? null;
    return newest && !newest.endedAt ? newest : null;
  }

  startGame(input: {
    title: string;
    playerIds: string[];
    lowWins: boolean;
    startedById: string;
  }): Game {
    const game: Game = {
      id: uid("g_"),
      title: input.title.trim() || "Game",
      playerIds: [...input.playerIds],
      lowWins: input.lowWins,
      startedAt: Date.now(),
      startedById: input.startedById,
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, SCOREPAD_TEMPLATE_ID);
      const games = ensureNestedMap<Game>(pub, "games");
      games.set(game.id, game);
    });
    return game;
  }

  endGame(id: string) {
    const game = this.readGamesMap()?.get(id);
    if (!game || game.endedAt) return;
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, SCOREPAD_TEMPLATE_ID);
      const games = ensureNestedMap<Game>(pub, "games");
      games.set(id, { ...game, endedAt: Date.now() });
    });
  }

  /** Rounds for a game, oldest first (round 1 = index 0). */
  listRounds(gameId: string): Round[] {
    const rounds = this.readRoundsMap();
    if (!rounds) return [];
    return [...rounds.values()]
      .filter((r) => r.gameId === gameId)
      .sort((a, b) => a.at - b.at);
  }

  addRound(input: { gameId: string; points: Record<string, number>; byId: string }): Round {
    const round: Round = {
      id: uid("r_"),
      gameId: input.gameId,
      points: { ...input.points },
      at: Date.now(),
      byId: input.byId,
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, SCOREPAD_TEMPLATE_ID);
      const rounds = ensureNestedMap<Round>(pub, "rounds");
      rounds.set(round.id, round);
    });
    return round;
  }

  removeRound(id: string) {
    this.publicDoc.transact(() => {
      this.readRoundsMap()?.delete(id);
    });
  }
}
