"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Theme } from "@/lib/themes/types";
import { activateThemeAction } from "../actions";
import { ThemePreviewVisual } from "./theme-preview-visual";

interface ThemeCardProps {
  theme: Theme;
  onOpenDetails: (theme: Theme) => void;
  dict?: Record<string, string>;
}

export function ThemeCard({ theme, onOpenDetails, dict }: ThemeCardProps) {
  const [isPending, startTransition] = useTransition();
  const [activationError, setActivationError] = useState(false);

  const handleActivate = (e: React.MouseEvent) => {
    e.stopPropagation();
    startTransition(async () => {
      setActivationError(false);
      try {
        const result = await activateThemeAction(theme.slug);
        if (!result.success) {
          setActivationError(true);
          return;
        }
      } catch {
        setActivationError(true);
        return;
      }
    });
  };

  const isActive = Boolean(theme.isActive);

  return (
    <div
      onClick={() => onOpenDetails(theme)}
      className={`group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-[3px] border bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-all hover:shadow-md ${
        isActive
          ? "border-[#2271b1] ring-2 ring-[#2271b1]"
          : "border-[#dcdcde] hover:border-[#8c8f94]"
      }`}
    >
      {/* Theme Screenshot Container */}
      <div className="relative border-b border-[#dcdcde]">
        <ThemePreviewVisual slug={theme.slug} />

        {/* Hover Action Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 p-4 opacity-0 backdrop-blur-[1px] transition-opacity group-hover:opacity-100">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {!isActive && (
              <button
                type="button"
                disabled={isPending}
                onClick={handleActivate}
                className="rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-3.5 py-1 text-[13px] font-medium text-white shadow transition-colors hover:bg-[#135e96] disabled:opacity-50"
              >
                {isPending
                  ? dict?.["admin.themes.activating"]
                  : dict?.["admin.themes.activate"]}
              </button>
            )}

            <Link
              href={
                isActive
                  ? "/admincp/customize"
                  : `/admincp/customize?theme=${theme.slug}`
              }
              onClick={(e) => e.stopPropagation()}
              className="rounded-[3px] border border-white bg-white/95 px-3 py-1 text-[13px] font-medium text-[#2c3338] shadow transition-colors hover:bg-white"
            >
              {isActive
                ? dict?.["admin.themes.customize"]
                : dict?.["admin.themes.live_preview"]}
            </Link>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetails(theme);
              }}
              className="rounded-[3px] border border-[#dcdcde] bg-black/60 px-3 py-1 text-[13px] font-medium text-white shadow transition-colors hover:bg-black/80"
            >
              {dict?.["admin.themes.theme_details"]}
            </button>
          </div>
        </div>
      </div>

      {activationError && (
        <p role="alert">{dict?.["admin.themes.activation_error"]}</p>
      )}
      {/* Theme Details Bottom Bar */}
      <div className="p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-semibold text-[#1d2327]">
            {theme.name}
          </h3>
          <span className="text-[11px] text-[#646970]">v{theme.version}</span>
        </div>

        <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[#50575e]">
          {theme.description}
        </p>

        {/* Card Footer Bar */}
        <div className="mt-3 flex items-center justify-between border-t border-[#f0f0f1] pt-2.5">
          {isActive ? (
            <>
              <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#2271b1]">
                <span className="size-2 rounded-full bg-[#2271b1]"></span>
                <span>
                  {dict?.["admin.themes.active"]}: {theme.name}
                </span>
              </div>
              <Link
                href="/admincp/customize"
                onClick={(e) => e.stopPropagation()}
                className="rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-3 py-1 text-[12px] font-medium text-white transition-colors hover:bg-[#135e96]"
              >
                {dict?.["admin.themes.customize"]}
              </Link>
            </>
          ) : (
            <>
              <span className="text-[11px] text-[#646970]">
                {dict?.["admin.themes.by_author"]} {theme.author}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleActivate}
                  className="rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-2.5 py-1 text-[12px] font-medium text-[#2271b1] transition-colors hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78] disabled:opacity-50"
                >
                  {isPending
                    ? dict?.["admin.themes.activating"]
                    : dict?.["admin.themes.activate"]}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
