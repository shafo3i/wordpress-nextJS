import { addFilter } from "@/lib/plugins/hooks";

export function init() {
  addFilter("the_content", (content: string) => {
    if (!content) return content;

    const signupCard = `
<div class="wp-plugin-newsletter not-prose my-10 p-6 bg-slate-900 text-white rounded-lg border border-slate-800 shadow-md">
  <div class="flex items-start gap-4">
    <div class="hidden sm:flex w-10 h-10 rounded-full bg-[#2271b1]/20 items-center justify-center text-xl text-[#72aee6] flex-shrink-0">
      ✉️
    </div>
    <div class="flex-1">
      <span class="text-[11px] uppercase tracking-wider font-semibold text-[#72aee6]">Daily Digest</span>
      <h4 class="text-lg font-bold text-white mt-0.5 mb-1">Get the Morning Briefing</h4>
      <p class="text-xs text-slate-300 leading-relaxed mb-4">
        Join over 45,000 journalists and executives who receive our curated morning analysis before the markets open.
      </p>
      <form class="flex flex-col sm:flex-row gap-2 max-w-md" onsubmit="event.preventDefault(); alert('Subscribed to Morning Briefing!');">
        <input
          type="email"
          placeholder="Enter your work email"
          required
          class="px-3.5 py-2 text-xs bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#72aee6] flex-1"
        />
        <button
          type="submit"
          class="px-4 py-2 text-xs font-semibold bg-[#2271b1] hover:bg-[#135e96] text-white rounded transition-colors"
        >
          Subscribe
        </button>
      </form>
    </div>
  </div>
</div>`;

    return content + signupCard;
  }, 20);
}
