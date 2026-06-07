import { chatCompletion, ChatMessage, ChatOptions } from "./aiChat";
import { AICitation } from "./types";
import {
  executeVaultTool,
  humanToolLabel,
  VaultToolContext,
  VAULT_TOOL_DEFINITIONS,
} from "./vaultTools";

const MAX_TOOL_ROUNDS = 8;

export interface AgentRequest {
  question: string;
  mode?: "chat" | "summarize";
  /** Pre-loaded note for summarize mode */
  summarizeNote?: { id: string; title: string; plainText: string };
  activeNoteId?: string | null;
}

export interface AgentResponse {
  answer: string;
  citedNotes: AICitation[];
  toolSteps: string[];
}

function todayLine(): string {
  const d = new Date();
  return `Today is ${d.toISOString().slice(0, 10)} (${d.toLocaleDateString("en-US", { weekday: "long" })}). Unix ms now: ${d.getTime()}.`;
}

function buildSystemPrompt(req: AgentRequest): string {
  if (req.mode === "summarize") {
    return (
      "Summarize the provided note concisely in 2-4 sentences. Focus on key points. " +
      "Cite the note title."
    );
  }

  let prompt =
    "You are a helpful assistant for the user's personal note vault (Second Brain). " +
    "You MUST use the provided tools to query the vault — never guess counts, dates, or note contents. " +
    "For 'how many' questions use count_notes. For finding ideas or topics use search_notes with focused keywords. " +
    "For time-based recall (e.g. 'about two weeks ago'), compute since_ms and until_ms from today's date and pass them to search_notes or list_notes. " +
    "Two weeks ≈ 14 days: since_ms = now - 14*24*60*60*1000. " +
    "After tools return data, answer clearly and cite note titles. " +
    "If tools find nothing, say so and suggest different search terms.\n\n" +
    todayLine();

  if (req.activeNoteId) {
    prompt += `\nThe user currently has a note open (id: ${req.activeNoteId}).`;
  }

  return prompt;
}

function buildUserMessage(req: AgentRequest): string {
  if (req.mode === "summarize" && req.summarizeNote) {
    const text =
      req.summarizeNote.plainText.length > 4000
        ? `${req.summarizeNote.plainText.slice(0, 4000)}…`
        : req.summarizeNote.plainText;
    return `Note: ${req.summarizeNote.title}\n\n${text}\n\nSummarize this note.`;
  }
  return req.question;
}

function uniqueCitations(items: AICitation[]): AICitation[] {
  const seen = new Set<string>();
  return items.filter((c) => {
    if (!c.id || seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
}

export async function runVaultAgent(
  req: AgentRequest,
  ctx: VaultToolContext,
  opts: ChatOptions,
  onStep?: (label: string) => void,
): Promise<AgentResponse> {
  const settings = opts.settings;
  const model = settings.model.trim();
  const toolSteps: string[] = [];
  const citedNotes: AICitation[] = [];

  const messages: ChatMessage[] = [
    { role: "system", content: buildSystemPrompt(req) },
    { role: "user", content: buildUserMessage(req) },
  ];

  const useTools = req.mode !== "summarize";

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const completion = await chatCompletion(
      {
        model,
        messages,
        ...(useTools ? { tools: VAULT_TOOL_DEFINITIONS, tool_choice: "auto" as const } : {}),
      },
      opts,
    );

    const msg = completion.message;
    const toolCalls = msg.tool_calls ?? [];

    if (useTools && toolCalls.length > 0) {
      messages.push({
        role: "assistant",
        content: msg.content ?? null,
        tool_calls: toolCalls,
      });

      for (const tc of toolCalls) {
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(tc.function.arguments || "{}") as Record<string, unknown>;
        } catch {
          args = {};
        }

        const label = humanToolLabel(tc.function.name, args);
        toolSteps.push(label);
        onStep?.(label);

        const { result, citedNotes: toolCites } = executeVaultTool(tc.function.name, args, ctx);
        citedNotes.push(...toolCites);

        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      }
      continue;
    }

    const answer = msg.content?.trim();
    if (!answer) {
      throw new Error("Empty response from AI model");
    }

    if (req.mode === "summarize" && req.summarizeNote) {
      citedNotes.push({
        id: req.summarizeNote.id,
        title: req.summarizeNote.title,
      });
    }

    return {
      answer,
      citedNotes: uniqueCitations(citedNotes),
      toolSteps,
    };
  }

  throw new Error("Too many tool rounds — try a simpler question.");
}
