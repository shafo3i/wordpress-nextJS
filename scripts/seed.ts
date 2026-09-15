import "dotenv/config";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { and, count, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  wpComments,
  wpOptions,
  wpPosts,
  wpTermRelationships,
  wpTermTaxonomy,
  wpTerms,
  user,
} from "@/db/schema";

const templatesDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "../templates");

type TermTemplate = { name: string; slug: string; description?: string; parent?: string };
type PostTemplate = {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status: string;
  author?: string;
  date?: string;
  type?: string;
  commentStatus?: string;
  menuOrder?: number;
  categories?: string[];
  tags?: string[];
};
type CommentTemplate = {
  postSlug: string;
  author: string;
  email: string;
  content: string;
  status: string;
  date?: string;
  url?: string;
  parent?: string;
};
type OptionTemplate = { name: string; value: string; autoload?: string };
type UserTemplate = { id: string; name: string; email: string; role?: string };
type ThemeTemplate = {
  slug: string;
  name: string;
  description?: string;
  version?: string;
  author?: string;
  authorUrl?: string;
  themeUrl?: string;
  screenshot?: string;
  tags?: string;
};
type PluginTemplate = {
  slug: string;
  name: string;
  description?: string;
  version?: string;
  author?: string;
  authorUrl?: string;
  pluginUrl?: string;
  isActive?: boolean;
};
type MenuItemTemplate = { title: string; url?: string; postSlug?: string; position?: number };
type MenuTemplate = { name: string; slug: string; location?: string; items: MenuItemTemplate[] };

function readTemplate<T>(fileName: string): T {
  return JSON.parse(readFileSync(resolve(templatesDirectory, fileName), "utf8")) as T;
}

async function ensureTerm(
  term: TermTemplate,
  taxonomy: "category" | "post_tag" | "nav_menu",
  taxonomyBySlug?: Map<string, bigint>,
) {
  const existingTerm = await db
    .select({ id: wpTerms.termId })
    .from(wpTerms)
    .where(eq(wpTerms.slug, term.slug))
    .limit(1);
  const termId = existingTerm[0]?.id ?? (
    await db
      .insert(wpTerms)
      .values({ name: term.name, slug: term.slug, termGroup: BigInt(0) })
      .returning({ id: wpTerms.termId })
  )[0].id;

  const parentId = term.parent ? (taxonomyBySlug?.get(term.parent) ?? BigInt(0)) : BigInt(0);

  const existingTaxonomy = await db
    .select({ id: wpTermTaxonomy.termTaxonomyId })
    .from(wpTermTaxonomy)
    .where(and(eq(wpTermTaxonomy.termId, termId), eq(wpTermTaxonomy.taxonomy, taxonomy)))
    .limit(1);
  const values = {
    termId,
    taxonomy,
    description: term.description ?? "",
    parent: parentId,
  };
  const taxonomyId = existingTaxonomy[0]?.id ?? (
    await db
      .insert(wpTermTaxonomy)
      .values(values)
      .returning({ id: wpTermTaxonomy.termTaxonomyId })
  )[0].id;

  if (existingTaxonomy[0]) {
    await db
      .update(wpTermTaxonomy)
      .set({ description: values.description, parent: values.parent })
      .where(eq(wpTermTaxonomy.termTaxonomyId, existingTaxonomy[0].id));
  }

  return { termId, taxonomyId };
}

async function ensureRelationship(objectId: bigint, termTaxonomyId: bigint) {
  const existing = await db
    .select({ objectId: wpTermRelationships.objectId })
    .from(wpTermRelationships)
    .where(and(eq(wpTermRelationships.objectId, objectId), eq(wpTermRelationships.termTaxonomyId, termTaxonomyId)))
    .limit(1);
  if (!existing.length) {
    await db.insert(wpTermRelationships).values({ objectId, termTaxonomyId });
  }
}

async function removeLegacyPosts() {
  const legacySlugs = ["welcome-to-the-cms", "a-draft-article"];
  const posts = await db
    .select({ id: wpPosts.id })
    .from(wpPosts)
    .where(and(eq(wpPosts.postType, "post"), inArray(wpPosts.postName, legacySlugs)));
  const ids = posts.map((post) => post.id);
  if (!ids.length) return;
  await db.delete(wpTermRelationships).where(inArray(wpTermRelationships.objectId, ids));
  await db.delete(wpPosts).where(inArray(wpPosts.id, ids));
}

