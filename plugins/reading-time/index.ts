import { addFilter } from "@/lib/plugins/hooks";

export function init() {
  addFilter("the_content", (content: string) => {
    if (!content) return content;

    // Strip HTML tags to get pure words
    const cleanText = content.replace(/<[^>]*>/g, " ").trim();
    const words = cleanText.length > 0 ? cleanText.split(/\s+/).length : 0;
    const minutes = Math.max(1, Math.ceil(words / 200));

    const badge = `
<div class="wp-plugin-reading-time not-prose my-5 p-3.5 bg-slate-50 border-l-4 border-[#2271b1] rounded-r-md flex items-center justify-between text-xs text-slate-700 shadow-sm">
  <div class="flex items-center gap-2">
    <span class="text-base">⏱️</span>
    <span><strong>Estimated Read:</strong> ${minutes} min read (${words.toLocaleString()} words)</span>
  </div>
  <span class="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Editorial Desk</span>
</div>`;

    return badge + content;
  }, 5);
}
