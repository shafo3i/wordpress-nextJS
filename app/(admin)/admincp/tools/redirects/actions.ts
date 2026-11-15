"use server"
import { RateLimitError } from "@/lib/rate-limit";
import { unstable_rethrow } from "next/navigation"
import { getAdminLanguageContext } from "@/components/admin/admin-shell"

import { revalidatePath } from "next/cache"
import { verifyAdmin } from "@/lib/authMIddleware"
import {
  getAllRedirects,
  createRedirect,
  deleteRedirect,
  type RedirectItem,
} from "@/services/redirect.service"

export async function fetchRedirectsAction(): Promise<{
  success: boolean
  redirects?: RedirectItem[]
  error?: string
}> {
  await verifyAdmin()
  try {
    const redirects = await getAllRedirects()
    return { success: true, redirects }
  } catch (error: unknown) {
    unstable_rethrow(error)
    const { dict } = await getAdminLanguageContext()
    return { success: false, error: dict[error instanceof RateLimitError ? error.message : "admin.tools.error.failed"] || "" }
  }
}

export async function createRedirectAction(payload: {
  sourcePath: string
  targetUrl: string
  statusCode?: 301 | 302
  notes?: string
}): Promise<{
  success: boolean
  redirect?: RedirectItem
  error?: string
}> {
  await verifyAdmin()
  try {
    const redirect = await createRedirect({
      sourcePath: payload.sourcePath,
      targetUrl: payload.targetUrl,
      statusCode: payload.statusCode || 301,
      notes: payload.notes,
    })
    revalidatePath("/admincp/tools/redirects")
    return { success: true, redirect }
  } catch (error: unknown) {
    unstable_rethrow(error)
    const { dict } = await getAdminLanguageContext()
    return { success: false, error: dict[error instanceof RateLimitError ? error.message : "admin.tools.error.failed"] || "" }
  }
}

export async function deleteRedirectAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  await verifyAdmin()
  try {
    const deleted = await deleteRedirect(id)
    if (!deleted) {
      const { dict } = await getAdminLanguageContext()
      return { success: false, error: dict["admin.tools.error.invalid"] || "" }
    }
    revalidatePath("/admincp/tools/redirects")
    return { success: true }
  } catch (error: unknown) {
    unstable_rethrow(error)
    const { dict } = await getAdminLanguageContext()
    return { success: false, error: dict[error instanceof RateLimitError ? error.message : "admin.tools.error.failed"] || "" }
  }
}
