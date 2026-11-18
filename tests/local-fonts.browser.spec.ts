import { test, expect } from "@playwright/test"
import { build } from "esbuild"
import { readFile } from "node:fs/promises"
import path from "node:path"
let files: { path: string; text: string }[]
test.beforeAll(async () => {
  files = (
    await build({
      entryPoints: ["tests/fixtures/local-fonts.fixture.tsx"],
      bundle: true,
      write: false,
      outdir: "test-results/font-fixture",
      platform: "browser",
      format: "iife",
      globalName: "FontFixture",
    })
  ).outputFiles
})
for (const locale of ["en", "ar"] as const)
  test(`local fonts render with no external requests (${locale})`, async ({
    page,
  }) => {
    const requests: string[] = []
    page.on("request", (request) => requests.push(request.url()))
    await page.route("http://fonts.test/**", async (route) => {
      const pathname = new URL(route.request().url()).pathname
      if (pathname === "/")
        return route.fulfill({
          contentType: "text/html",
          body: '<div id="fixture"></div>',
        })
      if (!/^\/fonts\/[a-z_]+\/(?:font\.css|[a-f0-9]+\.woff2)$/.test(pathname))
        return route.abort()
      await route.fulfill({
        contentType: pathname.endsWith(".css") ? "text/css" : "font/woff2",
        body: await readFile(
          path.join(process.cwd(), "public", pathname.slice(1))
        ),
      })
    })
    await page.goto("http://fonts.test/")
    for (const file of files) {
      if (file.path.endsWith(".css"))
        await page.addStyleTag({ content: file.text })
      else await page.addScriptTag({ content: file.text })
    }
    await page.evaluate(
      (locale) =>
        (
          window as unknown as {
            FontFixture: { render: (locale: string) => void }
          }
        ).FontFixture.render(locale),
      locale
    )
    await expect(page.locator("h1")).toBeVisible()
    for (const family of ["inter", "cairo", "amiri", "geist_mono"])
      await expect(
        page.locator(`link[rel="stylesheet"][href="/fonts/${family}/font.css"]`)
      ).toHaveCount(1)
    await expect(
      page.locator('link[rel="stylesheet"][href="/fonts/roboto/font.css"]')
    ).toHaveCount(0)
    const loaded = await page.evaluate(async () => {
      const groups = await Promise.all([
        document.fonts.load('700 24px "Inter"', "Newsroom"),
        document.fonts.load('700 24px "Cairo"', "الأخبار"),
        document.fonts.load('700 24px "Amiri"', "الأخبار"),
        document.fonts.load('400 16px "Geist Mono"', "Code"),
      ])
      return groups.map(
        (faces) =>
          faces.length > 0 && faces.every((face) => face.status === "loaded")
      )
    })
    expect(loaded).toEqual([true, true, true, true])
    // Decode every supported bundled family, not only the initial theme selection.
    const catalogLoaded = await page.evaluate(async () => {
      const { catalog } = (
        window as unknown as {
          FontFixture: {
            catalog: {
              id: string
              label: string
              local?: boolean
              script: string
            }[]
          }
        }
      ).FontFixture
      for (const font of catalog.filter((font) => font.local)) {
        const href = `/fonts/${font.id}/font.css`
        if (!document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) {
          await new Promise<void>((resolve, reject) => {
            const link = document.createElement("link")
            link.rel = "stylesheet"
            link.href = href
            link.onload = () => resolve()
            link.onerror = () => reject(new Error(font.id))
            document.head.append(link)
          })
        }
        const faces = await document.fonts.load(
          `700 20px "${font.label}"`,
          font.script === "arabic" ? "الأخبار" : "Newsroom"
        )
        if (!faces.length || faces.some((face) => face.status !== "loaded"))
          return font.id
      }
      return "loaded"
    })
    expect(catalogLoaded).toBe("loaded")
    expect(
      requests.every((url) => new URL(url).origin === "http://fonts.test")
    ).toBe(true)
    await page.screenshot({
      path: `test-results/local-fonts-${locale}.png`,
      fullPage: true,
    })
  })
