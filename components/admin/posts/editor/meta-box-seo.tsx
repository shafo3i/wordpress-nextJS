"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Search, Eye } from "lucide-react";

export type PostSeoData = {
  seoTitle?: string;
  seoDescription?: string;
  seoOgImage?: string;
  seoNoindex?: boolean;
  seoCanonical?: string;
};

export function MetaBoxSeo({
  postTitle = "",
  postExcerpt = "",
  postSlug = "",
  initialSeo = {},
  dict = {},
  direction = "ltr",
  onChange,
}: {
  postTitle?: string;
  postExcerpt?: string;
  postSlug?: string;
  initialSeo?: PostSeoData;
  dict?: Record<string, string>;
  direction?: "rtl" | "ltr";
  onChange?: (seo: PostSeoData) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [seoTitle, setSeoTitle] = useState(initialSeo.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(initialSeo.seoDescription ?? "");
  const [seoOgImage, setSeoOgImage] = useState(initialSeo.seoOgImage ?? "");
  const [seoNoindex, setSeoNoindex] = useState(Boolean(initialSeo.seoNoindex));
  const [seoCanonical, setSeoCanonical] = useState(initialSeo.seoCanonical ?? "");

  const handleTitleChange = (val: string) => {
    setSeoTitle(val);
    onChange?.({
      seoTitle: val,
      seoDescription,
      seoOgImage,
      seoNoindex,
      seoCanonical,
    });
  };

  const handleDescChange = (val: string) => {
    setSeoDescription(val);
    onChange?.({
      seoTitle,
      seoDescription: val,
      seoOgImage,
      seoNoindex,
      seoCanonical,
    });
  };

  const handleOgImageChange = (val: string) => {
    setSeoOgImage(val);
    onChange?.({
      seoTitle,
      seoDescription,
      seoOgImage: val,
      seoNoindex,
      seoCanonical,
    });
  };

  const handleNoindexToggle = (checked: boolean) => {
    setSeoNoindex(checked);
    onChange?.({
      seoTitle,
      seoDescription,
      seoOgImage,
      seoNoindex: checked,
      seoCanonical,
    });
  };

  const handleCanonicalChange = (val: string) => {
    setSeoCanonical(val);
    onChange?.({
      seoTitle,
      seoDescription,
      seoOgImage,
      seoNoindex,
      seoCanonical: val,
    });
  };

  // Preview fallbacks
  const previewTitle = seoTitle.trim() || postTitle.trim() || "Article Title Preview";
  const previewDesc =
    seoDescription.trim() ||
    postExcerpt.trim() ||
    "Please provide a meta description by editing the snippet below. If you don't, search engines will try to find a relevant excerpt from your article body.";
  const previewUrl = `https://example.com/posts/${postSlug || "post-slug"}`;

  return (
    <div
      className="rounded-[3px] border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)] text-start"
      dir={direction}
    >
      {/* Hidden inputs to naturally submit with the classic editor form */}
      <input type="hidden" name="seoTitle" value={seoTitle} />
      <input type="hidden" name="seoDescription" value={seoDescription} />
      <input type="hidden" name="seoOgImage" value={seoOgImage} />
      <input type="hidden" name="seoNoindex" value={seoNoindex ? "1" : "0"} />
      <input type="hidden" name="seoCanonical" value={seoCanonical} />

      {/* Meta Box Header */}
      <div
        className="flex cursor-pointer select-none items-center justify-between border-b border-[#c3c4c7] px-3.5 py-2.5 text-[14px] font-semibold text-[#1d2327]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <Search className="size-4 text-[#2271b1]" />
          <span>{dict["admin.posts.seo.meta_box_title"] || "Search Engine Optimization (SEO & Social)"}</span>
        </div>
        <button className="text-[#50575e] hover:text-[#1d2327]" type="button">
          {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-5 p-4 text-xs text-[#50575e]">
          {/* Google Search Live Preview */}
          <div className="rounded border border-[#e2e8f0] bg-[#f8fafc] p-3.5">
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
              <Eye className="size-3.5" />
              <span>{dict["admin.posts.seo.preview_heading"] || "Search Snippet Preview"}</span>
            </div>
            <div className="space-y-1">
              <div className="truncate text-[11px] text-[#202124]" dir="ltr">
                {previewUrl}
              </div>
              <div className="line-clamp-1 text-[16px] font-medium leading-snug text-[#1a0dab] hover:underline cursor-pointer">
                {previewTitle}
              </div>
              <div className="line-clamp-2 text-[13px] leading-relaxed text-[#4d5156]">
                {previewDesc}
              </div>
            </div>
          </div>

          {/* SEO Title Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="post-seo-title" className="text-[12px] font-semibold text-[#1d2327]">
                {dict["admin.posts.seo.title_label"] || "SEO Title"}
              </label>
              <span className={`text-[11px] ${seoTitle.length > 60 ? "text-[#d63638] font-bold" : "text-[#646970]"}`}>
                {seoTitle.length} / 60
              </span>
            </div>
            <input
              id="post-seo-title"
              type="text"
              value={seoTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder={postTitle || (dict["admin.posts.seo.title_placeholder"] || "Custom search title (defaults to post title)")}
              className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-xs text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
            />
          </div>

          {/* SEO Meta Description */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="post-seo-desc" className="text-[12px] font-semibold text-[#1d2327]">
                {dict["admin.posts.seo.desc_label"] || "Meta Description"}
              </label>
              <span className={`text-[11px] ${seoDescription.length > 160 ? "text-[#d63638] font-bold" : "text-[#646970]"}`}>
                {seoDescription.length} / 160
              </span>
            </div>
            <textarea
              id="post-seo-desc"
              rows={3}
              value={seoDescription}
              onChange={(e) => handleDescChange(e.target.value)}
              placeholder={postExcerpt || (dict["admin.posts.seo.desc_placeholder"] || "Write a compelling summary for Google search (defaults to post excerpt)...")}
              className="w-full rounded-[3px] border border-[#8c8f94] bg-white p-2 text-xs text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
            />
          </div>

          {/* Social Share Image Override */}
          <div className="space-y-1">
            <label htmlFor="post-seo-og-image" className="text-[12px] font-semibold text-[#1d2327]">
              {dict["admin.posts.seo.og_image_label"] || "Social Share Image Override (OG)"}
            </label>
            <input
              id="post-seo-og-image"
              type="text"
              value={seoOgImage}
              onChange={(e) => handleOgImageChange(e.target.value)}
              placeholder="https://... or /images/... (defaults to post featured image)"
              className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-xs text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
            />
          </div>

          {/* Noindex and Canonical Options */}
          <div className="pt-2 border-t border-[#f0f0f1] space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={seoNoindex}
                onChange={(e) => handleNoindexToggle(e.target.checked)}
                className="h-4 w-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
              />
              <span className="text-xs text-[#1d2327] font-medium">
                {dict["admin.posts.seo.noindex_label"] || "Discourage search engines from showing this post in search results (noindex)"}
              </span>
            </label>

            <div className="space-y-1">
              <label htmlFor="post-seo-canonical" className="text-[11px] font-semibold text-[#50575e]">
                {dict["admin.posts.seo.canonical_label"] || "Canonical URL Override"}
              </label>
              <input
                id="post-seo-canonical"
                type="url"
                value={seoCanonical}
                onChange={(e) => handleCanonicalChange(e.target.value)}
                placeholder="https://original-publisher.com/article-url"
                className="h-[28px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
