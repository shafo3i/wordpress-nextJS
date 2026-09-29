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
  Languages,
} from "lucide-react";

type SubItem = {
  href: string;
  label: string;
  key?: string;
};

type NavItem = {
  href: string;
  label: string;
  key?: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: SubItem[];
};

const navItems: NavItem[] = [
  {
    href: "/admincp",
    label: "Dashboard",
    key: "admin.menu.dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/admincp/posts",
    label: "Posts",
    key: "admin.menu.posts",
    icon: Pin,
    subItems: [
      { href: "/admincp/posts", label: "All Posts", key: "admin.menu.all_posts" },
      { href: "/admincp/posts/new", label: "Add New", key: "admin.menu.add_new" },
      { href: "/admincp/categories", label: "Categories", key: "admin.menu.categories" },
      { href: "/admincp/tags", label: "Tags", key: "admin.menu.tags" },
    ],
  },
  {
    href: "/admincp/media",
    label: "Media",
    key: "admin.menu.media",
    icon: FolderOpen,
  },
  {
    href: "/admincp/pages",
    label: "Pages",
    key: "admin.menu.pages",
    icon: FileText,
    subItems: [
      { href: "/admincp/pages", label: "All Pages", key: "admin.menu.all_pages" },
      { href: "/admincp/pages/new", label: "Add New", key: "admin.menu.add_new" },
    ],
  },
  {
    href: "/admincp/comments",
    label: "Comments",
    key: "admin.menu.comments",
    icon: MessageSquare,
  },
  {
    href: "/admincp/themes",
    label: "Appearance",
    key: "admin.menu.appearance",
    icon: Palette,
    subItems: [
      { href: "/admincp/themes", label: "Themes", key: "admin.menu.themes" },
      { href: "/admincp/customize", label: "Customize" },
      { href: "/admincp/widgets", label: "Widgets" },
      { href: "/admincp/menus", label: "Menus" },
      { href: "/admincp/theme-settings", label: "Theme Settings" },
    ],
  },
  {
    href: "/admincp/plugins",
    label: "Plugins",
    key: "admin.menu.plugins",
    icon: Plug,
    subItems: [
      { href: "/admincp/plugins", label: "Installed Plugins" },
      { href: "/admincp/plugins?tab=add-new", label: "Add New Plugin" },
    ],
  },
  {
    href: "/admincp/users",
    label: "Users",
    key: "admin.menu.users",
    icon: Users,
  },
  {
    href: "/admincp/tools",
    label: "Tools",
    key: "admin.menu.tools",
    icon: Wrench,
  },
  {
    href: "/admincp/languages",
    label: "Languages",
    key: "admin.menu.languages",
    icon: Languages,
    subItems: [
      { href: "/admincp/languages", label: "All Languages", key: "admin.menu.all_languages" },
      { href: "/admincp/translations", label: "Translations", key: "admin.menu.translations" },
    ],
  },
  {
    href: "/admincp/settings",
    label: "Settings",
    key: "admin.menu.settings",
    icon: Settings,
  },
];

export function AdminNav({ dict = {} }: { dict?: Record<string, string> }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Administrator navigation" className="py-2 ">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isExact = pathname === item.href;
        const isSubActive =
          item.subItems?.some((sub) => pathname === sub.href) ||
          (item.href !== "/admincp" && pathname.startsWith(`${item.href}/`));
        const isActive = isExact || isSubActive;
        const itemLabel = (item.key && dict[item.key]) || item.label;

        return (
          <div className="relative" key={item.href}>
            <Link
              className={`flex items-center gap-2.5 px-3 py-2 text-[13px] font-normal transition-colors ${isActive
                  ? "bg-[#2271b1] text-white"
                  : "text-[#f0f0f1] hover:bg-[#191e23] hover:text-[#72aee6]"
                }`}
              href={item.href}
            >
              <Icon className={`size-4 ${isActive ? "text-white" : "text-[#a7aaad]"}`} />
              <span>{itemLabel}</span>
            </Link>

            {/* Submenu if active and has subItems */}
            {isActive && item.subItems && item.subItems.length > 0 && (
              <div className="bg-[#2c3338] py-1">
                {item.subItems.map((sub) => {
                  const isCurrentSub =
                    pathname === sub.href ||
                    (sub.href === "/admincp/posts" && pathname === "/admincp/posts") ||
                    (sub.href === "/admincp/posts/new" && pathname === "/admincp/posts/new");
                  const subLabel = (sub.key && dict[sub.key]) || sub.label;

                  return (
                    <Link
                      className={`block ps-7 pe-3 py-1 text-xs transition-colors ${isCurrentSub
                          ? "font-semibold text-white"
                          : "text-[#c3c4c7] hover:text-[#72aee6]"
                        }`}
                      href={sub.href}
                      key={`${sub.href}-${sub.label}`}
                    >
                      {subLabel}
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
