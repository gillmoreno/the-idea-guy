export interface ArenaSettings {
  name: string;
  /** What you play, e.g. "FIFA", "ping-pong". */
  game: string;
  createdAt: number;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  joinedAt: number;
}

export interface Tournament {
  id: string;
  /** Player ids in seeded order (locked at start). */
  playerIds: string[];
  createdAt: number;
  startedById: string;
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
