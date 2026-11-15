import { checkCmsRateLimit } from "@/lib/rate-limit"
import "server-only"
import { randomUUID } from "node:crypto"
import { db, type DB } from "@/db"
import { wpOptions } from "@/db/schema/cms-options"
import { verifyAdmin } from "@/lib/authMIddleware"
import {
  redirectIdSchema,
  redirectInputSchema,
  redirectSourceSchema,
} from "@/db/schema/cms-tools"
import { eq, sql } from "drizzle-orm"
import { z } from "zod"
export interface RedirectItem {
  id: string
  sourcePath: string
  targetUrl: string
  statusCode: 301 | 302
  notes?: string
  hits: number
  lastAccessedAt?: string
  createdAt: string
}
type RedirectDatabase = Pick<DB, "select" | "insert">
const optionName = "pressforge_redirects"
const storedSchema = redirectInputSchema.extend({
  id: redirectIdSchema,
  hits: z.number().int().nonnegative().default(0),
  lastAccessedAt: z.iso.datetime().optional(),
  createdAt: z.iso.datetime(),
})
async function read(database: RedirectDatabase = db): Promise<RedirectItem[]> {
  const [row] = await database
    .select({ optionValue: wpOptions.optionValue })
    .from(wpOptions)
    .where(eq(wpOptions.optionName, optionName))
    .limit(1)
  if (!row?.optionValue) return []
  const raw: unknown = JSON.parse(row.optionValue)
  if (!Array.isArray(raw) || raw.length > 5000)
    throw new Error("invalid_redirects")
  return raw.flatMap((value) => {
    const parsed = storedSchema.safeParse(value)
    return parsed.success ? [parsed.data] : []
  })
}
async function save(items: RedirectItem[], database: RedirectDatabase) {
  const optionValue = JSON.stringify(items)
  await database
    .insert(wpOptions)
    .values({ optionName, optionValue, autoload: "no" })
    .onConflictDoUpdate({ target: wpOptions.optionName, set: { optionValue } })
}
function checkGraph(items: RedirectItem[], source?: string) {
  const targets = new Map(
    items.map((item) => [item.sourcePath, item.targetUrl])
  )
  if (targets.size !== items.length) throw new Error("duplicate_redirect")
  for (const item of source
    ? items.filter((item) => item.sourcePath === source)
    : items) {
    const visited = new Set<string>()
    let current: string | undefined = item.sourcePath
    for (let depth = 0; current; depth++) {
      if (visited.has(current) || depth >= 32) throw new Error("redirect_loop")
      visited.add(current)
      const target = targets.get(current)
      current = target?.startsWith("/")
        ? redirectSourceSchema.safeParse(
            new URL(target, "https://local.invalid").pathname
          ).data
        : undefined
    }
  }
}
export async function getAllRedirects(): Promise<RedirectItem[]> {
  await verifyAdmin()
  return read()
}
export async function findMatchingRedirect(
  path: string
): Promise<Pick<RedirectItem, "id" | "targetUrl" | "statusCode"> | null> {
  const parsed = redirectSourceSchema.safeParse(path)
  if (!parsed.success) return null
  const list = await read()
  const item = list.find((item) => item.sourcePath === parsed.data)
  if (!item) return null
  // Reject malformed legacy chains at the public boundary too.
  try {
    checkGraph(list, parsed.data)
  } catch {
    return null
  }
  return { id: item.id, targetUrl: item.targetUrl, statusCode: item.statusCode }
}
export async function createRedirect(
  data: Omit<RedirectItem, "id" | "hits" | "createdAt" | "lastAccessedAt">
): Promise<RedirectItem> {
  const rateActor = await verifyAdmin()
  await checkCmsRateLimit(rateActor.user.id, "write")
  const parsed = redirectInputSchema.parse(data)
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext('pressforge:redirects'))`
    )
    const list = await read(tx)
    if (list.length >= 5000) throw new Error("redirect_limit")
    const item = {
      ...parsed,
      id: randomUUID(),
      hits: 0,
      createdAt: new Date().toISOString(),
    }
    list.unshift(item)
    checkGraph(list)
    await save(list, tx)
    return item
  })
}
export async function updateRedirect(
  id: string,
  data: Partial<Omit<RedirectItem, "id" | "hits" | "createdAt">>
): Promise<RedirectItem> {
  const rateActor = await verifyAdmin()
  await checkCmsRateLimit(rateActor.user.id, "write")
  redirectIdSchema.parse(id)
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext('pressforge:redirects'))`
    )
    const list = await read(tx)
    const index = list.findIndex((item) => item.id === id)
    if (index < 0) throw new Error("missing_redirect")
    const item = {
      ...list[index],
      ...redirectInputSchema.parse({ ...list[index], ...data }),
    }
    list[index] = item
    checkGraph(list)
    await save(list, tx)
    return item
  })
}
export async function deleteRedirect(id: string): Promise<boolean> {
  const rateActor = await verifyAdmin()
  await checkCmsRateLimit(rateActor.user.id, "write")
  redirectIdSchema.parse(id)
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext('pressforge:redirects'))`
    )
    const list = await read(tx)
    const next = list.filter((item) => item.id !== id)
    if (next.length === list.length) return false
    await save(next, tx)
    return true
  })
}
export async function recordRedirectHit(id: string): Promise<void> {
  redirectIdSchema.parse(id)
  // Private notes and the redirect list never leave the service. Serialize this
  // counter update with administration so a hit cannot overwrite a saved rule.
  await db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext('pressforge:redirects'))`
    )
    const list = await read(tx)
    const item = list.find((item) => item.id === id)
    if (!item) return
    item.hits = Math.min(Number.MAX_SAFE_INTEGER, item.hits + 1)
    item.lastAccessedAt = new Date().toISOString()
    await save(list, tx)
  })
}
