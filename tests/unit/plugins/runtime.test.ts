import { describe, it, expect } from "vitest"
import { addFilter, createPluginRuntime } from "@/lib/plugins/hooks"
describe("isolated plugin runtimes", () => {
  it("does not leak or duplicate registrations across interleaved requests", async () => {
    let release!: () => void
    const pause = new Promise<void>((resolve) => {
      release = resolve
    })
    const a = createPluginRuntime(async () => {
      addFilter("content", (text: string) => text + "A")
      await pause
      addFilter("content", (text: string) => text + "a")
    })
    const b = await createPluginRuntime(async () => {
      addFilter("content", (text: string) => text + "B")
    })
    release()
    expect(await (await a).applyFilters("content", "")).toBe("Aa")
    expect(await b.applyFilters("content", "")).toBe("B")
    expect(await b.applyFilters("content", "")).toBe("B")
  })
})
