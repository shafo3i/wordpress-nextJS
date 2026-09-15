import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { wpPosts, wpPostmeta, wpTermRelationships, wpTermTaxonomy, wpTerms, user } from "@/db/schema";

export type ContentItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  date: Date;
  authorName: string;
  categories: string[];
  tags: string[];
  imageUrl: string;
};

// Curated high-resolution editorial broadsheet photos
const EDITORIAL_PHOTOS = [
  "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1200&auto=format&fit=crop&q=80", // Financial District
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80", // Microchip / Tech
  "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200&auto=format&fit=crop&q=80", // Policy / Space
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80", // Modern Architecture
  "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&auto=format&fit=crop&q=80", // Stock Markets Chart
  "https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=1200&auto=format&fit=crop&q=80", // Laboratory Research
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80", // Satellite / Global
  "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&auto=format&fit=crop&q=80", // Newspaper Broadsheet
  "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&auto=format&fit=crop&q=80", // Editorial Desk
  "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&auto=format&fit=crop&q=80", // Newsprint press
];

function getEditorialPhoto(seed: string | number): string {
  const hash = String(seed).split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return EDITORIAL_PHOTOS[hash % EDITORIAL_PHOTOS.length];
}

const FALLBACK_POSTS: ContentItem[] = [
  {
    id: "fallback-1",
    title: "Global Supply Chains Shift Toward Resilient Regional Corridors",
    slug: "global-supply-chains-shift-toward-resilient-regional-corridors",
    excerpt: "A deep investigation into how multinational shipping lines and manufacturing hubs are rewiring trade corridors against geopolitical instability.",
    content: "<p>Multinational manufacturers and international maritime operators are accelerating investments in diversified supply chain networks.</p><p>As trade routes adjust to shifting geopolitical dynamics, regional logistics hubs across North America, Europe, and Southeast Asia are seeing unprecedented capital inflows.</p>",
    date: new Date("2026-09-12T09:00:00.000Z"),
    authorName: "Sarah Jenkins",
    categories: ["Business", "Markets"],
    tags: ["Economy", "Logistics", "Trade"],
    imageUrl: EDITORIAL_PHOTOS[0],
  },
  {
    id: "fallback-2",
    title: "Next-Generation Semiconductor Foundries Accelerate Quantum Packaging",
    slug: "next-generation-semiconductor-foundries-accelerate-quantum-packaging",
    excerpt: "Silicon fabrication facilities transition to sub-2-nanometer architecture, ushering in commercialized neural processors and secure optical computing.",
    content: "<p>Microchip design is undergoing its most radical transformation in three decades.</p><p>Advanced 3D packaging and optical interconnects are enabling breakthroughs in power efficiency and raw computational density.</p>",
    date: new Date("2026-09-11T12:30:00.000Z"),
    authorName: "Marcus Vance",
    categories: ["Technology", "Innovation"],
    tags: ["Semiconductors", "Hardware", "AI"],
    imageUrl: EDITORIAL_PHOTOS[1],
  },
  {
    id: "fallback-3",
    title: "Central Banks Balance Interest Trajectories Amid Renewable Infrastructure Boom",
    slug: "central-banks-balance-interest-trajectories-amid-renewable-infrastructure-boom",
    excerpt: "Financial policymakers confront novel inflationary drivers as sovereign green energy transitions absorb trillions in private capital markets.",
    content: "<p>The intersection of public monetary policy and massive industrial decarbonization is testing traditional economic models.</p><p>Central bank governors gathering this week noted sustained liquidity demands from power grid modernization.</p>",
    date: new Date("2026-09-10T15:00:00.000Z"),
    authorName: "Elena Rostova",
    categories: ["Business", "Economy"],
    tags: ["Finance", "Energy", "Policy"],
    imageUrl: EDITORIAL_PHOTOS[4],
  },
  {
    id: "fallback-4",
    title: "The Architecture of Editorial Independence in the Age of Synthetic Content",
    slug: "architecture-of-editorial-independence-in-the-age-of-synthetic-content",
    excerpt: "Why verified human newsrooms, on-the-ground investigative reporting, and transparent provenance protocols remain indispensable to democracy.",
    content: "<p>In an ecosystem inundated with synthetic summaries, readers are demanding accountable journalism with real human reporters.</p><p>Standards desks across the world are establishing verifiable cryptographic provenance for news photography and investigative sources.</p>",
    date: new Date("2026-09-09T08:15:00.000Z"),
    authorName: "David Sterling",
    categories: ["Opinion", "Editorial"],
    tags: ["Journalism", "Ethics", "Media"],
    imageUrl: EDITORIAL_PHOTOS[7],
  },
  {
    id: "fallback-5",
    title: "Autonomous Maritime Freight Vessels Pass First Trans-Atlantic Trials",
    slug: "autonomous-maritime-freight-vessels-pass-first-trans-atlantic-trials",
    excerpt: "Uncrewed container ships powered by hybrid hydrogen propulsion complete test voyages with flawless safety margins.",
    content: "<p>Commercial shipping is reaching an automated milestone.</p><p>The successful ocean crossing demonstrates how automated sensor fusion and remote newsroom tracking keep oceanic transit on schedule.</p>",
    date: new Date("2026-09-08T11:45:00.000Z"),
    authorName: "Marcus Vance",
    categories: ["Technology", "Transportation"],
    tags: ["Robotics", "Shipping"],
    imageUrl: EDITORIAL_PHOTOS[6],
  },
  {
    id: "fallback-6",
    title: "Urban Architecture Adapts to Climate Resiliency in Coastal Megacities",
    slug: "urban-architecture-adapts-to-climate-resiliency-in-coastal-megacities",
    excerpt: "Civil engineering firms adopt sponge-city infrastructure and permeable high-rise foundations to withstand extreme seasonal flooding.",
    content: "<p>Municipal planners are rewriting building codes to emphasize water absorption and decentralized microgrids.</p><p>The modern skyline is becoming as much a civil engineering defense system as it is commercial real estate.</p>",
    date: new Date("2026-09-07T14:20:00.000Z"),
    authorName: "Sarah Jenkins",
    categories: ["Design", "Environment"],
    tags: ["Architecture", "Cities"],
    imageUrl: EDITORIAL_PHOTOS[3],
  },
];

