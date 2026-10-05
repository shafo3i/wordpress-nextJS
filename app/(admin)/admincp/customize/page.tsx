import { getAdminLanguageContext } from "@/components/admin/admin-shell";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import { getCustomizeQuery } from "./query";
import { CustomizerShell } from "./_components";

export const dynamic = "force-dynamic";

export default async function CustomizePage({
  searchParams,
}: {
  searchParams: Promise<{ theme?: string }>;
}) {
  await verifyAdminOrEditor();

  const { theme } = await searchParams;
  const langContext = await getAdminLanguageContext();
  const dict = langContext.dict;
  const direction: "rtl" | "ltr" = langContext.direction === "rtl" ? "rtl" : "ltr";

  const data = await getCustomizeQuery(theme);

  return (
    <CustomizerShell
      key={data.themeSlug}
      initialData={data}
      dict={dict}
      direction={direction}
      languages={langContext.allLanguages.map(({ code, name, nativeName }) => ({ code, name, nativeName }))}
      defaultPreviewLang={langContext.code}
    />
  );
}
