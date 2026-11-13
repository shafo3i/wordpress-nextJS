import { test, expect } from "@playwright/test"
import { build } from "esbuild"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"
import { readFile } from "node:fs/promises"
import tailwindcss from "@tailwindcss/postcss"
import en from "../templates/language/en.json" with { type: "json" }
import ar from "../templates/language/ar.json" with { type: "json" }
let bundle: string, css: string
test.beforeAll(async () => {
  const require = createRequire(import.meta.url)
  const postcss = createRequire(require.resolve("@tailwindcss/postcss"))(
    "postcss"
  )
  const stylesheet = fileURLToPath(
    new URL("../app/globals.css", import.meta.url)
  )
  css = (
    await postcss([tailwindcss()]).process(await readFile(stylesheet, "utf8"), {
      from: stylesheet,
    })
  ).css
  const result = await build({
    entryPoints: [
      fileURLToPath(
        new URL("./fixtures/profile-security.fixture.tsx", import.meta.url)
      ),
    ],
    bundle: true,
    write: false,
    platform: "browser",
    format: "iife",
    jsx: "automatic",
    globalName: "ProfileSecurityFixture",
    plugins: [
      {
        name: "profile-fixture",
        setup(builder) {
          builder.onResolve(
            { filter: /^(?:@\/lib\/auth-client|next\/navigation)$/ },
            (args) => ({ path: args.path, namespace: "profile-fixture" })
          )
          builder.onLoad(
            { filter: /.*/, namespace: "profile-fixture" },
            (args) => ({
              contents:
                args.path === "next/navigation"
                  ? "export const useRouter=()=>({refresh(){},replace(){}})"
                  : "export const authClient={updateUser:async()=>({data:{status:true}}),changePassword:async()=>({data:{status:true}}),signOut:async()=>({error:{message:'private transport error'}}),getSession:async()=>({data:{user:{twoFactorEnabled:false}}}),twoFactor:{}}",
            })
          )
        },
      },
    ],
  })
  bundle = result.outputFiles[0].text
})
for (const locale of ["en", "ar"] as const)
  test(
    "Profile safe controls and cleared password fields (" + locale + ")",
    async ({ page }) => {
      const dict = locale === "ar" ? ar : en
      await page.setContent('<div id="fixture"></div>')
      await page.addStyleTag({ content: css })
      await page.addScriptTag({ content: bundle })
      await page.evaluate(
        (locale) =>
          (
            window as unknown as {
              ProfileSecurityFixture: { render: (locale: string) => void }
            }
          ).ProfileSecurityFixture.render(locale),
        locale
      )
      await expect(page.locator('img[src^="javascript:"]')).toHaveCount(0)
      await expect(page.locator("#fixture script")).toHaveCount(0)
      await expect(page.locator("#fixture [onerror]")).toHaveCount(0)
      await page
        .getByRole("button", {
          name: dict["admin.profile.edit_profile"],
          exact: true,
        })
        .click()
      await expect(page.locator("#edit-phone")).toHaveCount(0)
      await page.locator("#edit-name").fill("Updated")
      await page
        .getByRole("button", {
          name: dict["admin.profile.save_changes"],
          exact: true,
        })
        .click()
      await expect(page.getByRole("dialog")).toBeHidden()
      await page
        .getByRole("button", {
          name: dict["admin.profile.change_password"],
          exact: true,
        })
        .first()
        .click()
      await page.locator("#curr-pass").fill("secret")
      await page.locator("#new-pass").fill("NewPassword123!")
      await page
        .getByRole("button", {
          name: dict["admin.profile.cancel"],
          exact: true,
        })
        .click()
      await page
        .getByRole("button", {
          name: dict["admin.profile.change_password"],
          exact: true,
        })
        .first()
        .click()
      await expect(page.locator("#curr-pass")).toHaveValue("")
      await expect(page.locator("#new-pass")).toHaveValue("")
      await expect(page.locator("#new-pass")).toHaveAttribute("minlength", "12")
      await page
        .getByRole("button", {
          name: dict["admin.profile.cancel"],
          exact: true,
        })
        .click()
      await page
        .getByRole("button", {
          name: dict["admin.profile.notifications"],
          exact: true,
        })
        .click()
      await expect(
        page.getByText(dict["admin.profile.notifications_unavailable"], {
          exact: true,
        })
      ).toBeVisible()
      await page
        .getByRole("button", {
          name: dict["admin.profile.account_security"],
          exact: true,
        })
        .click()
      await expect(
        page.getByText(dict["admin.profile.passkeys_unavailable"], {
          exact: true,
        })
      ).toBeVisible()
      await expect(
        page.getByRole("button", {
          name: dict["admin.profile.setup_passkey"],
          exact: true,
        })
      ).toHaveCount(0)
      await page
        .getByRole("button", {
          name: dict["admin.profile.log_out"],
          exact: true,
        })
        .click()
      await expect(page.getByRole("alert")).toHaveText(
        dict["admin.profile.signout_error"]
      )
    }
  )
