export type NoteContentType = "richtext" | "htmlPage";

export interface Note {
  id: string;
  title: string;
  /** richtext = Tiptap doc; htmlPage = full sandboxed HTML/CSS page */
  contentType?: NoteContentType;
  html: string;
  plainText: string;
  /** Full-page mode: body HTML (no wrapper) */
  pageHtml?: string;
  /** Full-page mode: page stylesheet */
  pageCss?: string;
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

export type AiProvider = "openai" | "ollama";

/** Per-vault AI config — stored in Yjs, synced E2E encrypted (not on the relay). */
export interface AiSettings {
  provider: AiProvider;
  apiKey: string;
  /** Ollama base URL, e.g. http://127.0.0.1:11434 */
  baseUrl: string;
  model: string;
}

export const DEFAULT_AI_MODEL = "gpt-4o-mini";
export const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434";
export const DEFAULT_OLLAMA_MODEL = "llama3.2";

export const AI_MODEL_OPTIONS = [
  "gpt-4o-mini",
  "gpt-4o",
  "gpt-4.1-mini",
  "gpt-4.1",
] as const;

export const OLLAMA_MODEL_SUGGESTIONS = [
  "llama3.2",
  "llama3.1",
  "mistral",
  "qwen2.5",
  "phi3",
] as const;

export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  score: number;
}

export interface AICitation {
  id: string;
  title: string;
}

export interface AIChatMessage {
  role: "user" | "assistant";
  content: string;
  citedNotes?: AICitation[];
  toolSteps?: string[];
}

export interface AIChatRequest {
  question: string;
  relevantNotes: { id: string; title: string; plainText: string }[];
  mode?: "chat" | "summarize" | "generatePage";
}

export interface AIChatResponse {
  answer: string;
  citedNotes: AICitation[];
  toolSteps?: string[];
}
