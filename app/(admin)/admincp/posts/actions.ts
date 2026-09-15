"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/db";
import { wpPostmeta, wpPosts, wpTermRelationships, wpTermTaxonomy, wpTerms } from "@/db/schema";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";

const VALID_STATUSES = new Set(["draft", "publish", "pending", "private", "trash"]);

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

async function uniqueSlug(title: string, postId?: bigint) {
  const base = toSlug(title) || `post-${Date.now()}`;
  let slug = base;
  let suffix = 2;
  while (true) {
    const existing = await db
      .select({ id: wpPosts.id })
      .from(wpPosts)
      .where(and(eq(wpPosts.postName, slug), postId ? ne(wpPosts.id, postId) : undefined))
      .limit(1);
    if (!existing.length) return slug;
    slug = `${base}-${suffix++}`.slice(0, 200);
  }
}

function postValues(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const requestedStatus = String(formData.get("status") ?? "draft");
  const status = VALID_STATUSES.has(requestedStatus) ? requestedStatus : "draft";
  const commentStatus = ["open", "closed"].includes(String(formData.get("commentStatus") ?? "open"))
    ? String(formData.get("commentStatus") ?? "open")
    : "open";
  const pingStatus = ["open", "closed"].includes(String(formData.get("pingStatus") ?? "open"))
    ? String(formData.get("pingStatus") ?? "open")
    : "open";
  const postType = String(formData.get("postType") ?? "post") || "post";
  const postParent = Number(formData.get("postParent") ?? "0") || 0;
  const menuOrder = Number(formData.get("menuOrder") ?? "0") || 0;
  const postPassword = String(formData.get("postPassword") ?? "");

  if (!title) throw new Error("A post title is required.");
  return {
    title,
    content,
    excerpt,
    status,
    commentStatus,
    pingStatus,
    postType,
    postParent: BigInt(postParent),
    menuOrder,
    postPassword,
  };
}

async function syncFeaturedImage(postId: bigint, formData: FormData) {
  const featuredImageId = String(formData.get("featuredImageId") ?? "").trim();

  await db
    .delete(wpPostmeta)
    .where(and(eq(wpPostmeta.postId, postId), eq(wpPostmeta.metaKey, "_thumbnail_id")));

  if (!featuredImageId || !/^\d+$/.test(featuredImageId)) {
    return;
  }

  await db.insert(wpPostmeta).values({
    postId,
    metaKey: "_thumbnail_id",
    metaValue: String(BigInt(featuredImageId)),
  });
}

async function syncPostTerms(postId: bigint, formData: FormData) {
  const categorySlugs = String(formData.get("categorySlugs") ?? "").split(",").map((value) => value.trim()).filter(Boolean);
  const tagNames = String(formData.get("tags") ?? "").split(",").map((value) => value.trim()).filter(Boolean);
  await db.delete(wpTermRelationships).where(eq(wpTermRelationships.objectId, postId));

  const taxonomyIds: bigint[] = [];
  if (categorySlugs.length) {
    const categories = await db
      .select({ taxonomyId: wpTermTaxonomy.termTaxonomyId })
      .from(wpTermTaxonomy)
      .innerJoin(wpTerms, eq(wpTermTaxonomy.termId, wpTerms.termId))
      .where(and(eq(wpTermTaxonomy.taxonomy, "category"), inArray(wpTerms.slug, categorySlugs)));
    taxonomyIds.push(...categories.map((item) => item.taxonomyId));
  }
  for (const tagName of tagNames) {
    const slug = toSlug(tagName);
    const existing = await db.select({ termId: wpTerms.termId }).from(wpTerms).where(eq(wpTerms.slug, slug)).limit(1);
    const termId = existing[0]?.termId ?? (await db.insert(wpTerms).values({ name: tagName, slug }).returning({ termId: wpTerms.termId }))[0].termId;
    const taxonomy = await db.select({ id: wpTermTaxonomy.termTaxonomyId }).from(wpTermTaxonomy).where(and(eq(wpTermTaxonomy.termId, termId), eq(wpTermTaxonomy.taxonomy, "post_tag"))).limit(1);
    const taxonomyId = taxonomy[0]?.id ?? (await db.insert(wpTermTaxonomy).values({ termId, taxonomy: "post_tag" }).returning({ id: wpTermTaxonomy.termTaxonomyId }))[0].id;
    taxonomyIds.push(taxonomyId);
  }
  if (taxonomyIds.length) await db.insert(wpTermRelationships).values(taxonomyIds.map((termTaxonomyId) => ({ objectId: postId, termTaxonomyId })));
}

