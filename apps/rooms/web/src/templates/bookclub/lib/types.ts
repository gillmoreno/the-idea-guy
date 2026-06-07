export interface ClubSettings {
  name: string;
  createdAt: number;
}

export interface Member {
  id: string;
  name: string;
  color: string;
  joinedAt: number;
}

export type BookStatus = "reading" | "queued" | "done";

export interface Book {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  /** Next discussion meeting (YYYY-MM-DD), usually set when status is reading. */
  meetingDate?: string;
  addedById: string;
  addedAt: number;
  finishedAt?: number;
}

export interface Note {
  id: string;
  bookId: string;
  authorId: string;
  body: string;
  createdAt: number;
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
