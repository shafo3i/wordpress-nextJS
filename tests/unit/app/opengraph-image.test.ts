import { beforeEach, describe, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({
  render: vi.fn(),
  options: {} as Record<string, string>,
  custom: vi.fn(),
}))
vi.mock("@/services/settings.service", () => ({
  getSiteSeoOptions: async () => mocks.options,
}))
vi.mock("@/lib/public-language", () => ({
  getPublicLanguageContext: async () => ({
    code: "ar",
    defaultCode: "ar",
    direction: "rtl",
  }),
}))
vi.mock("@/lib/seo/social-image", () => ({
  renderSocialImage: mocks.render,
  socialImageResponse: (data: Uint8Array) =>
    new Response(new Uint8Array(data), {
      headers: { "content-type": "image/png" },
    }),
}))
vi.mock("next/og", () => ({
  ImageResponse: class {
    arrayBuffer() {
      return mocks.custom()
    }
  },
}))
import Image from "@/app/opengraph-image"
beforeEach(() => {
  vi.clearAllMocks()
  mocks.options = {
    blogname: "جبرَاكة نيوز",
    blogdescription: "صحيفة مستقلة",
    home: "https://news.example.test",
  }
  mocks.render.mockResolvedValue(new Uint8Array([1, 2, 3]))
})
describe("site social image route", () => {
  it("uses configured Arabic identity instead of hardcoded sample branding", async () => {
    const response = await Image()
    expect(response.status).toBe(200)
    expect(mocks.render).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "جبرَاكة نيوز",
        description: "صحيفة مستقلة",
        direction: "rtl",
      })
    )
  })
  it("catches failures while consuming a custom image response and generates a fallback", async () => {
    mocks.options.og_default_image = "/uploads/unavailable.jpg"
    mocks.custom.mockRejectedValueOnce(new Error("stream failed"))
    const response = await Image()
    expect(response.status).toBe(200)
    expect(mocks.render).toHaveBeenCalledTimes(1)
  })
  it("preserves a successfully configured custom image", async () => {
    mocks.options.og_default_image = "/uploads/cover.jpg"
    mocks.custom.mockResolvedValueOnce(new Uint8Array([8, 9]).buffer)
    expect(new Uint8Array(await (await Image()).arrayBuffer())).toEqual(
      new Uint8Array([8, 9])
    )
    expect(mocks.render).not.toHaveBeenCalled()
  })
})
