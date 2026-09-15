"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createMenuAction } from "@/app/(admin)/admincp/menus/actions";

export function MenuSelectorBar({
  menus,
  currentMenuId,
}: {
  menus: { id: string; name: string; slug: string }[];
  currentMenuId?: string;
}) {
  const [selectedId, setSelectedId] = useState(currentMenuId || (menus[0]?.id ?? ""));
  const [isCreating, setIsCreating] = useState(false);
  const [newMenuName, setNewMenuName] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSelect = () => {
    if (selectedId) {
      router.push(`/admincp/menus?menu=${selectedId}`);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuName.trim()) return;

    startTransition(async () => {
      const res = await createMenuAction(newMenuName);
      if (res.success && res.menuId) {
        setIsCreating(false);
        setNewMenuName("");
        router.push(`/admincp/menus?menu=${res.menuId}`);
      } else {
        alert(res.error || "Failed to create menu");
      }
    });
  };

  return (
    <div className="rounded-[3px] border border-[#c3c4c7] bg-white p-3.5 text-[13px] shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
      {isCreating ? (
        <form onSubmit={handleCreate} className="flex flex-wrap items-center gap-2">
          <label htmlFor="new-menu-name" className="font-semibold text-[#1d2327]">
            Menu Name:
          </label>
          <input
            id="new-menu-name"
            type="text"
            placeholder="e.g. Primary Navigation"
            value={newMenuName}
            onChange={(e) => setNewMenuName(e.target.value)}
            className="h-[30px] rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
            autoFocus
          />
          <button
            type="submit"
            disabled={isPending || !newMenuName.trim()}
            className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-3 font-medium text-white hover:bg-[#135e96] transition-colors disabled:opacity-50"
          >
            {isPending ? "Creating..." : "Create Menu"}
          </button>
          <button
            type="button"
            onClick={() => setIsCreating(false)}
            className="h-[30px] rounded-[3px] border border-[#c3c4c7] bg-[#f6f7f7] px-3 text-[#50575e] hover:bg-[#f0f0f1]"
          >
            Cancel
          </button>
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="select-menu-to-edit" className="text-[#50575e]">
            Select a menu to edit:
          </label>
          <select
            id="select-menu-to-edit"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="h-[30px] rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
          >
            {menus.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleSelect}
            className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78] transition-colors"
          >
            Select
          </button>
          <span className="text-[#a7aaad]">or</span>
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="text-[#2271b1] hover:text-[#135e96] hover:underline"
          >
            create a new menu
          </button>
        </div>
      )}
    </div>
  );
}
