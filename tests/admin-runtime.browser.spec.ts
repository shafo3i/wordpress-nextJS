import "dotenv/config"
import { test, expect } from "@playwright/test"
import { Client } from "pg"
import { randomBytes, randomUUID } from "node:crypto"
import { hashPassword } from "better-auth/crypto"

test("authenticated Pages and Settings render without runtime failures", async ({
  page,
}) => {
  const baseURL = process.env.STUDIO_BASE_URL
  test.skip(!baseURL, "Set STUDIO_BASE_URL to the local application URL.")
  test.setTimeout(120000)
  if (
    !baseURL ||
    !["localhost", "127.0.0.1", "::1"].includes(new URL(baseURL).hostname)
  )
    throw new Error("Local application required")

  const client = new Client({ connectionString: process.env.DATABASE_URL })
  const id = `runtime-e2e-${randomUUID()}`
  const email = `${id}@example.test`
  const password = `${randomBytes(30).toString("base64url")}A9!`
  await client.connect()
  try {
    await client.query(
      'INSERT INTO "user"(id,name,email,email_verified,role) VALUES($1,$2,$3,true,$4)',
      [id, "Runtime test editor", email, "editor"]
    )
    await client.query(
      "INSERT INTO account(id,account_id,provider_id,user_id,password,updated_at) VALUES($1,$2,$3,$4,$5,now())",
      [randomUUID(), id, "credential", id, await hashPassword(password)]
    )
    const login = await page.request.post(`${baseURL}/api/auth/sign-in/email`, {
      data: { email, password },
      headers: { Origin: baseURL },
    })
    expect(login.status()).toBe(200)

    const errors: string[] = []
    page.on("pageerror", (error) => errors.push(error.message))
    for (const [route, title] of [
      ["/admincp/pages", "Pages"],
      ["/admincp/settings", "Settings"],
    ]) {
      const response = await page.goto(`${baseURL}${route}`)
      expect(response?.status()).toBe(200)
      await expect(
        page.getByRole("heading", { name: title, exact: true })
      ).toBeVisible()
      await expect(page).toHaveURL(`${baseURL}${route}`)
    }
    // Exercise client navigation as well as direct page requests.
    await page.getByRole("link", { name: "Pages", exact: true }).first().click()
    await expect(
      page.getByRole("heading", { name: "Pages", exact: true })
    ).toBeVisible()
    expect(errors).toEqual([])
  } finally {
    await client.query('delete from "user" where id=$1 and email=$2', [
      id,
      email,
    ])
    await client.end()
  }
})
