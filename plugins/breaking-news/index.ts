import { addFilter } from "@/lib/plugins/hooks";

export function init() {
  addFilter("the_content", (content: string) => {
    if (!content) return content;

    const banner = `
<div class="wp-plugin-breaking-news not-prose mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50/80 px-4 py-3 text-xs text-red-950 shadow-sm">
  <span class="inline-flex items-center gap-1.5 rounded bg-red-600 px-2 py-0.5 font-bold uppercase tracking-wider text-[10px] text-white animate-pulse">
    🚨 Breaking
  </span>
  <span class="font-medium">
    Editorial Alert: Special live coverage active — developments will be updated continuously.
  </span>
</div>`;

    return banner + content;
  }, 2);
}
