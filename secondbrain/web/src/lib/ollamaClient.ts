import { DEFAULT_OLLAMA_BASE_URL } from "./types";

export interface OllamaStatus {
  running: boolean;
  models: string[];
  error?: string;
}

interface OllamaTagsResponse {
  models?: { name: string }[];
}

function normalizeBaseUrl(base: string): string {
  const trimmed = base.trim() || DEFAULT_OLLAMA_BASE_URL;
  return trimmed.replace(/\/$/, "");
}

function parseModels(data: OllamaTagsResponse): string[] {
  const names = (data.models ?? []).map((m) => m.name).filter(Boolean);
  return [...new Set(names)].sort((a, b) => a.localeCompare(b));
}

async function fetchTagsDirect(baseUrl: string): Promise<OllamaTagsResponse> {
  const res = await fetch(`${normalizeBaseUrl(baseUrl)}/api/tags`);
  if (!res.ok) {
    throw new Error(`Ollama returned ${res.status}`);
  }
  return (await res.json()) as OllamaTagsResponse;
}

async function fetchTagsViaRelay(
  baseUrl: string,
  relayHttpUrl: string,
): Promise<OllamaTagsResponse> {
  const q = new URLSearchParams({ base: normalizeBaseUrl(baseUrl) });
  const res = await fetch(
    `${relayHttpUrl.replace(/\/$/, "")}/ai/ollama/tags?${q.toString()}`,
  );
  if (!res.ok) {
    const text = await res.text();
    let message = text || `Relay returned ${res.status}`;
    try {
      const parsed = JSON.parse(text) as { error?: string };
      if (parsed.error) message = parsed.error;
    } catch {
      /* use raw */
    }
    throw new Error(message);
  }
  return (await res.json()) as OllamaTagsResponse;
}

/** Probe Ollama and list locally pulled models. */
export async function detectOllama(
  baseUrl: string,
  relayHttpUrl: string,
): Promise<OllamaStatus> {
  try {
    const data = await fetchTagsDirect(baseUrl);
    const models = parseModels(data);
    return { running: true, models };
  } catch (directErr) {
    try {
      const data = await fetchTagsViaRelay(baseUrl, relayHttpUrl);
      const models = parseModels(data);
      return { running: true, models };
    } catch (relayErr) {
      const directMsg = directErr instanceof Error ? directErr.message : "unreachable";
      const relayMsg = relayErr instanceof Error ? relayErr.message : "relay failed";
      return {
        running: false,
        models: [],
        error: `Ollama not detected (${directMsg}). ${relayMsg}`,
      };
    }
  }
}
