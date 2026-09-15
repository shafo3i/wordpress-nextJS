"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Sparkles,
  CheckCircle2,
  Volume2,
  Pause,
  Play,
  Radio,
  Clock,
} from "lucide-react";
import type { WidgetItem } from "@/lib/widgets/db";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import type { ContentItem } from "@/lib/site-content";
import { DEFAULT_THEME, formatDate, getExcerpt, isSerifHeading, isDarkTheme } from "@/components/site/utils";

export function SidebarWidgetRenderer({
  item,
  theme = DEFAULT_THEME,
  posts = [],
}: {
  item: WidgetItem;
  theme?: FrontEndThemeContext;
  posts?: ContentItem[];
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState("");
  const isDark = isDarkTheme(theme);
  const isSerif = isSerifHeading(theme);

  switch (item.type) {
    case "search":
      return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            {item.title}
          </h4>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert("Search submitted");
            }}
            className="flex gap-1.5"
          >
            <input
              type="text"
              placeholder="Search news..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
            />
            <button
              type="submit"
              style={{ backgroundColor: theme.primaryColor }}
              className="rounded-lg px-3 py-1.5 text-white hover:opacity-90 transition-opacity"
            >
              <Search className="size-3.5" />
            </button>
          </form>
        </div>
      );

    case "author_bio":
      return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            {item.title}
          </h4>
          <div className="flex items-center gap-3 mb-2">
            <div
              style={{ backgroundColor: theme.primaryColor }}
              className="size-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
            >
              SN
            </div>
            <div>
              <span className="text-xs font-bold block text-slate-900 dark:text-white">
                Signal Bureau
              </span>
              <span className="text-[10px] text-slate-400">Independent Desk</span>
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {item.content ||
              "Independent investigative reporting and market intelligence operating under strict editorial standards."}
          </p>
        </div>
      );

    case "plugin_newsletter":
      return (
        <div className="rounded-xl border border-purple-200 dark:border-purple-900/60 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-900 dark:to-purple-950/40 p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-400 mb-1">
            <Sparkles className="size-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Plugin Widget</span>
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white font-serif mb-1">
            {item.title}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-snug">
            {item.content || "Get daily morning dispatches before market open."}
          </p>
          {subscribed ? (
            <div className="rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 p-2 text-xs flex items-center gap-1.5">
              <CheckCircle2 className="size-4" /> You are subscribed!
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubscribed(true);
              }}
              className="space-y-2"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="reader@domain.com"
                required
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
              <button
                type="submit"
                style={{ backgroundColor: theme.primaryColor }}
                className="w-full rounded-lg py-1.5 text-xs font-bold text-white hover:opacity-90 transition-opacity"
              >
                Join Morning Dispatch
              </button>
            </form>
          )}
        </div>
      );

    case "plugin_audio":
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

    case "plugin_breaking":
      return (
        <div className="rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/50 p-4 text-rose-950 dark:text-rose-200">
          <div className="flex items-center gap-1.5 text-rose-600 mb-1 font-bold text-[10px] uppercase tracking-wider">
            <Radio className="size-3.5 animate-pulse" /> Breaking Alert
          </div>
          <h4 className="text-xs font-bold leading-snug mb-1">{item.title}</h4>
          <p className="text-[11px] leading-relaxed text-rose-900/80 dark:text-rose-300/80">
            {item.content || "Emergency market circuit breaker triggered across secondary commodities."}
          </p>
        </div>
      );

    case "plugin_factcheck":
      return (
        <div className="rounded-xl border border-emerald-300 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Verified Scorecard
            </span>
            <span className="rounded bg-emerald-600 text-white font-black text-[9px] px-2 py-0.5">
              TRUE
            </span>
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug mb-1">
            {item.title}
          </h4>
          <p className="text-[11px] text-slate-600 dark:text-slate-300">
            {item.content || "Global shipping rates decline 40% in Q3. Verified by Bureau Desk."}
          </p>
        </div>
      );

    case "plugin_reading_time":
      return (
        <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 mb-1">
            <Clock className="size-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Reading Velocity</span>
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">{item.title}</h4>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 mb-2 leading-relaxed">
            {item.content || "Average editorial story read pace: ~200 words/min (3-5 min reads)."}
          </p>
          <div className="rounded bg-blue-100/70 dark:bg-blue-900/40 p-2 text-[10px] text-blue-900 dark:text-blue-200 flex justify-between font-mono">
            <span>Standard: 200 WPM</span>
            <span>Fast: 320 WPM</span>
          </div>
        </div>
      );

    case "plugin_related_posts":
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
                  {p.categories[0] || "Featured"}
                </span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 mt-0.5 block">
                  {p.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      );

    case "plugin_social":
      return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            {item.title}
          </h4>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <a
              href="#twitter"
              className="rounded-lg border border-slate-200 dark:border-slate-800 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold flex items-center gap-1.5"
            >
              <span>𝕏</span> 42.8k Follow
            </a>
            <a
              href="#linkedin"
              className="rounded-lg border border-slate-200 dark:border-slate-800 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold flex items-center gap-1.5"
            >
              <span>in</span> 19.4k Follow
            </a>
          </div>
        </div>
      );

    case "plugin_ad":
    case "custom_html":
      return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 shadow-sm text-center">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-mono block mb-1.5">
            Advertisement
          </span>
          <div
            className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed"
            dangerouslySetInnerHTML={{
              __html:
                item.content ||
                '<div class="p-3 bg-white dark:bg-slate-800 rounded border border-dashed border-slate-300 dark:border-slate-700">Digital Infrastructure Partner 2026</div>',
            }}
          />
        </div>
      );

    case "categories":
      return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            {item.title}
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {["Business", "Technology", "Markets", "Economy", "Opinion", "Policy"].map((cat) => (
              <Link
                key={cat}
                href={`/category/${cat.toLowerCase()}`}
                className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      );

    case "recent_posts":
    default: {
      const displayStyle = item.displayStyle || "list";
      const count = item.count || 5;
      const recentList = posts.slice(0, count);

      return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2.5 mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {item.title}
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">
              {recentList.length} stories
            </span>
          </div>

          {/* Compact Wire Style */}
          {displayStyle === "compact" && (
            <div className="space-y-2 divide-y divide-slate-100 dark:divide-slate-800/60">
              {recentList.map((story) => (
                <div key={story.id} className="pt-2 first:pt-0">
                  <Link href={`/posts/${story.slug}`} className="block group">
                    <h5 className="text-xs font-medium leading-snug text-slate-800 dark:text-slate-200 group-hover:text-[#2271b1] transition-colors">
                      • {story.title}
                    </h5>
                  </Link>
                  {item.showDate !== false && (
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5 ml-2">
                      {formatDate(story.date)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Numbered Leaderboard Style */}
          {displayStyle === "numbered" && (
            <div className="space-y-2.5 divide-y divide-slate-100 dark:divide-slate-800/60">
              {recentList.map((story, idx) => (
                <div key={story.id} className="pt-2.5 first:pt-0 flex gap-2.5 items-baseline">
                  <span
                    style={{ color: theme.primaryColor }}
                    className="font-mono text-xs font-black w-4 flex-shrink-0"
                  >
                    0{idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <Link href={`/posts/${story.slug}`} className="block group">
                      <h5 className="text-xs font-semibold leading-snug text-slate-800 dark:text-slate-200 group-hover:text-[#2271b1] transition-colors line-clamp-2">
                        {story.title}
                      </h5>
                    </Link>
                    {item.showDate !== false && (
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                        {formatDate(story.date)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Mini Cards Style */}
          {displayStyle === "card" && (
            <div className="space-y-3">
              {recentList.map((story) => (
                <div
                  key={story.id}
                  className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-2.5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  {item.showThumbnail !== false && story.imageUrl && (
                    <div className="aspect-[16/9] w-full rounded overflow-hidden mb-2 bg-slate-100 dark:bg-slate-800">
                      <img
                        src={story.imageUrl}
                        alt={story.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <Link href={`/posts/${story.slug}`} className="block group">
                    <h5 className="text-xs font-semibold leading-snug text-slate-800 dark:text-slate-200 group-hover:text-[#2271b1] transition-colors line-clamp-2">
                      {story.title}
                    </h5>
                  </Link>
                  {item.showExcerpt && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {getExcerpt(story, 80)}
                    </p>
                  )}
                  {item.showDate !== false && (
                    <span className="text-[10px] text-slate-400 font-mono block mt-1">
                      {formatDate(story.date)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Standard Thumbnail List (Default) */}
          {(displayStyle === "list" || !displayStyle) && (
            <div className="space-y-3">
              {recentList.map((story) => (
                <div key={story.id} className="flex gap-2.5 items-start">
                  {item.showThumbnail !== false && story.imageUrl && (
                    <img
                      src={story.imageUrl}
                      alt={story.title}
                      className="size-12 rounded object-cover flex-shrink-0 bg-slate-100 dark:bg-slate-800"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <Link href={`/posts/${story.slug}`} className="block group">
                      <h5 className="text-xs font-semibold leading-snug text-slate-800 dark:text-slate-200 group-hover:text-[#2271b1] transition-colors line-clamp-2">
                        {story.title}
                      </h5>
                    </Link>
                    {item.showExcerpt && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {getExcerpt(story, 60)}
                      </p>
                    )}
                    {item.showDate !== false && (
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                        {formatDate(story.date)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
  }
}
