"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { Camera, Music } from "lucide-react";
import { MetaBoxPublish } from "./meta-box-publish";
import { MetaBoxFormat } from "./meta-box-format";
import { MetaBoxCategories, type CategoryItem } from "./meta-box-categories";
import { MetaBoxTags } from "./meta-box-tags";
import { MetaBoxFeaturedImage } from "./meta-box-featured-image";
import { MetaBoxExcerpt } from "./meta-box-excerpt";
import { MetaBoxPageAttributes } from "./meta-box-page-attributes";

const DynamicEditor = dynamic(
  () => import("@tinymce/tinymce-react").then((mod) => mod.Editor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] w-full items-center justify-center bg-[#f6f7f7] text-xs text-[#646970]">
        Loading Classic Editor...
      </div>
    ),
  },
);

type PostAction = (formData: FormData) => void | Promise<void>;

export type ClassicPostEditorProps = {
  action: PostAction;
  initialTitle?: string;
  initialContent?: string;
  initialExcerpt?: string;
  initialFeaturedImageId?: string;
  initialStatus?: string;
  initialCategories?: string[];
  initialTags?: string;
  initialPostParent?: string;
  initialMenuOrder?: number;
  parentPages?: { id: string; title: string }[];
  postId?: string;
  postType?: "post" | "page";
  categories?: CategoryItem[];
  tags?: { slug: string; name: string }[];
  onTrash?: () => void;
};

