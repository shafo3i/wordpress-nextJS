import { addFilter } from "@/lib/plugins/hooks";

export function init() {
  addFilter("the_content", (content: string) => {
    if (!content) return content;

    const trustBadge = `
<div class="wp-plugin-fact-check not-prose my-6 flex items-center justify-between rounded-md border border-theme-success/40 bg-theme-success/10 p-3 text-xs text-theme-text">
  <div class="flex items-center gap-2.5">
    <span class="flex size-6 items-center justify-center rounded-full bg-theme-success text-xs text-white">
      ✓
    </span>
    <div>
      <span class="font-semibold text-theme-heading">Fact-Checked by Editorial Desk</span>
      <p class="text-[11px] text-theme-muted">Adheres to the News Integrity Standards and verified primary sources.</p>
    </div>
  </div>
  <span class="text-[10px] font-mono uppercase tracking-wider text-theme-success hidden md:inline">Audit ID #8841</span>
</div>`;

    return content + trustBadge;
  }, 22);
}
