import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  
  // 1. Move outside of 'experimental' for Next.js 16
  serverExternalPackages: ["@prisma/client", "ffmpeg-static", "fluent-ffmpeg"],

  // 2. Comprehensive Prisma tracing
  outputFileTracingIncludes: {
    '/api/**/*': ['./node_modules/.prisma/client/**/*'],
    '/**/*': ['./node_modules/.prisma/client/**/*'], // Added global fallback
  },

  // 3. Recommended: Explicitly enable Cache Components if using Next 16 features
  // cacheComponents: true, 
};

export default nextConfig;
