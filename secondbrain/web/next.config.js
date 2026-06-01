const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  reactStrictMode: true,
  images: { unoptimized: true },
  outputFileTracingRoot: path.join(__dirname),
};

module.exports = nextConfig;
