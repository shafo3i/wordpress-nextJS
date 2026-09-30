"use client";

import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import manifest from "./widget.json";
import type { WidgetModule, WidgetAdminFormProps, WidgetRenderProps } from "../types";

export function RelatedPostsAdminForm({ item, onChange, dict }: WidgetAdminFormProps) {
  return (
    <div className="space-y-3">
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

      <div>
        <label className="block text-[12px] font-medium text-[#50575e] mb-1">
          Related Stories Subtitle / Prompt
        </label>
        <textarea
          rows={3}
          value={item.content || ""}
          onChange={(e) => onChange({ content: e.target.value })}
          className="w-full rounded-[3px] border border-[#8c8f94] bg-white p-2 text-[12px] text-[#2c3338]"
        />
      </div>
    </div>
  );
}

export function RelatedPostsRender({ item, posts = [] }: WidgetRenderProps) {
  return (
    <div className="rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/40 dark:bg-sky-950/30 p-4 shadow-sm">
      <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 mb-1">
        <Sparkles className="size-3.5" />
        <span className="text-[10px] font-bold uppercase tracking-wider">Contextual Feed</span>
      </div>
      <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2">{item.title}</h4>
      <div className="space-y-2">
        {posts.slice(0, 3).map((p) => (
          <Link
            key={p.id}
            href={`/posts/${p.slug}`}
            className="block p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-400 transition-colors"
          >
            <span className="text-[9px] uppercase font-bold text-sky-600 dark:text-sky-400 block">
              {p.categories?.[0] || "Featured"}
            </span>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 mt-0.5 block">
              {p.title}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export const relatedPostsWidgetModule: WidgetModule = {
  manifest: manifest as any,
  AdminForm: RelatedPostsAdminForm,
  render: RelatedPostsRender,
};

export default relatedPostsWidgetModule;
