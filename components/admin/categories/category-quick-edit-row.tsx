"use client";

import { useState, useTransition } from "react";
import { quickUpdateCategory } from "@/app/(admin)/admincp/categories/actions";

export type CategoryQuickEditProps = {
  category: {
    id: string;
    name: string;
    slug: string;
  };
  onCancel: () => void;
  onSuccess: (updated: { id: string; name: string; slug: string }) => void;
};

export function CategoryQuickEditRow({
  category,
  onCancel,
  onSuccess,
}: CategoryQuickEditProps) {
  const [name, setName] = useState(category.name || "");
  const [slug, setSlug] = useState(category.slug || "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleUpdate = () => {
    setErrorMessage(null);
    if (!name.trim()) {
      setErrorMessage("Category name is required.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await quickUpdateCategory({
          id: category.id,
          name: name.trim(),
          slug: slug.trim(),
        });
        if (res?.success) {
          onSuccess(res);
        } else {
          setErrorMessage("Failed to update category.");
        }
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : "Error saving category.");
      }
    });
  };

  return (
    <tr className="border-y-2 border-[#2271b1] bg-[#f6f7f7]">
      <td className="p-3" colSpan={5}>
        <div className="space-y-3 text-[13px] text-[#2c3338]">
          <h4 className="text-[13px] font-bold uppercase tracking-wider text-[#1d2327]">
            QUICK EDIT
          </h4>

          {errorMessage && (
            <div className="rounded border border-[#d63638] bg-[#fcf0f1] px-3 py-1.5 text-xs text-[#d63638]">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#50575e]">
                Name
              </label>
              <input
                className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                onChange={(e) => setName(e.target.value)}
                type="text"
                value={name}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#50575e]">
                Slug
              </label>
              <input
                className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                onChange={(e) => setSlug(e.target.value)}
                type="text"
                value={slug}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[#dcdcde] pt-3">
            <button
              className="rounded-[3px] border border-[#8c8f94] bg-[#f6f7f7] px-3 py-1 text-[13px] text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78]"
              onClick={onCancel}
              type="button"
            >
              Cancel
            </button>
            <button
              className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-4 py-1 text-[13px] font-medium text-white hover:border-[#135e96] hover:bg-[#135e96] disabled:opacity-50"
              disabled={isPending}
              onClick={handleUpdate}
              type="button"
            >
              {isPending ? "Updating..." : "Update Category"}
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}
