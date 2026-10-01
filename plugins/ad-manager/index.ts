import { addFilter } from "@/lib/plugins/hooks";
import { getPluginConfig } from "@/lib/plugins/config";

export function init() {
  addFilter("the_content", async (content: string) => {
    if (!content) return content;

    const config = await getPluginConfig("ad-manager");
    if (!config.enabled) {
      return content;
    }

    const sponsorName = config.sponsorName || "Sponsored Partner";
    let bannerContent = "";

    if (config.customHtml) {
      bannerContent = config.customHtml;
    } else if (config.imageUrl) {
      bannerContent = `
        <a href="${config.targetUrl || "#"}" target="_blank" rel="noopener noreferrer" class="block overflow-hidden rounded-lg">
          <img src="${config.imageUrl}" alt="${sponsorName}" class="w-full object-cover rounded-lg max-h-40" />
        </a>`;
    } else {
      bannerContent = `
        <div class="py-5 bg-white/80 rounded-lg border border-dashed border-amber-300 text-xs text-amber-950 font-medium">
          <span class="block text-amber-800 font-bold mb-0.5">${sponsorName}</span>
          <span>Reach enterprise decision-makers and high-intent readers across our global network.</span>
          ${config.targetUrl ? `<a href="${config.targetUrl}" target="_blank" class="block mt-2 font-bold text-[#2271b1] underline">Learn More →</a>` : ""}
        </div>`;
    }

    const adBanner = `
<div class="wp-plugin-ad-manager not-prose my-8 p-4 bg-gradient-to-r from-amber-50/60 to-yellow-50/60 border border-amber-200 rounded-xl text-center shadow-xs">
  <span class="text-[9px] uppercase tracking-widest text-amber-800/70 font-bold block mb-2">Sponsored by ${sponsorName}</span>
  ${bannerContent}
</div>`;

    return content + adBanner;
  }, 15);
}
