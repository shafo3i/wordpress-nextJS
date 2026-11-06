import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Sharp 0.35 loads libvips via its native addon; automatic tracing can miss it.
  // Include the native packages in both pnpm's virtual store and hoisted layouts.
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/.pnpm/@img+sharp-*/node_modules/@img/sharp-*/lib/**/*",
      "./node_modules/@img/sharp-*/lib/**/*",
    ],
  },
}

export default nextConfig
