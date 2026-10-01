"use server";

import { revalidatePath } from "next/cache";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import { savePluginConfig } from "@/lib/plugins/config";
import { removeNewsletterSubscriber, clearAllNewsletterSubscribers } from "@/lib/newsletter/db";

export async function savePluginConfigAction(slug: string, config: Record<string, any>) {
  try {
    await verifyAdminOrEditor();
    await savePluginConfig(slug, config);

    revalidatePath(`/admincp/plugins/${slug}`);
    revalidatePath("/admincp/plugins");
    revalidatePath("/", "layout");
    revalidatePath("/posts/[slug]", "page");

    return { success: true };
  } catch (err: any) {
    console.error("Failed to save plugin config:", err);
    return { success: false, error: err?.message || "Failed to save plugin configuration." };
  }
}

export async function deleteSubscriberAction(email: string) {
  try {
    await verifyAdminOrEditor();
    await removeNewsletterSubscriber(email);
    revalidatePath("/admincp/plugins/newsletter");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to delete subscriber." };
  }
}

export async function clearSubscribersAction() {
  try {
    await verifyAdminOrEditor();
    await clearAllNewsletterSubscribers();
    revalidatePath("/admincp/plugins/newsletter");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to clear subscribers." };
  }
}
