/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  outputFileTracingRoot: require("path").join(__dirname),
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
