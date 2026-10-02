"use server";

import { revalidatePath } from "next/cache";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import {
  getMediaOverviewStats,
  regenerateThumbnails,
  scanOrphanMedia,
  cleanOrphanMedia,
  seedSampleMedia,
  type MediaOverviewStats,
  type OrphanScanResult,
} from "@/services/media-tools.service";

export async function getMediaStatsAction(): Promise<{
  success: boolean;
  stats?: MediaOverviewStats;
  error?: string;
}> {
  try {
    await verifyAdminOrEditor();
    const stats = await getMediaOverviewStats();
    return { success: true, stats };
  } catch (error: any) {
    console.error("getMediaStatsAction error:", error);
    return { success: false, error: error?.message || "Failed to fetch media stats" };
  }
}

export async function regenerateThumbnailsAction(options: {
  generateWebp?: boolean;
  onlyMissing?: boolean;
  attachmentIds?: number[];
}): Promise<{
  success: boolean;
  data?: {
    processed: number;
    totalSizesGenerated: number;
    details: Array<{
      id: number;
      title: string;
      sizesCreated: string[];
      success: boolean;
      error?: string;
    }>;
  };
  error?: string;
}> {
  try {
    await verifyAdminOrEditor();
    const result = await regenerateThumbnails(options);
    revalidatePath("/admincp/tools/media");
    revalidatePath("/admincp/media");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("regenerateThumbnailsAction error:", error);
    return { success: false, error: error?.message || "Failed to regenerate thumbnails" };
  }
}

export async function scanOrphanMediaAction(): Promise<{
  success: boolean;
  data?: OrphanScanResult;
  error?: string;
}> {
  try {
    await verifyAdminOrEditor();
    const result = await scanOrphanMedia();
    return { success: true, data: result };
  } catch (error: any) {
    console.error("scanOrphanMediaAction error:", error);
    return { success: false, error: error?.message || "Failed to scan orphan media" };
  }
}

export async function cleanOrphanMediaAction(
  filePaths: string[],
  action: "quarantine" | "delete"
): Promise<{
  success: boolean;
  data?: {
    cleanedCount: number;
    reclaimedBytes: number;
    actionTaken: "quarantine" | "delete";
  };
  error?: string;
}> {
  try {
    await verifyAdminOrEditor();
    const result = await cleanOrphanMedia(filePaths, action);
    revalidatePath("/admincp/tools/media");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("cleanOrphanMediaAction error:", error);
    return { success: false, error: error?.message || "Failed to clean orphan media" };
  }
}

export async function seedSampleMediaAction(): Promise<{
  success: boolean;
  createdCount?: number;
  error?: string;
}> {
  try {
    await verifyAdminOrEditor();
    const result = await seedSampleMedia();
    revalidatePath("/admincp/tools/media");
    revalidatePath("/admincp/media");
    return { success: true, createdCount: result.createdCount };
  } catch (error: any) {
    console.error("seedSampleMediaAction error:", error);
    return { success: false, error: error?.message || "Failed to seed demo media" };
  }
}
