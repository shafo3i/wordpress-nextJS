import { AdminShell, getAdminLanguageContext } from "@/components/admin/admin-shell";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import { getMediaOverviewStats } from "@/services/media-tools.service";
import { MediaToolsView } from "./_components/media-tools-view";

export const dynamic = "force-dynamic";

export default async function MediaToolsPage() {
  await verifyAdminOrEditor();

  const langContext = await getAdminLanguageContext();
  const dict = langContext.dict;
  const direction: "rtl" | "ltr" = langContext.direction === "rtl" ? "rtl" : "ltr";

  const initialStats = await getMediaOverviewStats();

  return (
    <AdminShell>
      <MediaToolsView initialStats={initialStats} dict={dict} direction={direction} />
    </AdminShell>
  );
}
