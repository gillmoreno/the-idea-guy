export interface CrewSettings {
  name: string;
  /** Free-text, e.g. "Every other Friday, loser does dishes". */
  details: string;
  createdAt: number;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  joinedAt: number;
}

export interface Session {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  game: string;
  winnerIds: string[];
  hostId?: string;
  note?: string;
  createdAt: number;
  createdById: string;
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

export interface Standing {
  player: Player;
  wins: number;
  /** Consecutive most-recent sessions won (0 if they lost the latest). */
  streak: number;
}

/** Sessions must be newest-first (as the store returns them). */
export function computeStandings(players: Player[], sessions: Session[]): Standing[] {
  const wins = new Map(players.map((p) => [p.id, 0]));
  for (const s of sessions) {
    for (const id of s.winnerIds) {
      if (wins.has(id)) wins.set(id, (wins.get(id) ?? 0) + 1);
    }
  }
  const streaks = new Map(players.map((p) => [p.id, 0]));
  const stillStreaking = new Set(players.map((p) => p.id));
  for (const s of sessions) {
    const winners = new Set(s.winnerIds);
    for (const id of [...stillStreaking]) {
      if (winners.has(id)) streaks.set(id, (streaks.get(id) ?? 0) + 1);
      else stillStreaking.delete(id);
    }
    if (stillStreaking.size === 0) break;
  }
  return players
    .map((player) => ({
      player,
      wins: wins.get(player.id) ?? 0,
      streak: streaks.get(player.id) ?? 0,
    }))
    .sort((a, b) => b.wins - a.wins || b.streak - a.streak || a.player.joinedAt - b.player.joinedAt);
}
