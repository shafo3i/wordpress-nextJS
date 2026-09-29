import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import {
  getAllTags as getTagsFromService,
  getTagCounts as getCountsFromService,
  getTagById as getTagByIdFromService,
  GetTagsOptions,
  TagItem,
  TagCounts,
} from "@/services/tag.service";

export type { TagItem, TagCounts };

export async function getTags(
  options: GetTagsOptions = {}
): Promise<{ tags: TagItem[]; total: number }> {
  await verifyAdminOrEditor();
  return getTagsFromService(options);
}

export async function getTagCounts(): Promise<TagCounts> {
  await verifyAdminOrEditor();
  return getCountsFromService();
}

export async function getTagById(
  id: bigint | string | number
): Promise<TagItem | null> {
  await verifyAdminOrEditor();
  return getTagByIdFromService(id);
}
