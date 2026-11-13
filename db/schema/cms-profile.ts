import { z } from "zod"
import { safeMediaUrl } from "@/lib/post-media"

export const profileUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    image: z
      .string()
      .max(2048)
      .refine((value) => value === "" || !!safeMediaUrl(value))
      .nullable()
      .optional(),
  })
  .strict()
  .refine((value) => value.name !== undefined || value.image !== undefined)
export const profilePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: z.string().min(12).max(128),
    revokeOtherSessions: z.boolean().optional(),
  })
  .strict()
