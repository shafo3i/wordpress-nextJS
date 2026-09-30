"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Globe, Pencil, Plus } from "lucide-react";

export type LanguageOption = {
  code: string;
  name: string;
  nativeName?: string;
  direction?: string;
  isDefault?: boolean;
};

export type TranslationLink = {
  languageCode: string;
  postId: string | number | bigint;
  title: string;
};

export function MetaBoxLanguages({
  languages = [],
  currentLanguage = "en",
  translations = [],
  postId,
  postType = "page",
  translationOfId,
  translationOfTitle,
  onLanguageChange,
  dict,
}: {
  languages?: LanguageOption[];
  currentLanguage?: string;
  translations?: TranslationLink[];
  postId?: string;
  postType?: "post" | "page";
  translationOfId?: string;
  translationOfTitle?: string;
  onLanguageChange?: (code: string) => void;
  dict?: Record<string, string>;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedLang, setSelectedLang] = useState(currentLanguage);

  const handleLangChange = (val: string) => {
    setSelectedLang(val);
    onLanguageChange?.(val);
  };

  const basePath = postType === "page" ? "/admincp/pages" : "/admincp/posts";
  const langOfLabel =
    postType === "page"
      ? (dict?.["admin.editor.language_of_page"] || "Language of this page")
      : (dict?.["admin.editor.language_of_post"] || "Language of this post");

  return (
    <div className="border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)] text-start">
      <div
        className="flex cursor-pointer select-none items-center justify-between border-b border-[#c3c4c7] px-3 py-2 text-[14px] font-semibold text-[#1d2327]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center gap-1.5">
          <Globe className="size-4 text-[#50575e]" />
          {dict?.["admin.editor.language"] || "Language"}
        </span>
        <button className="text-[#50575e] hover:text-[#1d2327]" type="button">
          {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-3 p-3 text-xs text-[#50575e]">
          {/* Translation of notice */}
          {translationOfTitle && (
            <div className="rounded-[3px] border border-[#c3c4c7] bg-[#f6f7f7] p-2 text-[11px] text-[#2c3338]">
              <span className="font-semibold text-[#50575e]">
                {dict?.["admin.editor.translation_of"] || "Translation of:"}{" "}
              </span>
              <span className="font-medium text-[#2271b1]">{translationOfTitle}</span>
              <input type="hidden" name="translationOf" value={translationOfId || ""} />
            </div>
          )}

          {/* Language Selector */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#50575e]">
              {langOfLabel}
            </label>
            <select
              className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1]"
              name="languageCode"
              onChange={(e) => handleLangChange(e.target.value)}
              value={selectedLang}
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.nativeName ? `${l.nativeName} (${l.name})` : l.name}
                  {l.isDefault ? ` — ${dict?.["admin.editor.default"] || "Default"}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Translations section */}
          {languages.length > 1 && (
            <div className="border-t border-[#f0f0f1] pt-2">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#50575e]">
                {dict?.["admin.editor.translations"] || "Translations"}
              </span>
              <div className="space-y-1.5">
                {languages
                  .filter((l) => l.code !== selectedLang)
                  .map((l) => {
                    const match = translations.find(
                      (t) => t.languageCode === l.code
                    );

                    return (
                      <div
                        key={l.code}
                        className="flex items-center justify-between py-0.5 text-[12px]"
                      >
                        <span className="font-medium text-[#2c3338]">
                          {l.nativeName || l.name}:
                        </span>
                        {match ? (
                          <Link
                            href={`${basePath}/${match.postId}/edit`}
                            className="inline-flex items-center gap-1 text-[#2271b1] hover:underline"
                            title={`Edit ${l.name} translation`}
                          >
                            <span className="max-w-[120px] truncate text-[11px]">
                              {match.title}
                            </span>
                            <Pencil className="size-3" />
                          </Link>
                        ) : postId ? (
                          <Link
                            href={`${basePath}/new?lang=${l.code}&translation_of=${postId}`}
                            className="inline-flex items-center gap-1 text-[#2271b1] hover:underline"
                            title={`Add translation in ${l.name}`}
                          >
                            <Plus className="size-3" />
                            <span className="text-[11px]">
                              {dict?.["admin.editor.add"] || "Add"}
                            </span>
                          </Link>
                        ) : (
                          <span className="text-[11px] text-[#a7aaad]">
                            {dict?.["admin.editor.save_first"] || "Save first"}
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
