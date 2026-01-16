import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // 1. STABILITY: Next.js 16 can crash by running too many threads
  experimental: {
    cpus: 1, 
    workerThreads: false,
  },
  // 2. PRISMA: Ensure the client is treated as an external package
  serverExternalPackages: ["@prisma/client", "ffmpeg-static"],
  // 3. TRACING: Don't let Next.js delete your database engines
  outputFileTracingIncludes: {
    '/api/**/*': ['./node_modules/.prisma/client/**/*'],
  },
};

export default nextConfig;
