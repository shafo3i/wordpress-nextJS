"use client";

import { useState } from "react";
import { MenuItem } from "@/lib/menus/types";
import { MenuItemsAccordion } from "./menu-items-accordion";
import { MenuStructureEditor } from "./menu-structure-editor";

export function MenuManagerShell({
  menu,
  initialItems,
  locations,
  pages,
  categories,
}: {
  menu: { id: string; name: string; slug: string };
  initialItems: MenuItem[];
  locations: string[];
  pages: { id: string; title: string; slug: string }[];
  categories: { id: string; name: string; slug: string }[];
}) {
  const [items, setItems] = useState<MenuItem[]>(initialItems);

  const handleAddItems = (newItems: { title: string; url: string }[]) => {
    const startOrder = items.length;
    const formatted: MenuItem[] = newItems.map((item, idx) => ({
      id: `temp-${Date.now()}-${idx}`,
      title: item.title,
      url: item.url,
      order: startOrder + idx + 1,
    }));

    setItems((curr) => [...curr, ...formatted]);
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[300px_1fr] items-start">
      <MenuItemsAccordion
        pages={pages}
        categories={categories}
        onAddItems={handleAddItems}
      />
      <MenuStructureEditor
        menu={menu}
        items={items}
        locations={locations}
        onUpdateItems={setItems}
      />
    </div>
  );
}
