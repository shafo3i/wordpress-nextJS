import path from "node:path"
import sharp from "sharp"
import { escapeXml } from "./urls"

export const socialImageSize = { width: 1200, height: 630 }
const fontfile = path.join(process.cwd(), "public/fonts/og/NotoSansArabic.ttf")

/** Pango shapes Arabic and mixed-direction text locally, without Satori's GSUB parser. */
export async function renderSocialImage(input: {
  title: string
  description?: string
  heading?: string
  footer?: string
  direction?: "rtl" | "ltr"
}) {
  const width = 1040,
    rtl = input.direction === "rtl"
  const line = async (
    value: string,
    top: number,
    height: number,
    size: number,
    color: string,
    bold = false
  ) => {
    const text = value
      .replace(/[\u0000-\u001f]/g, " ")
      .trim()
      .slice(0, 4000)
    if (!text) return null
    const { data, info } = await sharp({
      text: {
        text: `<span foreground="${color}">${escapeXml(text)}</span>`,
        font: `Noto Sans Arabic ${bold ? "Bold " : ""}${size}`,
        fontfile,
        width,
        height,
        rgba: true,
        align: rtl ? "right" : "left",
        wrap: "word-char",
      },
    })
      .png()
      .toBuffer({ resolveWithObject: true })
    return { input: data, top, left: rtl ? 1200 - 80 - info.width : 80 }
  }
  const layers = (
    await Promise.all([
      line(input.heading || "", 65, 65, 24, "#94a3b8"),
      line(input.title, 180, 220, 60, "#ffffff", true),
      line(input.description || "", 415, 95, 26, "#94a3b8"),
      line(input.footer || "", 550, 45, 18, "#94a3b8"),
    ])
  ).filter((layer): layer is NonNullable<typeof layer> => !!layer)
  const decoration = Buffer.from(
    '<svg width="1200" height="630"><path fill="#2271b1" d="M0 0h1200v8H0z"/><path stroke="#334155" d="M80 530h1040"/></svg>'
  )
  return sharp({
    create: { ...socialImageSize, channels: 4, background: "#0f172a" },
  })
    .composite([{ input: decoration }, ...layers])
    .png()
    .toBuffer()
}
export function socialImageResponse(data: Uint8Array) {
  // Finish rendering before returning: stream failures otherwise escape route error handling.
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
