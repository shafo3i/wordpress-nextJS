"use server"
import { RateLimitError } from "@/lib/rate-limit";
import { unstable_rethrow } from "next/navigation"
import { getAdminLanguageContext } from "@/components/admin/admin-shell"

import { revalidatePath } from "next/cache"
import { verifyAdmin } from "@/lib/authMIddleware"
import {
  getDatabaseCleanupStats,
  runDatabaseCleanup,
  type CleanupStats,
} from "@/services/database-maintenance.service"

export interface DatabaseCleanupResult {
  cleanedCount: number
  vacuumRun: boolean
  details: Record<string, number>
}

export async function getDatabaseCleanupStatsAction(): Promise<{
  success: boolean
  stats?: CleanupStats
  error?: string
}> {
  await verifyAdmin()
  try {
    const stats = await getDatabaseCleanupStats()
    return { success: true, stats }
  } catch (error: unknown) {
    unstable_rethrow(error)
    const { dict } = await getAdminLanguageContext()
    return { success: false, error: dict[error instanceof RateLimitError ? error.message : "admin.tools.error.failed"] || "" }
  }
}

export async function runDatabaseCleanupAction(actions: string[]): Promise<{
  success: boolean
  result?: DatabaseCleanupResult
  error?: string
}> {
  await verifyAdmin()
  try {
    const result = await runDatabaseCleanup(actions)
    revalidatePath("/admincp/tools/cleanup")
    return { success: true, result }
  } catch (error: unknown) {
    unstable_rethrow(error)
    const { dict } = await getAdminLanguageContext()
    return { success: false, error: dict[error instanceof RateLimitError ? error.message : "admin.tools.error.failed"] || "" }
  }
}
