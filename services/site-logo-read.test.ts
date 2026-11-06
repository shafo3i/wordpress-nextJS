import { describe, expect, it, vi } from "vitest"
import { getGlobalSiteLogo } from "./site-logo.service"

// This must not be evaluated by the public logo read path.
vi.mock("sharp", () => {
  throw new Error("Simulated missing Linux libvips")
})
vi.mock("./media.service", () => {
  throw new Error("Upload storage must not load on public pages")
})
vi.mock("./settings.service", () => ({ setOption: vi.fn() }))
vi.mock("@/db", () => ({
  db: {
    select: () => ({
      from: () => ({ where: () => ({ limit: async () => [] }) }),
    }),
  },
}))

describe("Public logo dependency isolation", () => {
  it("reads logo configuration without loading image processing or upload storage", async () => {
    expect(await getGlobalSiteLogo()).toBeNull()
  })
})
