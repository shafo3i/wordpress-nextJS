"use client";

import React, { useState } from "react";
import { Volume2, Play, Pause } from "lucide-react";
import manifest from "./widget.json";
import type { WidgetModule, WidgetAdminFormProps, WidgetRenderProps } from "../types";

export function ArticleAudioAdminForm({ item, onChange, dict }: WidgetAdminFormProps) {
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
          Podcast Stream Description
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

export function ArticleAudioRender({ item }: WidgetRenderProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="rounded bg-rose-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
          Live Stream
        </span>
        <Volume2 className="size-3.5 text-slate-400" />
      </div>
      <h4 className="text-xs font-bold font-serif mb-1">{item.title}</h4>
      <p className="text-[11px] text-slate-400 mb-3">
        {item.content || "Daily 5-minute newsroom podcast briefing."}
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className="size-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-slate-100 transition-colors"
        >
          {isPlaying ? <Pause className="size-4" /> : <Play className="size-4 ml-0.5" />}
        </button>
        <div className="flex-1">
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full bg-rose-500 rounded-full transition-all duration-300 ${
                isPlaying ? "w-2/3 animate-pulse" : "w-1/4"
              }`}
            />
          </div>
          <span className="text-[9px] font-mono text-slate-400 mt-1 block">
            {isPlaying ? "Streaming live • 03:42" : "04:15 • Episode #128"}
          </span>
        </div>
      </div>
    </div>
  );
}

export const articleAudioWidgetModule: WidgetModule = {
  manifest: manifest as any,
  AdminForm: ArticleAudioAdminForm,
  render: ArticleAudioRender,
};

export default articleAudioWidgetModule;
