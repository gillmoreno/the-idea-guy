import { AiSettings } from "./types";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  tools?: import("./vaultTools").VaultToolDefinition[];
  tool_choice?: "auto" | "none";
}

export interface ChatCompletionResult {
  message: ChatMessage;
  finishReason?: string;
}

function chatCompletionsUrl(settings: AiSettings): string {
  if (settings.provider === "ollama") {
    return `${settings.baseUrl.replace(/\/$/, "")}/v1/chat/completions`;
  }
  return OPENAI_URL;
}

function buildHeaders(settings: AiSettings): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (settings.provider === "openai") {
    headers.Authorization = `Bearer ${settings.apiKey}`;
  }
  return headers;
}

function parseCompletionBody(body: {
  choices?: {
    message?: ChatMessage;
    finish_reason?: string;
  }[];
  error?: { message?: string };
}): ChatCompletionResult {
  const choice = body.choices?.[0];
  if (!choice?.message) {
    throw new Error(body.error?.message ?? "Empty response from AI model");
  }
  return {
    message: choice.message,
    finishReason: choice.finish_reason,
  };
}

async function postChat(
  url: string,
  headers: Record<string, string>,
  body: ChatCompletionRequest,
): Promise<ChatCompletionResult> {
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as {
    choices?: { message?: ChatMessage; finish_reason?: string }[];
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(json.error?.message ?? `AI request failed (${res.status})`);
  }
  return parseCompletionBody(json);
}

async function callDirect(
  settings: AiSettings,
  body: ChatCompletionRequest,
): Promise<ChatCompletionResult> {
  return postChat(chatCompletionsUrl(settings), buildHeaders(settings), body);
}

async function callViaRelay(
  relayHttpUrl: string,
  settings: AiSettings,
  body: ChatCompletionRequest,
): Promise<ChatCompletionResult> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-AI-Upstream-URL": chatCompletionsUrl(settings),
  };
  if (settings.provider === "openai") {
    headers.Authorization = `Bearer ${settings.apiKey}`;
  } else {
    headers.Authorization = "Bearer ollama";
  }

  const res = await fetch(`${relayHttpUrl.replace(/\/$/, "")}/ai/forward`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as {
    choices?: { message?: ChatMessage; finish_reason?: string }[];
    error?: { message?: string };
  };
  if (!res.ok) {
    const text = json.error?.message ?? `AI forward failed (${res.status})`;
    throw new Error(text);
  }
  return parseCompletionBody(json);
}

export interface ChatOptions {
  settings: AiSettings;
  relayHttpUrl: string;
}

/** OpenAI-compatible chat completion — direct or via dumb relay passthrough. */
export async function chatCompletion(
  body: ChatCompletionRequest,
  opts: ChatOptions,
): Promise<ChatCompletionResult> {
  const { settings } = opts;

  if (settings.provider === "ollama") {
    try {
      return await callDirect(settings, body);
    } catch (e) {
      const isNetwork =
        e instanceof TypeError ||
        (e instanceof Error && /failed to fetch|cors/i.test(e.message));
      if (!isNetwork) throw e;
    }
  }

  return callViaRelay(opts.relayHttpUrl, settings, body);
}
