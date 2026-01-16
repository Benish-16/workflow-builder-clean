import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // This helps Turbopack resolve the modules it's complaining about
  experimental: {
    // If you are still seeing "Module not found" for tRPC or Server components
    serverComponentsExternalPackages: ["@prisma/client", "ffmpeg-static"],
  },
  // Ensure Next.js doesn't delete Prisma engine files during tracing
  outputFileTracingIncludes: {
    '/api/**/*': ['./node_modules/.prisma/client/**/*'],
  },
};

export default nextConfig;
