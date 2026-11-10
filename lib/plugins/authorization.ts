import { verifyAdminOrEditor } from "@/lib/authMIddleware"

export async function verifyPluginAdministrator() {
  const session = await verifyAdminOrEditor()
  if (session.user.role !== "admin") throw new Error("admin.plugins.forbidden")
  return session
}
