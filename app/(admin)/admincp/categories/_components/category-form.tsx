"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createCategory } from "../action";
import type { SelectLanguage } from "@/db/schema/cms-languages";
import type { CategoryItem } from "@/services/category.service";

export type CategoryParentOption = {
  id: string;
  name: string;
  parent?: string;
};

export function CategoryForm({
  parentCategories = [],
  languages = [],
  currentLanguage = "en",
  sourceCategories = [],
  initialTargetLanguage,
  initialSourceTaxId,
  onCreated,
  dict = {},
}: {
  parentCategories?: CategoryParentOption[];
  languages?: SelectLanguage[];
  currentLanguage?: string;
  sourceCategories?: CategoryItem[];
  initialTargetLanguage?: string;
  initialSourceTaxId?: string;
  onCreated?: () => void;
  dict?: Record<string, string>;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [parent, setParent] = useState("0");
  const [description, setDescription] = useState("");
  const [languageCode, setLanguageCode] = useState(
    initialTargetLanguage || (currentLanguage !== "all" ? currentLanguage : "en")
  );
  const [sourceTermTaxonomyId, setSourceTermTaxonomyId] = useState(initialSourceTaxId || "0");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (initialTargetLanguage) {
      setLanguageCode(initialTargetLanguage);
    }
  }, [initialTargetLanguage]);

  useEffect(() => {
    if (initialSourceTaxId) {
      setSourceTermTaxonomyId(initialSourceTaxId);
    }
  }, [initialSourceTaxId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setErrorMessage(
        dict["admin.categories.form.name_required"] || "Please enter a category name."
      );
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("name", name.trim());
        formData.set("slug", slug.trim());
        formData.set("parent", parent);
        formData.set("description", description.trim());
        formData.set("languageCode", languageCode);
        if (sourceTermTaxonomyId && sourceTermTaxonomyId !== "0") {
          formData.set("sourceTermTaxonomyId", sourceTermTaxonomyId);
        }

        await createCategory(formData);
        setName("");
        setSlug("");
        setParent("0");
        setDescription("");
        setSourceTermTaxonomyId("0");
        setSuccessMessage(
          dict["admin.categories.created_notice"] || "Category added."
        );
        onCreated?.();
        router.refresh();
      } catch (err: unknown) {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : dict["admin.categories.single_failed"] || "Failed to create category."
        );
      }
    });
  };

  return (
    <div className="text-[13px] text-start text-[#2c3338]">
      <h2 className="mb-3 text-[14px] font-semibold text-[#1d2327]">
        {dict["admin.categories.form.add_new_title"] || "Add New Category"}
      </h2>

      {errorMessage && (
        <div className="mb-3 border-l-4 border-[#d63638] bg-[#fcf0f1] p-2.5 text-xs text-[#d63638]">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mb-3 border-l-4 border-[#00a32a] bg-[#f0f6f0] p-2.5 text-xs text-[#00a32a]">
          {successMessage}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#1d2327]">
            {dict["admin.categories.form.name"] || "Name"}
          </label>
          <input
            className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
            disabled={isPending}
            name="name"
            onChange={(e) => setName(e.target.value)}
            required
            type="text"
            value={name}
          />
          <p className="mt-1 text-[11px] text-[#646970]">
            {dict["admin.categories.form.name_desc"] ||
              "The name is how it appears on your site."}
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#1d2327]">
            {dict["admin.categories.form.slug"] || "Slug"}
          </label>
          <input
            className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
            disabled={isPending}
            name="slug"
            onChange={(e) => setSlug(e.target.value)}
            type="text"
            value={slug}
          />
          <p className="mt-1 text-[11px] text-[#646970]">
            {dict["admin.categories.form.slug_desc"] ||
              "The “slug” is the URL-friendly version of the name. It is usually all lowercase and contains only letters, numbers, and hyphens."}
          </p>
        </div>

        {languages && languages.length > 0 && (
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#1d2327]">
              {dict["admin.common.language"] || "Language"}
            </label>
            <select
              className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1]"
              disabled={isPending}
              name="languageCode"
              onChange={(e) => setLanguageCode(e.target.value)}
              value={languageCode}
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.nativeName ? `${l.nativeName} (${l.name})` : l.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {languageCode !== "en" && sourceCategories && sourceCategories.length > 0 && (
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#1d2327]">
              {dict["admin.categories.translation_of"] || "Translation of"}
            </label>
            <select
              className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1]"
              disabled={isPending}
              name="sourceTermTaxonomyId"
              onChange={(e) => setSourceTermTaxonomyId(e.target.value)}
              value={sourceTermTaxonomyId}
            >
              <option value="0">
                {dict["admin.common.none"] || "— None (standalone category) —"}
              </option>
              {sourceCategories.map((c) => (
                <option key={c.termTaxonomyId} value={c.termTaxonomyId}>
                  {c.name} ({c.slug})
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-[#646970]">
              {dict["admin.categories.translation_of_desc"] ||
                "Link this category as a translation of an English category."}
            </p>
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#1d2327]">
            {dict["admin.categories.form.parent"] || "Parent Category"}
          </label>
          <select
            className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1]"
            disabled={isPending}
            name="parent"
            onChange={(e) => setParent(e.target.value)}
            value={parent}
          >
            <option value="0">
              {dict["admin.categories.form.parent_none"] || "None"}
            </option>
            {parentCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-[#646970]">
            {dict["admin.categories.form.parent_desc"] ||
              "Categories, unlike tags, can have a hierarchy. You might have a Jazz category, and under that have children categories for Bebop and Big Band. Totally optional."}
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#1d2327]">
            {dict["admin.categories.form.description"] || "Description"}
          </label>
          <textarea
            className="w-full rounded-[3px] border border-[#8c8f94] bg-white p-2 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] resize-y"
            disabled={isPending}
            name="description"
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            value={description}
          />
          <p className="mt-1 text-[11px] text-[#646970]">
            {dict["admin.categories.form.description_desc"] ||
              "The description is not prominent by default; however, some themes may show it."}
          </p>
        </div>

        <button
          className="inline-flex h-[30px] items-center rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-3 text-[13px] font-normal text-white shadow-[0_1px_0_#135e96] hover:border-[#135e96] hover:bg-[#135e96] disabled:opacity-50 cursor-pointer"
          disabled={isPending}
          type="submit"
        >
          {isPending
            ? dict["admin.categories.form.submitting"] || "Adding Category..."
            : dict["admin.categories.form.submit"] || "Add New Category"}
        </button>
      </form>
    </div>
  );
}
