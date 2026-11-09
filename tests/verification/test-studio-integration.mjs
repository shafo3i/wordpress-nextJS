import { spawnSync } from "node:child_process"
import { resolve } from "node:path"
const result = spawnSync(
  process.execPath,
  [
    resolve("node_modules/vitest/vitest.mjs"),
    "run",
    "tests/unit/services/studio-content.integration.test.ts",
  ],
  { stdio: "inherit", env: { ...process.env, STUDIO_INTEGRATION: "1" } }
)
if (result.error) throw result.error
process.exitCode = result.status ?? 1
