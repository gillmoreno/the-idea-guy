export interface Member {
  id: string;
  name: string;
  color: string;
  joinedAt: number;
}

export const MEMBER_COLORS = [
  "#4f46e5",
  "#06b6d4",
  "#8b5cf6",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#ec4899",
  "#64748b",
];

export type ActivityType = "run" | "gym" | "walk" | "yoga" | "sport" | "other";

export const ACTIVITY_META: Record<ActivityType, { label: string; emoji: string }> = {
  run: { label: "Run", emoji: "🏃" },
  gym: { label: "Gym", emoji: "🏋️" },
  walk: { label: "Walk", emoji: "🚶" },
  yoga: { label: "Yoga", emoji: "🧘" },
  sport: { label: "Sport", emoji: "⚽" },
  other: { label: "Other", emoji: "💪" },
};

export interface CrewSettings {
  name: string;
  createdAt: number;
}

export interface WorkoutLog {
  id: string;
  memberId: string;
  activity: ActivityType;
  minutes?: number;
  note?: string;
  /** Serialized `ImageValue` JSON */
  proofImage?: string;
  dayKey: string;
  loggedAt: number;
}

export interface Prize {
  id: string;
  title: string;
  emoji: string;
  description?: string;
  createdById: string;
  createdAt: number;
  awardedToId?: string;
}

export interface MemberStats {
  memberId: string;
  weeklyCount: number;
  currentStreak: number;
  bestStreak: number;
}