async function getTermData(postIds: bigint[] | string[]) {
  if (!postIds.length) return new Map<string, { categories: string[]; tags: string[] }>();

  const rows = await db
    .select({
      objectId: wpTermRelationships.objectId,
      taxonomy: wpTermTaxonomy.taxonomy,
      name: wpTerms.name,
    })
    .from(wpTermRelationships)
    .innerJoin(wpTermTaxonomy, eq(wpTermRelationships.termTaxonomyId, wpTermTaxonomy.termTaxonomyId))
    .innerJoin(wpTerms, eq(wpTermTaxonomy.termId, wpTerms.termId))
    .where(inArray(wpTermRelationships.objectId, postIds.map((id) => BigInt(id))));

  const map = new Map<string, { categories: string[]; tags: string[] }>();
  for (const row of rows) {
    const key = row.objectId.toString();
    const existing = map.get(key) ?? { categories: [], tags: [] };
    if (row.taxonomy === "category") existing.categories.push(row.name);
    if (row.taxonomy === "post_tag") existing.tags.push(row.name);
    map.set(key, existing);
  }

  return map;
}

async function getImageData(postIds: bigint[] | string[]) {
  if (!postIds.length) return new Map<string, string>();
  try {
    const metas = await db
      .select({
        postId: wpPostmeta.postId,
        metaValue: wpPostmeta.metaValue,
      })
      .from(wpPostmeta)
      .where(
        and(
          inArray(wpPostmeta.postId, postIds.map((id) => BigInt(id))),
          eq(wpPostmeta.metaKey, "_thumbnail_id")
        )
      );

    const attachmentIds = metas
      .map((m) => m.metaValue)
      .filter((v): v is string => Boolean(v) && !isNaN(Number(v)));

    const attachmentMap = new Map<string, string>();

    if (attachmentIds.length) {
      const attachments = await db
        .select({
          id: wpPosts.id,
          guid: wpPosts.guid,
        })
        .from(wpPosts)
        .where(
          and(
            inArray(wpPosts.id, attachmentIds.map((id) => BigInt(id))),
            eq(wpPosts.postType, "attachment")
          )
        );

      for (const att of attachments) {
        if (att.guid) {
          attachmentMap.set(att.id.toString(), att.guid);
        }
      }
    }

    const postImageMap = new Map<string, string>();
    for (const meta of metas) {
      if (meta.metaValue && attachmentMap.has(meta.metaValue)) {
        postImageMap.set(meta.postId.toString(), attachmentMap.get(meta.metaValue)!);
      }
    }
    return postImageMap;
  } catch {
    return new Map<string, string>();
  }
}

