import { verifyAdmin } from "@/lib/authMIddleware"

export async function verifyPluginAdministrator() {
  const session = await verifyAdmin()
  if (session.user.role !== "admin" || session.user.banned)
    throw new Error("admin.plugins.forbidden")
  return session
}
