import { test, expect } from "@playwright/test"
import { build } from "esbuild"
import { fileURLToPath } from "node:url"

declare global {
  interface Window {
    TickerFixture: typeof import("./fixtures/ticker.fixture")
  }
}

for (const rtl of [false, true]) {
  test(`ticker pauses in place on hover and focus, and respects manual pause (${rtl ? "RTL" : "LTR"})`, async ({
    page,
  }) => {
    const bundle = await build({
      entryPoints: [
        fileURLToPath(
          new URL("./fixtures/ticker.fixture.tsx", import.meta.url)
        ),
      ],
      bundle: true,
      write: false,
      outdir: "test-results/ticker-fixture",
      platform: "browser",
      format: "iife",
      globalName: "TickerFixture",
      plugins: [
        {
          name: "next-link-fixture",
          setup(build) {
            build.onResolve({ filter: /^next\/link$/ }, (args) => ({
              path: args.path,
              namespace: "link",
            }))
            build.onLoad({ filter: /.*/, namespace: "link" }, () => ({
              contents:
                'import React from "react"; export default function Link(props) { return React.createElement("a",props,props.children); }',
              loader: "js",
              resolveDir: process.cwd(),
            }))
          },
        },
      ],
    })
    await page.setViewportSize({ width: 900, height: 500 })
    await page.setContent(
      '<div id="fixture"></div><button id="outside" style="margin-top:100px">Outside</button>'
    )
    await page.addStyleTag({
      content: "body {margin:0} * {box-sizing:border-box}",
    })
    for (const file of bundle.outputFiles) {
      if (file.path.endsWith(".css"))
        await page.addStyleTag({ content: file.text })
      else await page.addScriptTag({ content: file.text })
    }
    await page.evaluate((rtl) => window.TickerFixture.render(rtl), rtl)
    const track = page.locator("[data-paused]")
    const state = () =>
      track.evaluate((node) => getComputedStyle(node).animationPlayState)
    const transform = () =>
      track.evaluate((node) => getComputedStyle(node).transform)
    await expect.poll(state).toBe("running")
    await page.waitForTimeout(250)
    await page.locator("section").hover()
    await expect.poll(state).toBe("paused")
    const stopped = await transform()
    await page.waitForTimeout(200)
    expect(await transform()).toBe(stopped)
    const headline = page.locator("section a").filter({ visible: true }).first()
    // Focusing must not reset the animation or remove the repeated headline under the pointer.
    await headline.focus()
    expect(await transform()).toBe(stopped)
    await page.mouse.move(850, 450)
    await expect.poll(state).toBe("paused")
    await page.locator("#outside").focus()
    await expect.poll(state).toBe("running")
    const pause = page.locator("section button").nth(1)
    await pause.click()
    await page.mouse.move(850, 450)
    await page.locator("#outside").focus()
    await expect(track).toHaveAttribute("data-paused", "true")
    await expect.poll(state).toBe("paused")
    await pause.click()
    await page.mouse.move(850, 450)
    await page.locator("#outside").focus()
    await expect.poll(state).toBe("running")
  })
}
