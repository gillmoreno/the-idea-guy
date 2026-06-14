const path = require("path");
const fs = require("fs");

// Single build-version source of truth, written by scripts/compute-version.mjs
// (the `prebuild` step). Baked into the bundle so the running app knows which
// build it is and can compare against /version.json at runtime.
let buildVersion = (process.env.APP_BUILD_VERSION || "").trim();
if (!buildVersion) {
  try {
    buildVersion = fs.readFileSync(path.join(__dirname, ".build-version"), "utf8").trim();
  } catch {
    buildVersion = "dev";
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  reactStrictMode: true,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_APP_VERSION: buildVersion },
  outputFileTracingRoot: path.join(__dirname, "../../.."),
  transpilePackages: ["@the-idea-guy/room-kit"],
  serverExternalPackages: ["yjs", "y-indexeddb"],
  webpack: (config) => {
    // One Yjs instance for app + room-kit (constructor checks / instanceof)
    const yjsPath = path.dirname(require.resolve("yjs/package.json"));
    const yIndexedDbPath = path.dirname(require.resolve("y-indexeddb/package.json"));
    config.resolve.alias = {
      ...config.resolve.alias,
      yjs: yjsPath,
      "y-indexeddb": yIndexedDbPath,
    };
    return config;
  },
};

module.exports = nextConfig;
