import { addFilter } from "@/lib/plugins/hooks";

export function init() {
  addFilter("the_content", (content: string) => {
    if (!content) return content;

    const trustBadge = `
<div class="wp-plugin-fact-check not-prose my-6 flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-950">
  <div class="flex items-center gap-2.5">
    <span class="flex size-6 items-center justify-center rounded-full bg-emerald-600 text-xs text-white">
      ✓
    </span>
    <div>
      <span class="font-semibold text-emerald-900">Fact-Checked by Editorial Desk</span>
      <p class="text-[11px] text-emerald-700">Adheres to the News Integrity Standards and verified primary sources.</p>
    </div>
  </div>
  <span class="text-[10px] font-mono uppercase tracking-wider text-emerald-600 hidden md:inline">Audit ID #8841</span>
</div>`;

    return content + trustBadge;
  }, 22);
}
