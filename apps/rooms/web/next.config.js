const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  reactStrictMode: true,
  images: { unoptimized: true },
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
