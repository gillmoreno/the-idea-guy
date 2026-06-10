import { createServer } from "node:http";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { loadSkills, skillCatalog, buildSystemPrompt } from "./skills.mjs";

const PORT = Number(process.env.PORT || 4700);
const MODEL = process.env.INKANTO_MODEL || "claude-opus-4-8";

const skills = loadSkills();
console.log(`inkanto sidecar: loaded ${skills.size} skills, model ${MODEL}`);

if (!process.env.CLAUDE_CODE_OAUTH_TOKEN && !process.env.ANTHROPIC_API_KEY) {
  console.warn("WARNING: neither CLAUDE_CODE_OAUTH_TOKEN nor ANTHROPIC_API_KEY is set — coach calls will fail.");
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

// The sidecar is stateless: the Go backend owns conversation history and
// passes it along, so we fold it into a single prompt for a 1-turn query.
function buildPrompt({ context, history, message }) {
  const parts = [];
  if (context) parts.push(`<story_context>\n${context}\n</story_context>`);
  if (history?.length) {
    const transcript = history
      .map((t) => `${t.role === "assistant" ? "COACH" : "WRITER"}: ${t.content}`)
      .join("\n\n");
    parts.push(`<conversation_so_far>\n${transcript}\n</conversation_so_far>`);
  }
  parts.push(`WRITER: ${message}\n\nReply as the coach.`);
  return parts.join("\n\n");
}

async function handleCoach(req, res) {
  let body;
  try {
    body = JSON.parse(await readBody(req));
  } catch {
    res.writeHead(400, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "invalid json" }));
  }
  const { skill, locale, message } = body;
  if (!skill || !skills.has(skill) || skill === "_base") {
    res.writeHead(400, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "unknown skill" }));
  }
  if (!message?.trim()) {
    res.writeHead(400, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "message required" }));
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  try {
    const stream = query({
      prompt: buildPrompt(body),
      options: {
        systemPrompt: buildSystemPrompt(skills, skill, locale),
        allowedTools: [], // pure conversation — the coach never touches files or shell
        maxTurns: 1,
        model: MODEL,
      },
    });

    for await (const msg of stream) {
      if (msg.type === "assistant" && msg.message?.content) {
        for (const block of msg.message.content) {
          if (typeof block.text === "string" && block.text) {
            send({ text: block.text });
          }
        }
      } else if (msg.type === "result") {
        if (msg.subtype !== "success") {
          console.error("agent sdk result error:", msg.subtype, msg.errors ?? "");
          send({ error: msg.subtype });
        }
      }
    }
    send({ done: true });
  } catch (err) {
    console.error("coach error:", err);
    send({ error: "coach_failed" });
  } finally {
    res.end();
  }
}

const server = createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ status: "ok", skills: skills.size }));
  }
  if (req.method === "GET" && req.url === "/skills") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(skillCatalog(skills)));
  }
  if (req.method === "POST" && req.url === "/coach") {
    return handleCoach(req, res);
  }
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "not found" }));
});

server.listen(PORT, () => console.log(`inkanto sidecar listening on :${PORT}`));