export function ClassicPostEditor({
  action,
  initialTitle = "",
  initialContent = "",
  initialExcerpt = "",
  initialFeaturedImageId = "",
  initialStatus = "draft",
  initialCategories = [],
  initialTags = "",
  initialPostParent = "0",
  initialMenuOrder = 0,
  parentPages = [],
  postId,
  postType = "post",
  categories = [],
  tags: availableTags = [],
  onTrash,
}: ClassicPostEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [excerpt, setExcerpt] = useState(initialExcerpt);
  const [featuredImageId, setFeaturedImageId] = useState(initialFeaturedImageId);
  const [status, setStatus] = useState(initialStatus);
  const [postParent, setPostParent] = useState(initialPostParent);
  const [menuOrder, setMenuOrder] = useState(initialMenuOrder);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);
  const [tagList, setTagList] = useState<string[]>(
    initialTags ? initialTags.split(",").map((t) => t.trim()).filter(Boolean) : [],
  );
  const [editorMode, setEditorMode] = useState<"visual" | "text">("visual");
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [customSlug, setCustomSlug] = useState("");
  const [lastSaved, setLastSaved] = useState<string>(
    new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" }),
  );
  const [isPending, startTransition] = useTransition();

  const slug =
    customSlug ||
    (title
      ? title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
      : "post");

  const wordCount = content.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;

  const toggleCategory = (catSlug: string, checked: boolean) => {
    setSelectedCategories((curr) =>
      checked ? [...new Set([...curr, catSlug])] : curr.filter((s) => s !== catSlug),
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("title", title);
    formData.set("content", content);
    formData.set("excerpt", excerpt);
    formData.set("featuredImageId", featuredImageId);
    formData.set("status", status);
    formData.set("categorySlugs", selectedCategories.join(","));
    formData.set("tags", tagList.join(", "));
    formData.set("postType", postType);
    formData.set("postParent", postParent);
    formData.set("menuOrder", String(menuOrder));
    if (postId) formData.set("id", postId);

    startTransition(async () => {
      await action(formData);
      setLastSaved(
        new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" }),
      );
    });
  };

  return (
    <form className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_280px]" onSubmit={handleSubmit}>
      {postId && <input name="id" type="hidden" value={postId} />}
      <input name="content" type="hidden" value={content} />
      <input name="excerpt" type="hidden" value={excerpt} />
      <input name="featuredImageId" type="hidden" value={featuredImageId} />
      <input name="status" type="hidden" value={status} />
      <input name="categorySlugs" type="hidden" value={selectedCategories.join(",")} />
      <input name="tags" type="hidden" value={tagList.join(", ")} />
      <input name="postType" type="hidden" value={postType} />
      <input name="postParent" type="hidden" value={postParent} />
      <input name="menuOrder" type="hidden" value={menuOrder} />

      {/* Main Content Column */}
      <div className="min-w-0 space-y-4">
        {/* Title input (Classic WordPress style) */}
        <div>
          <input
            className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-3 py-2 text-[1.7em] font-normal leading-tight text-[#1d2327] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none placeholder:text-[#a7aaad] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
            name="title"
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter title here"
            required
            type="text"
            value={title}
          />
        </div>

        {/* Permalink Preview Row */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#50575e]">
          <span className="font-medium text-[#1d2327]">Permalink:</span>
          <span className="text-[#2271b1]">
            http://localhost:3000/{postType === "page" ? "" : "posts/"}
            {isEditingSlug ? (
              <input
                className="h-[22px] rounded border border-[#8c8f94] bg-white px-1 text-xs text-[#2c3338]"
                onChange={(e) => setCustomSlug(e.target.value)}
                type="text"
                value={slug}
              />
            ) : (
              <span className="font-semibold text-[#1d2327] underline">{slug}/</span>
            )}
          </span>
          <button
            className="rounded-[3px] border border-[#c3c4c7] bg-[#f6f7f7] px-2 py-0.5 text-[11px] text-[#2271b1] hover:border-[#8c8f94] hover:bg-[#f0f0f1]"
            onClick={() => setIsEditingSlug(!isEditingSlug)}
            type="button"
          >
            {isEditingSlug ? "OK" : "Edit"}
          </button>
        </div>

        {/* Add Media Row & Visual/Text Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 py-1 text-xs font-medium text-[#2271b1] shadow-sm hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78]"
            onClick={() => alert("WordPress Media Library modal")}
            type="button"
          >
            <span className="flex items-center text-xs">
              <Camera className="size-3.5 mr-0.5" />
              <Music className="size-3" />
            </span>
            <span>Add Media</span>
          </button>

          <div className="flex items-center text-xs">
            <button
              className={`rounded-t-[3px] px-3 py-1 font-medium ${
                editorMode === "visual"
                  ? "border-x border-t border-[#8c8f94] bg-white text-[#1d2327]"
                  : "border-b border-[#8c8f94] bg-[#f6f7f7] text-[#2271b1] hover:text-[#135e96]"
              }`}
              onClick={() => setEditorMode("visual")}
              type="button"
            >
              Visual
            </button>
            <button
              className={`rounded-t-[3px] px-3 py-1 font-medium ${
                editorMode === "text"
                  ? "border-x border-t border-[#8c8f94] bg-white text-[#1d2327]"
                  : "border-b border-[#8c8f94] bg-[#f6f7f7] text-[#2271b1] hover:text-[#135e96]"
              }`}
              onClick={() => setEditorMode("text")}
              type="button"
            >
              Text
            </button>
          </div>
        </div>

        {/* Editor Container */}
        <div className="overflow-hidden rounded-[3px] border border-[#8c8f94] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset]">
          {editorMode === "visual" ? (
            <DynamicEditor
              init={{
                height: 440,
                menubar: false,
                branding: false,
                statusbar: false,
                plugins: "advlist autolink lists link image table code wordcount",
                toolbar:
                  "formatselect | bold italic underline | bullist numlist blockquote | alignleft aligncenter alignright | link unlink | code",
                toolbar_mode: "floating",
                resize: false,
                content_style:
                  "body { font-family: Georgia, serif; font-size: 16px; line-height: 1.7; color: #23282d; margin: 16px; } p { margin: 0 0 1em; }",
                skin: "oxide",
                content_css: false,
              }}
              licenseKey="gpl"
              onEditorChange={setContent}
              tinymceScriptSrc="/tinymce/tinymce.min.js"
              value={content}
            />
          ) : (
            <textarea
              className="h-[440px] w-full resize-none p-4 font-mono text-xs leading-relaxed text-[#2c3338] outline-none"
              onChange={(e) => setContent(e.target.value)}
              value={content}
            />
          )}

          {/* Editor Status Bar */}
          <div className="flex items-center justify-between border-t border-[#dcdcde] bg-[#f6f7f7] px-3 py-1.5 text-[11px] text-[#646970]">
            <span>Word count: {wordCount}</span>
            <span>Draft saved at {lastSaved}.</span>
          </div>
        </div>

        {/* Excerpt Meta Box (Can be displayed under editor in classic WP style) */}
        <MetaBoxExcerpt excerpt={excerpt} onChange={setExcerpt} />
      </div>

      {/* Right Sidebar Meta Boxes */}
      <div className="space-y-4">
        <MetaBoxPublish
          isExisting={Boolean(postId)}
          isPostTypePage={postType === "page"}
          isSaving={isPending}
          onStatusChange={setStatus}
          onTrash={onTrash}
          status={status}
        />

        {postType === "post" && <MetaBoxFormat />}

        {postType === "post" && (
          <MetaBoxCategories
            categories={categories}
            onToggleCategory={toggleCategory}
            selectedCategories={selectedCategories}
          />
        )}

        {postType === "post" && (
          <MetaBoxTags
            availableTags={availableTags}
            onTagsChange={setTagList}
            tags={tagList}
          />
        )}

        {postType === "page" && (
          <MetaBoxPageAttributes
            currentParentId={postParent}
            onOrderChange={setMenuOrder}
            onParentChange={setPostParent}
            order={menuOrder}
            parentPages={parentPages}
          />
        )}

        <MetaBoxFeaturedImage
          featuredImageId={featuredImageId}
          onChange={setFeaturedImageId}
        />
      </div>
    </form>
  );
}
