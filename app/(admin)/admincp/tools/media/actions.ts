"use server"
import { RateLimitError } from "@/lib/rate-limit";
import { unstable_rethrow } from "next/navigation"
import { getAdminLanguageContext } from "@/components/admin/admin-shell"

import { revalidatePath } from "next/cache"
import { verifyAdmin } from "@/lib/authMIddleware"
import {
  getMediaOverviewStats,
  regenerateThumbnails,
  scanOrphanMedia,
  cleanOrphanMedia,
  seedSampleMedia,
  type MediaOverviewStats,
  type OrphanScanResult,
} from "@/services/media-tools.service"

export async function getMediaStatsAction(): Promise<{
  success: boolean
  stats?: MediaOverviewStats
  error?: string
}> {
  await verifyAdmin()
  try {
    const stats = await getMediaOverviewStats({ scanFiles: true })
    return { success: true, stats }
  } catch (error: unknown) {
    unstable_rethrow(error)
    const { dict } = await getAdminLanguageContext()
    return { success: false, error: dict[error instanceof RateLimitError ? error.message : "admin.tools.error.failed"] || "" }
  }
}

export async function regenerateThumbnailsAction(options: {
  afterId?: number
  generateWebp?: boolean
  onlyMissing?: boolean
  attachmentIds?: number[]
}): Promise<{
  success: boolean
  data?: {
    nextAfterId?: number
    processed: number
    totalSizesGenerated: number
    details: Array<{
      id: number
      title: string
      sizesCreated: string[]
      success: boolean
      error?: string
    }>
  }
  error?: string
}> {
  await verifyAdmin()
  try {
    const result = await regenerateThumbnails(options)
    revalidatePath("/admincp/tools/media")
    revalidatePath("/admincp/media")
    return { success: true, data: result }
  } catch (error: unknown) {
    unstable_rethrow(error)
    const { dict } = await getAdminLanguageContext()
    return { success: false, error: dict[error instanceof RateLimitError ? error.message : "admin.tools.error.failed"] || "" }
  }
}

export async function scanOrphanMediaAction(): Promise<{
  success: boolean
  data?: OrphanScanResult
  error?: string
}> {
  await verifyAdmin()
  try {
    const result = await scanOrphanMedia()
    return { success: true, data: result }
  } catch (error: unknown) {
    unstable_rethrow(error)
    const { dict } = await getAdminLanguageContext()
    return { success: false, error: dict[error instanceof RateLimitError ? error.message : "admin.tools.error.failed"] || "" }
  }
}

export async function cleanOrphanMediaAction(
  filePaths: string[],
  action: "quarantine" | "delete"
): Promise<{
  success: boolean
  data?: {
    cleanedCount: number
    reclaimedBytes: number
    failedCount: number
    actionTaken: "quarantine" | "delete"
  }
  error?: string
}> {
  await verifyAdmin()
  try {
    const result = await cleanOrphanMedia(filePaths, action)
    revalidatePath("/admincp/tools/media")
    return { success: true, data: result }
  } catch (error: unknown) {
    unstable_rethrow(error)
    const { dict } = await getAdminLanguageContext()
    return { success: false, error: dict[error instanceof RateLimitError ? error.message : "admin.tools.error.failed"] || "" }
  }
}

export async function seedSampleMediaAction(): Promise<{
  success: boolean
  createdCount?: number
  error?: string
}> {
  await verifyAdmin()
  try {
    const result = await seedSampleMedia()
    revalidatePath("/admincp/tools/media")
    revalidatePath("/admincp/media")
    return { success: true, createdCount: result.createdCount }
  } catch (error: unknown) {
    unstable_rethrow(error)
    const { dict } = await getAdminLanguageContext()
    return { success: false, error: dict[error instanceof RateLimitError ? error.message : "admin.tools.error.failed"] || "" }
  }
}
