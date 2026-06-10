export interface User {
  id: number;
  username: string;
  display_name: string;
  locale: string;
}

export interface Story {
  id: number;
  title: string;
  idea: string;
  voice: string;
  status: string;
  share_token?: string;
  created_at: string;
  updated_at: string;
}

export interface SharedBook {
  title: string;
  idea: string;
  author: string;
  chapters: Chapter[];
  entities: Entity[];
}

export interface Beat {
  id?: number;
  position?: number;
  title: string;
  summary: string;
}

export interface Chapter {
  id: number;
  story_id: number;
  position: number;
  title: string;
  content: string;
  status: string;
  updated_at: string;
}

export interface Entity {
  id: number;
  story_id: number;
  kind: "character" | "place" | "object";
  name: string;
  summary: string;
  notes: string;
}

export interface StoryDetail extends Story {
  beats: Beat[];
  chapters: Chapter[];
  entities: Entity[];
}

export interface SkillInfo {
  name: string;
  emoji: string;
  titles: Record<string, string>;
  description: string;
}

export interface CoachMessage {
  id?: number;
  skill: string;
  role: "user" | "assistant";
  content: string;
}
