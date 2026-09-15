"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PluginManifest } from "@/lib/plugins/types";
import { togglePluginAction } from "@/app/(admin)/admincp/plugins/actions";

export function PluginRowItem({
  plugin,
  isSelected,
  onToggleSelect,
  onNotice,
}: {
  plugin: PluginManifest;
  isSelected: boolean;
  onToggleSelect: (checked: boolean) => void;
  onNotice?: (notice: { type: "success" | "error"; message: string } | null) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleToggle = (activate: boolean) => {
    startTransition(async () => {
      const res = await togglePluginAction(plugin.slug, activate);
      if (res?.error) {
        onNotice?.({ type: "error", message: res.error });
      } else {
        onNotice?.({
          type: "success",
          message: `Plugin "${plugin.name}" ${activate ? "activated" : "deactivated"}.`,
        });
        router.refresh();
      }
    });
  };

  const isActive = Boolean(plugin.isActive);

  return (
    <tr
      className={`border-b border-[#c3c4c7] transition-colors ${
        isActive
          ? "border-l-4 border-l-[#2271b1] bg-[#f0f6fc] hover:bg-[#ebf3fa]"
          : "border-l-4 border-l-transparent bg-white hover:bg-[#f6f7f7]"
      }`}
    >
      {/* Checkbox */}
      <th scope="row" className="w-8 px-3 py-3 text-center align-top">
        <input
          type="checkbox"
          aria-label={`Select ${plugin.name}`}
          checked={isSelected}
          onChange={(e) => onToggleSelect(e.target.checked)}
          className="h-4 w-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
        />
      </th>

      {/* Plugin Name & Row Actions */}
      <td className="w-1/4 min-w-[200px] px-3 py-3 align-top">
        <strong className="block text-[14px] font-semibold text-[#1d2327]">
          {plugin.name}
        </strong>

        <div className="mt-1.5 flex items-center gap-1.5 text-[12px]">
          {isActive ? (
            <>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleToggle(false)}
                className="text-[#2271b1] hover:text-[#135e96] hover:underline disabled:opacity-50"
              >
                {isPending ? "Updating..." : "Deactivate"}
              </button>
              {plugin.settingsUrl && (
                <>
                  <span className="text-[#a7aaad]">|</span>
                  <Link
                    href={plugin.settingsUrl}
                    className="text-[#2271b1] hover:text-[#135e96] hover:underline"
                  >
                    Settings
                  </Link>
                </>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleToggle(true)}
                className="font-medium text-[#2271b1] hover:text-[#135e96] hover:underline disabled:opacity-50"
              >
                {isPending ? "Updating..." : "Activate"}
              </button>
              <span className="text-[#a7aaad]">|</span>
              <button
                type="button"
                onClick={() => {
                  alert(
                    `Built-in plugin "${plugin.name}" is managed in source control and cannot be physically deleted from the filesystem.`
                  );
                }}
                className="text-[#b32d2e] hover:text-[#b32d2e] hover:underline"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </td>

      {/* Description & Metadata */}
      <td className="px-3 py-3 align-top">
        <p className="text-[13px] leading-relaxed text-[#50575e]">
          {plugin.description}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-[#646970]">
          <span>Version {plugin.version}</span>
          <span className="text-[#a7aaad]">|</span>
          <span>
            By{" "}
            {plugin.authorUrl ? (
              <a
                href={plugin.authorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#2271b1] hover:text-[#135e96] hover:underline"
              >
                {plugin.author}
              </a>
            ) : (
              plugin.author
            )}
          </span>
          {plugin.pluginUrl && (
            <>
              <span className="text-[#a7aaad]">|</span>
              <a
                href={plugin.pluginUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#2271b1] hover:text-[#135e96] hover:underline"
              >
                View details
              </a>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
