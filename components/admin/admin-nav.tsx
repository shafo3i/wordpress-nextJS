"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  FolderOpen,
  LayoutDashboard,
  MessageSquare,
  Palette,
  Pin,
  Plug,
  Settings,
  Users,
  Wrench,
} from "lucide-react";

type SubItem = {
  href: string;
  label: string;
};

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: SubItem[];
};

const navItems: NavItem[] = [
  {
    href: "/admincp",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/admincp/posts",
    label: "Posts",
    icon: Pin,
    subItems: [
      { href: "/admincp/posts", label: "All Posts" },
      { href: "/admincp/posts/new", label: "Add New" },
      { href: "/admincp/categories", label: "Categories" },
      { href: "/admincp/tags", label: "Tags" },
    ],
  },
  {
    href: "/admincp/media",
    label: "Media",
    icon: FolderOpen,
  },
  {
    href: "/admincp/pages",
    label: "Pages",
    icon: FileText,
    subItems: [
      { href: "/admincp/pages", label: "All Pages" },
      { href: "/admincp/pages/new", label: "Add New" },
    ],
  },
  {
    href: "/admincp/comments",
    label: "Comments",
    icon: MessageSquare,
  },
  {
    href: "/admincp/themes",
    label: "Appearance",
    icon: Palette,
    subItems: [
      { href: "/admincp/themes", label: "Themes" },
      { href: "/admincp/customize", label: "Customize" },
      { href: "/admincp/widgets", label: "Widgets" },
      { href: "/admincp/menus", label: "Menus" },
      { href: "/admincp/theme-settings", label: "Theme Settings" },
    ],
  },
  {
    href: "/admincp/plugins",
    label: "Plugins",
    icon: Plug,
    subItems: [
      { href: "/admincp/plugins", label: "Installed Plugins" },
      { href: "/admincp/plugins?tab=add-new", label: "Add New Plugin" },
    ],
  },
  {
    href: "/admincp/users",
    label: "Users",
    icon: Users,
  },
  {
    href: "/admincp/tools",
    label: "Tools",
    icon: Wrench,
  },
  {
    href: "/admincp/settings",
    label: "Settings",
    icon: Settings,
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Administrator navigation" className="py-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isExact = pathname === item.href;
        const isSubActive =
          item.subItems?.some((sub) => pathname === sub.href) ||
          (item.href !== "/admincp" && pathname.startsWith(`${item.href}/`));
        const isActive = isExact || isSubActive;

        return (
          <div className="relative" key={item.href}>
            <Link
              className={`flex items-center gap-2.5 px-3 py-2 text-[13px] font-normal transition-colors ${
                isActive
                  ? "bg-[#2271b1] text-white"
                  : "text-[#f0f0f1] hover:bg-[#191e23] hover:text-[#72aee6]"
              }`}
              href={item.href}
            >
              <Icon className={`size-4 ${isActive ? "text-white" : "text-[#a7aaad]"}`} />
              <span>{item.label}</span>
            </Link>

            {/* Submenu if active and has subItems */}
            {isActive && item.subItems && item.subItems.length > 0 && (
              <div className="bg-[#2c3338] py-1">
                {item.subItems.map((sub) => {
                  const isCurrentSub =
                    pathname === sub.href ||
                    (sub.href === "/admincp/posts" && pathname === "/admincp/posts") ||
                    (sub.href === "/admincp/posts/new" && pathname === "/admincp/posts/new");

                  return (
                    <Link
                      className={`block px-7 py-1 text-xs transition-colors ${
                        isCurrentSub
                          ? "font-semibold text-white"
                          : "text-[#c3c4c7] hover:text-[#72aee6]"
                      }`}
                      href={sub.href}
                      key={`${sub.href}-${sub.label}`}
                    >
                      {sub.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