export async function savePost(formData: FormData) {
  const session = await verifyAdminOrEditor();
  const { title, content, excerpt, status, commentStatus, pingStatus, postType, postParent, menuOrder, postPassword } = postValues(formData);
  const slug = await uniqueSlug(title);

  const now = new Date();
  const generatedExcerpt = excerpt || content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200) || "";

  const inserted = await db.insert(wpPosts).values({
    postAuthor: session.user.id,
    postDate: now,
    postDateGmt: now,
    postContent: content,
    postTitle: title,
    postExcerpt: generatedExcerpt,
    postStatus: status,
    commentStatus,
    pingStatus,
    postPassword,
    postName: slug,
    toPing: "",
    pinged: "",
    postModified: now,
    postModifiedGmt: now,
    postContentFiltered: "",
    postParent,
    guid: `/${slug}`,
    menuOrder,
    postType,
    postMimeType: "",
    commentCount: BigInt(0),
  }).returning({ id: wpPosts.id });
  await syncFeaturedImage(inserted[0].id, formData);
  await syncPostTerms(inserted[0].id, formData);

  revalidatePath("/admincp");
  revalidatePath("/admincp/posts");
  revalidatePath("/admincp/pages");
  redirect("/admincp/posts");
}

export async function savePage(formData: FormData) {
  const session = await verifyAdminOrEditor();
  const { title, content, excerpt, status, commentStatus, pingStatus, postParent, menuOrder, postPassword } = postValues(formData);
  const slug = await uniqueSlug(title);
  const now = new Date();
  const generatedExcerpt = excerpt || content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200) || "";

  const inserted = await db.insert(wpPosts).values({
    postAuthor: session.user.id,
    postDate: now,
    postDateGmt: now,
    postContent: content,
    postTitle: title,
    postExcerpt: generatedExcerpt,
    postStatus: status,
    commentStatus,
    pingStatus,
    postPassword,
    postName: slug,
    toPing: "",
    pinged: "",
    postModified: now,
    postModifiedGmt: now,
    postContentFiltered: "",
    postParent,
    guid: `/${slug}`,
    menuOrder,
    postType: "page",
    postMimeType: "",
    commentCount: BigInt(0),
  }).returning({ id: wpPosts.id });

  await syncFeaturedImage(inserted[0].id, formData);
  await syncPostTerms(inserted[0].id, formData);

  revalidatePath("/admincp");
  revalidatePath("/admincp/pages");
  redirect("/admincp/pages");
}

export async function updatePost(formData: FormData) {
  await verifyAdminOrEditor();
  const postId = BigInt(String(formData.get("id") ?? "0"));
  if (postId <= BigInt(0)) throw new Error("A valid post is required.");
  const { title, content, excerpt, status, commentStatus, pingStatus, postType, postParent, menuOrder, postPassword } = postValues(formData);
  const slug = await uniqueSlug(title, postId);

  const now = new Date();
  const generatedExcerpt = excerpt || content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200) || "";

  await db
    .update(wpPosts)
    .set({
      postTitle: title,
      postContent: content,
      postExcerpt: generatedExcerpt,
      postName: slug,
      postStatus: status,
      commentStatus,
      pingStatus,
      postPassword,
      postModified: now,
      postModifiedGmt: now,
      guid: `/${slug}`,
      postType,
      postParent,
      menuOrder,
    })
    .where(and(eq(wpPosts.id, postId), eq(wpPosts.postType, "post")));
  await syncFeaturedImage(postId, formData);
  await syncPostTerms(postId, formData);

  revalidatePath("/admincp");
  revalidatePath("/admincp/posts");
  redirect("/admincp/posts");
}

export async function updatePage(formData: FormData) {
  await verifyAdminOrEditor();
  const postId = BigInt(String(formData.get("id") ?? "0"));
  if (postId <= BigInt(0)) throw new Error("A valid page is required.");
  const { title, content, excerpt, status, commentStatus, pingStatus, postParent, menuOrder, postPassword } = postValues(formData);
  const slug = await uniqueSlug(title, postId);
  const now = new Date();
  const generatedExcerpt = excerpt || content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200) || "";

  await db
    .update(wpPosts)
    .set({
      postTitle: title,
      postContent: content,
      postExcerpt: generatedExcerpt,
      postName: slug,
      postStatus: status,
      commentStatus,
      pingStatus,
      postPassword,
      postModified: now,
      postModifiedGmt: now,
      guid: `/${slug}`,
      postType: "page",
      postParent,
      menuOrder,
    })
    .where(and(eq(wpPosts.id, postId), eq(wpPosts.postType, "page")));

  await syncFeaturedImage(postId, formData);
  await syncPostTerms(postId, formData);

  revalidatePath("/admincp");
  revalidatePath("/admincp/pages");
  redirect("/admincp/pages");
}

export async function updatePostStatus(id: string, status: string) {
  await verifyAdminOrEditor();

  const safeStatus = VALID_STATUSES.has(status) ? status : "draft";
  const postId = BigInt(id);

  if (postId <= BigInt(0)) {
    return { error: "A valid post is required." };
  }

  await db
    .update(wpPosts)
    .set({ postStatus: safeStatus, postModified: new Date() })
    .where(eq(wpPosts.id, postId));

  revalidatePath("/admincp");
  revalidatePath("/admincp/posts");
  return { success: true };
}

export async function movePostsToTrash(ids: string[]) {
  await verifyAdminOrEditor();

  const postIds = ids.map((id) => BigInt(id)).filter((id) => id > BigInt(0));

  if (!postIds.length) {
    return { error: "Select at least one post." };
  }

  await db
    .update(wpPosts)
    .set({ postStatus: "trash", postModified: new Date() })
    .where(inArray(wpPosts.id, postIds));

  revalidatePath("/admincp");
  revalidatePath("/admincp/posts");
  return { success: true };
}

