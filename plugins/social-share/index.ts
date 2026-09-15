import { addFilter } from "@/lib/plugins/hooks";

export function init() {
  addFilter("the_content", (content: string) => {
    if (!content) return content;

    const shareBar = `
<div class="wp-plugin-social-share not-prose my-6 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-sm">
  <span class="font-semibold text-slate-500 uppercase tracking-wider text-[11px] mr-2">Share story:</span>
  <button
    type="button"
    onclick="window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(document.title) + '&url=' + encodeURIComponent(window.location.href), '_blank')"
    class="inline-flex items-center gap-1.5 rounded bg-slate-900 px-3 py-1.5 font-medium text-white hover:bg-black transition-colors"
  >
    𝕏 Post
  </button>
  <button
    type="button"
    onclick="window.open('https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(window.location.href), '_blank')"
    class="inline-flex items-center gap-1.5 rounded bg-[#0077b5] px-3 py-1.5 font-medium text-white hover:bg-[#006097] transition-colors"
  >
    in LinkedIn
  </button>
  <button
    type="button"
    onclick="window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(document.title + ' ' + window.location.href), '_blank')"
    class="inline-flex items-center gap-1.5 rounded bg-[#25d366] px-3 py-1.5 font-medium text-white hover:bg-[#1da851] transition-colors"
  >
    WhatsApp
  </button>
  <button
    type="button"
    onclick="navigator.clipboard.writeText(window.location.href); alert('Story link copied to clipboard!');"
    class="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-slate-100 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-200 transition-colors"
  >
    📋 Copy Link
  </button>
</div>`;

    return content + shareBar;
  }, 25);
}
