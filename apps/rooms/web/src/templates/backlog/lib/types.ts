export type IdeaStatus = "proposed" | "building" | "shipped" | "parked";

export interface BoardSettings {
  name: string;
  createdAt: number;
}

export interface Member {
  id: string;
  name: string;
  color: string;
  joinedAt: number;
}

export interface BacklogIdea {
  id: string;
  title: string;
  description: string;
  emoji: string;
  status: IdeaStatus;
  proposedById: string;
  proposedAt: number;
}

export const MEMBER_COLORS = [
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#ef4444",
  "#84cc16",
];
