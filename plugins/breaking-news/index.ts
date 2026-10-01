import { addFilter } from "@/lib/plugins/hooks";
import { getPluginConfig } from "@/lib/plugins/config";

export function init() {
  addFilter("the_content", async (content: string) => {
    if (!content) return content;

    const config = await getPluginConfig("breaking-news");
    if (!config.enabled) {
      return content;
    }

    const badgeText = config.badgeText || "BREAKING ALERT";
    const headline = config.headline || "Special live coverage active — developments will be updated continuously.";
    const targetUrl = config.targetUrl || "";
    const urgency = config.urgency || "urgent";

    const colorClasses = {
      urgent: "border-rose-300 bg-rose-50/90 text-rose-950",
      developing: "border-amber-300 bg-amber-50/90 text-amber-950",
      alert: "border-blue-300 bg-blue-50/90 text-blue-950",
    }[urgency as "urgent" | "developing" | "alert"] || "border-rose-300 bg-rose-50/90 text-rose-950";

    const badgeBg = {
      urgent: "bg-rose-600",
      developing: "bg-amber-600",
      alert: "bg-blue-600",
    }[urgency as "urgent" | "developing" | "alert"] || "bg-rose-600";

    const banner = `
<div class="wp-plugin-breaking-news not-prose mb-6 flex items-center justify-between gap-3 rounded-xl border ${colorClasses} px-4 py-3 text-xs shadow-sm">
  <div class="flex items-center gap-3">
    <span class="inline-flex items-center gap-1.5 rounded ${badgeBg} px-2.5 py-1 font-black uppercase tracking-wider text-[10px] text-white animate-pulse">
      🚨 ${badgeText}
    </span>
    <span class="font-medium leading-relaxed">
      ${headline}
    </span>
  </div>
  ${targetUrl ? `<a href="${targetUrl}" class="font-bold underline text-[11px] flex-shrink-0 hover:opacity-80">Full Story →</a>` : ""}
</div>`;

    return banner + content;
  }, 2);
}
