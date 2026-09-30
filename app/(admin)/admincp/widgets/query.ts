import { getAllWidgetAreas, getAvailableWidgets, WidgetArea, AvailableWidgetDescriptor } from "@/lib/widgets/db";

export async function getWidgetsQuery(): Promise<{
  areas: WidgetArea[];
  availableWidgets: AvailableWidgetDescriptor[];
}> {
  const [areas, availableWidgets] = await Promise.all([
    getAllWidgetAreas(),
    getAvailableWidgets(),
  ]);

  return {
    areas,
    availableWidgets,
  };
}
