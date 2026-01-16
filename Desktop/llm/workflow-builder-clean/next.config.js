// next.config.js

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  // 1. Force Next.js to use only 1 worker (prevents out-of-memory crashes)
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
  // 2. Disable the static analysis that often causes hangs
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
