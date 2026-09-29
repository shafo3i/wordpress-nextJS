"use client";

import { useState, useTransition } from "react";
import { quickUpdateTag } from "../action";

export type TagQuickEditProps = {
  tag: {
    id: string;
    name: string;
    slug: string;
  };
  onCancel: () => void;
  onSuccess: (updated: { id: string; name: string; slug: string }) => void;
  dict?: Record<string, string>;
};

export function TagQuickEditRow({
  tag,
  onCancel,
  onSuccess,
  dict = {},
}: TagQuickEditProps) {
  const [name, setName] = useState(tag.name || "");
  const [slug, setSlug] = useState(tag.slug || "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleUpdate = () => {
    setErrorMessage(null);
    if (!name.trim()) {
      setErrorMessage(dict["admin.tags.form.name_required"] || "Tag name is required.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await quickUpdateTag({
          id: tag.id,
          name: name.trim(),
          slug: slug.trim(),
        });
        if (res?.success) {
          onSuccess(res);
        } else {
          setErrorMessage(dict["admin.tags.single_failed"] || "Failed to update tag.");
        }
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : "Error saving tag.");
      }
    });
  };

  return (
    <tr className="border-y-2 border-[#2271b1] bg-[#f6f7f7]">
      <td className="p-3 text-start" colSpan={5}>
        <div className="space-y-3 text-start text-[13px] text-[#2c3338]">
          <h4 className="text-[13px] font-bold uppercase tracking-wider text-start text-[#1d2327]">
            {dict["admin.tags.quick_edit"] || "QUICK EDIT"}
          </h4>

          {errorMessage && (
            <div className="rounded border border-[#d63638] bg-[#fcf0f1] px-3 py-1.5 text-xs text-[#d63638]">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#1d2327]">
                {dict["admin.tags.table.name"] || "Name"}
              </label>
              <input
                className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                disabled={isPending}
                onChange={(e) => setName(e.target.value)}
                required
                type="text"
                value={name}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#1d2327]">
                {dict["admin.tags.table.slug"] || "Slug"}
              </label>
              <input
                className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                disabled={isPending}
                onChange={(e) => setSlug(e.target.value)}
                type="text"
                value={slug}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              className="inline-flex h-[30px] items-center rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-3 text-[13px] font-normal text-white shadow-[0_1px_0_#135e96] hover:border-[#135e96] hover:bg-[#135e96] disabled:opacity-50 cursor-pointer"
              disabled={isPending}
              onClick={handleUpdate}
              type="button"
            >
              {isPending
                ? dict["admin.tags.updating"] || "Updating..."
                : dict["admin.tags.update"] || "Update Tag"}
            </button>
            <button
              className="inline-flex h-[30px] items-center rounded-[3px] border border-[#8c8f94] bg-[#f6f7f7] px-3 text-[13px] text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78] disabled:opacity-50 cursor-pointer"
              disabled={isPending}
              onClick={onCancel}
              type="button"
            >
              {dict["admin.tags.cancel"] || "Cancel"}
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}
