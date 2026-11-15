"use server"
import { RateLimitError } from "@/lib/rate-limit";
import { unstable_rethrow } from "next/navigation"
import { getAdminLanguageContext } from "@/components/admin/admin-shell"

import { verifyAdmin } from "@/lib/authMIddleware"
import {
  getSiteHealthData,
  type SiteHealthData,
} from "@/services/database-maintenance.service"

export async function fetchSiteHealthAction(): Promise<{
  success: boolean
  data?: SiteHealthData
  error?: string
}> {
  await verifyAdmin()
  try {
    const data = await getSiteHealthData()
    return { success: true, data }
  } catch (error: unknown) {
    unstable_rethrow(error)
    const { dict } = await getAdminLanguageContext()
    return {
      success: false,
      error: dict[error instanceof RateLimitError ? error.message : "admin.tools.error.failed"] || "",
    }
  }
}

export async function scanSiteStorageAction(): Promise<{
  success: boolean
  data?: SiteHealthData
  error?: string
}> {
  await verifyAdmin()
  try {
    return {
      success: true,
      data: await getSiteHealthData({ includeStorageInventory: true }),
    }
  } catch (error: unknown) {
    unstable_rethrow(error)
    const { dict } = await getAdminLanguageContext()
    return { success: false, error: dict[error instanceof RateLimitError ? error.message : "admin.tools.error.failed"] || "" }
  }
}
