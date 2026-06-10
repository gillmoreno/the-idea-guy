import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_SKILLS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "skills");
const SKILLS_DIR = process.env.SKILLS_DIR || DEFAULT_SKILLS_DIR;

function parseSkillFile(path) {
  const raw = readFileSync(path, "utf8");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };
  const meta = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx > 0) meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return { meta, body: match[2].trim() };
}

export function loadSkills() {
  const skills = new Map();
  for (const file of readdirSync(SKILLS_DIR)) {
    if (!file.endsWith(".md")) continue;
    const { meta, body } = parseSkillFile(join(SKILLS_DIR, file));
    if (!meta.name) continue;
    skills.set(meta.name, { meta, body });
  }
  return skills;
}

// Catalog for the frontend skill picker — the base guardrail skill is hidden.
export function skillCatalog(skills) {
  return [...skills.values()]
    .filter((s) => s.meta.name !== "_base")
    .map((s) => ({
      name: s.meta.name,
      emoji: s.meta.emoji || "✏️",
      titles: {
        it: s.meta.title_it || s.meta.name,
        es: s.meta.title_es || s.meta.title_it || s.meta.name,
        en: s.meta.title_en || s.meta.name,
      },
      description: s.meta.description || "",
    }));
}

export function buildSystemPrompt(skills, skillName, locale) {
  const base = skills.get("_base");
  const skill = skills.get(skillName);
  if (!skill) throw new Error(`unknown skill: ${skillName}`);
  const localeNote = `\n\nThe writer's preferred language right now is "${locale || "it"}". Default to it unless she writes in another language.`;
  return `${base ? base.body : ""}\n\n---\n\n${skill.body}${localeNote}`;
}
