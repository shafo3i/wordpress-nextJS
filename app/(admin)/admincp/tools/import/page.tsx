import { AdminShell, getAdminLanguageContext } from "@/components/admin/admin-shell";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import { ImportForm } from "./_components/import-form";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  await verifyAdminOrEditor();

  const langContext = await getAdminLanguageContext();
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
                {dict["admin.tools.import"] || "Import"}
              </h1>
            </div>
            <p className="text-[13px] text-[#50575e] mt-0.5">
              {dict["admin.tools.import_page_desc"] ||
                "Upload a WordPress WXR XML export or PressForge JSON archive to import articles, pages, categories, and comments."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admincp/tools/export"
              className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#c3c4c7] bg-white px-3 py-1 text-[13px] font-medium text-[#2c3338] hover:border-[#8c8f94] transition-colors"
            >
              ← {dict["admin.tools.go_to_export"] || "Go to Export"}
            </Link>
          </div>
        </div>

        {/* Import Form */}
        <ImportForm dict={dict} />
      </div>
    </AdminShell>
  );
}
