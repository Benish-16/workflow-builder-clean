import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Force a single CPU to prevent memory crashes during optimization
  experimental: {
    cpus: 1, 
    workerThreads: false,
  },
  serverExternalPackages: ["@prisma/client", "ffmpeg-static"],
  outputFileTracingIncludes: {
    '/api/**/*': ['./node_modules/.prisma/client/**/*'],
  },
};

export default nextConfig;
