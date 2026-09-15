import { AdminShell } from "@/components/admin/admin-shell";
import { getAllWidgetAreas, getAvailableWidgets } from "@/lib/widgets/db";
import { WidgetsManagerShell } from "@/components/admin/widgets/widgets-manager-shell";

export const dynamic = "force-dynamic";

export default async function WidgetsPage() {
  const [areas, availableWidgets] = await Promise.all([
    getAllWidgetAreas(),
    getAvailableWidgets(),
  ]);

  return (
    <AdminShell>
      <WidgetsManagerShell initialAreas={areas} availableWidgets={availableWidgets} />
    </AdminShell>
  );
}
