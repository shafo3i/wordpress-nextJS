import {
  AdminShell,
  getAdminLanguageContext,
} from "@/components/admin/admin-shell"
import { verifyAdmin } from "@/lib/authMIddleware"
import { getToolsExportData } from "../query"
import { ExportForm } from "./_components/export-form"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function ExportPage() {
  await verifyAdmin()

  const [langContext, toolsData] = await Promise.all([
    getAdminLanguageContext(),
    getToolsExportData(),
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
                {dict["admin.tools.export"] || ""}
              </h1>
            </div>
            <p className="mt-0.5 text-[13px] text-[#50575e]">
              {dict["admin.tools.export_page_desc"] || ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admincp/tools/import"
              className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#c3c4c7] bg-white px-3 py-1 text-[13px] font-medium text-[#2c3338] transition-colors hover:border-[#8c8f94]"
            >
              {dict["admin.tools.go_to_import"] || ""} →
            </Link>
          </div>
        </div>

        {/* Export Form */}
        <ExportForm
          categories={toolsData.categories}
          authors={toolsData.authors}
          stats={toolsData.stats}
          dict={dict}
        />
      </div>
    </AdminShell>
  )
}
