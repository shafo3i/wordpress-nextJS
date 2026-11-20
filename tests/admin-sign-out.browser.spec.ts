import { test, expect } from "@playwright/test"
import { build } from "esbuild"
import { fileURLToPath } from "node:url"
import en from "../templates/language/en.json" with { type: "json" }
import ar from "../templates/language/ar.json" with { type: "json" }

let bundle: string
test.beforeAll(async () => {
  const result = await build({
    entryPoints: [fileURLToPath(new URL("./fixtures/admin-sign-out.fixture.tsx", import.meta.url))],
    bundle: true, write: false, format: "iife", platform: "browser", globalName: "SignOutFixture",
    plugins: [{ name: "auth-fixture", setup(builder) {
      builder.onResolve({ filter: /^@\/lib\/auth-client$/ }, () => ({ path: "auth", namespace: "fixture" }))
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({ contents: "export const authClient={signOut:async()=>{const response=await fetch('/api/auth/sign-out',{method:'POST'});return {error:response.ok?null:{message:'failed'}}}}" }))
    } }],
  })
  bundle = result.outputFiles[0].text
})

for (const locale of ["en", "ar"] as const) {
  test(`sign out waits for revocation and stays on failure (${locale})`, async ({ page }) => {
    const dict = locale === "ar" ? ar : en
    await page.route("http://signout.test/**", route => route.fulfill({ contentType: "text/html", body: '<div id="fixture"></div>' }))
    let success = false
    let release: (() => void) | undefined
    await page.route("**/api/auth/sign-out", async route => {
      expect(route.request().method()).toBe("POST")
      await new Promise<void>(resolve => { release = resolve })
      await route.fulfill({ status: success ? 200 : 503, json: {} })
    })
    await page.goto("http://signout.test/admincp")
    await page.addScriptTag({ content: bundle })
    await page.evaluate(locale => (window as unknown as { SignOutFixture: { render: (locale: string) => void } }).SignOutFixture.render(locale), locale)
    const button = page.getByRole("button", { name: dict["admin.menu.logout"] })
    await button.click()
    await expect(button).toBeDisabled()
    expect(page.url()).toBe("http://signout.test/admincp")
    await expect.poll(() => Boolean(release)).toBe(true)
    release!()
    await expect(page.getByRole("alert")).toHaveText(dict["admin.profile.signout_error"])
    await expect(button).toBeEnabled()
    success = true
    release = undefined
    await button.click()
    await expect.poll(() => Boolean(release)).toBe(true)
    release!()
    await expect(page).toHaveURL("http://signout.test/cms-admin")
  })
}
