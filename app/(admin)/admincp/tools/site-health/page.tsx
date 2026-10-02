import { AdminShell, getAdminLanguageContext } from "@/components/admin/admin-shell";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import { getSiteHealthData } from "@/services/database-maintenance.service";
import { SiteHealthView } from "./_components/site-health-view";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SiteHealthPage() {
  await verifyAdminOrEditor();

  const [langContext, healthData] = await Promise.all([
    getAdminLanguageContext(),
    getSiteHealthData(),
  ]);

  const dict = langContext.dict;
  const direction: "rtl" | "ltr" = langContext.direction === "rtl" ? "rtl" : "ltr";

  return (
    <AdminShell>
      <div dir={direction} className="space-y-6 text-start">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#c3c4c7] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/admincp/tools"
                className="text-[13px] text-[#2271b1] hover:underline"
              >
                {dict["admin.tools.title"] || "Tools"}
              </Link>
              <span className="text-[#646970]">/</span>
              <h1 className="text-[23px] font-normal leading-normal text-[#1d2327]">
                {dict["admin.tools.site_health"] || "Site Health"}
              </h1>
            </div>
            <p className="text-[13px] text-[#50575e] mt-0.5">
              {dict["admin.tools.site_health_desc"] ||
                "Check the health and performance status of your database, server, storage, and security."}
            </p>
          </div>
        </div>

        {/* View */}
        <SiteHealthView data={healthData} dict={dict} />
      </div>
    </AdminShell>
  );
}
