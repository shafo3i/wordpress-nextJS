"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export function MetaBoxExcerpt({
  excerpt,
  onChange,
}: {
  excerpt: string;
  onChange: (excerpt: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
      <div
        className="flex cursor-pointer select-none items-center justify-between border-b border-[#c3c4c7] px-3 py-2 text-[14px] font-semibold text-[#1d2327]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>Excerpt</span>
        <button className="text-[#50575e] hover:text-[#1d2327]" type="button">
          {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="p-3 text-xs text-[#50575e]">
          <textarea
            className="min-h-20 w-full rounded-[3px] border border-[#8c8f94] bg-white p-2 text-xs text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1]"
            name="excerpt"
            onChange={(e) => onChange(e.target.value)}
            placeholder="Write an excerpt (optional)"
            rows={3}
            value={excerpt}
          />
          <p className="mt-1 text-[11px] text-[#646970]">
            Excerpts are optional hand-crafted summaries of your content.
          </p>
        </div>
      )}
    </div>
  );
}
