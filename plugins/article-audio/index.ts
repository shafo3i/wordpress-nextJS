import { addFilter } from "@/lib/plugins/hooks";

export function init() {
  addFilter("the_content", (content: string) => {
    if (!content) return content;

    const audioWidget = `
<div class="wp-plugin-audio not-prose my-5 flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 p-3.5 text-white shadow-sm">
  <div class="flex items-center gap-3">
    <button
      type="button"
      onclick="alert('Streaming editorial narration audio...')"
      class="flex size-9 items-center justify-center rounded-full bg-[#2271b1] text-sm text-white hover:bg-[#135e96] transition-transform hover:scale-105"
    >
      ▶
    </button>
    <div>
      <span class="block text-xs font-semibold text-white">Listen to this story</span>
      <span class="block text-[10px] text-slate-400">Narration • 3 min 45 sec</span>
    </div>
  </div>
  <div class="hidden sm:flex items-center gap-2">
    <span class="text-[10px] uppercase tracking-wider font-semibold rounded bg-slate-700/60 px-2 py-0.5 text-slate-300">
      AI Voice Studio
    </span>
  </div>
</div>`;

    return audioWidget + content;
  }, 4);
}
