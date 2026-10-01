import { notFound } from "next/navigation";
import { AdminShell, getAdminLanguageContext } from "@/components/admin/admin-shell";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import { AVAILABLE_PLUGINS } from "@/plugins/registry";
import { getPluginConfig } from "@/lib/plugins/config";
import { getNewsletterSubscribers } from "@/lib/newsletter/db";
import { PluginConfigForm } from "./_components/plugin-config-form";

export const dynamic = "force-dynamic";

interface PluginSettingsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PluginSettingsPage({ params }: PluginSettingsPageProps) {
  await verifyAdminOrEditor();

  const { slug } = await params;
  const pluginModule = AVAILABLE_PLUGINS[slug];

  if (!pluginModule) {
    notFound();
  }

  const langContext = await getAdminLanguageContext();
  const config = await getPluginConfig(slug);
  const subscribers = slug === "newsletter" ? await getNewsletterSubscribers() : [];

  return (
    <AdminShell>
      <PluginConfigForm
        slug={slug}
        manifest={pluginModule.manifest}
        config={config}
        subscribers={subscribers}
        dict={langContext.dict}
        direction={(langContext.direction === "rtl" ? "rtl" : "ltr") as "rtl" | "ltr"}
      />
    </AdminShell>
  );
}
