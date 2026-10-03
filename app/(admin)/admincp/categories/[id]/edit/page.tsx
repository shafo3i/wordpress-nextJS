import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell, getAdminLanguageContext } from "@/components/admin/admin-shell";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import { getCategoryById, getParentCategories } from "../../query";
import { updateCategory } from "../../action";

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await verifyAdminOrEditor();

  const { id } = await params;
  const termId = BigInt(id);

  const langContext = await getAdminLanguageContext();
  const dict = langContext.dict;

  const [category, allOtherCategories, englishCategories] = await Promise.all([
    getCategoryById(termId),
    getParentCategories(termId),
    getParentCategories(undefined, "en"),
  ]);

  if (!category) notFound();

  return (
    <AdminShell>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#c3c4c7] pb-3">
        <div className="flex items-center gap-3">
          <h1 className="text-[23px] font-normal text-[#1d2327]">
            {dict["admin.categories.edit_title"] || "Edit Category"}
          </h1>
          <Link
            className="text-xs text-[#2271b1] hover:underline"
            href="/admincp/categories"
          >
            {dict["admin.categories.back_to_categories"] || "← Go to Categories"}
          </Link>
        </div>
        <div className="flex items-center gap-1 text-[13px]">
          <button
            className="flex items-center gap-1 rounded-b-[4px] border border-[#c3c4c7] bg-white px-2.5 py-0.5 text-[#50575e] hover:border-[#8c8f94] hover:text-[#1d2327]"
            type="button"
          >
            {dict["admin.common.screen_options"] || "Screen Options"} <span className="text-[9px]">▼</span>
          </button>
          <button
            className="flex items-center gap-1 rounded-b-[4px] border border-[#c3c4c7] bg-white px-2.5 py-0.5 text-[#50575e] hover:border-[#8c8f94] hover:text-[#1d2327]"
            type="button"
          >
            {dict["admin.common.help"] || "Help"} <span className="text-[9px]">▼</span>
          </button>
        </div>
      </div>

      <div className="max-w-2xl text-[13px] text-[#2c3338]">
        <form action={updateCategory} className="space-y-5">
          <input name="termId" type="hidden" value={category.id} />

          <div>
            <label className="mb-1 block text-xs font-semibold text-[#1d2327]">
              {dict["admin.categories.form.name"] || "Name"}
            </label>
            <input
              className="h-[32px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
              defaultValue={category.name}
              name="name"
              required
              type="text"
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
              className="h-[32px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
              defaultValue={category.slug}
              name="slug"
              type="text"
            />
            <p className="mt-1 text-[11px] text-[#646970]">
              {dict["admin.categories.form.slug_desc"] ||
                "The “slug” is the URL-friendly version of the name. It is usually all lowercase and contains only letters, numbers, and hyphens."}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[#1d2327]">
              {dict["admin.common.language"] || "Language"}
            </label>
            <select
              className="h-[32px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1]"
              defaultValue={category.languageCode || "en"}
              name="languageCode"
            >
              {langContext.allLanguages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.nativeName ? `${l.nativeName} (${l.name})` : l.name}
                </option>
              ))}
            </select>
          </div>

          {category.languageCode !== "en" && englishCategories.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#1d2327]">
                {dict["admin.categories.translation_of"] || "Translation of"}
              </label>
              <select
                className="h-[32px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1]"
                defaultValue={
                  category.translations?.find((t) => t.languageCode === "en")?.termTaxonomyId || "0"
                }
                name="sourceTermTaxonomyId"
              >
                <option value="0">
                  {dict["admin.common.none"] || "— None (standalone category) —"}
                </option>
                {englishCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-[#646970]">
                {dict["admin.categories.translation_of_desc"] ||
                  "Link this category as a translation of an English category."}
              </p>
            </div>
          )}

          {category.translations && category.translations.length > 1 && (
            <div className="rounded-[3px] border border-[#c3c4c7] bg-[#f6f7f7] p-3">
              <span className="block text-xs font-semibold text-[#1d2327] mb-1.5">
                {dict["admin.editor.translations"] || "Translations"}
              </span>
              <ul className="space-y-1 text-xs">
                {category.translations
                  .filter((t) => t.termTaxonomyId !== category.termTaxonomyId)
                  .map((t) => (
                    <li className="flex items-center gap-2" key={t.termTaxonomyId}>
                      <span className="inline-block rounded border border-[#c3c4c7] bg-white px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#50575e]">
                        {t.languageCode}
                      </span>
                      <Link
                        className="text-[#2271b1] hover:underline font-medium"
                        href={`/admincp/categories/${t.termId}/edit`}
                      >
                        {t.name}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-[#1d2327]">
              {dict["admin.categories.form.parent"] || "Parent Category"}
            </label>
            <select
              className="h-[32px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1]"
              defaultValue={category.parent || "0"}
              name="parent"
            >
              <option value="0">
                {dict["admin.categories.form.parent_none"] || "None"}
              </option>
              {allOtherCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-[#646970]">
              {dict["admin.categories.form.parent_desc"] ||
                "Assign a parent term to create a hierarchy."}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[#1d2327]">
              {dict["admin.categories.form.description"] || "Description"}
            </label>
            <textarea
              className="w-full rounded-[3px] border border-[#8c8f94] bg-white p-2.5 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] resize-y"
              defaultValue={category.description || ""}
              name="description"
              rows={5}
            />
            <p className="mt-1 text-[11px] text-[#646970]">
              {dict["admin.categories.form.description_desc"] ||
                "The description is not prominent by default; however, some themes may show it."}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              className="inline-flex items-center rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-5 py-1.5 text-[13px] font-medium text-white shadow-[0_1px_0_#135e96] hover:border-[#135e96] hover:bg-[#135e96] cursor-pointer"
              type="submit"
            >
              {dict["admin.categories.update"] || "Update"}
            </button>
            <Link
              className="rounded-[3px] border border-[#8c8f94] bg-[#f6f7f7] px-3 py-1.5 text-[13px] text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78]"
              href="/admincp/categories"
            >
              {dict["admin.categories.cancel"] || "Cancel"}
            </Link>
          </div>
        </form>
      </div>
    </AdminShell>
  );
}
