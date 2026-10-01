"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { PluginManifest } from "@/lib/plugins/types";
import { installPluginAction, togglePluginAction } from "@/app/(admin)/admincp/plugins/actions";

export function PluginCard({
  plugin,
  dict = {},
}: {
  plugin: PluginManifest;
  dict?: Record<string, string>;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleInstall = () => {
    startTransition(async () => {
      await installPluginAction(plugin.slug);
      router.refresh();
    });
  };

  const handleActivate = () => {
    startTransition(async () => {
      await togglePluginAction(plugin.slug, true);
      router.refresh();
    });
  };

  const slugKey = plugin.slug.replace(/_/g, "-");
  const displayName =
    dict[`admin.plugins.catalog.${slugKey}.name`] ||
    dict[`admin.plugins.catalog.${plugin.slug}.name`] ||
    plugin.name;
  const displayDesc =
    dict[`admin.plugins.catalog.${slugKey}.desc`] ||
    dict[`admin.plugins.catalog.${plugin.slug}.desc`] ||
    plugin.description;
  const displayAuthor =
    dict[`admin.plugins.catalog.${slugKey}.author`] ||
    dict[`admin.plugins.catalog.${plugin.slug}.author`] ||
    plugin.author;
  const displayInstalls =
    dict[`admin.plugins.catalog.${slugKey}.installs`] ||
    plugin.activeInstalls ||
    "10,000+";

  return (
    <div className="flex flex-col justify-between rounded-[3px] border border-[#dcdcde] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
      <div>
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex size-12 flex-shrink-0 items-center justify-center rounded bg-[#f0f0f1] text-2xl border border-[#c3c4c7]/40 shadow-inner">
              {plugin.icon ?? "🔌"}
            </div>
            <div>
              <h3 className="text-[15px] font-semibold leading-snug text-[#1d2327]">
                {displayName}
              </h3>
              <p className="text-[12px] text-[#646970]">
                {dict["admin.plugins.add_new.by"] || "By"}{" "}
                <span className="text-[#2271b1]">
                  {displayAuthor}
                </span>
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div>
            {plugin.isActive ? (
              <button
                type="button"
                disabled
                className="flex items-center gap-1 rounded-[3px] border border-[#c3c4c7] bg-[#f0f0f1] px-3 py-1 text-[13px] font-medium text-[#2c3338] opacity-90 cursor-default"
              >
                <span>✓</span> {dict["admin.plugins.add_new.active"] || "Active"}
              </button>
            ) : plugin.isInstalled ? (
              <button
                type="button"
                disabled={isPending}
                onClick={handleActivate}
                className="rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-3 py-1 text-[13px] font-medium text-white hover:bg-[#135e96] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isPending
                  ? dict["admin.plugins.add_new.activating"] || "Activating..."
                  : dict["admin.plugins.add_new.activate"] || "Activate"}
              </button>
            ) : (
              <button
                type="button"
                disabled={isPending}
                onClick={handleInstall}
                className="rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 py-1 text-[13px] font-medium text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isPending
                  ? dict["admin.plugins.add_new.installing"] || "Installing..."
                  : dict["admin.plugins.add_new.install_now"] || "Install Now"}
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="mt-3 text-[13px] leading-relaxed text-[#50575e]">
          {displayDesc}
        </p>
      </div>

      {/* Card Footer Metadata */}
      <div className="mt-4 border-t border-[#f0f0f1] pt-3 text-[11px] text-[#646970]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-[#dba617] text-sm">★★★★★</span>
            <span className="font-semibold text-[#2c3338]">
              {plugin.rating ?? 4.8}
            </span>
            <span>({plugin.reviewsCount ?? 42})</span>
          </div>

          <div className="font-medium text-[#50575e]">
            {displayInstalls} {dict["admin.plugins.add_new.active_installations"] || "Active Installations"}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between text-[#646970]">
          <span className="text-[#00a32a]">
            ✓ {dict["admin.plugins.add_new.compatible"] || "Compatible with your version of WordPress"}
          </span>
          <span>
            {dict["admin.plugins.add_new.version"] || "Version"} {plugin.version}
          </span>
        </div>
      </div>
    </div>
  );
}
