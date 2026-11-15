import {
  AdminShell,
  getAdminLanguageContext,
} from "@/components/admin/admin-shell"
import { verifyAdmin } from "@/lib/authMIddleware"
import { getDatabaseCleanupStats } from "@/services/database-maintenance.service"
import { CleanupForm } from "./_components/cleanup-form"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function CleanupPage() {
  await verifyAdmin()

  const [langContext, stats] = await Promise.all([
    getAdminLanguageContext(),
    getDatabaseCleanupStats(),
  ])

  const dict = langContext.dict
  const direction: "rtl" | "ltr" =
    langContext.direction === "rtl" ? "rtl" : "ltr"

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
                {dict["admin.tools.title"] || ""}
              </Link>
              <span className="text-[#646970]">/</span>
              <h1 className="text-[23px] leading-normal font-normal text-[#1d2327]">
                {dict["admin.tools.cleanup_title"] || ""}
              </h1>
            </div>
            <p className="mt-0.5 text-[13px] text-[#50575e]">
              {dict["admin.tools.cleanup_subtitle"] || ""}
            </p>
          </div>
        </div>

        {/* Form */}
        <CleanupForm initialStats={stats} dict={dict} />
      </div>
    </AdminShell>
  )
}
