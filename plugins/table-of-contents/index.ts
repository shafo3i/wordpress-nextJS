import { addFilter } from "@/lib/plugins/hooks";

export function init() {
  addFilter("the_content", (content: string) => {
    if (!content) return content;

    const headingMatches = Array.from(content.matchAll(/<h([2-3])[^>]*>(.*?)<\/h[2-3]>/gi));
    if (headingMatches.length === 0) return content;

    const items = headingMatches
      .slice(0, 6)
      .map((match, idx) => {
        const title = match[2].replace(/<[^>]*>/g, "").trim();
        return `<li class="hover:text-[#2271b1] cursor-pointer">
          <span class="text-[#2271b1] font-mono mr-1.5">${idx + 1}.</span>
          <span>${title}</span>
        </li>`;
      })
      .join("");

    const tocBox = `
<div class="wp-plugin-toc not-prose my-6 rounded-lg border border-slate-200 bg-slate-50 p-4 font-sans text-xs shadow-sm">
  <div class="mb-2 flex items-center justify-between font-semibold text-slate-800 border-b border-slate-200 pb-2">
    <span class="flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-slate-600">
      <span>📑</span> Table of Contents
    </span>
    <span class="text-[10px] text-slate-400">Quick Navigation</span>
  </div>
  <ul class="space-y-1.5 text-slate-600 pl-1">
    ${items}
  </ul>
</div>`;

    return tocBox + content;
  }, 8);
}
