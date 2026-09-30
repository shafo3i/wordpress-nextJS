"use client";

import { useEffect, useTransition } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Theme } from "@/lib/themes/types";
import { activateThemeAction } from "../actions";
import { ThemePreviewVisual } from "./theme-preview-visual";

interface ThemeDetailsModalProps {
  theme: Theme | null;
  allThemes: Theme[];
  onClose: () => void;
  onSelectTheme: (theme: Theme) => void;
  dict?: Record<string, string>;
  direction?: "rtl" | "ltr";
}

export function ThemeDetailsModal({
  theme,
  allThemes,
  onClose,
  onSelectTheme,
  dict,
  direction = "ltr",
}: ThemeDetailsModalProps) {
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        if (theme) {
          const idx = allThemes.findIndex((t) => t.slug === theme.slug);
          const prevIdx = (idx - 1 + allThemes.length) % allThemes.length;
          onSelectTheme(allThemes[prevIdx]);
        }
      } else if (e.key === "ArrowRight") {
        if (theme) {
          const idx = allThemes.findIndex((t) => t.slug === theme.slug);
          const nextIdx = (idx + 1) % allThemes.length;
          onSelectTheme(allThemes[nextIdx]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [theme, allThemes, onClose, onSelectTheme]);

  if (!theme) return null;

  const currentIndex = allThemes.findIndex((t) => t.slug === theme.slug);
  const prevTheme = allThemes[(currentIndex - 1 + allThemes.length) % allThemes.length];
  const nextTheme = allThemes[(currentIndex + 1) % allThemes.length];

  const handleActivate = () => {
    startTransition(async () => {
      await activateThemeAction(theme.slug);
      onClose();
    });
  };

  const tagsList = theme.tags
    ? theme.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
    : [];

  return (
    <div
      dir={direction}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-6 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[3px] border border-[#c3c4c7] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header Bar */}
        <div className="flex items-center justify-between border-b border-[#dcdcde] bg-[#f6f7f7] px-4 py-2.5">
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => onSelectTheme(prevTheme)}
              className="flex size-7 items-center justify-center rounded border border-[#c3c4c7] bg-white text-[#50575e] hover:border-[#8c8f94] hover:text-[#1d2327]"
              title={dict?.["admin.themes.prev_theme"] || "Previous Theme"}
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => onSelectTheme(nextTheme)}
              className="flex size-7 items-center justify-center rounded border border-[#c3c4c7] bg-white text-[#50575e] hover:border-[#8c8f94] hover:text-[#1d2327]"
              title={dict?.["admin.themes.next_theme"] || "Next Theme"}
            >
              <ChevronRight className="size-4" />
            </button>
            <span className="font-semibold text-[#1d2327]">
              {theme.name}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded text-[#50575e] hover:bg-[#dcdcde] hover:text-[#1d2327]"
            title={dict?.["admin.themes.close_details"] || "Close details dialog"}
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal Main Content */}
        <div className="overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.2fr_1fr]">
            {/* Left Preview */}
            <div className="overflow-hidden rounded border border-[#dcdcde] shadow-sm">
              <ThemePreviewVisual slug={theme.slug} />
            </div>

            {/* Right Information */}
            <div className="flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-baseline justify-between gap-2 border-b border-[#f0f0f1] pb-3">
                  <h2 className="text-xl font-bold text-[#1d2327]">{theme.name}</h2>
                  <span className="text-xs text-[#646970]">
                    {dict?.["admin.themes.version"] || "Version"}: {theme.version}
                  </span>
                </div>

                <p className="mt-2 text-xs text-[#50575e]">
                  {dict?.["admin.themes.by_author"] || "By"}{" "}
                  {theme.authorUrl ? (
                    <a
                      href={theme.authorUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[#2271b1] hover:underline"
                    >
                      {theme.author}
                    </a>
                  ) : (
                    <span className="font-medium text-[#1d2327]">{theme.author}</span>
                  )}
                </p>

                <p className="mt-4 text-xs leading-relaxed text-[#2c3338]">
                  {theme.description}
                </p>

                {tagsList.length > 0 && (
                  <div className="mt-6 border-t border-[#f0f0f1] pt-4">
                    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-[#646970]">
                      {dict?.["admin.themes.tags"] || "Tags"}:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {tagsList.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-[3px] border border-[#dcdcde] bg-[#f6f7f7] px-2 py-0.5 text-[11px] text-[#50575e]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="flex items-center justify-between border-t border-[#dcdcde] bg-[#f6f7f7] px-6 py-3">
          {theme.isActive ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-[#2271b1]">
              <span className="size-2 rounded-full bg-[#2271b1]"></span>
              <span>{dict?.["admin.themes.active_theme"] || "Active Theme"}</span>
            </div>
          ) : (
            <div className="text-xs text-[#646970]">
              {dict?.["admin.themes.by_author"] || "By"} {theme.author}
            </div>
          )}

          <div className="flex items-center gap-2">
            {theme.isActive ? (
              <Link
                href="/admincp/customize"
                className="inline-flex items-center rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-4 py-1.5 text-xs font-medium text-white shadow hover:bg-[#135e96]"
              >
                {dict?.["admin.themes.customize"] || "Customize"}
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleActivate}
                  className="inline-flex items-center rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-4 py-1.5 text-xs font-medium text-white shadow hover:bg-[#135e96] disabled:opacity-50"
                >
                  {isPending
                    ? dict?.["admin.themes.activating"] || "Activating..."
                    : dict?.["admin.themes.activate"] || "Activate"}
                </button>
                <Link
                  href={`/admincp/customize?theme=${theme.slug}`}
                  className="inline-flex items-center rounded-[3px] border border-[#c3c4c7] bg-white px-3 py-1.5 text-xs font-medium text-[#2c3338] hover:border-[#8c8f94] hover:bg-[#f0f0f1]"
                >
                  {dict?.["admin.themes.live_preview"] || "Live Preview"}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
