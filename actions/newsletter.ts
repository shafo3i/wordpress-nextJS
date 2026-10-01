"use server";

import { addNewsletterSubscriber } from "@/lib/newsletter/db";
import { getPluginConfig } from "@/lib/plugins/config";
import { sendNewsletterWelcomeEmail } from "@/lib/email";

export async function subscribeNewsletterAction(email: string, source = "client_action") {
  try {
    const trimmed = email?.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return { success: false, error: "Please enter a valid email address." };
    }

    const { alreadySubscribed } = await addNewsletterSubscriber(trimmed, { source });

    const pluginConfig = await getPluginConfig("newsletter");
    if (pluginConfig.sendWelcomeEmail !== false && !alreadySubscribed) {
      try {
        await sendNewsletterWelcomeEmail(trimmed, pluginConfig.brandName);
      } catch (mailErr) {
        console.warn("Newsletter welcome email dispatch skipped:", mailErr);
      }
    }

    return {
      success: true,
      alreadySubscribed,
      message: alreadySubscribed
        ? "You are already subscribed to our newsletter."
        : "Thank you for subscribing! Check your inbox for confirmation.",
    };
  } catch (err: any) {
    console.error("Failed to subscribe via server action:", err);
    return { success: false, error: err?.message || "Failed to process subscription." };
  }
}
