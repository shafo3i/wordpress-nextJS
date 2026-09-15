"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { MenuItem } from "@/lib/menus/types";
import { deleteMenuAction, saveMenuAction } from "@/app/(admin)/admincp/menus/actions";

export function MenuStructureEditor({
  menu,
  items: initialItems,
  locations: initialLocations,
  onUpdateItems,
}: {
  menu: { id: string; name: string; slug: string };
  items: MenuItem[];
  locations: string[];
  onUpdateItems: (items: MenuItem[]) => void;
}) {
  const [menuName, setMenuName] = useState(menu.name);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [selectedLocations, setSelectedLocations] = useState<string[]>(initialLocations);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Move item via button
  const moveItem = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= initialItems.length) return;

    const newItems = [...initialItems];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    const reordered = newItems.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));

    onUpdateItems(reordered);
  };

  // Drag and Drop reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = "move";
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newItems = [...initialItems];
    const [movedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, movedItem);

    const reordered = newItems.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));

    onUpdateItems(reordered);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const removeItem = (id: string) => {
    const remaining = initialItems
      .filter((item) => item.id !== id)
      .map((item, idx) => ({ ...item, order: idx + 1 }));
    onUpdateItems(remaining);
  };

  const updateItem = (id: string, updates: Partial<MenuItem>) => {
    const updated = initialItems.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    onUpdateItems(updated);
  };

  const toggleLocation = (loc: string, checked: boolean) => {
    setSelectedLocations((curr) =>
      checked ? [...new Set([...curr, loc])] : curr.filter((l) => l !== loc)
    );
  };

  const handleSave = () => {
    if (!menuName.trim()) return;

    startTransition(async () => {
      const res = await saveMenuAction(
        menu.id,
        menuName.trim(),
        initialItems.map((item, idx) => ({
          id: item.id,
          title: item.title,
          url: item.url,
          order: idx + 1,
        })),
        selectedLocations
      );

      if (res.error) {
        setNotice({ type: "error", message: res.error });
      } else {
        setNotice({ type: "success", message: `Menu "${menuName}" has been updated.` });
        router.refresh();
      }
    });
  };

  const handleDelete = () => {
    if (!confirm(`Are you sure you want to delete the menu "${menu.name}"?`)) return;

    startTransition(async () => {
      const res = await deleteMenuAction(menu.id);
      if (res.error) {
        setNotice({ type: "error", message: res.error });
      } else {
        router.push("/admincp/menus");
      }
    });
  };

  return (
    <div className="rounded-[3px] border border-[#c3c4c7] bg-white text-[13px] shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c3c4c7] bg-[#f6f7f7] px-4 py-3">
        <div className="flex items-center gap-2">
          <label htmlFor="menu-name-top" className="font-semibold text-[#1d2327]">
            Menu Name
          </label>
          <input
            id="menu-name-top"
            type="text"
            value={menuName}
            onChange={(e) => setMenuName(e.target.value)}
            className="h-[30px] w-64 rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
          />
        </div>

        <button
          type="button"
          disabled={isPending || !menuName.trim()}
          onClick={handleSave}
          className="rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-4 py-1.5 font-medium text-white hover:bg-[#135e96] transition-colors disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save Menu"}
        </button>
      </div>

      {notice && (
        <div
          className={`flex items-center justify-between border-l-4 p-3 text-[13px] m-4 ${
            notice.type === "success"
              ? "border-[#00a32a] bg-[#f0f6fc] text-[#1d2327]"
              : "border-[#d63638] bg-[#fcf0f1] text-[#1d2327]"
          }`}
        >
          <span>{notice.message}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-[16px] leading-none text-[#787c82] hover:text-[#d63638]"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Structure Body */}
      <div className="p-4 space-y-4">
        <div>
          <h3 className="font-semibold text-[#1d2327] text-sm">Menu Structure</h3>
          <p className="text-[12px] text-[#646970] mt-0.5">
            Drag each item into the order you prefer, or click the arrows to move items.
          </p>
        </div>

        {/* Menu Items List with Drag & Drop */}
        <div className="space-y-2">
          {initialItems.length ? (
            initialItems.map((item, index) => {
              const isExpanded = expandedItemId === item.id;
              const isDragging = draggedIndex === index;
              const isDragOver = dragOverIndex === index && draggedIndex !== index;

              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`rounded-[3px] border bg-[#f6f7f7] shadow-sm transition-all duration-150 ${
                    isDragging
                      ? "opacity-40 border-dashed border-[#2271b1] bg-blue-50"
                      : isDragOver
                      ? "border-t-4 border-t-[#2271b1] border-[#c3c4c7] bg-[#f0f6fc]"
                      : "border-[#c3c4c7] hover:border-[#8c8f94]"
                  }`}
                >
                  {/* Item Header */}
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2">
                      {/* Drag Handle */}
                      <div
                        className="cursor-grab active:cursor-grabbing text-[#8c8f94] hover:text-[#1d2327] p-0.5"
                        title="Drag to reorder"
                      >
                        <GripVertical className="size-4" />
                      </div>

                      {/* Up/Down fallback buttons */}
                      <div className="flex flex-col">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveItem(index, "up")}
                          aria-label="Move item up"
                          className="text-[#646970] hover:text-[#2271b1] disabled:opacity-20"
                        >
                          <ArrowUp className="size-3" />
                        </button>
                        <button
                          type="button"
                          disabled={index === initialItems.length - 1}
                          onClick={() => moveItem(index, "down")}
                          aria-label="Move item down"
                          className="text-[#646970] hover:text-[#2271b1] disabled:opacity-20"
                        >
                          <ArrowDown className="size-3" />
                        </button>
                      </div>

                      <span className="font-semibold text-[#1d2327] select-none">{item.title}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#646970] font-mono">
                        {item.url.startsWith("/category")
                          ? "Category"
                          : item.url.startsWith("http")
                          ? "Custom Link"
                          : "Page"}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedItemId(isExpanded ? null : item.id)
                        }
                        className="p-1 text-[#646970] hover:text-[#2271b1]"
                      >
                        {isExpanded ? (
                          <ChevronUp className="size-4" />
                        ) : (
                          <ChevronDown className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Item Form */}
                  {isExpanded && (
                    <div className="border-t border-[#dcdcde] bg-white p-3.5 space-y-3">
                      <div>
                        <label className="block text-[12px] font-medium text-[#50575e] mb-1">
                          Navigation Label
                        </label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => updateItem(item.id, { title: e.target.value })}
                          className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
                        />
                      </div>

                      <div>
                        <label className="block text-[12px] font-medium text-[#50575e] mb-1">
                          URL
                        </label>
                        <input
                          type="text"
                          value={item.url}
                          onChange={(e) => updateItem(item.id, { url: e.target.value })}
                          className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-[#f0f0f1]">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-[12px] text-[#b32d2e] hover:underline"
                        >
                          Remove
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpandedItemId(null)}
                          className="text-[12px] text-[#2271b1] hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="border border-dashed border-[#c3c4c7] p-8 text-center text-[#646970]">
              No menu items yet. Check pages or categories on the left and click "Add to Menu".
            </div>
          )}
        </div>

        {/* Menu Settings Section */}
        <div className="border-t border-[#dcdcde] pt-4 mt-6">
          <h4 className="font-semibold text-[#1d2327]">Menu Settings</h4>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2 items-start">
            <span className="text-[12px] text-[#50575e]">Display location:</span>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedLocations.includes("primary")}
                  onChange={(e) => toggleLocation("primary", e.target.checked)}
                  className="h-4 w-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                />
                <span className="text-[#2c3338]">Primary Navigation (Header)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedLocations.includes("footer")}
                  onChange={(e) => toggleLocation("footer", e.target.checked)}
                  className="h-4 w-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                />
                <span className="text-[#2c3338]">Footer Menu</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer Bar */}
      <div className="flex items-center justify-between border-t border-[#c3c4c7] bg-[#f6f7f7] px-4 py-3">
        <button
          type="button"
          disabled={isPending}
          onClick={handleDelete}
          className="text-[13px] text-[#b32d2e] hover:underline disabled:opacity-50"
        >
          Delete Menu
        </button>

        <button
          type="button"
          disabled={isPending || !menuName.trim()}
          onClick={handleSave}
          className="rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-4 py-1.5 font-medium text-white hover:bg-[#135e96] transition-colors disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save Menu"}
        </button>
      </div>
    </div>
  );
}
