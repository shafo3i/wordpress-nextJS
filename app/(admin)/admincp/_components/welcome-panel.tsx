"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  PenTool,
  FilePlus,
  ExternalLink,
  Sliders,
  Menu,
  Image,
  Activity,
  X,
  Palette,
} from "lucide-react";

interface WelcomePanelProps {
  dict: Record<string, string>;
  siteName: string;
}

export function WelcomePanel({ dict, siteName }: WelcomePanelProps) {
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isDismissed = localStorage.getItem("pressforge_welcome_dismissed") === "true";
    setDismissed(isDismissed);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("pressforge_welcome_dismissed", "true");
  };

  if (!mounted || dismissed) {
    return null;
  }

  return (
    <div className="relative mb-6 rounded-[3px] border border-[#c3c4c7] bg-white p-5 shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
      {/* Dismiss Button */}
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-3 end-3 inline-flex items-center gap-1 text-[12px] text-[#646970] hover:text-[#135e96] transition-colors cursor-pointer"
        aria-label={dict["admin.dashboard.welcome_dismiss"] || "Dismiss"}
      >
        <span>{dict["admin.dashboard.welcome_dismiss"] || "Dismiss"}</span>
        <X className="size-4" />
      </button>

      <div className="max-w-3xl">
        <h2 className="text-[19px] font-normal leading-snug text-[#1d2327]">
          {dict["admin.dashboard.welcome_title"] || "Welcome to PressForge!"}
        </h2>
        <p className="mt-1 text-[13px] text-[#646970]">
          {dict["admin.dashboard.welcome_desc"] || "We’ve assembled some links to get you started:"}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 border-t border-[#f0f0f1] pt-5">
        {/* Column 1: Get Started */}
        <div className="space-y-3">
          <h3 className="text-[14px] font-semibold text-[#1d2327]">
            {dict["admin.dashboard.get_started"] || "Get Started"}
          </h3>
          <div className="pt-1">
            <Link
              href="/admincp/customize"
              className="inline-flex items-center gap-1.5 rounded-[3px] bg-[#2271b1] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#135e96] transition-colors shadow-xs"
            >
              <Palette className="size-4" />
              <span>{dict["admin.dashboard.customize_site"] || "Customize Your Site"}</span>
            </Link>
          </div>
          <p className="text-[12px] text-[#646970]">
            {dict["admin.dashboard.or_change_theme"] || "or, "}{" "}
            <Link
              href="/admincp/themes"
              className="text-[#2271b1] hover:underline"
            >
              {dict["admin.menu.themes"] || "change your theme completely"}
            </Link>
          </p>
        </div>

        {/* Column 2: Next Steps */}
        <div className="space-y-2">
          <h3 className="text-[14px] font-semibold text-[#1d2327]">
            {dict["admin.dashboard.next_steps"] || "Next Steps"}
          </h3>
          <ul className="space-y-2 text-[13px]">
            <li>
              <Link
                href="/admincp/posts/new"
                className="inline-flex items-center gap-2 text-[#2271b1] hover:underline"
              >
                <PenTool className="size-3.5 text-[#646970]" />
                <span>{dict["admin.dashboard.write_post"] || "Write your first blog post"}</span>
              </Link>
            </li>
            <li>
              <Link
                href="/admincp/pages/new"
                className="inline-flex items-center gap-2 text-[#2271b1] hover:underline"
              >
                <FilePlus className="size-3.5 text-[#646970]" />
                <span>{dict["admin.dashboard.add_page"] || "Add an About page"}</span>
              </Link>
            </li>
            <li>
              <Link
                href="/"
                target="_blank"
                className="inline-flex items-center gap-2 text-[#2271b1] hover:underline"
              >
                <ExternalLink className="size-3.5 text-[#646970]" />
                <span>{dict["admin.dashboard.view_site"] || "View your site"}</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: More Actions */}
        <div className="space-y-2">
          <h3 className="text-[14px] font-semibold text-[#1d2327]">
            {dict["admin.dashboard.more_actions"] || "More Actions"}
          </h3>
          <ul className="space-y-2 text-[13px]">
            <li>
              <Link
                href="/admincp/widgets"
                className="inline-flex items-center gap-2 text-[#2271b1] hover:underline"
              >
                <Sliders className="size-3.5 text-[#646970]" />
                <span>{dict["admin.dashboard.manage_widgets"] || "Manage widgets"}</span>
              </Link>
            </li>
            <li>
              <Link
                href="/admincp/menus"
                className="inline-flex items-center gap-2 text-[#2271b1] hover:underline"
              >
                <Menu className="size-3.5 text-[#646970]" />
                <span>{dict["admin.dashboard.manage_menus"] || "Manage menus"}</span>
              </Link>
            </li>
            <li>
              <Link
                href="/admincp/media"
                className="inline-flex items-center gap-2 text-[#2271b1] hover:underline"
              >
                <Image className="size-3.5 text-[#646970]" />
                <span>{dict["admin.dashboard.manage_media"] || "Manage media library"}</span>
              </Link>
            </li>
            <li>
              <Link
                href="/admincp/tools/site-health"
                className="inline-flex items-center gap-2 text-[#2271b1] hover:underline"
              >
                <Activity className="size-3.5 text-[#646970]" />
                <span>{dict["admin.dashboard.site_health_link"] || "Check site health"}</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