export async function restorePosts(ids: string[]) {
  await verifyAdminOrEditor();
  const postIds = ids.map((id) => BigInt(id)).filter((id) => id > BigInt(0));
  if (!postIds.length) return { error: "Select at least one post." };
  await db.update(wpPosts).set({ postStatus: "draft", postModified: new Date() }).where(inArray(wpPosts.id, postIds));
  revalidatePath("/admincp");
  revalidatePath("/admincp/posts");
  return { success: true };
}

export async function deletePosts(ids: string[]) {
  await verifyAdminOrEditor();
  const postIds = ids.map((id) => BigInt(id)).filter((id) => id > BigInt(0));
  if (!postIds.length) return { error: "Select at least one post." };
  await db.transaction(async (tx) => {
    await tx.delete(wpTermRelationships).where(inArray(wpTermRelationships.objectId, postIds));
    await tx.delete(wpPosts).where(inArray(wpPosts.id, postIds));
  });
  revalidatePath("/admincp");
  revalidatePath("/admincp/posts");
  return { success: true };
}

export type QuickUpdateData = {
  id: string;
  title: string;
  slug?: string;
  date?: string;
  status?: string;
  categorySlugs?: string[];
  tags?: string;
  commentStatus?: "open" | "closed";
  pingStatus?: "open" | "closed";
  postPassword?: string;
};

export async function quickUpdatePost(data: QuickUpdateData) {
  await verifyAdminOrEditor();
  const postId = BigInt(data.id);
  if (postId <= BigInt(0)) throw new Error("A valid post ID is required.");

  const title = (data.title || "").trim();
  if (!title) throw new Error("A post title is required.");

  const slug = await uniqueSlug(data.slug || title, postId);
  const safeStatus = data.status && VALID_STATUSES.has(data.status) ? data.status : "draft";

  const now = new Date();
  const updateData: Record<string, unknown> = {
    postTitle: title,
    postName: slug,
    postStatus: safeStatus,
    postModified: now,
    postModifiedGmt: now,
    commentStatus: data.commentStatus ?? "open",
    pingStatus: data.pingStatus ?? "open",
  };

  if (data.postPassword !== undefined) {
    updateData.postPassword = data.postPassword;
  }

  if (data.date) {
    const parsedDate = new Date(data.date);
    if (!Number.isNaN(parsedDate.getTime())) {
      updateData.postDate = parsedDate;
      updateData.postDateGmt = parsedDate;
    }
  }

  await db.update(wpPosts).set(updateData).where(eq(wpPosts.id, postId));

  const formData = new FormData();
  if (data.categorySlugs) {
    formData.set("categorySlugs", data.categorySlugs.join(","));
  }
  if (data.tags !== undefined) {
    formData.set("tags", data.tags);
  }
  await syncPostTerms(postId, formData);

  revalidatePath("/admincp");
  revalidatePath("/admincp/posts");
  return {
    success: true,
    id: data.id,
    title,
    slug,
    status: safeStatus,
    date: (updateData.postDate as Date | undefined)?.toISOString() || now.toISOString(),
  };
}

export type QuickUpdatePageData = {
  id: string;
  title: string;
  slug?: string;
  date?: string;
  status?: string;
  postParent?: string | number;
  menuOrder?: number;
  commentStatus?: "open" | "closed";
  postPassword?: string;
};

export async function quickUpdatePage(data: QuickUpdatePageData) {
  await verifyAdminOrEditor();
  const pageId = BigInt(data.id);
  if (pageId <= BigInt(0)) throw new Error("A valid page ID is required.");

  const title = (data.title || "").trim();
  if (!title) throw new Error("A page title is required.");

  const slug = await uniqueSlug(data.slug || title, pageId);
  const safeStatus = data.status && VALID_STATUSES.has(data.status) ? data.status : "draft";

  const now = new Date();
  const updateData: Record<string, unknown> = {
    postTitle: title,
    postName: slug,
    postStatus: safeStatus,
    postModified: now,
    postModifiedGmt: now,
    commentStatus: data.commentStatus ?? "closed",
    menuOrder: Number(data.menuOrder ?? 0) || 0,
    postParent: BigInt(Number(data.postParent ?? 0) || 0),
  };

  if (data.postPassword !== undefined) {
    updateData.postPassword = data.postPassword;
  }

  if (data.date) {
    const parsedDate = new Date(data.date);
    if (!Number.isNaN(parsedDate.getTime())) {
      updateData.postDate = parsedDate;
      updateData.postDateGmt = parsedDate;
    }
  }

  await db
    .update(wpPosts)
    .set(updateData)
    .where(and(eq(wpPosts.id, pageId), eq(wpPosts.postType, "page")));

  revalidatePath("/admincp");
  revalidatePath("/admincp/pages");
  return {
    success: true,
    id: data.id,
    title,
    slug,
    status: safeStatus,
    date: (updateData.postDate as Date | undefined)?.toISOString() || now.toISOString(),
  };
}


