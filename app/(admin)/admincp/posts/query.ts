import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import {
  getPosts,
  getPostCounts,
  getPostById,
  getAllCategoriesOptions,
  getAllTagOptions,
  GetPostsOptions,
  PostItem,
  PostCounts,
  CategoryOption,
  TagOption,
} from "@/services/post.service";

export type { PostItem, PostCounts, GetPostsOptions, CategoryOption, TagOption };

export async function getPostsQuery(options: GetPostsOptions = {}) {
  await verifyAdminOrEditor();
  return getPosts(options);
}

export async function getPostCountsQuery(options: { language?: string } = {}) {
  await verifyAdminOrEditor();
  return getPostCounts(options);
}

export async function getPostByIdQuery(id: bigint | string | number) {
  await verifyAdminOrEditor();
  return getPostById(id);
}

export async function getAllCategoriesQuery() {
  await verifyAdminOrEditor();
  return getAllCategoriesOptions();
}

export async function getAllTagsQuery() {
  await verifyAdminOrEditor();
  return getAllTagOptions();
}
