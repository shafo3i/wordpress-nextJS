import { readFileSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { describe, expect, it } from "vitest"

const config = JSON.parse(readFileSync("vercel.json", "utf8"))
const source = `
  const purifier = require("isomorphic-dompurify");
  console.log(purifier.sanitize('<p>safe</p><script>alert(1)</script>'));
`

describe("server sanitizer runtime", () => {
  it("reproduces the deployed failure with require(ESM) disabled", () => {
    const result = spawnSync(
      process.execPath,
      ["--no-experimental-require-module", "-e", source],
      { encoding: "utf8", env: { ...process.env, NODE_OPTIONS: "" } }
    )
    expect(result.status).not.toBe(0)
    expect(result.stderr).toContain("ERR_REQUIRE_ESM")
  })

  it("loads and sanitizes with the configured Vercel runtime options", () => {
    const result = spawnSync(process.execPath, ["-e", source], {
      encoding: "utf8",
      env: { ...process.env, NODE_OPTIONS: config.env.NODE_OPTIONS },
    })
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(result.stdout.trim()).toBe("<p>safe</p>")
  })
})
