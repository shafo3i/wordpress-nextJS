import { APIError, createAuthMiddleware } from "better-auth/api"
import {
  profileUpdateSchema,
  profilePasswordSchema,
} from "@/db/schema/cms-profile"

/** Apply the same policy to HTTP and server-side Better Auth calls. */
export const profileAuthBefore = createAuthMiddleware(async (ctx) => {
  if (ctx.path === "/update-user") {
    const result = profileUpdateSchema.safeParse(ctx.body)
    if (!result.success)
      throw new APIError("BAD_REQUEST", { message: "INVALID_PROFILE_INPUT" })
    return { context: { body: result.data } }
  }
  if (ctx.path === "/change-password") {
    const result = profilePasswordSchema.safeParse(ctx.body)
    if (!result.success)
      throw new APIError("BAD_REQUEST", { message: "INVALID_PASSWORD_INPUT" })
    return { context: { body: { ...result.data, revokeOtherSessions: true } } }
  }
})
