import { addFilter } from "@/lib/plugins/hooks";
import { getPluginConfig } from "@/lib/plugins/config";

export function init() {
  addFilter("the_content", async (content: string) => {
    if (!content) return content;

    const config = await getPluginConfig("newsletter");
    const brandName = config.brandName || "Morning Briefing";
    const pitch = config.pitch || "Join our readers receiving curated investigative analysis before the markets open.";
    const buttonText = config.buttonText || "Subscribe";
    const uniqueFormId = `nl-form-${Math.random().toString(36).substring(2, 7)}`;

    const signupCard = `
<div class="wp-plugin-newsletter not-prose my-10 p-6 bg-slate-900 text-white rounded-lg border border-slate-800 shadow-md">
  <div class="flex items-start gap-4">
    <div class="hidden sm:flex w-10 h-10 rounded-full bg-[#2271b1]/20 items-center justify-center text-xl text-[#72aee6] flex-shrink-0">
      ✉️
    </div>
    <div class="flex-1">
      <span class="text-[11px] uppercase tracking-wider font-semibold text-[#72aee6]">Daily Digest</span>
      <h4 class="text-lg font-bold text-white mt-0.5 mb-1">${brandName}</h4>
      <p class="text-xs text-slate-300 leading-relaxed mb-4">
        ${pitch}
      </p>
      <div id="${uniqueFormId}-container">
        <form
          id="${uniqueFormId}"
          class="flex flex-col sm:flex-row gap-2 max-w-md"
          onsubmit="
            event.preventDefault();
            var form = this;
            var input = form.querySelector('input[type=email]');
            var btn = form.querySelector('button');
            var emailVal = input.value;
            if(!emailVal) return;
            btn.disabled = true;
            btn.innerText = 'Subscribing...';
            fetch('/api/newsletter/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: emailVal, source: 'article_footer' })
            })
            .then(function(res) { return res.json(); })
            .then(function(data) {
              if (data.success) {
                var container = document.getElementById('${uniqueFormId}-container');
                container.innerHTML = '<div class=\\'flex items-center gap-2 rounded bg-emerald-950/80 border border-emerald-800 p-3 text-xs text-emerald-300 font-semibold\\'><span>✓</span> <span>' + (data.message || 'Subscribed successfully!') + '</span></div>';
              } else {
                alert(data.error || 'Subscription failed. Please try again.');
                btn.disabled = false;
                btn.innerText = '${buttonText}';
              }
            })
            .catch(function(err) {
              alert('Network error. Please try again.');
              btn.disabled = false;
              btn.innerText = '${buttonText}';
            });
          "
        >
          <input
            type="email"
            placeholder="Enter your work email"
            required
            class="px-3.5 py-2 text-xs bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#72aee6] flex-1"
          />
          <button
            type="submit"
            class="px-4 py-2 text-xs font-semibold bg-[#2271b1] hover:bg-[#135e96] text-white rounded transition-colors disabled:opacity-50"
          >
            ${buttonText}
          </button>
        </form>
      </div>
    </div>
  </div>
</div>`;

    return content + signupCard;
  }, 20);
}
