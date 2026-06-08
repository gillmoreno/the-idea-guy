import { ChatOptions } from "./aiChat";
import { AIChatRequest, AIChatResponse, AiSettings } from "./types";
import { runVaultAgent } from "./vaultAgent";
import { VaultToolContext } from "./vaultTools";

export type AskVaultOptions = ChatOptions;

export interface AskVaultContext extends VaultToolContext {
  activeNoteId?: string | null;
}

function validateSettings(settings: AiSettings) {
  if (settings.provider === "openai" && !settings.apiKey.trim()) {
    throw new Error("Add your OpenAI API key in Settings → AI.");
  }
  if (settings.provider === "ollama" && !settings.baseUrl.trim()) {
    throw new Error("Set your Ollama URL in Settings → AI (e.g. http://127.0.0.1:11434).");
  }
  if (!settings.model.trim()) {
    throw new Error("Choose a model in Settings → AI.");
  }
}

export async function askVaultAI(
  req: AIChatRequest,
  opts: AskVaultOptions,
  vaultCtx: AskVaultContext,
  onStep?: (label: string) => void,
): Promise<AIChatResponse> {
  validateSettings(opts.settings);

  const summarizeNote =
    req.mode === "summarize" && req.relevantNotes.length === 1
      ? req.relevantNotes[0]
      : undefined;

  const result = await runVaultAgent(
    {
      question: req.question,
      mode: req.mode,
      summarizeNote,
      activeNoteId: vaultCtx.activeNoteId,
    },
    {
      store: vaultCtx.store,
      searchIndex: vaultCtx.searchIndex,
      activeNoteId: vaultCtx.activeNoteId,
    },
    opts,
    onStep,
  );

  return {
    answer: result.answer,
    citedNotes: result.citedNotes,
    toolSteps: result.toolSteps,
  };
}
