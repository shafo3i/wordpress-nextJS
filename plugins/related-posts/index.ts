import { addFilter } from "@/lib/plugins/hooks";

export function init() {
  addFilter("the_content", (content: string) => {
    if (!content) return content;

    const relatedBox = `
<div class="wp-plugin-related-posts not-prose my-8 p-5 bg-slate-50 border border-slate-200 rounded-md">
  <h4 class="text-xs uppercase tracking-wider font-bold text-slate-500 mb-3 flex items-center gap-1.5">
    <span>📌</span> Recommended Follow-ups
  </h4>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
    <div class="p-2.5 bg-white border border-slate-200 rounded hover:border-[#2271b1] transition-colors">
      <span class="text-[10px] text-[#2271b1] font-semibold">Special Report</span>
      <p class="font-medium text-slate-800 mt-1">Infrastructure resilience and high-availability setups</p>
    </div>
    <div class="p-2.5 bg-white border border-slate-200 rounded hover:border-[#2271b1] transition-colors">
      <span class="text-[10px] text-[#2271b1] font-semibold">Analysis</span>
      <p class="font-medium text-slate-800 mt-1">Global market trends and quarterly editorial retrospective</p>
    </div>
  </div>
</div>`;

    return content + relatedBox;
  }, 30);
}
