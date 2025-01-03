// Get Arnold AI Web Version
const { version: package_version } = require("./package.json"); // version from package.json
const env_version = process.env.ENMEDD_VERSION; // version from env variable
// Use env version if set & valid, otherwise default to package version
const version = env_version || package_version;

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  swcMinify: true,
  reactStrictMode: false,
  publicRuntimeConfig: {
    version,
  },
};

module.exports = nextConfig;
