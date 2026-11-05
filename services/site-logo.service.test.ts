import { beforeEach, describe, expect, it, vi } from "vitest"
import sharp from "sharp"
import {
  getGlobalSiteLogo,
  normalizeSiteLogo,
  uploadSiteLogo,
} from "./site-logo.service"
import {
  siteLogoIdSchema,
  SITE_LOGO_MAX_BYTES,
} from "@/db/schema/cms-site-logo"

const mocks = vi.hoisted(() => ({
  select: vi.fn(),
  upload: vi.fn(),
  set: vi.fn(),
}))
vi.mock("@/db", () => ({ db: { select: mocks.select } }))
vi.mock("./media.service", () => ({ uploadMediaFile: mocks.upload }))
vi.mock("./settings.service", () => ({ setOption: mocks.set }))
beforeEach(() => vi.clearAllMocks())
function rows(...values: unknown[][]) {
  mocks.select.mockImplementation(() => ({
    from: () => ({
      where: () => ({ limit: async () => values.shift() || [] }),
    }),
  }))
}
const image = () =>
  sharp({
    create: { width: 320, height: 80, channels: 4, background: "transparent" },
  })
    .png()
    .toBuffer()

describe("Site logo validation and persistence", () => {
  it("decodes and re-encodes image bytes instead of trusting the file extension", async () => {
    const buffer = await normalizeSiteLogo(
      new File([new Uint8Array(await image())], "unsafe.html", {
        type: "text/html",
      })
    )
    const meta = await sharp(buffer).metadata()
    expect(meta.format).toBe("webp")
    expect(meta.width).toBe(320)
    expect(meta.height).toBe(80)
    expect(meta.exif).toBeUndefined()
  })
  it.each([
    "<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>",
    "<html>not an image</html>",
    "broken image",
  ])("rejects unsafe or invalid image bytes", async (bytes) => {
    await expect(
      normalizeSiteLogo(new File([bytes], "logo.png", { type: "image/png" }))
    ).rejects.toThrow("admin.settings.logo.invalid_file")
  })
  it("rejects empty and oversized files before any media write", async () => {
    await expect(
      uploadSiteLogo(new File([], "empty.png"), "user")
    ).rejects.toThrow()
    await expect(
      uploadSiteLogo(
        new File([new Uint8Array(SITE_LOGO_MAX_BYTES + 1)], "large.png"),
        "user"
      )
    ).rejects.toThrow()
    expect(mocks.upload).not.toHaveBeenCalled()
    expect(mocks.set).not.toHaveBeenCalled()
  })
  it("registers the normalized file before storing its attachment ID", async () => {
    mocks.upload.mockResolvedValue({ id: 900, url: "/uploads/logo.webp" })
    expect(
      await uploadSiteLogo(
        new File([new Uint8Array(await image())], "logo.png"),
        "editor"
      )
    ).toEqual({ id: "900", url: "/uploads/logo.webp" })
    expect(mocks.upload).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.stringMatching(/^site-logo-.*\.webp$/),
      "image/webp",
      "editor"
    )
    expect(mocks.set).toHaveBeenCalledWith("site_logo_id", "900")
  })
  it("distinguishes no global setting from an explicitly removed logo", async () => {
    rows([])
    expect(await getGlobalSiteLogo()).toBeNull()
    rows([{ value: "" }])
    expect(await getGlobalSiteLogo()).toEqual({ id: "", url: "" })
  })
  it.each([
    "javascript:alert(1)",
    "//external.test/logo.png",
    "/uploads/evil\\path.png",
  ])("does not render an unsafe attachment URL", async (url) => {
    rows([{ value: "900" }], [{ url, mime: "image/png" }])
    expect((await getGlobalSiteLogo())?.url).toBe("")
  })
  it("resolves the current attachment and falls back safely if it is missing", async () => {
    rows(
      [{ value: "900" }],
      [{ url: "/uploads/logo.webp", mime: "image/webp" }]
    )
    expect((await getGlobalSiteLogo())?.url).toBe("/uploads/logo.webp")
    rows([{ value: "900" }], [])
    expect((await getGlobalSiteLogo())?.url).toBe("")
  })
  it.each(["0", "-1", "1e3", "invalid", "999999999999999999999999"])(
    "handles invalid IDs without throwing: %s",
    (id) => {
      expect(siteLogoIdSchema.safeParse(id).success).toBe(false)
    }
  )
})
