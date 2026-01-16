import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // This section is CRUCIAL for Prisma on Next.js 16
  outputFileTracingIncludes: {
    '/api/**/*': ['./node_modules/.prisma/client/**/*'],
    '/**/*': ['./node_modules/.prisma/client/**/*'],
  },
};

export default nextConfig;
