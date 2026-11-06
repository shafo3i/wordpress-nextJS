import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // jsdom reads package assets relative to its own directory. Keep the server
  // sanitizer in Node's module loader so bundling cannot relocate those reads.
  serverExternalPackages: ["isomorphic-dompurify", "jsdom"],
  // Sharp 0.35 loads libvips via its native addon; automatic tracing can miss it.
  // Trace real pnpm store directories only. Hoisted @img paths are symlinks;
  // avoid explicitly including both aliases and their targets in deployment.
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/.pnpm/@img+sharp-linux-x64@*/node_modules/@img/sharp-linux-x64/lib/**/*",
      "./node_modules/.pnpm/@img+sharp-libvips-linux-x64@*/node_modules/@img/sharp-libvips-linux-x64/lib/**/*",
      "./node_modules/.pnpm/@img+sharp-linuxmusl-x64@*/node_modules/@img/sharp-linuxmusl-x64/lib/**/*",
      "./node_modules/.pnpm/@img+sharp-libvips-linuxmusl-x64@*/node_modules/@img/sharp-libvips-linuxmusl-x64/lib/**/*",
    ],
  },
}

export default nextConfig
