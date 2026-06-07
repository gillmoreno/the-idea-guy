import { AIChatRequest, AIChatResponse } from "./types";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

function buildContext(notes: AIChatRequest["relevantNotes"]): string {
  return notes
    .map((n, i) => {
      const header = i > 0 ? "\n\n---\n\n" : "";
      let text = n.plainText;
      if (text.length > 2000) text = `${text.slice(0, 2000)}…`;
      return `${header}Note: ${n.title}\n${text}`;
    })
    .join("");
}

function buildMessages(req: AIChatRequest): { role: string; content: string }[] {
  const systemPrompt =
    req.mode === "summarize"
      ? "Summarize the provided note concisely in 2-4 sentences. Focus on key points."
      : "You are a helpful assistant answering questions about the user's personal notes. " +
        "Only use the provided note excerpts. Cite note titles when relevant. " +
        "If the excerpts don't contain enough information, say so.";

  const contextBlock = buildContext(req.relevantNotes);
  let userContent = req.question;
  if (contextBlock) {
    userContent = `Note excerpts:\n\n${contextBlock}\n\nQuestion: ${req.question}`;
  }

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userContent },
  ];
}

function citedTitles(notes: AIChatRequest["relevantNotes"]): string[] {
  return notes.map((n) => n.title || n.id);
}

async function parseOpenAIResponse(res: Response): Promise<string> {
  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(body.error?.message ?? `OpenAI request failed (${res.status})`);
  }
  const answer = body.choices?.[0]?.message?.content;
  if (!answer) throw new Error("Empty response from OpenAI");
  return answer;
}

/** Call OpenAI directly from the browser with the user's API key. */
async function callOpenAIDirect(
  apiKey: string,
  model: string,
  req: AIChatRequest,
): Promise<AIChatResponse> {
  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages: buildMessages(req) }),
  });
  return { answer: await parseOpenAIResponse(res), citedNotes: citedTitles(req.relevantNotes) };
}

/**
 * Dumb relay forward — no server-side API key. The relay only adds CORS headers
 * and passes the client's Authorization header through to OpenAI.
 */
async function callOpenAIViaRelay(
  relayHttpUrl: string,
  apiKey: string,
  model: string,
  req: AIChatRequest,
): Promise<AIChatResponse> {
  const res = await fetch(`${relayHttpUrl.replace(/\/$/, "")}/ai/forward`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages: buildMessages(req) }),
  });
  if (!res.ok) {
    const text = await res.text();
    let message = text || `AI forward failed (${res.status})`;
    try {
      const parsed = JSON.parse(text) as { error?: string };
      if (parsed.error) message = parsed.error;
    } catch {
      /* use raw text */
    }
    throw new Error(message);
  }
  const data = (await res.json()) as AIChatResponse;
  return { answer: data.answer, citedNotes: data.citedNotes ?? citedTitles(req.relevantNotes) };
}

export interface AskVaultOptions {
  apiKey: string;
  model: string;
  relayHttpUrl: string;
  /** Prefer direct OpenAI when true (may hit browser CORS limits). */
  preferDirect?: boolean;
}

export async function askVaultAI(
  req: AIChatRequest,
  opts: AskVaultOptions,
): Promise<AIChatResponse> {
  const key = opts.apiKey.trim();
  if (!key) {
    throw new Error("Add your OpenAI API key in Settings → AI to use this feature.");
  }

  const model = opts.model.trim() || "gpt-4o-mini";

  if (opts.preferDirect) {
    try {
      return await callOpenAIDirect(key, model, req);
    } catch (e) {
      const isNetwork =
        e instanceof TypeError ||
        (e instanceof Error && /failed to fetch|cors/i.test(e.message));
      if (!isNetwork) throw e;
    }
  }

  return callOpenAIViaRelay(opts.relayHttpUrl, key, model, req);
}
