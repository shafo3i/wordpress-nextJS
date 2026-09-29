"use client";

import Link from "next/link";
import { SelectLanguage } from "@/db/schema/cms-languages";
import { createLanguageAction, updateLanguageAction } from "../action";

type Props = {
    defaultValues?: SelectLanguage | null;
    dict?: Record<string, string>;
};

export function LanguageForm({ defaultValues, dict = {} }: Props) {
    const isEditing = Boolean(defaultValues);

    return (
        <div className="mb-4 max-w-2xl border border-[#c3c4c7] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.04)] text-[13px]">
            <h2 className="mb-3 text-[14px] font-semibold text-[#1d2327]">
                {isEditing
                    ? `${dict["admin.languages.form.edit_title"] || "Edit Language"}: ${defaultValues?.name}`
                    : dict["admin.languages.form.create_title"] || "Add New Language"}
            </h2>

            <form action={isEditing ? updateLanguageAction : createLanguageAction} className="space-y-4">
                {isEditing && (
                    <input name="originalCode" type="hidden" value={defaultValues?.code} />
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Language Code */}
                    <div>
                        <label className="mb-1 block font-medium text-[#2c3338]" htmlFor="code">
                            {dict["admin.languages.form.code"] || "Language Code"} <span className="text-[#d63638]">*</span>
                        </label>
                        <input
                            className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] disabled:bg-[#f0f0f1] disabled:text-[#646970]"
                            defaultValue={defaultValues?.code ?? ""}
                            disabled={isEditing}
                            id="code"
                            maxLength={10}
                            name="code"
                            placeholder="e.g. de, fr, es"
                            required
                            type="text"
                        />
                        <p className="mt-1 text-[11px] text-[#646970]">
                            {dict["admin.languages.form.code_desc"] || "2-10 character ISO code (e.g., 'en', 'ar', 'fr'). Cannot be changed once created."}
                        </p>
                    </div>

                    {/* Display Order */}
                    <div>
                        <label className="mb-1 block font-medium text-[#2c3338]" htmlFor="displayOrder">
                            {dict["admin.languages.form.order"] || "Display Order"}
                        </label>
                        <input
                            className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                            defaultValue={defaultValues?.displayOrder ?? 0}
                            id="displayOrder"
                            name="displayOrder"
                            type="number"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Name */}
                    <div>
                        <label className="mb-1 block font-medium text-[#2c3338]" htmlFor="name">
                            {dict["admin.languages.form.name"] || "Language Name (English)"} <span className="text-[#d63638]">*</span>
                        </label>
                        <input
                            className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                            defaultValue={defaultValues?.name ?? ""}
                            id="name"
                            name="name"
                            placeholder="e.g. German"
                            required
                            type="text"
                        />
                    </div>

                    {/* Native Name */}
                    <div>
                        <label className="mb-1 block font-medium text-[#2c3338]" htmlFor="nativeName">
                            {dict["admin.languages.form.native_name"] || "Native Name"}
                        </label>
                        <input
                            className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                            defaultValue={defaultValues?.nativeName ?? ""}
                            id="nativeName"
                            name="nativeName"
                            placeholder="e.g. Deutsch"
                            type="text"
                        />
                    </div>
                </div>

                {/* Text Direction */}
                <div>
                    <label className="mb-1 block font-medium text-[#2c3338]" htmlFor="direction">
                        {dict["admin.languages.form.direction"] || "Text Direction"}
                    </label>
                    <select
                        className="h-[30px] w-48 rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                        defaultValue={defaultValues?.direction ?? "ltr"}
                        id="direction"
                        name="direction"
                    >
                        <option value="ltr">{dict["admin.languages.form.direction_ltr"] || "Left to Right (LTR)"}</option>
                        <option value="rtl">{dict["admin.languages.form.direction_rtl"] || "Right to Left (RTL)"}</option>
                    </select>
                </div>

                {/* Checkboxes: Active & Default */}
                <div className="flex flex-wrap items-center gap-6 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer font-normal text-[#2c3338]">
                        <input
                            className="h-4 w-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                            defaultChecked={defaultValues ? defaultValues.isActive : true}
                            name="isActive"
                            type="checkbox"
                            value="true"
                        />
                        {dict["admin.languages.form.active"] || "Active (available for visitors and translation)"}
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-normal text-[#2c3338]">
                        <input
                            className="h-4 w-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                            defaultChecked={defaultValues ? defaultValues.isDefault : false}
                            name="isDefault"
                            type="checkbox"
                            value="true"
                        />
                        {dict["admin.languages.form.default"] || "Default Language"}
                    </label>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#f0f0f1]">
                    <button
                        className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-4 text-[13px] font-normal text-white hover:border-[#0a4b78] hover:bg-[#135e96] cursor-pointer"
                        type="submit"
                    >
                        {isEditing
                            ? dict["admin.languages.form.save"] || "Save Changes"
                            : dict["admin.languages.form.add"] || "Add Language"}
                    </button>
                    <Link
                        className="h-[30px] inline-flex items-center rounded-[3px] border border-[#c3c4c7] bg-[#f6f7f7] px-3 text-[13px] text-[#2c3338] hover:bg-[#f0f0f1]"
                        href="/admincp/languages"
                    >
                        {dict["admin.languages.form.cancel"] || "Cancel"}
                    </Link>
                </div>
            </form>
        </div>
    );
}
