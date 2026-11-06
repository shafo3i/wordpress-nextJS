import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Sharp 0.35 loads libvips via its native addon; automatic tracing can miss it.
  // Trace real pnpm store directories only. Hoisted @img paths are symlinks;
  // avoid explicitly including both aliases and their targets in deployment.
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/.pnpm/@img+sharp-*/node_modules/@img/sharp-*/lib/**/*",
    ],
  },
}

export default nextConfig
