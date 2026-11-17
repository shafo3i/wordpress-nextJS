import { test, expect } from "@playwright/test"
import { build } from "esbuild"
import en from "../templates/language/en.json" with { type: "json" }
import ar from "../templates/language/ar.json" with { type: "json" }
let bundle: string
test.beforeAll(async () => {
  const output = await build({ entryPoints: ["tests/fixtures/language-install.fixture.tsx"], bundle: true, write: false, platform: "browser", format: "iife", globalName: "LanguageFixture",
    plugins: [{ name: "language-fixture", setup(builder) {
      builder.onResolve({ filter: /^(next\/navigation|\.\.\/action)$/ }, ({ path }) => ({ path, namespace: "fixture" }))
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({ contents: path === "next/navigation" ? "export const useRouter=()=>({refresh(){}})" : "export const installLanguageTemplateAction=async input=>{window.installed=input;return {success:true}}", loader: "js" }))
    } }],
  })
  bundle = output.outputFiles[0].text
})
for (const locale of ["en", "ar"] as const) {
  test(`language installer selects bundled languages and default in ${locale}`, async ({ page }) => {
    const dict = locale === "ar" ? ar : en
    await page.setContent('<div id="fixture"></div>')
    await page.addScriptTag({ content: bundle })
    await page.evaluate(locale => (window as unknown as { LanguageFixture: { render: (locale: string) => void } }).LanguageFixture.render(locale), locale)
    await page.getByLabel(dict["admin.languages.templates.select"], { exact: true }).selectOption("fr")
    await page.getByLabel(dict["admin.languages.templates.default"], { exact: true }).check()
    await page.getByRole("button", { name: dict["admin.languages.templates.install"], exact: true }).click()
    await expect(page.getByRole("status")).toHaveText(dict["admin.languages.templates.success"])
    expect(await page.evaluate(() => (window as unknown as { installed: unknown }).installed)).toEqual({ code: "fr", isDefault: true })
  })
}
