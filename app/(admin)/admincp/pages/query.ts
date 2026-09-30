import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import {
  getPages,
  getPageCounts,
  getPageById,
  getAllParentPageOptions,
  GetPagesOptions,
  PageItem,
  PageCounts,
} from "@/services/page.service";

export type { PageItem, PageCounts, GetPagesOptions };

export async function getPagesQuery(options: GetPagesOptions = {}) {
  await verifyAdminOrEditor();
  return getPages(options);
}

export async function getPageCountsQuery(options: { language?: string } = {}) {
  await verifyAdminOrEditor();
  return getPageCounts(options);
}

export async function getPageByIdQuery(id: bigint | string | number) {
  await verifyAdminOrEditor();
  return getPageById(id);
}

export async function getParentPagesQuery(
  excludeId?: bigint | string | number,
  language?: string
) {
  await verifyAdminOrEditor();
  return getAllParentPageOptions(excludeId, language);
}
