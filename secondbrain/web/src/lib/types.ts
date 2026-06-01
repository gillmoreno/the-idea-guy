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
