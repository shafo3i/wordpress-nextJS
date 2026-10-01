"use server";

import { revalidatePath } from "next/cache";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import { setOptions, type SettingsMap } from "@/services/settings.service";

export type SaveSettingsResult =
  | { success: true; message?: string }
  | { success: false; error: string };

export async function saveSettingsAction(
  entries: SettingsMap
): Promise<SaveSettingsResult> {
  try {
    await verifyAdminOrEditor();

    // Sanitize and save entries
    await setOptions(entries);

    revalidatePath("/admincp/settings");
    revalidatePath("/admincp/customize");
    revalidatePath("/admincp/themes");
    revalidatePath("/admincp");
    revalidatePath("/", "layout");
    revalidatePath("/[slug]", "page");
    revalidatePath("/posts/[slug]", "page");

    return { success: true, message: "Settings saved successfully." };
  } catch (error: any) {
    console.error("Failed to save settings:", error);
    return {
      success: false,
      error: error?.message || "Failed to save settings.",
    };
  }
}

export async function sendTestEmailAction(
  targetEmail: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    await verifyAdminOrEditor();
    if (!targetEmail || !targetEmail.includes("@")) {
      return { success: false, error: "Please enter a valid email address." };
    }
    const { sendTestEmail } = await import("@/lib/email");
    const res = await sendTestEmail(targetEmail);
    if (!res.success) {
      return { success: false, error: res.error || "Failed to dispatch test email." };
    }
    return { success: true, message: "Test email dispatched successfully! Check your inbox." };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to send test email." };
  }
}
