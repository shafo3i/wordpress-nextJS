import { describe, expect, it } from "vitest"
import { readFileSync, readdirSync, realpathSync } from "node:fs"
import { createRequire } from "node:module"
import { resolve } from "node:path"
import nextConfig from "@/next.config"

const picomatch = createRequire(import.meta.url)("next/dist/compiled/picomatch")
function filesIn(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filename = `${directory}/${entry.name}`
    return entry.isDirectory()
      ? filesIn(filename)
      : entry.isFile()
        ? [filename]
        : []
  })
}
describe("Sharp deployment assets", () => {
  it("does not match dependency symlinks inside native package store directories", () => {
    const patterns = nextConfig.outputFileTracingIncludes?.["/*"] || []
    const matches = patterns.map((pattern) => picomatch(pattern.replace(/^\.\//, "")))
    const aliases = readdirSync("node_modules/.pnpm")
      .filter((name) => name.startsWith("@img+sharp-"))
      .flatMap((name) => {
        const directory = `node_modules/.pnpm/${name}/node_modules/@img`
        return readdirSync(directory).flatMap((dependency) => {
          const path = `${directory}/${dependency}`
          if (realpathSync(path) === resolve(path)) return []
          return filesIn(`${path}/lib`)
        })
      })
    expect(aliases.length).toBeGreaterThan(0)
    expect(aliases.filter((file) => matches.some((match) => match(file)))).toEqual([])
  })

  it("does not explicitly trace hoisted symlink aliases", () => {
    const patterns = nextConfig.outputFileTracingIncludes?.["/*"] || []
    expect(patterns.length).toBeGreaterThan(0)
    for (const pattern of patterns) {
      expect(pattern).toMatch(/^\.\/node_modules\/\.pnpm\/@img\+sharp-/)
    }
  })

  it("explicitly includes the native libvips dependency used by the pinned Sharp version", () => {
    const patterns = nextConfig.outputFileTracingIncludes?.["/*"] || []
    const matches = patterns.map((pattern) =>
      picomatch(pattern.replace(/^\.\//, ""))
    )
    const files = readdirSync("node_modules/.pnpm")
      .filter((name) => /^@img\+sharp-(?:libvips-)?linux-x64@/.test(name))
      .flatMap((name) =>
        filesIn(
          `node_modules/.pnpm/${name}/node_modules/@img/${name.slice(5).split("@")[0]}`
        )
      )
      .filter((file) => matches.some((match) => match(file)))
    const pkg = JSON.parse(
      readFileSync("node_modules/sharp/package.json", "utf8")
    )
    const libvipsVersion =
      pkg.optionalDependencies["@img/sharp-libvips-linux-x64"]
    expect(
      files.some(
        (file) =>
          file.includes(`@img+sharp-libvips-linux-x64@${libvipsVersion}/`) &&
          /libvips-cpp\.so\./.test(file)
      )
    ).toBe(true)
    expect(files.some((file) => file.endsWith("/sharp-linux-x64.node"))).toBe(
      true
    )
  })
})
