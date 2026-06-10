// Claude-subscription sidecar for genproxy — the Inkanto pattern
// (inkanto/ai-sidecar) applied to room-schema generation.
//
// Speaks the OpenAI chat-completions shape on the outside so genproxy's
// `openai` provider can use it as an upstream unchanged, and the Claude Agent
// SDK on the inside, authenticated with CLAUDE_CODE_OAUTH_TOKEN from
// `claude setup-token` — drawing from the Claude subscription's Agent SDK
// credit instead of API billing. Bind to localhost: genproxy owns the public
// rails (rate limits, budget, CORS, schema checks); this is a private adapter.

import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { query } from "@anthropic-ai/claude-agent-sdk";

// Minimal .env loader (./claude-sidecar/.env); real env vars win.
try {
  for (const line of readFileSync(new URL(".env", import.meta.url), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  console.log("claude-sidecar: loaded .env");
} catch {
  /* no .env is fine */
}

const PORT = Number(process.env.SIDECAR_PORT || 4601);
const HOST = process.env.SIDECAR_HOST || "127.0.0.1";

if (!process.env.CLAUDE_CODE_OAUTH_TOKEN && !process.env.ANTHROPIC_API_KEY) {
  console.warn(
    "note: no CLAUDE_CODE_OAUTH_TOKEN/ANTHROPIC_API_KEY set — using this machine's `claude` login if present. For headless/deployed runs, mint a token with `claude setup-token`.",
  );
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => {
      data += c;
      if (data.length > 1_000_000) reject(new Error("body too large"));
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

async function handleCompletion(req, res) {
  let body;
  try {
    body = JSON.parse(await readBody(req));
  } catch {
    res.writeHead(400, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: { message: "invalid json" } }));
  }

  const system = body.messages?.find((m) => m.role === "system")?.content ?? "";
  const user = body.messages?.find((m) => m.role === "user")?.content ?? "";
  if (!user.trim()) {
    res.writeHead(400, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: { message: "user message required" } }));
  }

  try {
    // One-turn, tool-less query — pure text generation, like Inkanto's coach.
    // The Agent SDK has no max_tokens knob; maxTurns:1 + the schema-only
    // system prompt bound the output instead.
    const stream = query({
      prompt: user,
      options: {
        systemPrompt: system,
        allowedTools: [],
        maxTurns: 1,
        model: body.model || process.env.SIDECAR_MODEL || "claude-haiku-4-5",
      },
    });

    let text = "";
    let usage = { prompt_tokens: 0, completion_tokens: 0 };
    let failed = null;
    for await (const msg of stream) {
      if (msg.type === "assistant" && msg.message?.content) {
        for (const block of msg.message.content) {
          if (typeof block.text === "string") text += block.text;
        }
      } else if (msg.type === "result") {
        if (msg.subtype !== "success") failed = msg.subtype;
        if (!text && typeof msg.result === "string") text = msg.result;
        if (msg.usage) {
          usage = {
            prompt_tokens: msg.usage.input_tokens ?? 0,
            completion_tokens: msg.usage.output_tokens ?? 0,
          };
        }
      }
    }
    if (failed || !text) {
      console.error("claude-sidecar: generation failed:", failed ?? "empty response");
      res.writeHead(502, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: { message: failed ?? "empty response" } }));
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        choices: [{ message: { role: "assistant", content: text } }],
        usage,
      }),
    );
  } catch (err) {
    console.error("claude-sidecar: error:", err);
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: { message: "sidecar_failed" } }));
  }
}

const server = createServer((req, res) => {
  if (req.method === "GET" && req.url === "/healthz") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    return res.end("ok");
  }
  if (req.method === "POST" && req.url === "/v1/chat/completions") {
    return handleCompletion(req, res);
  }
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: { message: "not found" } }));
});

server.listen(PORT, HOST, () =>
  console.log(`claude-sidecar listening on ${HOST}:${PORT} (subscription auth via CLAUDE_CODE_OAUTH_TOKEN)`),
);
