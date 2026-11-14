import { verifyAdmin } from "@/lib/authMIddleware";
import "server-only";
import { getAllWidgetAreas, getAvailableWidgets, WidgetArea, AvailableWidgetDescriptor } from "@/lib/widgets/db";

export async function getWidgetsQuery(): Promise<{
  areas: WidgetArea[];
  availableWidgets: AvailableWidgetDescriptor[];
}> {
  await verifyAdmin();
  const [areas, availableWidgets] = await Promise.all([
    getAllWidgetAreas(undefined, true),
    getAvailableWidgets(),
  ]);

  return {
    areas,
    availableWidgets,
  };
}
