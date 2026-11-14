import { test, expect } from "@playwright/test"
import { build } from "esbuild"
import { fileURLToPath } from "node:url"

declare global {
  interface Window {
    SettingsIdentityFixture: typeof import("./fixtures/settings-identity.fixture")
  }
}

test("newsletter wording stays separate for each language in either admin direction", async ({
  page,
}) => {
  const bundle = await build({
    entryPoints: [
      fileURLToPath(
        new URL("./fixtures/settings-identity.fixture.tsx", import.meta.url)
      ),
    ],
    bundle: true,
    write: false,
    platform: "browser",
    format: "iife",
    globalName: "SettingsIdentityFixture",
  })
  await page.setContent('<div id="fixture"></div>')
  await page.addScriptTag({ content: bundle.outputFiles[0].text })
  for (const rtl of [true, false]) {
    await page.evaluate(
      (rtl) => window.SettingsIdentityFixture.renderEmail(rtl),
      rtl
    )
    await expect(page.locator("#email-template-language")).toHaveValue("ar")
    await page.locator("#email-template-language").selectOption("en")
    await page.locator("#email_welcome_subject").fill("Welcome to {{siteName}}")
    await page.locator("#email_welcome_body").fill("Hello {{name}}")
    await expect(page.locator("#email_welcome_body")).toHaveAttribute(
      "dir",
      "ltr"
    )
    await page.locator("#email-template-language").selectOption("ar")
    await expect(page.locator("#email_welcome_subject")).toHaveValue(
      "Default welcome"
    )
    await expect(page.locator("#email_welcome_body")).toHaveAttribute(
      "dir",
      "rtl"
    )
    await page.locator("#email_welcome_subject").fill("Updated default welcome")
    const saved = JSON.parse(await page.locator("output").innerText())
    expect(saved.email_welcome_subject).toBe("Updated default welcome")
    const templates = JSON.parse(saved.email_template_translations)
    expect(templates.en).toEqual({
      email_welcome_subject: "Welcome to {{siteName}}",
      email_welcome_body: "Hello {{name}}",
    })
    expect(templates.ar.email_welcome_subject).toBe("Updated default welcome")
  }
})

test("site identity translates independently of admin UI and preserves the default name", async ({
  page,
}) => {
  const bundle = await build({
    entryPoints: [
      fileURLToPath(
        new URL("./fixtures/settings-identity.fixture.tsx", import.meta.url)
      ),
    ],
    bundle: true,
    write: false,
    platform: "browser",
    format: "iife",
    globalName: "SettingsIdentityFixture",
  })
  await page.setContent('<div id="fixture"></div>')
  await page.addScriptTag({ content: bundle.outputFiles[0].text })
  for (const rtl of [false, true]) {
    await page.evaluate(
      (rtl) => window.SettingsIdentityFixture.render(rtl),
      rtl
    )
    await expect(page.locator("#identity-language")).toHaveValue("ar")
    await expect(page.locator("#blogname")).toHaveValue("Default publication")
    await page.locator("#identity-language").selectOption("en")
    await expect(page.locator("#blogname")).toHaveValue("")
    await expect(page.locator("#blogname")).toHaveAttribute("dir", "ltr")
    await page.locator("#blogname").fill("English publication")
    await page.locator("#blogdescription").fill("English description")
    await page.getByLabel("Preview language").selectOption("en")
    await expect(page.locator("h1")).toHaveText("English publication")
    await expect(page.locator("[data-tagline]")).toHaveText(
      "English description"
    )
    await page.locator("#identity-language").selectOption("ar")
    await expect(page.locator("#blogname")).toHaveValue("Default publication")
    await expect(page.locator("#blogname")).toHaveAttribute("dir", "rtl")
    await page.locator("#blogname").fill("Updated default publication")
    await expect(page.locator("h1")).toHaveText("English publication")
    const stored = JSON.parse(await page.locator("output").innerText())
    expect(stored.blogname).toBe("Updated default publication")
    expect(JSON.parse(stored.site_identity_translations)).toEqual({
      en: { title: "English publication", tagline: "English description" },
    })
    await page.locator("#identity-language").selectOption("en")
    await page.locator("#blogdescription").fill("")
    await expect(page.locator("[data-tagline]")).toHaveText("")
  }
})
