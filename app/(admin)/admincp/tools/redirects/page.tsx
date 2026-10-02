import { AdminShell, getAdminLanguageContext } from "@/components/admin/admin-shell";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import { getAllRedirects } from "@/services/redirect.service";
import { RedirectManager } from "./_components/redirect-manager";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function RedirectsPage() {
  await verifyAdminOrEditor();

  const [langContext, redirects] = await Promise.all([
    getAdminLanguageContext(),
    getAllRedirects(),
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
                {dict["admin.tools.redirects_title"] || "301 Redirects Manager"}
              </h1>
            </div>
            <p className="text-[13px] text-[#50575e] mt-0.5">
              {dict["admin.tools.redirects_subtitle"] ||
                "Manage permanent (301) and temporary (302) URL redirects to protect search rankings and fix broken links."}
            </p>
          </div>
        </div>

        {/* Manager */}
        <RedirectManager initialRedirects={redirects} dict={dict} />
      </div>
    </AdminShell>
  );
}
