import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import tailwindcss from "@tailwindcss/postcss";
import en from "../templates/language/en.json" with { type: "json" };
import ar from "../templates/language/ar.json" with { type: "json" };
declare global {
  interface Window {
    UserManagementFixture: typeof import("./fixtures/user-management.fixture");
    __userXss?: boolean;
  }
}
let bundle: string;
let css: string;
test.use({ viewport: { width: 1400, height: 1100 } });
test.beforeAll(async () => {
  const require = createRequire(import.meta.url);
  const postcss = createRequire(require.resolve("@tailwindcss/postcss"))(
    "postcss"
  );
  const stylesheet = fileURLToPath(
    new URL("../app/globals.css", import.meta.url)
  );
  css = (
    await postcss([tailwindcss()]).process(await readFile(stylesheet, "utf8"), {
      from: stylesheet,
    })
  ).css;
  const result = await build({
    entryPoints: [
      fileURLToPath(
        new URL("./fixtures/user-management.fixture.tsx", import.meta.url)
      ),
    ],
    bundle: true,
    write: false,
    platform: "browser",
    format: "iife",
    jsx: "automatic",
    globalName: "UserManagementFixture",
    plugins: [
      {
        name: "user-actions",
        setup(builder) {
          builder.onResolve({ filter: /^\.\.\/action$/ }, () => ({
            path: "actions",
            namespace: "user-fixture",
          }));
          builder.onLoad({ filter: /.*/, namespace: "user-fixture" }, () => ({
            contents: `const send=(action,input)=>fetch('/fixture/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)}).then(r=>r.json());export const createUserAction=input=>send('create',input);export const resetPasswordAction=input=>send('reset',input);export const addRoleAction=input=>send('add-role',input);export const deleteRoleAction=input=>send('delete-role',input);`,
          }));
        },
      },
    ],
  });
  bundle = result.outputFiles[0].text;
});
for (const locale of ["en", "ar"] as const) {
  test(`user dialogs use safe defaults and show email delivery warnings (${locale})`, async ({
    page,
  }) => {
    const dict = locale === "ar" ? ar : en;
    const received: { action: string; input: Record<string, unknown> }[] = [];
    await page.route("http://users.test/**", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: '<div id="fixture"></div>',
      })
    );
    await page.route("**/fixture/**", async (route) => {
      const action = route.request().url().split("/").pop()!;
      const input = route.request().postDataJSON();
      received.push({ action, input });
      await route.fulfill({
        json: {
          success: true,
          id: "user-2",
          plainPassword:
            action === "reset" ? input.newPassword : "OneTimeFixture123!",
          warning: dict["admin.users.security.email_failed"],
        },
      });
    });
    await page.goto("http://users.test");
    await page.addStyleTag({ content: css });
    await page.addScriptTag({ content: bundle });
    await page.evaluate(
      (locale) => window.UserManagementFixture.render("create", locale),
      locale
    );
    const dialog = page.getByRole("dialog");
    await expect(dialog).toHaveAttribute(
      "dir",
      locale === "ar" ? "rtl" : "ltr"
    );
    await expect(dialog.locator("select")).toHaveValue("subscriber");
    await expect(
      dialog.getByText(dict["admin.users.send_notification"], { exact: true })
    ).toBeVisible();
    await dialog.locator('input[type="text"]').first().fill("Reader");
    await dialog.locator('input[type="email"]').fill("reader@example.test");
    await dialog.locator('button[type="submit"]').click();
    await expect(dialog.getByRole("status")).toHaveText(
      dict["admin.users.security.email_failed"]
    );
    expect(received[0].input.role).toBe("subscriber");
    await page.evaluate(
      (locale) => window.UserManagementFixture.render("reset", locale),
      locale
    );
    const password = dialog
      .locator('input[type="text"], input[type="password"]')
      .first();
    await expect(password).toHaveValue(/.{14}/);
    await expect(
      dialog.getByText(dict["admin.users.send_new_password_email"], {
        exact: true,
      })
    ).toBeVisible();
    await dialog.locator('button[type="submit"]').click();
    await expect(dialog.getByRole("status")).toHaveText(
      dict["admin.users.security.email_failed"]
    );
    expect(received[1].input.userId).toBe("user-2");
    expect(received[1].input).not.toHaveProperty("twoFactorEnabled");
  });
  test(`custom role labels render as text (${locale})`, async ({ page }) => {
    await page.route("http://users.test/**", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: '<div id="fixture"></div>',
      })
    );
    await page.goto("http://users.test");
    await page.addStyleTag({ content: css });
    await page.addScriptTag({ content: bundle });
    await page.evaluate(
      (locale) => window.UserManagementFixture.render("roles", locale),
      locale
    );
    await expect(
      page
        .getByRole("dialog")
        .getByText('<img src=x onerror="window.__userXss=true">', {
          exact: true,
        })
    ).toBeVisible();
    await expect(page.getByRole("dialog").locator("img")).toHaveCount(0);
    expect(await page.evaluate(() => window.__userXss)).toBeUndefined();
  });
}