async function seedUsers(users: UserTemplate[]) {
  const existing = await db.select({ id: user.id, email: user.email }).from(user);
  const byEmail = new Map(existing.map((item) => [item.email, item.id]));
  for (const item of users) {
    if (byEmail.has(item.email)) continue;
    const inserted = await db
      .insert(user)
      .values({ id: item.id, name: item.name, email: item.email, emailVerified: true, role: item.role ?? "subscriber" })
      .returning({ id: user.id });
    byEmail.set(item.email, inserted[0].id);
  }
  return byEmail;
}

async function ensurePost(
  post: PostTemplate,
  authorByEmail: Map<string, string>,
  fallbackAuthorId: string | null,
) {
  const postType = post.type ?? "post";
  const existing = await db
    .select({ id: wpPosts.id })
    .from(wpPosts)
    .where(and(eq(wpPosts.postName, post.slug), eq(wpPosts.postType, postType)))
    .limit(1);
  const date = post.date ? new Date(post.date) : new Date();
  const authorId = post.author ? (authorByEmail.get(post.author) ?? fallbackAuthorId) : fallbackAuthorId;
  const postId = existing[0]?.id ?? (
    await db
      .insert(wpPosts)
      .values({
        postAuthor: authorId,
        postDate: date,
        postDateGmt: date,
        postContent: post.content,
        postTitle: post.title,
        postExcerpt: post.excerpt ?? "",
        postStatus: post.status,
        commentStatus: post.commentStatus ?? "open",
        pingStatus: "open",
        postPassword: "",
        postName: post.slug,
        toPing: "",
        pinged: "",
        postModified: date,
        postModifiedGmt: date,
        postContentFiltered: "",
        postParent: BigInt(0),
        guid: `/${post.slug}`,
        menuOrder: post.menuOrder ?? 0,
        postType,
        postMimeType: "",
        commentCount: BigInt(0),
      })
      .returning({ id: wpPosts.id })
  )[0].id;
  return postId;
}

async function seedComments(comments: CommentTemplate[], postIdBySlug: Map<string, bigint>) {
  const commentIdByEmail = new Map<string, bigint>();
  for (const comment of comments) {
    const postId = postIdBySlug.get(comment.postSlug);
    if (!postId) continue;
    const existing = await db
      .select({ id: wpComments.commentId })
      .from(wpComments)
      .where(and(eq(wpComments.commentPostId, postId), eq(wpComments.commentAuthorEmail, comment.email)))
      .limit(1);
    if (existing.length) {
      commentIdByEmail.set(comment.email, existing[0].id);
      continue;
    }
    const date = comment.date ? new Date(comment.date) : new Date();
    const parentId = comment.parent ? (commentIdByEmail.get(comment.parent) ?? BigInt(0)) : BigInt(0);
    const inserted = await db
      .insert(wpComments)
      .values({
        commentPostId: postId,
        commentAuthor: comment.author,
        commentAuthorEmail: comment.email,
        commentAuthorUrl: comment.url ?? "",
        commentContent: comment.content,
        commentApproved: comment.status,
        commentDate: date,
        commentDateGmt: date,
        commentParent: parentId,
      })
      .returning({ id: wpComments.commentId });
    commentIdByEmail.set(comment.email, inserted[0].id);
  }
}

async function setOption(name: string, value: string, autoload = "yes") {
  const existing = await db
    .select({ id: wpOptions.optionId })
    .from(wpOptions)
    .where(eq(wpOptions.optionName, name))
    .limit(1);
  if (existing.length) {
    await db.update(wpOptions).set({ optionValue: value, autoload }).where(eq(wpOptions.optionId, existing[0].id));
  } else {
    await db.insert(wpOptions).values({ optionName: name, optionValue: value, autoload });
  }
}

// In standard WordPress, themes and plugins are configured via wp_options
async function seedThemes(themes: ThemeTemplate[]) {
  if (themes.length > 0) {
    const active = themes[0];
    await setOption("current_theme", active.name);
    await setOption("template", active.slug);
    await setOption("stylesheet", active.slug);
  }
}

async function seedPlugins(plugins: PluginTemplate[]) {
  const activeSlugs = plugins.filter((p) => p.isActive).map((p) => `${p.slug}/${p.slug}.php`);
  await setOption("active_plugins", JSON.stringify(activeSlugs));
}

