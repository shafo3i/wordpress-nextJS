import { AdminShell, getAdminLanguageContext } from "@/components/admin/admin-shell";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import { getSettingsQuery } from "./query";
import { SettingsForm } from "./_components/settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await verifyAdminOrEditor();

  const [langContext, settings] = await Promise.all([
    getAdminLanguageContext(),
    getSettingsQuery(),
  ]);

  const dict = langContext.dict;
  const direction: "rtl" | "ltr" = langContext.direction === "rtl" ? "rtl" : "ltr";

  return (
    <AdminShell>
      <div dir={direction} className="space-y-4 text-start">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#c3c4c7] pb-3">
          <h1 className="text-[23px] font-normal leading-normal text-[#1d2327]">
            {dict["admin.settings.title"] || "Settings"}
          </h1>
          <div className="flex items-center gap-1 text-[13px]">
            <button
              className="flex items-center gap-1 rounded-b-[4px] border border-[#c3c4c7] bg-white px-2.5 py-0.5 text-[#50575e] hover:border-[#8c8f94] hover:text-[#1d2327]"
              type="button"
            >
              {dict["admin.common.help"] || "Help"} <span className="text-[9px]">▼</span>
            </button>
          </div>
        </div>

        {/* Settings Form */}
        <SettingsForm
          initialSettings={settings}
          dict={dict}
          direction={direction}
        />
      </div>
    </AdminShell>
  );
}
