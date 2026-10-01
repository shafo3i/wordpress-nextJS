"use client";

import { useState } from "react";
import { Play, Pause, Radio } from "lucide-react";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import { DEFAULT_THEME } from "@/components/site/utils";

/**
 * 12. MULTIMEDIA HUB (Podcast & Studio Audio Stream)
 */
export function MultimediaBlock({
  title,
  theme = DEFAULT_THEME,
}: {
  title: string;
  theme?: FrontEndThemeContext;
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-black p-6 sm:p-8 text-white shadow-xl">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest flex items-center gap-1">
              <Radio className="size-3 animate-pulse" /> Studio Stream
            </span>
            <span className="text-xs text-slate-400 font-mono">Episode #142</span>
          </div>

          <h3 className="text-2xl font-bold font-serif">{title}</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Daily 15-minute briefing dissecting macro monetary policy shifts, global shipping trends, and algorithmic market infrastructure.
          </p>
        </div>

        <div className="w-full lg:w-auto bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center gap-4 min-w-[320px]">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            style={{ backgroundColor: theme.primaryColor }}
            className="size-12 rounded-full flex items-center justify-center text-white hover:opacity-90 transition-opacity flex-shrink-0 shadow-lg"
          >
            {isPlaying ? <Pause className="size-5" /> : <Play className="size-5 ml-0.5" />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1 text-xs">
              <span className="font-bold truncate">Morning Intelligence Audio</span>
              <span className="font-mono text-slate-400 text-[10px]">
                {isPlaying ? "08:24 / 15:00" : "15:00"}
              </span>
            </div>

            <div className="flex items-end gap-1 h-6 py-1">
              {[40, 70, 30, 90, 60, 100, 45, 80, 55, 95, 30, 75, 50, 85].map((h, i) => (
                <div
                  key={i}
                  style={{
                    height: isPlaying ? `${h}%` : "30%",
                    backgroundColor: isPlaying ? theme.primaryColor : "#64748b",
                  }}
                  className="w-1 rounded-full transition-all duration-300"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
