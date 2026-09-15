"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";

export function MetaBoxTags({
  tags,
  onTagsChange,
  availableTags = [],
}: {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  availableTags?: { slug: string; name: string }[];
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [inputVal, setInputVal] = useState("");

  const handleAdd = () => {
    const raw = inputVal.split(",").map((s) => s.trim()).filter(Boolean);
    if (!raw.length) return;
    const combined = [...new Set([...tags, ...raw])];
    onTagsChange(combined);
    setInputVal("");
  };

  const handleRemove = (tagToRemove: string) => {
    onTagsChange(tags.filter((t) => t !== tagToRemove));
  };

  return (
    <div className="border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
      <div
        className="flex cursor-pointer select-none items-center justify-between border-b border-[#c3c4c7] px-3 py-2 text-[14px] font-semibold text-[#1d2327]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>Tags</span>
        <button className="text-[#50575e] hover:text-[#1d2327]" type="button">
          {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-3 p-3 text-xs text-[#50575e]">
          <div className="flex items-center gap-2">
            <input
              className="h-[28px] flex-1 rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1]"
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              placeholder="Add tag"
              type="text"
              value={inputVal}
            />
            <button
              className="rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 py-1 text-xs font-normal text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78]"
              onClick={handleAdd}
              type="button"
            >
              Add
            </button>
          </div>

          <p className="text-[11px] text-[#646970]">Separate tags with commas</p>

          {/* Tag Pills */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.map((tag) => (
                <span
                  className="inline-flex items-center gap-1 rounded bg-[#f0f0f1] px-2 py-0.5 text-xs text-[#2c3338]"
                  key={tag}
                >
                  <span>{tag}</span>
                  <button
                    aria-label={`Remove tag ${tag}`}
                    className="text-[#787c82] hover:text-[#d63638]"
                    onClick={() => handleRemove(tag)}
                    type="button"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {availableTags.length > 0 && (
            <div className="pt-2 border-t border-[#f0f0f1]">
              <p className="text-[11px] font-semibold text-[#50575e] mb-1">Most Used Tags:</p>
              <div className="flex flex-wrap gap-1">
                {availableTags.slice(0, 10).map((t) => (
                  <button
                    key={t.slug}
                    type="button"
                    onClick={() => {
                      if (!tags.includes(t.name)) {
                        onTagsChange([...tags, t.name]);
                      }
                    }}
                    className="text-[11px] text-[#2271b1] hover:underline"
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
