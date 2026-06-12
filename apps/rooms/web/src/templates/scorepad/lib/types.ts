export interface PadSettings {
  name: string;
  /** What you usually play — free text, shown in the topbar. */
  game: string;
  createdAt: number;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  joinedAt: number;
}

export interface Game {
  id: string;
  title: string;
  /** Locked at start; scores are entered for exactly these players. */
  playerIds: string[];
  /** true = lowest total wins (hearts, golf). */
  lowWins: boolean;
  startedAt: number;
  startedById: string;
  /** Set when the table calls it a night. */
  endedAt?: number;
}

export interface Round {
  id: string;
  gameId: string;
  /** Points per player id for this round (missing id = 0). */
  points: Record<string, number>;
  at: number;
  byId: string;
}

export const PLAYER_COLORS = [
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#ef4444",
  "#84cc16",
];

export function gameTotals(game: Game, rounds: Round[]): Map<string, number> {
  const totals = new Map(game.playerIds.map((id) => [id, 0]));
  for (const round of rounds) {
    if (round.gameId !== game.id) continue;
    for (const [playerId, points] of Object.entries(round.points)) {
      if (totals.has(playerId)) {
        totals.set(playerId, (totals.get(playerId) ?? 0) + points);
      }
    }
  }
  return totals;
}

/** Leader(s) under the game's win direction; ties return multiple ids. */
export function gameLeaders(game: Game, rounds: Round[]): string[] {
  const totals = gameTotals(game, rounds);
  if (totals.size === 0) return [];
  const values = [...totals.values()];
  const best = game.lowWins ? Math.min(...values) : Math.max(...values);
  return game.playerIds.filter((id) => (totals.get(id) ?? 0) === best);
}
