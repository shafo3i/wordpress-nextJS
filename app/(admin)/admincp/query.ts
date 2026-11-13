import { absoluteWebUrl } from "@/lib/seo/urls";
import "server-only";
import { verifyAdmin } from "@/lib/authMIddleware";
import { count, desc, eq, ne, and } from "drizzle-orm";
import { db } from "@/db";
import { wpPosts, wpComments, wpTermTaxonomy } from "@/db/schema";
import { getSiteHealthData } from "@/services/database-maintenance.service";
export async function getDashboardData() {
  await verifyAdmin();
  const [
    postResult,
    pageResult,
    mediaResult,
    commentResult,
    pendingCommentResult,
    categoryResult,
    tagResult,
    recentPosts,
    recentDrafts,
    recentComments,
    healthData,
  ] = await Promise.all([
    // Active published/draft posts
    db
      .select({ value: count() })
      .from(wpPosts)
      .where(
        and(eq(wpPosts.postType, "post"), ne(wpPosts.postStatus, "trash"))
      ),
    // Active pages
    db
      .select({ value: count() })
      .from(wpPosts)
      .where(
        and(eq(wpPosts.postType, "page"), ne(wpPosts.postStatus, "trash"))
      ),
    // Media attachments
    db
      .select({ value: count() })
      .from(wpPosts)
      .where(eq(wpPosts.postType, "attachment")),
    // Approved comments
    db
      .select({ value: count() })
      .from(wpComments)
      .where(eq(wpComments.commentApproved, "1")),
    // Pending moderation comments
    db
      .select({ value: count() })
      .from(wpComments)
      .where(eq(wpComments.commentApproved, "0")),
    // Categories count
    db
      .select({ value: count() })
      .from(wpTermTaxonomy)
      .where(eq(wpTermTaxonomy.taxonomy, "category")),
    // Tags count
    db
      .select({ value: count() })
      .from(wpTermTaxonomy)
      .where(eq(wpTermTaxonomy.taxonomy, "post_tag")),
    // 5 Recently Published Posts
    db
      .select({
        id: wpPosts.id,
        title: wpPosts.postTitle,
        date: wpPosts.postDate,
        guid: wpPosts.guid,
      })
      .from(wpPosts)
      .where(
        and(eq(wpPosts.postType, "post"), eq(wpPosts.postStatus, "publish"))
      )
      .orderBy(desc(wpPosts.postDate))
      .limit(5),
    // 3 Recent Drafts for Quick Draft widget
    db
      .select({
        id: wpPosts.id,
        title: wpPosts.postTitle,
        modified: wpPosts.postModified,
      })
      .from(wpPosts)
      .where(and(eq(wpPosts.postType, "post"), eq(wpPosts.postStatus, "draft")))
      .orderBy(desc(wpPosts.postModified))
      .limit(3),
    // 3 Recent Comments
    db
      .select({
        id: wpComments.commentId,
        author: wpComments.commentAuthor,
        content: wpComments.commentContent,
        date: wpComments.commentDate,
        approved: wpComments.commentApproved,
        postId: wpComments.commentPostId,
      })
      .from(wpComments)
      .where(ne(wpComments.commentApproved, "trash"))
      .orderBy(desc(wpComments.commentDate))
      .limit(3),
    // Site Health overview
    getSiteHealthData().catch(() => null),
  ]);

  return {
    counts: {
      posts: postResult[0]?.value ?? 0,
      pages: pageResult[0]?.value ?? 0,
      media: mediaResult[0]?.value ?? 0,
      comments: commentResult[0]?.value ?? 0,
      pendingComments: pendingCommentResult[0]?.value ?? 0,
      categories: categoryResult[0]?.value ?? 0,
      tags: tagResult[0]?.value ?? 0,
    },
    recentPosts: recentPosts.map((post) => ({
      ...post,
      guid: absoluteWebUrl(post.guid),
    })),
    recentDrafts: recentDrafts.map((d) => ({
      id: d.id.toString(),
      title: d.title || "",
      date: new Date(d.modified).toLocaleDateString(),
    })),
    recentComments,
    healthData,
  };
}
