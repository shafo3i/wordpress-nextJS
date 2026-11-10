import "dotenv/config"
import { Client } from "pg"
import { randomUUID } from "node:crypto"
import { z } from "zod"

// Explicit maintenance step: never run schema changes from web requests.
const client = new Client({ connectionString: process.env.DATABASE_URL })
try {
  await client.connect()
  await client.query("BEGIN")
  await client.query(`CREATE TABLE IF NOT EXISTS cms_newsletter_subscribers (
    email text PRIMARY KEY, id text NOT NULL UNIQUE, name text, source text, locale text,
    status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','unsubscribed')),
    subscribed_at timestamp NOT NULL DEFAULT now(), confirmation_hash text,
    confirmation_expires timestamp, next_request_at timestamp
  )`)
  await client.query(
    `CREATE TABLE IF NOT EXISTS cms_newsletter_rate_limits (key text PRIMARY KEY, count integer NOT NULL, resets_at timestamp NOT NULL)`
  )
  const { rows } = await client.query(
    "SELECT option_value FROM wp_options WHERE option_name='newsletter_subscribers' LIMIT 1"
  )
  const legacy: unknown = JSON.parse(rows[0]?.option_value || "[]")
  if (!Array.isArray(legacy))
    throw new Error("Invalid legacy subscriber data; migration rolled back")
  let imported = 0,
    skipped = 0
  for (const row of legacy) {
    const parsed = z
      .object({
        email: z.string().trim().email().max(254),
        name: z.string().max(150).optional(),
        source: z.string().max(100).optional(),
        locale: z.string().max(20).optional(),
        status: z.enum(["active", "unsubscribed"]),
        subscribedAt: z.string().datetime().optional(),
      })
      .safeParse(row)
    if (!parsed.success) {
      skipped++
      continue
    }
    const r = parsed.data
    const result = await client.query(
      "INSERT INTO cms_newsletter_subscribers (email,id,name,source,locale,status,subscribed_at) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(email) DO NOTHING",
      [
        r.email.toLowerCase(),
        randomUUID(),
        r.name,
        r.source,
        r.locale,
        r.status,
        r.subscribedAt || new Date().toISOString(),
      ]
    )
    imported += result.rowCount || 0
  }
  await client.query("COMMIT")
  console.log(
    `Newsletter migration complete: ${imported} imported, ${skipped} invalid entries skipped. Legacy option retained.`
  )
} catch (error) {
  await client.query("ROLLBACK").catch(() => {})
  console.error(
    error instanceof Error ? error.message : "Newsletter migration failed"
  )
  process.exitCode = 1
} finally {
  await client.end()
}
