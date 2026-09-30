"use client";

import React from "react";
import Link from "next/link";
import manifest from "./widget.json";
import type { WidgetModule, WidgetAdminFormProps, WidgetRenderProps } from "../types";

export function CategoriesAdminForm({ item, onChange, dict }: WidgetAdminFormProps) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-[#50575e] mb-1">
        {dict?.["admin.widgets.widget_title"] || "Widget Title"}
      </label>
      <input
        type="text"
        value={item.title}
        onChange={(e) => onChange({ title: e.target.value })}
        className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
      />
    </div>
  );
}

export function CategoriesRender({ item, posts = [] }: WidgetRenderProps) {
  // Aggregate category counts from posts
  const counts: Record<string, number> = {};
  for (const post of posts) {
    if (post.categories) {
      for (const cat of post.categories) {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    }
  }

  const categoryEntries = Object.entries(counts);

  return (
    <div className="theme-widget rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
      <h4 className="theme-widget-title text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
        {item.title}
      </h4>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
        {categoryEntries.length ? (
          categoryEntries.map(([cat, count]) => (
            <li key={cat} className="py-1.5 flex items-center justify-between">
              <Link
                href={`/category/${cat.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-slate-700 dark:text-slate-300 hover:text-[#2271b1] hover:underline"
              >
                {cat}
              </Link>
              <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                {count}
              </span>
            </li>
          ))
        ) : (
          <li className="py-1 text-slate-400 text-[11px]">No categories found.</li>
        )}
      </ul>
    </div>
  );
}

export const categoriesWidgetModule: WidgetModule = {
  manifest: manifest as any,
  AdminForm: CategoriesAdminForm,
  render: CategoriesRender,
};

export default categoriesWidgetModule;
