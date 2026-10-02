import { Suspense } from "react";
import { AdminShell, getAdminLanguageContext } from "@/components/admin/admin-shell";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import { getMediaLibraryItems } from "@/services/media.service";
import { MediaLibraryView } from "./_components/media-library-view";

export const dynamic = "force-dynamic";

export default async function MediaLibraryPage() {
  await verifyAdminOrEditor();

  const [langContext, initialData] = await Promise.all([
    getAdminLanguageContext(),
    getMediaLibraryItems({ page: 1, perPage: 40 }),
  ]);

  const dict = langContext.dict;
  const direction: "rtl" | "ltr" = langContext.direction === "rtl" ? "rtl" : "ltr";

  return (
    <AdminShell>
      <Suspense fallback={<div className="p-8 text-center text-xs text-[#646970]">Loading Media Library...</div>}>
        <MediaLibraryView
          initialData={initialData}
          dict={dict}
          direction={direction}
        />
      </Suspense>
    </AdminShell>
  );
}
