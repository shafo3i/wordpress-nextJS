import { mkdtempSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { createRequire } from "node:module"
import { spawnSync } from "node:child_process"
import { buildSync } from "esbuild"
import { expect, it } from "vitest"

it("releases article DOMs after repeated media rendering", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "pressforge-media-memory-"))
  const require = createRequire(import.meta.url)
  const bundle = path.join(directory, "render.cjs")
  try {
    buildSync({
      entryPoints: [path.resolve("lib/post-content-media.ts")], outfile: bundle,
      bundle: true, platform: "node", format: "cjs",
      alias: { "isomorphic-dompurify": require.resolve("isomorphic-dompurify") },
      external: [require.resolve("isomorphic-dompurify")],
    })
    // Resolve the external dependency from the project, not the temporary folder.
    const runner = path.join(directory, "probe.cjs")
    writeFileSync(runner, `
      const {renderPostMedia}=require(${JSON.stringify(bundle)});
      const content='<h2>News</h2>'+('<p>Article <strong>text</strong> and <a href="https://example.org/story">a link</a>.</p>'.repeat(8))+'<p>https://youtu.be/aqz-KE-bpKQ</p><video src="/uploads/example.mp4"></video>';
      async function heap(){await new Promise(setImmediate);global.gc();await new Promise(setImmediate);global.gc();return process.memoryUsage().heapUsed;}
      (async()=>{for(let i=0;i<50;i++)renderPostMedia(content);const before=await heap();for(let i=0;i<500;i++)renderPostMedia(content);const after=await heap();console.log(JSON.stringify({before,after,growth:after-before}));})();
    `)
    const result = spawnSync(process.execPath, ["--expose-gc", "--max-old-space-size=256", runner], {
      encoding: "utf8", timeout: 25000, env: { ...process.env, NODE_OPTIONS: "" },
    })
    expect(result.status, result.stderr).toBe(0)
    const sample = JSON.parse(result.stdout.trim()) as { before: number; after: number; growth: number }
    // The reproduced leak retained ~100 MiB per 500 renders. Allow ample
    // runtime/platform variation while rejecting that sustained retention.
    expect(sample.growth).toBeLessThan(32 * 1024 * 1024)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}, 30000)