// In standard WordPress, menus are stored in wp_terms (taxonomy: 'nav_menu')
// and menu items are stored in wp_posts (post_type: 'nav_menu_item')
async function seedMenus(
  menus: MenuTemplate[],
  postIdBySlug: Map<string, bigint>,
  authorId: string | null,
) {
  for (const menu of menus) {
    const { taxonomyId } = await ensureTerm({ name: menu.name, slug: menu.slug }, "nav_menu");

    for (const [index, item] of menu.items.entries()) {
      const position = item.position ?? index + 1;
      const postSlug = `menu-item-${menu.slug}-${position}`;

      const existingItem = await db
        .select({ id: wpPosts.id })
        .from(wpPosts)
        .where(and(eq(wpPosts.postType, "nav_menu_item"), eq(wpPosts.postName, postSlug)))
        .limit(1);

      const date = new Date();
      const itemId = existingItem[0]?.id ?? (
        await db
          .insert(wpPosts)
          .values({
            postAuthor: authorId,
            postDate: date,
            postDateGmt: date,
            postContent: "",
            postTitle: item.title,
            postExcerpt: "",
            postStatus: "publish",
            commentStatus: "closed",
            pingStatus: "closed",
            postName: postSlug,
            guid: item.url ?? (item.postSlug ? `/${item.postSlug}` : "#"),
            menuOrder: position,
            postType: "nav_menu_item",
            commentCount: BigInt(0),
          })
          .returning({ id: wpPosts.id })
      )[0].id;

      await ensureRelationship(itemId, taxonomyId);
    }
  }
}

async function refreshCounts() {
  const commentCounts = await db
    .select({ postId: wpComments.commentPostId, total: count() })
    .from(wpComments)
    .where(eq(wpComments.commentApproved, "1"))
    .groupBy(wpComments.commentPostId);
  for (const row of commentCounts) {
    if (row.postId === null) continue;
    await db.update(wpPosts).set({ commentCount: BigInt(row.total) }).where(eq(wpPosts.id, row.postId));
  }

  const termCounts = await db
    .select({ taxonomyId: wpTermRelationships.termTaxonomyId, total: count() })
    .from(wpTermRelationships)
    .groupBy(wpTermRelationships.termTaxonomyId);
  for (const row of termCounts) {
    await db.update(wpTermTaxonomy).set({ count: BigInt(row.total) }).where(eq(wpTermTaxonomy.termTaxonomyId, row.taxonomyId));
  }
}

async function seed() {
  await removeLegacyPosts();

  const users = readTemplate<UserTemplate[]>("users.json");
  const options = readTemplate<OptionTemplate[]>("options.json");
  const categories = readTemplate<TermTemplate[]>("categories.json");
  const tags = readTemplate<TermTemplate[]>("tags.json");
  const posts = readTemplate<PostTemplate[]>("posts.json");
  const pages = readTemplate<PostTemplate[]>("pages.json");
  const comments = readTemplate<CommentTemplate[]>("comments.json");
  const themes = readTemplate<ThemeTemplate[]>("themes.json");
  const plugins = readTemplate<PluginTemplate[]>("plugins.json");
  const menus = readTemplate<MenuTemplate[]>("menus.json");

  const authorByEmail = await seedUsers(users);
  const fallbackAuthorId = [...authorByEmail.values()][0] ?? null;

  for (const option of options) {
    await setOption(option.name, option.value, option.autoload ?? "yes");
  }

  const categoryTaxonomies = new Map<string, bigint>();
  for (const category of categories) {
    categoryTaxonomies.set(category.slug, (await ensureTerm(category, "category", categoryTaxonomies)).taxonomyId);
  }
  const tagTaxonomies = new Map<string, bigint>();
  for (const tag of tags) {
    tagTaxonomies.set(tag.slug, (await ensureTerm(tag, "post_tag")).taxonomyId);
  }

  const postIdBySlug = new Map<string, bigint>();
  for (const post of [...posts, ...pages]) {
    const postId = await ensurePost(post, authorByEmail, fallbackAuthorId);
    postIdBySlug.set(post.slug, postId);
    for (const categorySlug of post.categories ?? []) {
      const taxonomyId = categoryTaxonomies.get(categorySlug);
      if (taxonomyId) await ensureRelationship(postId, taxonomyId);
    }
    for (const tagSlug of post.tags ?? []) {
      const taxonomyId = tagTaxonomies.get(tagSlug);
      if (taxonomyId) await ensureRelationship(postId, taxonomyId);
    }
  }

  await seedComments(comments, postIdBySlug);
  await seedThemes(themes);
  await seedPlugins(plugins);
  await seedMenus(menus, postIdBySlug, fallbackAuthorId);
  await refreshCounts();

  console.log(
    `Seed complete: ${users.length} users, ${categories.length} categories, ${tags.length} tags, ` +
      `${posts.length + pages.length} posts and pages, ${comments.length} comments, ` +
      `${themes.length} themes, ${plugins.length} plugins, ${menus.length} menus.`,
  );
}

seed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
