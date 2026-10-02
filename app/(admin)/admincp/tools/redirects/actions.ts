"use server";

import { revalidatePath } from "next/cache";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import {
  getAllRedirects,
  createRedirect,
  deleteRedirect,
  type RedirectItem,
} from "@/services/redirect.service";

export async function fetchRedirectsAction(): Promise<{
  success: boolean;
  redirects?: RedirectItem[];
  error?: string;
}> {
  try {
    await verifyAdminOrEditor();
    const redirects = await getAllRedirects();
    return { success: true, redirects };
  } catch (error: any) {
    console.error("fetchRedirectsAction error:", error);
    return { success: false, error: error?.message || "Failed to fetch redirects" };
  }
}

export async function createRedirectAction(payload: {
  sourcePath: string;
  targetUrl: string;
  statusCode?: 301 | 302;
  notes?: string;
}): Promise<{
  success: boolean;
  redirect?: RedirectItem;
  error?: string;
}> {
  try {
    await verifyAdminOrEditor();
    const redirect = await createRedirect({
      sourcePath: payload.sourcePath,
      targetUrl: payload.targetUrl,
      statusCode: payload.statusCode || 301,
      notes: payload.notes,
    });
    revalidatePath("/admincp/tools/redirects");
    return { success: true, redirect };
  } catch (error: any) {
    console.error("createRedirectAction error:", error);
    return { success: false, error: error?.message || "Failed to create redirect" };
  }
}

export async function deleteRedirectAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyAdminOrEditor();
    const deleted = await deleteRedirect(id);
    if (!deleted) {
      return { success: false, error: "Redirect not found." };
    }
    revalidatePath("/admincp/tools/redirects");
    return { success: true };
  } catch (error: any) {
    console.error("deleteRedirectAction error:", error);
    return { success: false, error: error?.message || "Failed to delete redirect" };
  }
}
