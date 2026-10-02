"use server";

import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import {
  getSiteHealthData,
  type SiteHealthData,
} from "@/services/database-maintenance.service";

export async function fetchSiteHealthAction(): Promise<{
  success: boolean;
  data?: SiteHealthData;
  error?: string;
}> {
  try {
    await verifyAdminOrEditor();
    const data = await getSiteHealthData();
    return { success: true, data };
  } catch (error: any) {
    console.error("fetchSiteHealthAction error:", error);
    return {
      success: false,
      error: error?.message || "Failed to fetch site health data.",
    };
  }
}
