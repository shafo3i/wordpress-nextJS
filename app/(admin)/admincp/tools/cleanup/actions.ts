"use server";

import { revalidatePath } from "next/cache";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import {
  getDatabaseCleanupStats,
  runDatabaseCleanup,
  type CleanupStats,
} from "@/services/database-maintenance.service";

export interface DatabaseCleanupResult {
  cleanedCount: number;
  vacuumRun: boolean;
  details: Record<string, number>;
}

export async function getDatabaseCleanupStatsAction(): Promise<{
  success: boolean;
  stats?: CleanupStats;
  error?: string;
}> {
  try {
    await verifyAdminOrEditor();
    const stats = await getDatabaseCleanupStats();
    return { success: true, stats };
  } catch (error: any) {
    console.error("getDatabaseCleanupStatsAction error:", error);
    return { success: false, error: error?.message || "Failed to fetch cleanup stats" };
  }
}

export async function runDatabaseCleanupAction(
  actions: string[]
): Promise<{
  success: boolean;
  result?: DatabaseCleanupResult;
  error?: string;
}> {
  try {
    await verifyAdminOrEditor();
    const result = await runDatabaseCleanup(actions);
    revalidatePath("/admincp/tools/cleanup");
    return { success: true, result };
  } catch (error: any) {
    console.error("runDatabaseCleanupAction error:", error);
    return { success: false, error: error?.message || "Failed to run database cleanup" };
  }
}
