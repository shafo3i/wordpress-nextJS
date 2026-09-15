import { getCustomizerData } from "@/lib/themes/customizer";
import { CustomizerShell } from "@/components/admin/customize/customizer-shell";

export const dynamic = "force-dynamic";

export default async function CustomizePage({
  searchParams,
}: {
  searchParams: Promise<{ theme?: string }>;
}) {
  const { theme } = await searchParams;
  const data = await getCustomizerData(theme);

  return <CustomizerShell key={data.themeSlug} initialData={data} />;
}
