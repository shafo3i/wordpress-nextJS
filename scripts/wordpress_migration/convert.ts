import { Worker } from "node:worker_threads"
import { createHash } from "node:crypto"
import { readFile, writeFile, mkdir } from "node:fs/promises"
import { resolve } from "node:path"
import { build } from "esbuild"

// Short-lived workers bound DOM memory and cache completed batches for safe retries.
async function main() {
  const out = resolve(".local/wordpress-migration")
  const source = await readFile(resolve(out, "prepared.json"))
  const sha256 = createHash("sha256").update(source).digest("hex")
  const posts = JSON.parse(source.toString("utf8")).posts as {
    ID: string
    post_type: string
    post_name: string
    post_content: string
    post_excerpt: string
  }[]
  const articles = posts
    .filter((p) => p.post_type === "post")
    .map((p) => [p.ID, p.post_name])
  const workerFile = resolve(out, "convert-worker.cjs")
  const cacheDir = resolve(out, "converted", sha256)
  await mkdir(cacheDir, { recursive: true })
  await build({
    entryPoints: [resolve("scripts/wordpress_migration/convert-worker.ts")],
    outfile: workerFile,
    bundle: true,
    platform: "node",
    format: "cjs",
    packages: "external",
  })
  type Entry = [string, { content: string; excerpt: string }]
  const entries: Entry[] = []
  let next = 0,
    completed = 0
  const batchSize = 250
  const batches = Math.ceil(posts.length / batchSize)
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (next < batches) {
        const index = next++
        const cacheFile = resolve(cacheDir, `${index}.json`)
        let converted: Entry[]
        try {
          converted = JSON.parse(await readFile(cacheFile, "utf8"))
        } catch {
          converted = await new Promise<Entry[]>((done, fail) => {
            const worker = new Worker(workerFile, {
              workerData: {
                articles,
                posts: posts.slice(index * batchSize, (index + 1) * batchSize),
              },
            })
            worker.once("message", done)
            worker.once("error", fail)
            worker.once("exit", (code) => {
              if (code !== 0)
                fail(new Error(`Conversion worker exited ${code}`))
            })
          })
          await writeFile(cacheFile, JSON.stringify(converted))
        }
        entries.push(...converted)
        completed++
        console.log(JSON.stringify({ convertedBatches: completed, batches }))
      }
    })
  )
  if (
    entries.length !== posts.length ||
    new Set(entries.map((e) => e[0])).size !== posts.length
  )
    throw new Error("Incomplete conversion cache")
  await writeFile(
    resolve(out, "converted.json"),
    JSON.stringify({ sha256, entries: Object.fromEntries(entries) })
  )
  console.log(
    JSON.stringify({ convertedRecords: entries.length, cached: true })
  )
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Conversion failed")
  process.exitCode = 1
})
