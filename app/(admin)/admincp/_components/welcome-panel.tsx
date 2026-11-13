"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  PenTool,
  FilePlus,
  ExternalLink,
  Sliders,
  Menu,
  Image as ImageIcon,
  Activity,
  X,
  Palette,
} from "lucide-react";

interface WelcomePanelProps {
  dict: Record<string, string>;
  siteName: string;
}

export function WelcomePanel({ dict }: WelcomePanelProps) {
  const [dismissed, setDismissed] = useState(false);
  const storedDismissed = useSyncExternalStore(
    (callback) => {
      window.addEventListener("storage", callback);
      return () => window.removeEventListener("storage", callback);
    },
    () => {
      try {
        return localStorage.getItem("pressforge_welcome_dismissed") === "true";
      } catch {
        return false;
      }
    },
    () => true
  );

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem("pressforge_welcome_dismissed", "true");
    } catch {
      /* Dismiss for this view only. */
    }
  };

  if (storedDismissed || dismissed) {
    return null;
  }

  return (
    <div className="relative mb-6 rounded-[3px] border border-[#c3c4c7] bg-white p-5 shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
      {/* Dismiss Button */}
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute end-3 top-3 inline-flex cursor-pointer items-center gap-1 text-[12px] text-[#646970] transition-colors hover:text-[#135e96]"
        aria-label={dict["admin.dashboard.welcome_dismiss"]}
      >
        <span>{dict["admin.dashboard.welcome_dismiss"]}</span>
        <X className="size-4" />
      </button>

      <div className="max-w-3xl">
        <h2 className="text-[19px] leading-snug font-normal text-[#1d2327]">
          {dict["admin.dashboard.welcome_title"]}
        </h2>
        <p className="mt-1 text-[13px] text-[#646970]">
          {dict["admin.dashboard.welcome_desc"]}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-6 border-t border-[#f0f0f1] pt-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Column 1: Get Started */}
        <div className="space-y-3">
          <h3 className="text-[14px] font-semibold text-[#1d2327]">
            {dict["admin.dashboard.get_started"]}
          </h3>
          <div className="pt-1">
            <Link
              href="/admincp/customize"
              className="inline-flex items-center gap-1.5 rounded-[3px] bg-[#2271b1] px-4 py-2 text-[13px] font-medium text-white shadow-xs transition-colors hover:bg-[#135e96]"
            >
              <Palette className="size-4" />
              <span>{dict["admin.dashboard.customize_site"]}</span>
            </Link>
          </div>
          <p className="text-[12px] text-[#646970]">
            {dict["admin.dashboard.or_change_theme"]}{" "}
            <Link
              href="/admincp/themes"
              className="text-[#2271b1] hover:underline"
            >
              {dict["admin.menu.themes"]}
            </Link>
          </p>
        </div>

        {/* Column 2: Next Steps */}
        <div className="space-y-2">
          <h3 className="text-[14px] font-semibold text-[#1d2327]">
            {dict["admin.dashboard.next_steps"]}
          </h3>
          <ul className="space-y-2 text-[13px]">
            <li>
              <Link
                href="/admincp/posts/new"
                className="inline-flex items-center gap-2 text-[#2271b1] hover:underline"
              >
                <PenTool className="size-3.5 text-[#646970]" />
                <span>{dict["admin.dashboard.write_post"]}</span>
              </Link>
            </li>
            <li>
              <Link
                href="/admincp/pages/new"
                className="inline-flex items-center gap-2 text-[#2271b1] hover:underline"
              >
                <FilePlus className="size-3.5 text-[#646970]" />
                <span>{dict["admin.dashboard.add_page"]}</span>
              </Link>
            </li>
            <li>
              <Link
                href="/"
                target="_blank"
                className="inline-flex items-center gap-2 text-[#2271b1] hover:underline"
              >
                <ExternalLink className="size-3.5 text-[#646970]" />
                <span>{dict["admin.dashboard.view_site"]}</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: More Actions */}
        <div className="space-y-2">
          <h3 className="text-[14px] font-semibold text-[#1d2327]">
            {dict["admin.dashboard.more_actions"]}
          </h3>
          <ul className="space-y-2 text-[13px]">
            <li>
              <Link
                href="/admincp/widgets"
                className="inline-flex items-center gap-2 text-[#2271b1] hover:underline"
              >
                <Sliders className="size-3.5 text-[#646970]" />
                <span>{dict["admin.dashboard.manage_widgets"]}</span>
              </Link>
            </li>
            <li>
              <Link
                href="/admincp/menus"
                className="inline-flex items-center gap-2 text-[#2271b1] hover:underline"
              >
                <Menu className="size-3.5 text-[#646970]" />
                <span>{dict["admin.dashboard.manage_menus"]}</span>
              </Link>
            </li>
            <li>
              <Link
                href="/admincp/media"
                className="inline-flex items-center gap-2 text-[#2271b1] hover:underline"
              >
                <ImageIcon className="size-3.5 text-[#646970]" />
                <span>{dict["admin.dashboard.manage_media"]}</span>
              </Link>
            </li>
            <li>
              <Link
                href="/admincp/tools/site-health"
                className="inline-flex items-center gap-2 text-[#2271b1] hover:underline"
              >
                <Activity className="size-3.5 text-[#646970]" />
                <span>{dict["admin.dashboard.site_health_link"]}</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
