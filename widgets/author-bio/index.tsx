"use client";

import React from "react";
import Link from "next/link";
import manifest from "./widget.json";
import type { WidgetModule, WidgetAdminFormProps, WidgetRenderProps } from "../types";

export function AuthorBioAdminForm({ item, onChange, dict, direction }: WidgetAdminFormProps) {
  const isRtl = direction === "rtl";
  const authorName = item.config?.authorName || (isRtl ? "فريق التحرير" : "Editorial Bureau");
  const authorRole = item.config?.authorRole || (isRtl ? "محرر شؤون الأخبار والتحقيقات" : "Investigative News Desk");
  const avatarUrl = item.config?.avatarUrl || "";
  const bio = item.content || item.config?.bio || (isRtl ? "تغطية إخبارية مستقلة وتحليلات معمقة وفق أعلى المعايير التحريرية." : "Independent investigative reporting and market intelligence.");
  const profileUrl = item.config?.profileUrl || "";

  return (
    <div className="space-y-3 text-start">
      <div>
        <label className="block text-[0.75rem] font-medium text-[#50575e] mb-1">
          {dict?.["admin.widgets.widget_title"] || (isRtl ? "عنوان الأداة" : "Widget Title")}
        </label>
        <input
          type="text"
          value={item.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[0.8125rem] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[0.6875rem] font-medium text-[#50575e] mb-1">
            {isRtl ? "اسم الكاتب / الصحفي" : "Author Name"}
          </label>
          <input
            type="text"
            value={authorName}
            placeholder={isRtl ? "مثال: د. ماجد السعيد" : "e.g. Sarah Jenkins"}
            onChange={(e) =>
              onChange({
                config: { ...item.config, authorName: e.target.value },
              })
            }
            className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
          />
        </div>
        <div>
          <label className="block text-[0.6875rem] font-medium text-[#50575e] mb-1">
            {isRtl ? "الصفة التحريرية / المنصب" : "Title / Designation"}
          </label>
          <input
            type="text"
            value={authorRole}
            placeholder={isRtl ? "محرر الشؤون السياسية" : "Senior Politics Editor"}
            onChange={(e) =>
              onChange({
                config: { ...item.config, authorRole: e.target.value },
              })
            }
            className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
          />
        </div>
      </div>

      <div>
        <label className="block text-[0.6875rem] font-medium text-[#50575e] mb-1">
          {isRtl ? "رابط الصورة الشخصية (Avatar Image URL)" : "Avatar Image URL"}
        </label>
        <input
          type="url"
          value={avatarUrl}
          placeholder="https://example.com/authors/photo.jpg"
          onChange={(e) =>
            onChange({
              config: { ...item.config, avatarUrl: e.target.value },
            })
          }
          className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
        />
        <p className="text-[0.625rem] text-[#646970] mt-0.5">
          {isRtl ? "اترك الحقل فارغاً لاستخدام الأحرف الأولى تلقائياً." : "Leave empty to auto-generate styled monogram initials."}
        </p>
      </div>

      <div>
        <label className="block text-[0.6875rem] font-medium text-[#50575e] mb-1">
          {isRtl ? "نبذة السيرة الذاتية (Bio)" : "Biography Summary"}
        </label>
        <textarea
          rows={3}
          value={bio}
          onChange={(e) => {
            onChange({
              content: e.target.value,
              config: { ...item.config, bio: e.target.value },
            });
          }}
          className="w-full rounded-[3px] border border-[#8c8f94] bg-white p-2 text-[0.75rem] text-[#2c3338]"
        />
      </div>

      <div>
        <label className="block text-[0.6875rem] font-medium text-[#50575e] mb-1">
          {isRtl ? "رابط الملف الشخصي أو أرشيف الكاتب" : "Profile / Archive Link"}
        </label>
        <input
          type="text"
          value={profileUrl}
          placeholder="/authors/..."
          onChange={(e) =>
            onChange({
              config: { ...item.config, profileUrl: e.target.value },
            })
          }
          className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
        />
      </div>
    </div>
  );
}

export function AuthorBioRender({ item, theme }: WidgetRenderProps) {
  const isRtl = theme?.direction === "rtl";
  const authorName = item.config?.authorName || (isRtl ? "فريق التحرير" : "Editorial Bureau");
  const authorRole = item.config?.authorRole || (isRtl ? "محرر شؤون الأخبار" : "Senior News Editor");
  const avatarUrl = item.config?.avatarUrl;
  const bio = item.content || item.config?.bio || (isRtl ? "تغطية إخبارية مستقلة وتحليلات معمقة وفق أعلى المعايير التحريرية." : "Independent investigative reporting and market intelligence.");
  const profileUrl = item.config?.profileUrl;

  const initials = authorName
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="theme-widget rounded-xl border border-[var(--theme-widget-border,var(--theme-border))] bg-[var(--theme-widget-bg,var(--theme-surface))] text-[var(--theme-widget-text,var(--theme-text))] p-4 shadow-sm text-start">
      <div className="flex items-center justify-between border-b border-[var(--theme-border)] pb-2 mb-3">
        <h4 className="theme-widget-title text-xs font-bold uppercase tracking-wider text-[var(--theme-widget-title-color,var(--theme-heading))]">
          {item.title || (isRtl ? "عن الكاتب" : "About the Author")}
        </h4>
        <span className="text-[0.625rem] text-[var(--theme-muted)] font-mono">
          {isRtl ? "طاقم التحرير" : "Newsroom"}
        </span>
      </div>

      <div className="flex items-start gap-3 mb-2.5">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={authorName}
            className="size-11 rounded-full object-cover border border-[var(--theme-border)] shadow-sm flex-shrink-0"
            loading="lazy"
          />
        ) : (
          <div
            className="theme-btn size-11 rounded-full flex items-center justify-center  font-black text-sm shadow-sm flex-shrink-0"
          >
            {initials || "ED"}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold block text-[var(--theme-heading)] truncate">
            {authorName}
          </span>
          <span className="text-[0.625rem] text-[var(--theme-muted)] font-medium block">
            {authorRole}
          </span>
        </div>
      </div>

      <p className="text-xs text-[var(--theme-muted)] leading-relaxed mb-3">
        {bio}
      </p>

      {profileUrl && (
        <div className="pt-2 border-t border-[var(--theme-border)]">
          <Link
            href={profileUrl}
            className="text-[0.6875rem] font-bold text-[var(--theme-primary)] hover:underline inline-flex items-center gap-1"
          >
            <span>{isRtl ? "عرض جميع مقالات الكاتب ←" : "View all stories by author →"}</span>
          </Link>
        </div>
      )}
    </div>
  );
}

export const authorBioWidgetModule: WidgetModule = {
  manifest: manifest as any,
  AdminForm: AuthorBioAdminForm,
  render: AuthorBioRender,
};

export default authorBioWidgetModule;
