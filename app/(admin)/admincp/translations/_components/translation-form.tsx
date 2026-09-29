"use client";

import Link from "next/link";
import { saveTranslationAction } from "../action";

type Props = {
    activeLocale: string;
    returnUrl: string;
    dict?: Record<string, string>;
};

export function TranslationForm({ activeLocale, returnUrl, dict = {} }: Props) {
    return (
        <div className="mb-4 max-w-2xl border border-[#c3c4c7] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.04)] text-[13px]">
            <h2 className="mb-3 text-[14px] font-semibold text-[#1d2327]">
                {dict["admin.translations.form.title"] || "Add New Translatable Key"} ({activeLocale.toUpperCase()})
            </h2>

            <form action={saveTranslationAction} className="space-y-4">
                <input name="languageCode" type="hidden" value={activeLocale} />
                <input name="returnUrl" type="hidden" value={returnUrl} />

                <div>
                    <label className="mb-1 block font-medium text-[#2c3338]" htmlFor="key">
                        {dict["admin.translations.form.key"] || "Translation Key"} <span className="text-[#d63638]">*</span>
                    </label>
                    <input
                        className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 font-mono text-[12px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                        id="key"
                        name="key"
                        placeholder="e.g. footer.copyright or posts.readMore"
                        required
                        type="text"
                    />
                    <p className="mt-1 text-[11px] text-[#646970]">
                        {dict["admin.translations.form.key_desc"] || "Dot-separated key identifying the string (e.g., 'common.submit')."}
                    </p>
                </div>

                <div>
                    <label className="mb-1 block font-medium text-[#2c3338]" htmlFor="value">
                        {dict["admin.translations.form.value"] || "Translation Text"} <span className="text-[#d63638]">*</span>
                    </label>
                    <textarea
                        className="w-full rounded-[3px] border border-[#8c8f94] bg-white p-2 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                        id="value"
                        name="value"
                        placeholder="Enter the localized translation..."
                        required
                        rows={3}
                    />
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-[#f0f0f1]">
                    <button
                        className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-4 text-[13px] font-normal text-white hover:border-[#0a4b78] hover:bg-[#135e96] cursor-pointer"
                        type="submit"
                    >
                        {dict["admin.translations.form.save"] || "Save Translation"}
                    </button>
                    <Link
                        className="h-[30px] inline-flex items-center rounded-[3px] border border-[#c3c4c7] bg-[#f6f7f7] px-3 text-[13px] text-[#2c3338] hover:bg-[#f0f0f1]"
                        href={returnUrl}
                    >
                        {dict["admin.translations.form.cancel"] || "Cancel"}
                    </Link>
                </div>
            </form>
        </div>
    );
}
