/**
 * Client for the stateless schema-generation proxy (genproxy/, see
 * docs_and_changelog/ROOM_AI.md). The proxy holds the system prompt and the
 * platform AI key; we send only the user's room description. Generation is an
 * enhancement — every failure mode falls back to the copy-paste prompt flow.
 */

export const GENPROXY_URL =
  process.env.NEXT_PUBLIC_GENPROXY_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:4600" : "");

/** Feature flag: hidden entirely when no proxy URL is configured. */
export const GENERATION_ENABLED = GENPROXY_URL.length > 0;

export const MAX_DESCRIPTION_CHARS = 500;

export type GenerateErrorCode =
  | "bad_request"
  | "rate_limited"
  | "budget_exhausted"
  | "generation_failed"
  | "network";

export type GenerateResult =
  | { ok: true; schema: unknown }
  | { ok: false; code: GenerateErrorCode };

export async function generateSchema(description: string): Promise<GenerateResult> {
  try {
    const res = await fetch(`${GENPROXY_URL}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
    });
    const body = (await res.json().catch(() => null)) as
      | { schema?: unknown; error?: string }
      | null;
    if (res.ok && body?.schema) return { ok: true, schema: body.schema };
    const code = (body?.error ?? "generation_failed") as GenerateErrorCode;
    return { ok: false, code };
  } catch {
    return { ok: false, code: "network" };
  }
}

export function generateErrorMessage(code: GenerateErrorCode): string {
  switch (code) {
    case "rate_limited":
      return "Too many generations right now — wait a bit, or use the copy-paste prompt below.";
    case "budget_exhausted":
      return "Free generation is resting this month. The copy-paste prompt below works with any AI chat — same result, no limits.";
    case "network":
      return "Couldn't reach the generator. Check your connection, or use the copy-paste prompt below.";
    case "bad_request":
      return "Keep the description short and plain — or use the copy-paste prompt below.";
    default:
      return "The AI returned something unusable — try rephrasing, or use the copy-paste prompt below.";
  }
}
