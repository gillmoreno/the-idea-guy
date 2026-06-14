// prebuild: pin a single build version and expose it to every consumer.
//
// One source of truth (.build-version) is read by:
//   - next.config.js  → baked into the bundle as NEXT_PUBLIC_APP_VERSION
//   - public/version.json → polled at runtime to detect a fresh deploy
//   - postbuild stamp-sw.mjs → makes sw.js byte-different each deploy
//
// Order of precedence: explicit APP_BUILD_VERSION (passed by the Docker build),
// else the short git sha, else a timestamp fallback (so every build still differs).
import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const webDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

let version = (process.env.APP_BUILD_VERSION || "").trim();
if (!version) {
  try {
    version = execSync("git rev-parse --short=12 HEAD", { cwd: webDir, stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    /* no git in this context (e.g. Docker build) — fall through */
  }
}
if (!version) {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  version = `b${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
}

writeFileSync(path.join(webDir, ".build-version"), version);
mkdirSync(path.join(webDir, "public"), { recursive: true });
writeFileSync(path.join(webDir, "public", "version.json"), JSON.stringify({ version }) + "\n");
console.log(`[version] build version = ${version}`);
