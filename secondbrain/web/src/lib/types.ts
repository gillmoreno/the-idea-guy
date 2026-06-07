export interface Note {
  id: string;
  title: string;
  html: string;
  plainText: string;
  folderId?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
}

export interface LinkEntry {
  outgoing: string[];
  incoming: string[];
}

export interface VaultMeta {
  name: string;
  createdAt: number;
}

/** Per-vault AI config — stored in Yjs, synced E2E encrypted (not on the relay). */
export interface AiSettings {
  provider: "openai";
  apiKey: string;
  model: string;
}

export const DEFAULT_AI_MODEL = "gpt-4o-mini";

export const AI_MODEL_OPTIONS = [
  "gpt-4o-mini",
  "gpt-4o",
  "gpt-4.1-mini",
  "gpt-4.1",
] as const;

export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  score: number;
}

export interface AIChatMessage {
  role: "user" | "assistant";
  content: string;
  citedNotes?: string[];
}

export interface AIChatRequest {
  question: string;
  relevantNotes: { id: string; title: string; plainText: string }[];
  mode?: "chat" | "summarize";
}

export interface AIChatResponse {
  answer: string;
  citedNotes: string[];
}
