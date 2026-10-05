import { addFilter } from "@/lib/plugins/hooks";
import { getPluginConfig } from "@/lib/plugins/config";
import { getPublishedPosts } from "@/lib/site-content";

export function init() {
  addFilter("the_content", async (content: string, context?: any) => {
    if (!content) return content;

    const config = await getPluginConfig("related-posts");
    const count = Number(config.count) || 3;
    const currentSlug = context?.article?.slug;
    const currentCategories: string[] = context?.article?.categories || [];

    const allPosts = await getPublishedPosts(10);
    const candidatePosts = allPosts.filter((p) => p.slug !== currentSlug);

    // Prefer posts sharing at least one category
    const categoryMatches = candidatePosts.filter((p) =>
      p.categories?.some((c) => currentCategories.includes(c))
    );
    const relatedStories = (categoryMatches.length > 0 ? categoryMatches : candidatePosts).slice(
      0,
      count
    );

    if (relatedStories.length === 0) {
      return content;
    }

    const cardsHtml = relatedStories
      .map(
        (story) => `
    <a href="/posts/${story.slug}" class="block p-3 bg-theme-surface border border-theme-border rounded-lg hover:border-theme-primary hover:shadow-sm transition-all group">
      <span class="text-[10px] text-theme-link font-bold uppercase tracking-wider block mb-1">${
        story.categories?.[0] || "Analysis"
      }</span>
      <p class="font-bold text-theme-heading group-hover:text-theme-link-hover transition-colors line-clamp-2 leading-snug">${
        story.title
      }</p>
    </a>`
      )
      .join("");

    const relatedBox = `
<div class="wp-plugin-related-posts not-prose my-8 p-5 bg-theme-surface border border-theme-border rounded-xl">
  <h4 class="text-xs uppercase tracking-wider font-bold text-theme-muted mb-3 flex items-center gap-1.5">
    <span>📌</span> Recommended Follow-ups & Next Reads
  </h4>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
    ${cardsHtml}
  </div>
</div>`;

    return content + relatedBox;
  }, 30);
}
