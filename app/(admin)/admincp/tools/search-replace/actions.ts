"use server";

import { revalidatePath } from "next/cache";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import {
  searchAndReplace,
  type SearchReplaceResult,
} from "@/services/database-maintenance.service";

export async function runSearchReplaceAction(payload: {
  search: string;
  replace: string;
  dryRun?: boolean;
  tables?: string[];
}): Promise<{
  success: boolean;
  result?: SearchReplaceResult;
  error?: string;
}> {
  try {
    await verifyAdminOrEditor();
    const result = await searchAndReplace(payload);
    if (!payload.dryRun) {
      revalidatePath("/", "layout");
    }
    return { success: true, result };
  } catch (error: any) {
    console.error("runSearchReplaceAction error:", error);
    return { success: false, error: error?.message || "Failed to execute search and replace" };
  }
}
