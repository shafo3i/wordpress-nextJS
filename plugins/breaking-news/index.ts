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
      urgent: "border-theme-danger/40 bg-theme-danger/10 text-theme-text",
      developing: "border-theme-warning/40 bg-theme-warning/10 text-theme-text",
      alert: "border-theme-info/40 bg-theme-info/10 text-theme-text",
    }[urgency as "urgent" | "developing" | "alert"] || "border-theme-danger/40 bg-theme-danger/10 text-theme-text";

    const badgeBg = {
      urgent: "bg-theme-danger",
      developing: "bg-theme-warning",
      alert: "bg-theme-info",
    }[urgency as "urgent" | "developing" | "alert"] || "bg-theme-danger";

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
