import { NextResponse } from "next/server";
import { addNewsletterSubscriber } from "@/lib/newsletter/db";
import { getPluginConfig } from "@/lib/plugins/config";
import { sendNewsletterWelcomeEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = body?.email?.trim();
    const name = body?.name?.trim();
    const source = body?.source?.trim() || "website_form";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    // Persist subscriber into the database
    const { success, alreadySubscribed } = await addNewsletterSubscriber(email, {
      name,
      source,
    });

    // Check plugin configuration for welcome email dispatch
    const pluginConfig = await getPluginConfig("newsletter");
    if (pluginConfig.sendWelcomeEmail !== false && !alreadySubscribed) {
      try {
        await sendNewsletterWelcomeEmail(email, name || pluginConfig.brandName);
      } catch (mailErr) {
        console.warn("Newsletter welcome email dispatch skipped or SMTP not configured:", mailErr);
      }
    }

    return NextResponse.json({
      success: true,
      alreadySubscribed,
      message: alreadySubscribed
        ? "You are already subscribed to our newsletter."
        : "Thank you for subscribing! Check your inbox for confirmation.",
    });
  } catch (error: any) {
    console.error("Newsletter subscription error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error." },
      { status: 500 }
    );
  }
}
