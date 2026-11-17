import { z } from "zod"

const deliveryUrl = z.string().max(2048).refine(value => {
  if (!value) return true
  try {
    const url = new URL(value)
    return url.protocol === "https:" && !url.username && !url.password && !url.search && !url.hash && !url.port &&
      /^[a-z0-9.-]+$/i.test(url.hostname) && url.hostname.includes(".") && !/^[\d.]+$/.test(url.hostname) &&
      !/(?:^|\.)(?:localhost|local|internal|invalid)$/.test(url.hostname) &&
      !/[\\\u0000-\u0020]/.test(value) && !/%2e|%2f|%5c/i.test(url.pathname)
  } catch { return false }
}).transform(value => value ? new URL(value).href.replace(/\/$/, "") : "")
const endpoint = deliveryUrl.refine(value => !value || new URL(value).pathname === "/")
export const mediaUploadDestinationSchema = z.enum(["local", "s3"]).default("local")
export const mediaStorageSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  endpoint: endpoint.default(""),
  region: z.string().max(80).regex(/^[a-z0-9-]*$/).default(""),
  bucket: z.string().max(63).refine(value => !value || (/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(value) && !value.includes("..") && !/^[\d.]+$/.test(value))).default(""),
  prefix: z.string().max(200).regex(/^(?:[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*)?$/).default("media"),
  publicBaseUrl: deliveryUrl.default(""),
}).strict().refine(value => !value.enabled || !!(value.endpoint && value.region && value.bucket && value.publicBaseUrl))
export const mediaStoragePatchSchema = z.object({
  settings: mediaStorageSettingsSchema,
  accessKeyId: z.string().trim().max(200).default(""),
  secretAccessKey: z.string().max(500).default(""),
}).strict()
export type MediaStorageSettings = z.infer<typeof mediaStorageSettingsSchema>
export type MediaStorageAdminView = MediaStorageSettings & { credentialsConfigured: boolean }
