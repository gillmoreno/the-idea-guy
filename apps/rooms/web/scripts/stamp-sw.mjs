// postbuild: stamp the build version into the exported service worker.
//
// The placeholder __BUILD_VERSION__ in public/sw.js is copied verbatim into
// out/sw.js by `next build`; replacing it here makes the SW bytes change on
// every deploy, which is what makes the browser actually notice an update
// (a static cache name never updates → users get pinned to a stale build).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const webDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const version = readFileSync(path.join(webDir, ".build-version"), "utf8").trim();
const swPath = path.join(webDir, "out", "sw.js");

if (!existsSync(swPath)) {
  console.error(`[stamp-sw] ${swPath} not found — did the export run?`);
  process.exit(1);
}

const stamped = readFileSync(swPath, "utf8").replaceAll("__BUILD_VERSION__", version);
writeFileSync(swPath, stamped);
console.log(`[stamp-sw] sw.js cache stamped with ${version}`);
