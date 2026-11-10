import { describe, it, expect, vi } from "vitest"
import sharp from "sharp"
import { renderSocialImage, socialImageResponse } from "@/lib/seo/social-image"

describe("offline bilingual social images", () => {
  it.each([
    {
      title: "Independent newsroom",
      description: "News & analysis",
      direction: "ltr" as const,
    },
    {
      title: "جبرَاكة نيوز",
      description:
        "السودان يواجه مخاطر متزايدة مع تفاقم الجفاف المرتبط بظاهرة النِّينُو",
      direction: "rtl" as const,
    },
    {
      title: "Sudan السودان 2026",
      description: "English والعربية together",
      direction: "rtl" as const,
    },
    {
      title: "عنوان طويل لاختبار التفاف النص ".repeat(30),
      description:
        '<span foreground="red">Not markup & no external resources</span>',
      direction: "rtl" as const,
    },
  ])(
    "renders $direction text into a complete PNG without network font requests",
    async (input) => {
      const fetch = vi
        .spyOn(globalThis, "fetch")
        .mockRejectedValue(new Error("Network disabled"))
      try {
        const png = await renderSocialImage({
          ...input,
          heading: "News أخبار",
          footer: "news.example.test",
        })
        expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a")
        expect(await sharp(png).metadata()).toMatchObject({
          width: 1200,
          height: 630,
          format: "png",
        })
        expect(png.length).toBeGreaterThan(10000)
        expect(fetch).not.toHaveBeenCalled()
        const response = socialImageResponse(png)
        expect(response.headers.get("content-type")).toBe("image/png")
        expect((await response.arrayBuffer()).byteLength).toBe(png.length)
      } finally {
        fetch.mockRestore()
      }
    }
  )
})
