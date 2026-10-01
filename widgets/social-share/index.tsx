"use client";

import React from "react";
import manifest from "./widget.json";
import type { WidgetModule, WidgetAdminFormProps, WidgetRenderProps } from "../types";

interface SocialPlatformConfig {
  key: string;
  name: string;
  placeholder: string;
  color: string;
  hoverBg: string;
  iconSvg: React.ReactNode;
}

const PLATFORMS: SocialPlatformConfig[] = [
  {
    key: "x",
    name: "X (Twitter)",
    placeholder: "https://x.com/yournewsroom",
    color: "#000000",
    hoverBg: "hover:bg-slate-900 hover:text-white",
    iconSvg: (
      <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    key: "facebook",
    name: "Facebook",
    placeholder: "https://facebook.com/yourpage",
    color: "#1877F2",
    hoverBg: "hover:bg-[#1877F2] hover:text-white",
    iconSvg: (
      <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    key: "youtube",
    name: "YouTube",
    placeholder: "https://youtube.com/@channel",
    color: "#FF0000",
    hoverBg: "hover:bg-[#FF0000] hover:text-white",
    iconSvg: (
      <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    key: "telegram",
    name: "Telegram",
    placeholder: "https://t.me/newsgroup",
    color: "#229ED9",
    hoverBg: "hover:bg-[#229ED9] hover:text-white",
    iconSvg: (
      <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
  },
  {
    key: "whatsapp",
    name: "WhatsApp Channel",
    placeholder: "https://whatsapp.com/channel/...",
    color: "#25D366",
    hoverBg: "hover:bg-[#25D366] hover:text-white",
    iconSvg: (
      <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
        <path d="M12.031 0C5.397 0 .009 5.388.009 12.022c0 2.118.553 4.188 1.604 6.01L0 24.004l6.149-1.613a11.968 11.968 0 0 0 5.882 1.528h.005c6.634 0 12.022-5.388 12.022-12.022A12.03 12.03 0 0 0 12.031 0zm0 22.008a9.97 9.97 0 0 1-5.086-1.39l-.365-.216-3.778.991 1.008-3.684-.237-.377A9.972 9.972 0 0 1 2.008 12.02c0-5.526 4.496-10.022 10.023-10.022 5.527 0 10.023 4.496 10.023 10.022 0 5.526-4.496 10.022-10.023 10.022z" />
      </svg>
    ),
  },
  {
    key: "linkedin",
    name: "LinkedIn",
    placeholder: "https://linkedin.com/company/...",
    color: "#0A66C2",
    hoverBg: "hover:bg-[#0A66C2] hover:text-white",
    iconSvg: (
      <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
      </svg>
    ),
  },
];

export function SocialShareAdminForm({ item, onChange, dict, direction }: WidgetAdminFormProps) {
  const isRtl = direction === "rtl";
  const links = item.config?.links || {
    x: "https://x.com",
    telegram: "https://t.me",
    whatsapp: "https://whatsapp.com",
  };
  const counts = item.config?.counts || {
    x: "45K",
    telegram: "28K",
    whatsapp: "Join",
  };
  const style = item.config?.style || "cards";

  const updateLink = (key: string, val: string) => {
    onChange({
      config: {
        ...item.config,
        links: { ...links, [key]: val },
      },
    });
  };

  const updateCount = (key: string, val: string) => {
    onChange({
      config: {
        ...item.config,
        counts: { ...counts, [key]: val },
      },
    });
  };

  return (
    <div className="space-y-3 text-start">
      <div>
        <label className="block text-[12px] font-medium text-[#50575e] mb-1">
          {dict?.["admin.widgets.widget_title"] || (isRtl ? "عنوان الأداة" : "Widget Title")}
        </label>
        <input
          type="text"
          value={item.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-[11px] font-medium text-[#50575e] mb-1">
          {isRtl ? "نمط العرض" : "Display Layout Style"}
        </label>
        <select
          value={style}
          onChange={(e) => onChange({ config: { ...item.config, style: e.target.value } })}
          className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
        >
          <option value="cards">{isRtl ? "بطاقات تفاعلية مع العدادات" : "Interactive Cards with Follow Badges"}</option>
          <option value="pills">{isRtl ? "أزرار شريطية عريضة" : "Wide Action Buttons"}</option>
          <option value="compact">{isRtl ? "شريط أيقونات مدمج وسريع" : "Compact Icon Bar"}</option>
        </select>
      </div>

      <div className="space-y-2 pt-2 border-t border-[#f0f0f1]">
        <label className="block text-[11px] font-bold text-[#50575e] uppercase tracking-wider">
          {isRtl ? "روابط المنصات الاجتماعية الرسمية" : "Official Social Channels & URLs"}
        </label>
        <p className="text-[10px] text-[#646970]">
          {isRtl ? "اترك الحقل فارغاً لإخفاء أي منصة لا تستخدمها." : "Leave blank to hide any platform you do not use."}
        </p>

        {PLATFORMS.map((p) => {
          const val = links[p.key] || "";
          const count = counts[p.key] || "";
          return (
            <div key={p.key} className="flex items-center gap-2">
              <span className="w-24 text-[11px] font-semibold text-[#1d2327] flex-shrink-0 flex items-center gap-1.5">
                <span style={{ color: p.color }}>{p.iconSvg}</span>
                {p.name.split(" ")[0]}
              </span>
              <input
                type="text"
                value={val}
                placeholder={p.placeholder}
                onChange={(e) => updateLink(p.key, e.target.value)}
                className="h-[28px] flex-1 rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
              />
              <input
                type="text"
                value={count}
                placeholder={isRtl ? "العداد" : "Count"}
                title={isRtl ? "شارة المتابعين (مثال: 50K)" : "Follower badge text (e.g. 50K)"}
                onChange={(e) => updateCount(p.key, e.target.value)}
                className="h-[28px] w-14 rounded-[3px] border border-[#8c8f94] bg-white px-1.5 text-[11px] text-center text-[#2c3338]"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SocialShareRender({ item, theme }: WidgetRenderProps) {
  const isRtl = theme?.direction === "rtl";
  const links: Record<string, string> = item.config?.links || {
    x: "https://x.com",
    telegram: "https://t.me",
    whatsapp: "https://whatsapp.com",
  };
  const counts: Record<string, string> = item.config?.counts || {
    x: "45K",
    telegram: "28K",
    whatsapp: "Join",
  };
  const style = item.config?.style || "cards";

  const activePlatforms = PLATFORMS.filter((p) => Boolean(links[p.key]?.trim()));
  const platformsToRender = activePlatforms.length > 0 ? activePlatforms : PLATFORMS.slice(0, 3);

  return (
    <div className="theme-widget rounded-xl border border-[var(--theme-widget-border,var(--theme-border,#e2e8f0))] bg-[var(--theme-widget-bg,var(--theme-surface,#ffffff))] text-[var(--theme-widget-text,var(--theme-text,#1d2327))] p-4 shadow-sm text-start">
      <div className="flex items-center justify-between border-b border-[var(--theme-border,#e2e8f0)] pb-2 mb-3">
        <h4 className="theme-widget-title text-xs font-bold uppercase tracking-wider text-[var(--theme-widget-title-color,var(--theme-heading,#0f172a))]">
          {item.title || (isRtl ? "قنوات التواصل" : "Official Channels")}
        </h4>
        <span className="text-[10px] text-[var(--theme-muted,#64748b)] font-mono">
          {isRtl ? "متابعة مباشرة" : "Official"}
        </span>
      </div>

      {style === "compact" ? (
        <div className="flex items-center gap-2 flex-wrap">
          {platformsToRender.map((p) => {
            const href = links[p.key] || "#";
            return (
              <a
                key={p.key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                title={p.name}
                className="size-9 rounded-lg border border-[var(--theme-border,#e2e8f0)] bg-[var(--theme-bg,#f8f7f4)] flex items-center justify-center text-[var(--theme-text,#1d2327)] hover:border-[var(--theme-primary,#2271b1)] hover:scale-105 transition-all"
                style={{ color: p.color }}
              >
                {p.iconSvg}
              </a>
            );
          })}
        </div>
      ) : style === "pills" ? (
        <div className="space-y-2">
          {platformsToRender.map((p) => {
            const href = links[p.key] || "#";
            const count = counts[p.key];
            return (
              <a
                key={p.key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between rounded-lg border border-[var(--theme-border,#e2e8f0)] p-2.5 bg-[var(--theme-bg,#f8f7f4)] hover:border-[var(--theme-primary,#2271b1)] text-xs font-semibold text-[var(--theme-text,#1d2327)] transition-colors group"
              >
                <span className="flex items-center gap-2">
                  <span style={{ color: p.color }}>{p.iconSvg}</span>
                  <span>{p.name}</span>
                </span>
                {count && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--theme-surface,#ffffff)] border border-[var(--theme-border,#e2e8f0)] text-[var(--theme-muted,#64748b)]">
                    {count}
                  </span>
                )}
              </a>
            );
          })}
        </div>
      ) : (
        /* Default Grid Cards Style */
        <div className="grid grid-cols-2 gap-2 text-xs">
          {platformsToRender.map((p) => {
            const href = links[p.key] || "#";
            const count = counts[p.key] || (isRtl ? "متابعة" : "Follow");
            return (
              <a
                key={p.key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-[var(--theme-border,#e2e8f0)] p-2.5 hover:border-[var(--theme-primary,#2271b1)] bg-[var(--theme-bg,#f8f7f4)] font-semibold flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-2">
                  <span style={{ color: p.color }}>{p.iconSvg}</span>
                  <span className="text-[11px] text-[var(--theme-heading,#0f172a)] font-bold truncate">
                    {p.name.split(" ")[0]}
                  </span>
                </div>
                <span className="text-[9px] font-mono font-bold text-[var(--theme-muted,#64748b)] bg-[var(--theme-surface,#ffffff)] border border-[var(--theme-border,#e2e8f0)] px-1.5 py-0.5 rounded">
                  {count}
                </span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const socialShareWidgetModule: WidgetModule = {
  manifest: manifest as any,
  AdminForm: SocialShareAdminForm,
  render: SocialShareRender,
};

export default socialShareWidgetModule;
