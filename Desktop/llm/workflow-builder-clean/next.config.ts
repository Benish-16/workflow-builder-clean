import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // 1. LIMIT RESOURCES: Prevent silent crashes by restricting build threads
  experimental: {
    cpus: 1, 
    workerThreads: false,
  },
  // 2. EXTERNALIZE BINARIES: Ensure Prisma and ffmpeg aren't bundled incorrectly
  serverExternalPackages: ["@prisma/client", "ffmpeg-static", "fluent-ffmpeg"],
  
  // 3. FILE TRACING: Explicitly include Prisma engines for the Vercel runtime
  outputFileTracingIncludes: {
    '/api/**/*': ['./node_modules/.prisma/client/**/*'],
    '/**/*': ['./node_modules/.prisma/client/**/*'],
  },
};

export default nextConfig;
