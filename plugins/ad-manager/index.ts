import { addFilter } from "@/lib/plugins/hooks";

export function init() {
  addFilter("the_content", (content: string) => {
    if (!content) return content;

    const adBanner = `
<div class="wp-plugin-ad-manager not-prose my-6 p-4 bg-amber-50/50 border border-amber-200/80 rounded-md text-center">
  <span class="text-[9px] uppercase tracking-widest text-amber-800/60 font-semibold block mb-1">Sponsored Advertisement</span>
  <div class="py-4 bg-white/70 rounded border border-dashed border-amber-200 text-xs text-amber-900 font-medium">
    📢 Reserve this sponsor spotlight slot — reach high-intent enterprise leaders.
  </div>
</div>`;

    return content + adBanner;
  }, 15);
}
