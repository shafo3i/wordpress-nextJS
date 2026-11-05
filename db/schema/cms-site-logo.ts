import { z } from "zod"

export const siteLogoIdSchema = z
  .string()
  .regex(/^$|^[1-9][0-9]{0,18}$/)
  .refine(
    (value) =>
      value === "" ||
      (/^[1-9][0-9]{0,18}$/.test(value) &&
        BigInt(value) <= BigInt("9223372036854775807"))
  )
export const SITE_LOGO_MAX_BYTES = 2 * 1024 * 1024
export const SITE_LOGO_ACCEPT = "image/png,image/jpeg,image/webp"
