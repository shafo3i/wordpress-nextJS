import "dotenv/config"
import { test, expect } from "@playwright/test"
import { Client } from "pg"
import sharp from "sharp"
import { randomBytes, randomUUID } from "node:crypto"
import { hashPassword } from "better-auth/crypto"
import { promises as fs } from "node:fs"
import path from "node:path"

const baseURL = process.env.STUDIO_BASE_URL
test("Settings logo uploads, renders in both languages, and removes without changing other settings", async ({
  page,
}) => {
  test.skip(!baseURL, "Set STUDIO_BASE_URL to the local application URL.")
  test.setTimeout(90000)
  if (!["localhost", "127.0.0.1", "::1"].includes(new URL(baseURL!).hostname))
    throw new Error("Local application required")
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  const id = `logo-e2e-${randomUUID()}`,
    email = `${id}@example.test`,
    password = `${randomBytes(30).toString("base64url")}A9!`
  const original = (
    await client.query(
      "select option_value from wp_options where option_name='site_logo_id'"
    )
  ).rows[0]
  let logo: { id: string; url: string } | undefined
  const unchanged = (
    await client.query(
      "select md5(string_agg(option_name || coalesce(option_value,''),'' order by option_name)) as signature from wp_options where option_name <> 'site_logo_id'"
    )
  ).rows[0].signature
  try {
    await client.query(
      'INSERT INTO "user"(id,name,email,email_verified,role) VALUES($1,$2,$3,true,$4)',
      [id, "Logo test administrator", email, "admin"]
    )
    await client.query(
      "INSERT INTO account(id,account_id,provider_id,user_id,password,updated_at) VALUES($1,$2,$3,$4,$5,now())",
      [randomUUID(), id, "credential", id, await hashPassword(password)]
    )
    const login = await page.request.post(`${baseURL}/api/auth/sign-in/email`, {
      data: { email, password },
      headers: { Origin: baseURL! },
    })
    expect(login.status()).toBe(200)
    await page.goto(`${baseURL}/admincp/settings`)
    const buffer = await sharp({
      create: { width: 400, height: 100, channels: 4, background: "#2271b1" },
    })
      .png()
      .toBuffer()
    await page
      .getByLabel("Choose a logo image", { exact: true })
      .setInputFiles({ name: "logo-test.png", mimeType: "image/png", buffer })
    await expect(
      page.getByRole("status").filter({ hasText: "Logo selected" })
    ).toBeVisible()
    // A pending file must survive tab changes and the main form's Save Changes.
    await page
      .getByRole("button", { name: "SEO & Indexing", exact: true })
      .click()
    const uploaded = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/admin/settings/logo") &&
        response.request().method() === "POST"
    )
    await page
      .getByRole("button", { name: "Save Changes", exact: true })
      .click()
    const response = await uploaded
    expect(response.status()).toBe(200)
    logo = (await response.json()).logo
    expect(logo).toBeTruthy()
    await expect(
      page.getByText("Settings saved successfully.", { exact: true })
    ).toBeVisible()
    await page.getByRole("button", { name: "General", exact: true }).click()
    await expect(
      page.getByRole("img", { name: "Current site logo", exact: true })
    ).toHaveAttribute("src", logo!.url)
    for (const route of ["/", "/ar"]) {
      await page.goto(`${baseURL}${route}`)
      await expect(page.locator("header img")).toHaveAttribute("src", logo!.url)
      await expect(page.locator("footer img")).toHaveAttribute("src", logo!.url)
    }
    const image = await page.request.get(`${baseURL}${logo!.url}`)
    expect(image.status()).toBe(200)
    expect(image.headers()["content-type"]).toContain("image/webp")
    await page.goto(`${baseURL}/admincp/settings`)
    await page.getByRole("button", { name: "Remove logo", exact: true }).click()
    await expect(
      page.getByRole("img", { name: "Current site logo", exact: true })
    ).toHaveCount(0)
    await page.goto(`${baseURL}/`)
    await expect(page.locator("header img")).toHaveCount(0)
    await expect(page.locator("footer img")).toHaveCount(0)
    await page.goto(`${baseURL}/admincp/settings`)
    await page
      .getByLabel("Choose a logo image", { exact: true })
      .setInputFiles({
        name: "invalid.png",
        mimeType: "image/png",
        buffer: Buffer.from("not an image"),
      })
    const rejected = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/admin/settings/logo") &&
        response.request().method() === "POST"
    )
    await page
      .getByRole("button", { name: "Save Changes", exact: true })
      .click()
    expect((await rejected).status()).toBe(400)
    await expect(page.getByRole("group", { name: "Site logo", exact: true }).getByRole("alert")).toBeVisible()
    await expect(
      page.getByText("Settings saved successfully.", { exact: true })
    ).toHaveCount(0)
    expect(
      (
        await client.query(
          "select md5(string_agg(option_name || coalesce(option_value,''),'' order by option_name)) as signature from wp_options where option_name <> 'site_logo_id'"
        )
      ).rows[0].signature
    ).toBe(unchanged)
  } finally {
    // Restore only this test's option and remove only its own attachment/files.
    const current = (
      await client.query(
        "select option_value from wp_options where option_name='site_logo_id'"
      )
    ).rows[0]?.option_value
    if (current === "" || current === logo?.id) {
      if (original)
        await client.query(
          "update wp_options set option_value=$1 where option_name='site_logo_id'",
          [original.option_value]
        )
      else
        await client.query(
          "delete from wp_options where option_name='site_logo_id'"
        )
    }
    const attachments = await client.query(
      "select \"ID\"::text as id,guid from wp_posts where post_author=$1 and post_type='attachment'",
      [id]
    )
    for (const row of attachments.rows) {
      const uploads = path.resolve("public/uploads"),
        absolute = path.resolve(
          uploads,
          String(row.guid).replace(/^\/uploads\//, "")
        )
      const name = path.basename(absolute),
        prefix = path.basename(name, ".webp")
      if (
        !absolute.startsWith(uploads + path.sep) ||
        !/^site-logo-[a-f0-9-]+\.webp$/.test(name)
      )
        throw new Error("Unexpected test upload path")
      for (const filename of await fs.readdir(path.dirname(absolute))) {
        if (filename === name || filename.startsWith(prefix + "-"))
          await fs.rm(path.join(path.dirname(absolute), filename), {
            force: true,
          })
      }
      await client.query("delete from wp_postmeta where post_id=$1", [row.id])
      await client.query(
        'delete from wp_posts where "ID"=$1 and post_author=$2',
        [row.id, id]
      )
    }
    await client.query('delete from "user" where id=$1 and email=$2', [
      id,
      email,
    ])
    await client.end()
  }
})
