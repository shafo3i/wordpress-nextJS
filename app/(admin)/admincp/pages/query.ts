import "server-only";
import { verifyAdmin } from "@/lib/authMIddleware";
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
  await verifyAdmin();
  return getPages(options);
}

export async function getPageCountsQuery(options: { language?: string } = {}) {
  await verifyAdmin();
  return getPageCounts(options);
}

export async function getPageByIdQuery(id: bigint | string | number) {
  await verifyAdmin();
  return getPageById(id);
}

export async function getParentPagesQuery(
  excludeId?: bigint | string | number,
  language?: string
) {
  await verifyAdmin();
  return getAllParentPageOptions(excludeId, language);
}
