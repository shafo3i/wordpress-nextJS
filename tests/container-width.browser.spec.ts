import { test, expect } from "@playwright/test"
import { build } from "esbuild"
import { fileURLToPath } from "node:url"
declare global {
  interface Window {
    ContainerWidthFixture: typeof import("./fixtures/container-width.fixture")
  }
}
test("navigation and inherited Studio frames align across widths, directions and mobile", async ({
  page,
}) => {
  const result = await build({
    entryPoints: [
      fileURLToPath(
        new URL("./fixtures/container-width.fixture.tsx", import.meta.url)
      ),
    ],
    bundle: true,
    write: false,
    outdir: "test-results/width-fixture",
    platform: "browser",
    format: "iife",
    globalName: "ContainerWidthFixture",
    jsx: "automatic",
    plugins: [
      {
        name: "unrelated-widgets",
        setup(builder) {
          builder.onResolve(
            { filter: /\/studio-widget$|^\.\/studio-widget$/ },
            (args) => ({ path: args.path, namespace: "stub" })
          )
          builder.onLoad({ filter: /.*/, namespace: "stub" }, () => ({
            contents: "export const StudioWidget=()=>null",
            loader: "js",
          }))
        },
      },
    ],
  })
  await page.setContent('<div id="fixture"></div>')
  await page.addStyleTag({
    content:
      "body{margin:0}*{box-sizing:border-box}.mx-auto{margin-inline:auto}.w-full{width:100%}",
  })
  for (const file of result.outputFiles) {
    if (file.path.endsWith(".css"))
      await page.addStyleTag({ content: file.text })
    else await page.addScriptTag({ content: file.text })
  }
  for (const width of ["1140", "1280", "1440", "1600", "100%"] as const) {
    await page.evaluate(
      (width) => window.ContainerWidthFixture.setWidth(width),
      width
    )
    for (const viewport of [375, 1024, 1920])
      for (const direction of ["ltr", "rtl"] as const) {
        await page.setViewportSize({ width: viewport, height: 800 })
        await page.evaluate(
          (direction) => window.ContainerWidthFixture.render(direction),
          direction
        )
        const nav = page.locator("nav"),
          frame = page.locator('[data-studio-element="frame"] > div').first()
        await expect(nav).toBeVisible()
        const navBox = await nav.evaluate((el) => {
          const r = el.getBoundingClientRect()
          return {
            x: r.x,
            width: r.width,
            padding: getComputedStyle(el).paddingLeft,
          }
        })
        const frameBox = await frame.evaluate((el) => {
          const r = el.getBoundingClientRect()
          return {
            x: r.x,
            width: r.width,
            padding: getComputedStyle(el).paddingLeft,
          }
        })
        expect(frameBox).toEqual(navBox)
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
          )
        ).toBe(true)
      }
  }
  await page.evaluate(() =>
    window.ContainerWidthFixture.render("ltr", {
      contentWidth: "boxed",
      maxWidth: 960,
      customWidth: true,
    })
  )
  await expect(
    page.locator('[data-studio-element="frame"] > div').first()
  ).toHaveCSS("max-width", "960px")
})
