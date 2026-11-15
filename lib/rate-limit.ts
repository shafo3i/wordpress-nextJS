import "server-only"
import { createHmac } from "node:crypto"
import type { RedisClientType } from "redis"

type Client = RedisClientType
type Connection = { client: Client; ready: Promise<Client> }
const connections = globalThis as typeof globalThis & { pressforgeRateRedis?: Connection }

export class RateLimitError extends Error {
  constructor(readonly status: 429 | 503, readonly retryAfter = 60) {
    super(status === 429 ? "admin.security.rate_limited" : "admin.security.rate_unavailable")
  }
}

// One script makes the allowance and expiration atomic across app containers.
const script = `
local maximum, window, cost = tonumber(ARGV[1]), tonumber(ARGV[2]), tonumber(ARGV[3])
local count = tonumber(redis.call('GET', KEYS[1]) or '0')
local ttl = redis.call('PTTL', KEYS[1])
if count > 0 and ttl < 0 then return redis.error_reply('invalid counter expiration') end
if count + cost > maximum then return {maximum + 1, math.max(ttl, window * (count == 0 and 1 or 0), 1)} end
if count == 0 then
  redis.call('SET', KEYS[1], cost, 'PX', window)
else
  redis.call('INCRBY', KEYS[1], cost)
end
return {count + cost, redis.call('PTTL', KEYS[1])}
`

async function bounded<T>(operation: Promise<T>, connection: Connection): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([operation, new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        try { if (connection.client.isOpen) connection.client.destroy() } catch { /* Already closed. */ }
        if (connections.pressforgeRateRedis === connection) delete connections.pressforgeRateRedis
        reject(new RateLimitError(503))
      }, 2000)
    })])
  } finally { clearTimeout(timer) }
}

async function redisConnection() {
  const url = process.env.REDIS_URL
  if (!url || !/^rediss?:\/\//.test(url)) throw new RateLimitError(503)
  if (!connections.pressforgeRateRedis) {
    const { createClient } = await import("redis")
    // The import may yield to another request; check again before opening a socket.
    if (!connections.pressforgeRateRedis) {
      const client = createClient({ url, disableOfflineQueue: true, commandsQueueMaxLength: 128,
        socket: { connectTimeout: 1500, reconnectStrategy: false } })
      // Client error events must be handled without logging credentials or URLs.
      client.on("error", () => {})
      const connection: Connection = { client, ready: Promise.resolve(client) }
      connections.pressforgeRateRedis = connection
      connection.ready = bounded(client.connect().then(() => client), connection).catch(() => {
        if (connections.pressforgeRateRedis === connection) delete connections.pressforgeRateRedis
        if (client.isOpen) client.destroy()
        throw new RateLimitError(503)
      })
    }
  }
  const connection = connections.pressforgeRateRedis
  await connection.ready
  return connection
}

type RateLimitConfig = { namespace: string; identifier: string; max: number; window: number; cost?: number }
export async function enforceRateLimit({ namespace, identifier, max, window, cost = 1 }: RateLimitConfig) {
  if (!/^[a-z0-9][a-z0-9:-]{0,79}$/.test(namespace) || !identifier || identifier.length > 1024 ||
      !Number.isSafeInteger(max) || max < 1 || max > 10000 || !Number.isSafeInteger(window) || window < 1 || window > 86400 ||
      !Number.isSafeInteger(cost) || cost < 1 || cost > 10000) throw new RateLimitError(503)
  const secret = process.env.BETTER_AUTH_SECRET
  if (!secret) throw new RateLimitError(503)
  const key = `pressforge:rl:v1:${namespace}:${createHmac("sha256", secret).update(identifier).digest("hex")}`
  try {
    const connection = await redisConnection()
    const result = await bounded(connection.client.eval(script, {
      keys: [key], arguments: [String(max), String(window * 1000), String(cost)],
    }), connection)
    if (!Array.isArray(result) || result.length !== 2) throw new RateLimitError(503)
    const [count, ttl] = result.map(Number)
    if (!Number.isSafeInteger(count) || count < 1 || count > max + 1 || !Number.isSafeInteger(ttl) || ttl < 1 || ttl > window * 1000) throw new RateLimitError(503)
    if (count > max) throw new RateLimitError(429, Math.max(1, Math.ceil(ttl / 1000)))
    return { success: true, remaining: max - count, retryAfter: 0 }
  } catch (error) {
    if (error instanceof RateLimitError) throw error
    const connection = connections.pressforgeRateRedis
    if (connection && !connection.client.isReady) {
      try { if (connection.client.isOpen) connection.client.destroy() } catch { /* Already closed. */ }
      delete connections.pressforgeRateRedis
    }
    throw new RateLimitError(503)
  }
}

// Separate work budgets keep normal autosave and browsing independent of maintenance.
const budgets = {
  write: [120, 60], autosave: [30, 60], upload: [30, 60], "logo-upload": [10, 60], "upload-bytes": [256, 60], "studio-content": [240, 60],
  import: [3, 300], export: [3, 300], scan: [2, 300], regenerate: [60, 60], cleanup: [3, 300], replace: [3, 300],
  sync: [3, 300], "email-test": [3, 60], "email-recipient": [5, 900], "email-site": [200, 3600],
  "newsletter-request": [60, 3600], "newsletter-token": [30, 60], "video-extract": [20, 60],
} as const
export async function checkCmsRateLimit(actorId: string, operation: keyof typeof budgets = "write", cost = 1) {
  if (!actorId || actorId.length > 320) throw new RateLimitError(503)
  const [max, window] = budgets[operation]
  return enforceRateLimit({ namespace: operation, identifier: actorId, max, window, cost })
}

export function rateLimitResponse(error: unknown): Response | null {
  return error instanceof RateLimitError ? Response.json({ error: error.message, retryAfter: error.retryAfter }, {
    status: error.status, headers: { "Cache-Control": "no-store", "Retry-After": String(error.retryAfter) },
  }) : null
}
