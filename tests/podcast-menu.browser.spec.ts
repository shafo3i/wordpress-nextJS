import { test, expect } from "@playwright/test"
import { build } from "esbuild"
import en from "../templates/language/en.json" with { type: "json" }
import ar from "../templates/language/ar.json" with { type: "json" }
let bundle: string
test.beforeAll(async () => {
  const result = await build({
    entryPoints: ["tests/fixtures/podcast-menu.fixture.tsx"],
    bundle: true,
    write: false,
    platform: "browser",
    format: "iife",
    globalName: "PodcastMenuFixture",
  })
  bundle = result.outputFiles[0].text
})
for (const locale of ["ar", "en"] as const)
  test(`selects the podcast directory without typing a link (${locale})`, async ({
    page,
  }) => {
    const dict = locale === "ar" ? ar : en
    await page.setContent('<div id="fixture"></div>')
    await page.addScriptTag({ content: bundle })
    await page.evaluate(
      (locale) =>
        (
          window as unknown as {
            PodcastMenuFixture: { render: (locale: string) => void }
          }
        ).PodcastMenuFixture.render(locale),
      locale
    )
    const panel = page.getByRole("button", {
      name: dict["admin.menus.podcasts"],
      exact: true,
    })
    await panel.click()
    await expect(panel).toHaveAttribute("aria-expanded", "true")
    const checkbox = page.getByRole("checkbox", {
      name: dict["site.podcasts.title"],
      exact: true,
    })
    const add = page
      .getByRole("button", {
        name: dict["admin.menus.add_to_menu"],
        exact: true,
      })
      .last()
    await expect(add).toBeDisabled()
    await checkbox.check()
    await add.click()
    await expect(
      page.getByRole("navigation", { name: "Selected items" }).getByRole("link")
    ).toHaveAttribute("href", locale === "ar" ? "/podcasts" : "/en/podcasts")
    await expect(checkbox).not.toBeChecked()
    await expect(add).toBeDisabled()
  })