export async function getPublishedContent(type: "post" | "page", slug?: string, limit = 10) {
  const base = await db
    .select({
      id: wpPosts.id,
      title: wpPosts.postTitle,
      slug: wpPosts.postName,
      excerpt: wpPosts.postExcerpt,
      content: wpPosts.postContent,
      date: wpPosts.postDate,
      authorName: user.name,
    })
    .from(wpPosts)
    .leftJoin(user, eq(wpPosts.postAuthor, user.id))
    .where(and(eq(wpPosts.postType, type), eq(wpPosts.postStatus, "publish"), slug ? eq(wpPosts.postName, slug) : undefined))
    .orderBy(desc(wpPosts.postDate))
    .limit(limit);

  if (!base.length) {
    const filtered = FALLBACK_POSTS.filter((item) => item.slug === slug || item.slug !== "");
    return type === "page" ? filtered.filter((item) => item.slug.includes("launch") || item.slug.includes("workflow")).slice(0, 1) : filtered.slice(0, limit);
  }

  const postIds = base.map((item) => item.id.toString());
  const [termMap, imageMap] = await Promise.all([
    getTermData(postIds),
    getImageData(postIds),
  ]);

  return base.map((item, idx) => {
    // Check if postContent contains an <img> tag
    let contentImg = "";
    const match = item.content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match && match[1]) {
      contentImg = match[1];
    }

    const attachedImg = imageMap.get(item.id.toString());
    const resolvedImg = attachedImg || contentImg || getEditorialPhoto(item.id.toString() || idx);

    return {
      id: item.id.toString(),
      title: item.title || "Untitled",
      slug: item.slug || "untitled",
      excerpt: item.excerpt || item.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 180),
      content: item.content || "",
      date: item.date,
      authorName: item.authorName || "Editorial Desk",
      categories: termMap.get(item.id.toString())?.categories ?? ["News"],
      tags: termMap.get(item.id.toString())?.tags ?? [],
      imageUrl: resolvedImg,
    };
  });
}

export async function getPublishedPosts(limit = 12) {
  const posts = await getPublishedContent("post", undefined, limit);
  return posts.length ? posts : FALLBACK_POSTS.slice(0, limit);
}

export async function getPublishedPageBySlug(slug: string) {
  const pages = await getPublishedContent("page", slug, 1);
  if (pages.length) return pages[0];

  const fallback = FALLBACK_POSTS.find((item) => item.slug === slug) ?? FALLBACK_POSTS[0];
  return fallback;
}

export async function getPublishedPostBySlug(slug: string) {
  const posts = await getPublishedContent("post", slug, 1);
  if (posts.length) return posts[0];

  const fallback = FALLBACK_POSTS.find((item) => item.slug === slug) ?? FALLBACK_POSTS[0];
  return fallback;
}
