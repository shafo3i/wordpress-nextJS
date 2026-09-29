"use client";

import { useState } from "react";
import { MenuItem } from "@/lib/menus/types";
import { MenuItemsAccordion } from "./menu-items-accordion";
import { MenuStructureEditor } from "./menu-structure-editor";

interface MenuManagerShellProps {
  menu: { id: string; name: string; slug: string; language?: string };
  initialItems: MenuItem[];
  locations: string[];
  pages: { id: string; title: string; slug: string; language?: string }[];
  categories: { id: string; name: string; slug: string; language?: string }[];
  posts?: { id: string; title: string; slug: string; language?: string }[];
  languages?: { code: string; name: string; nativeName?: string; isDefault?: boolean }[];
  dict: Record<string, string>;
  direction?: "rtl" | "ltr";
}

export function MenuManagerShell({
  menu,
  initialItems,
  locations,
  pages,
  categories,
  posts = [],
  languages = [],
  dict,
  direction = "ltr",
}: MenuManagerShellProps) {
  const [items, setItems] = useState<MenuItem[]>(initialItems);

  const handleAddItems = (newItems: { title: string; url: string }[]) => {
    const startOrder = items.length;
    const formatted: MenuItem[] = newItems.map((item, idx) => ({
      id: `temp-${Date.now()}-${idx}`,
      title: item.title,
      url: item.url,
      order: startOrder + idx + 1,
      type: item.url.startsWith("/category/")
        ? "category"
        : item.url.startsWith("/post/")
          ? "post"
          : item.url.startsWith("http://") || item.url.startsWith("https://")
            ? "custom"
            : "page",
    }));

    setItems((curr) => [...curr, ...formatted]);
  };

  return (
    <div
      dir={direction}
      className="grid grid-cols-1 gap-6 md:grid-cols-[300px_1fr] items-start text-start"
    >
      <MenuItemsAccordion
        pages={pages}
        categories={categories}
        posts={posts}
        onAddItems={handleAddItems}
        dict={dict}
        direction={direction}
      />
      <MenuStructureEditor
        menu={menu}
        items={items}
        locations={locations}
        languages={languages}
        onUpdateItems={setItems}
        dict={dict}
        direction={direction}
      />
    </div>
  );
}
