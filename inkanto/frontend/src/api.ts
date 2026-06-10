const TOKEN_KEY = "inkanto_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const resp = await fetch(`/api${path}`, { ...options, headers });
  if (resp.status === 204) return undefined as T;
  const body = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new ApiError(resp.status, body.error || "errore");
  return body as T;
}

export interface CoachStreamBody {
  skill: string;
  message: string;
  chapter_id?: number;
  entity_id?: number;
}

// POST the coach request and invoke onText for each streamed chunk.
export async function coachStream(
  storyId: number,
  body: CoachStreamBody,
  onText: (text: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const resp = await fetch(`/api/stories/${storyId}/coach`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal,
  });
  if (!resp.ok || !resp.body) {
    const err = await resp.json().catch(() => ({}));
    throw new ApiError(resp.status, err.error || "il coach non risponde");
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const chunk = JSON.parse(line.slice(6));
        if (chunk.text) onText(chunk.text);
        if (chunk.error) throw new ApiError(502, "il coach ha avuto un problema");
      } catch (e) {
        if (e instanceof ApiError) throw e;
        // ignore malformed keep-alive lines
      }
    }
  }
}
