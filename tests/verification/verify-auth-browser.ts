import assert from "node:assert/strict"
import { chromium } from "@playwright/test"
import en from "@/templates/language/en.json"
import ar from "@/templates/language/ar.json"

const browser = await chromium.launch({ channel: "msedge", headless: true })
try {
  const context = await browser.newContext({
    baseURL: "http://localhost:3000",
    viewport: { width: 1440, height: 1000 },
  })
  const requests: { path: string; body: Record<string, unknown> }[] = []
  await context.route("**/api/auth/**", async (route) => {
    const path = new URL(route.request().url()).pathname.replace(
      "/api/auth",
      ""
    )
    const body = route.request().postDataJSON() || {}
    requests.push({ path, body })
    const challenge = [
      "/sign-in/email",
      "/sign-in/email-otp",
      "/magic-link/verify",
    ].includes(path)
    await route.fulfill({
      status: path === "/two-factor/verify-totp" ? 400 : 200,
      contentType: "application/json",
      body: JSON.stringify(
        path === "/two-factor/verify-totp"
          ? { code: "INVALID_CODE", message: "Invalid code" }
          : challenge
            ? { twoFactorRedirect: true, twoFactorMethods: ["totp"] }
            : path === "/get-session"
              ? null
              : { status: true }
      ),
    })
  })
  const page = await context.newPage()
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  for (const [locale, dict] of [
    ["en", en],
    ["ar", ar],
  ] as const) {
    await context.addCookies([
      { name: "admin_lang", value: locale, url: "http://localhost:3000" },
    ])
    for (const [path, mode] of [
      ["/cms-admin", "login"],
      ["/cms-login", "login"],
      ["/forgot-password", "forgot"],
      ["/password-reset", "invalidToken"],
      ["/magic-link", "magic"],
      ["/email-otp", "emailOtp"],
      ["/verify-email", "verifyEmail"],
      ["/verify-2fa", "twoFactor"],
      ["/email-verified", "verified"],
      ["/cms-login/signup", "signup"],
    ]) {
      assert.equal(
        (
          await page.goto(path, {
            waitUntil: "networkidle",
            timeout: 180000,
          })
        )?.status(),
        200
      )
      await page
        .getByRole("heading", {
          name: dict[`auth.${mode}.title` as keyof typeof dict],
          exact: true,
        })
        .waitFor()
      assert.equal(
        await page.locator("main").getAttribute("dir"),
        locale === "ar" ? "rtl" : "ltr"
      )
      assert(
        !/\?{2,}|admin@pressforge|Admin123456|unsplash/.test(
          await page.locator("body").innerText()
        )
      )
      if (mode === "login") {
        assert.equal(await page.locator('input[name="email"]').inputValue(), "")
        assert.equal(
          await page.locator('input[name="password"]').inputValue(),
          ""
        )
        for (const target of [
          "/forgot-password",
          "/magic-link",
          "/email-otp",
          "/verify-email",
        ])
          assert(await page.locator(`a[href^="${target}?"]`).count())
      }
      if (path === "/cms-admin")
        await page.screenshot({
          path: `.local/wordpress-migration/auth-login-${locale}.png`,
        })
    }
  }
  await context.addCookies([
    { name: "admin_lang", value: "en", url: "http://localhost:3000" },
  ])
  await page.goto("/cms-admin", { waitUntil: "networkidle" })
  await page
    .getByLabel(en["auth.email"], { exact: true })
    .fill("fixture@example.test")
  await page
    .getByLabel(en["auth.password"], { exact: true })
    .fill("FixturePass123!")
  await page
    .getByRole("button", { name: en["auth.login.submit"], exact: true })
    .click()
  await page.waitForURL("**/verify-2fa?**")
  assert.equal(new URL(page.url()).searchParams.get("callbackUrl"), "/admincp")
  await page
    .getByLabel(en["auth.authenticatorCode"], { exact: true })
    .fill("123456")
  await page.getByRole("button", { name: en["auth.twoFactor.submit"] }).click()
  await page.locator("main").getByRole("alert").waitFor()
  await page.getByRole("button", { name: en["auth.useBackup"] }).click()
  await page.getByLabel(en["auth.backupCode"], { exact: true }).waitFor()
  await page.goto("/forgot-password", { waitUntil: "networkidle" })
  await page
    .getByLabel(en["auth.email"], { exact: true })
    .fill("fixture@example.test")
  await page.getByRole("button", { name: en["auth.forgot.submit"] }).click()
  await page.locator("main").getByRole("status").waitFor()
  assert(
    String(
      requests.find((request) => request.path === "/request-password-reset")
        ?.body.redirectTo
    ).startsWith("/password-reset?")
  )
  await page.goto("/password-reset?token=browser-fixture", {
    waitUntil: "networkidle",
  })
  await page
    .getByLabel(en["auth.newPassword"], { exact: true })
    .fill("FixturePass123!")
  await page
    .getByLabel(en["auth.confirmPassword"], { exact: true })
    .fill("Different123!")
  await page.getByRole("button", { name: en["auth.reset.submit"] }).click()
  await page.locator("main").getByRole("alert").waitFor()
  assert(!requests.some((request) => request.path === "/reset-password"))
  await page
    .getByLabel(en["auth.confirmPassword"], { exact: true })
    .fill("FixturePass123!")
  await page.getByRole("button", { name: en["auth.reset.submit"] }).click()
  await page.locator("main").getByRole("status").waitFor()
  await page.goto(
    "/magic-link?token=browser-fixture&callbackUrl=%2Fadmincp&login=%2Fcms-admin",
    { waitUntil: "networkidle" }
  )
  await page.getByRole("button", { name: en["auth.magic.continue"] }).waitFor()
  assert(!requests.some((request) => request.path === "/magic-link/verify"))
  await page.getByRole("button", { name: en["auth.magic.continue"] }).click()
  await page.waitForURL("**/verify-2fa?**")
  await page.goto("/email-otp", { waitUntil: "networkidle" })
  await page
    .getByLabel(en["auth.email"], { exact: true })
    .fill("fixture@example.test")
  await page.getByRole("button", { name: en["auth.emailOtp.submit"] }).click()
  await page
    .getByLabel(en["auth.emailOtp.code"], { exact: true })
    .fill("123456")
  await page.getByRole("button", { name: en["auth.emailOtp.verify"] }).click()
  await page.waitForURL("**/verify-2fa?**")
  assert.deepEqual(errors, [])
  console.log(
    "Auth browser checks passed: bilingual screens, empty credentials, login links, reset validation and MFA redirects. All browser auth requests intercepted; no emails sent."
  )
  await context.close()
} finally {
  await browser.close()
}
