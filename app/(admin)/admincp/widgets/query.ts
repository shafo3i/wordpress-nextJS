import { verifyAdmin } from "@/lib/authMIddleware";
import "server-only";
import { getAllWidgetAreas, getAvailableWidgets, WidgetArea, AvailableWidgetDescriptor } from "@/lib/widgets/db";
import { getAllCategoriesOptions, type CategoryOption } from "@/services/post.service";

export async function getWidgetsQuery(): Promise<{
  areas: WidgetArea[];
  availableWidgets: AvailableWidgetDescriptor[];
  categories: CategoryOption[];
}> {
  await verifyAdmin();
  const [areas, availableWidgets, categories] = await Promise.all([
    getAllWidgetAreas(undefined, true),
    getAvailableWidgets(),
    getAllCategoriesOptions(),
  ]);

  return {
    areas,
    availableWidgets,
    categories,
  };
}
