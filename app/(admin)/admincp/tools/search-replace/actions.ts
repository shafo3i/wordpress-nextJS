"use server"
import { RateLimitError } from "@/lib/rate-limit";
import { unstable_rethrow } from "next/navigation"
import { getAdminLanguageContext } from "@/components/admin/admin-shell"

import { revalidatePath } from "next/cache"
import { verifyAdmin } from "@/lib/authMIddleware"
import {
  searchAndReplace,
  type SearchReplaceResult,
} from "@/services/database-maintenance.service"

export async function runSearchReplaceAction(payload: {
  search: string
  replace: string
  dryRun?: boolean
  tables?: string[]
}): Promise<{
  success: boolean
  result?: SearchReplaceResult
  error?: string
}> {
  await verifyAdmin()
  try {
    const result = await searchAndReplace(payload)
    if (!result.dryRun) {
      revalidatePath("/", "layout")
    }
    return { success: true, result }
  } catch (error: unknown) {
    unstable_rethrow(error)
    const { dict } = await getAdminLanguageContext()
    return { success: false, error: dict[error instanceof RateLimitError ? error.message : "admin.tools.error.failed"] || "" }
  }
}
