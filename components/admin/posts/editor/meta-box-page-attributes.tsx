"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export type PageOption = {
  id: string;
  title: string;
};

export function MetaBoxPageAttributes({
  parentPages = [],
  currentParentId = "0",
  order = 0,
  template = "default",
  onParentChange,
  onOrderChange,
  onTemplateChange,
  dict,
}: {
  parentPages?: PageOption[];
  currentParentId?: string;
  order?: number;
  template?: string;
  onParentChange?: (parentId: string) => void;
  onOrderChange?: (order: number) => void;
  onTemplateChange?: (template: string) => void;
  dict?: Record<string, string>;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [parent, setParent] = useState(currentParentId);
  const [menuOrder, setMenuOrder] = useState(order);
  const [selectedTemplate, setSelectedTemplate] = useState(template);

  const handleParent = (val: string) => {
    setParent(val);
    onParentChange?.(val);
  };

  const handleOrder = (val: number) => {
    setMenuOrder(val);
    onOrderChange?.(val);
  };

  const handleTemplate = (val: string) => {
    setSelectedTemplate(val);
    onTemplateChange?.(val);
  };

  return (
    <div className="border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)] text-start">
      <div
        className="flex cursor-pointer select-none items-center justify-between border-b border-[#c3c4c7] px-3 py-2 text-[14px] font-semibold text-[#1d2327]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{dict?.["admin.editor.page_attributes"] || "Page Attributes"}</span>
        <button className="text-[#50575e] hover:text-[#1d2327]" type="button">
          {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-3 p-3 text-xs text-[#50575e]">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#50575e]">
              {dict?.["admin.editor.parent"] || "Parent"}
            </label>
            <select
              className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1]"
              name="postParent"
              onChange={(e) => handleParent(e.target.value)}
              value={parent}
            >
              <option value="0">{dict?.["admin.editor.no_parent"] || "(no parent)"}</option>
              {parentPages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title || `Page #${p.id}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[#50575e]">
              {dict?.["admin.editor.template"] || "Template"}
            </label>
            <select
              className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1]"
              name="pageTemplate"
              onChange={(e) => handleTemplate(e.target.value)}
              value={selectedTemplate}
            >
              <option value="default">{dict?.["admin.editor.template_default"] || "Default Template"}</option>
              <option value="full-width">{dict?.["admin.editor.template_full_width"] || "Full Width Page"}</option>
              <option value="with-sidebar">{dict?.["admin.editor.template_with_sidebar"] || "Page with Sidebar"}</option>
              <option value="landing">{dict?.["admin.editor.template_landing"] || "Landing Page"}</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[#50575e]">
              {dict?.["admin.editor.order"] || "Order"}
            </label>
            <input
              className="h-[30px] w-20 rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1]"
              name="menuOrder"
              onChange={(e) => handleOrder(Number(e.target.value))}
              type="number"
              value={menuOrder}
            />
            <p className="mt-1 text-[11px] text-[#646970]">
              {dict?.["admin.editor.order_help"] || "Need help? Use the Order field to position your pages."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
