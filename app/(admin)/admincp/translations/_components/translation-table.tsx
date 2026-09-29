"use client";

import { TranslationCatalogItem } from "@/services/language.service";
import { TranslationPagination } from "./translation-pagination";
import {
    saveTranslationAction,
    deleteTranslationOverrideAction,
} from "../action";

type Props = {
    items: TranslationCatalogItem[];
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize?: number;
    locale: string;
    direction?: string;
    group: string;
    filter: string;
    searchQuery: string;
    returnUrl: string;
    dict?: Record<string, string>;
};

export function TranslationTable({
    items,
    currentPage,
    totalPages,
    totalItems,
    locale,
    direction = "ltr",
    group,
    filter,
    searchQuery,
    returnUrl,
    dict = {},
}: Props) {
    return (
        <div className="space-y-2">
            {/* Top Pagination */}
            <TranslationPagination
                basePath="/admincp/translations"
                currentPage={currentPage}
                dict={dict}
                filter={filter}
                group={group}
                locale={locale}
                position="top"
                searchQuery={searchQuery}
                totalItems={totalItems}
                totalPages={totalPages}
            />

            {/* Widefat Table */}
            <div className="overflow-x-auto border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
                <table className="w-full min-w-[850px] border-collapse text-start text-[13px]">
                    <thead className="border-b border-[#c3c4c7] bg-[#f6f7f7] text-[13px] text-[#2c3338]">
                        <tr>
                            <th className="px-3 py-2 font-medium w-64 text-start">
                                {dict["admin.translations.table.key"] || "Key"}
                            </th>
                            <th className="px-3 py-2 font-medium w-72 text-start">
                                {dict["admin.translations.table.original"] || "Original (English)"}
                            </th>
                            <th className="px-3 py-2 font-medium text-start">
                                {dict["admin.translations.table.translation"] || "Translation"} ({locale.toUpperCase()})
                            </th>
                            <th className="px-3 py-2 font-medium w-28 text-center">
                                {dict["admin.translations.table.source"] || "Source"}
                            </th>
                            <th className="px-3 py-2 font-medium w-36 text-end">
                                {dict["admin.translations.table.action"] || "Action"}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f0f1]">
                        {items.length === 0 ? (
                            <tr>
                                <td className="px-3 py-6 text-center text-[#646970]" colSpan={5}>
                                    {dict["admin.translations.table.no_strings"] || "No translatable strings found matching your criteria."}
                                </td>
                            </tr>
                        ) : (
                            items.map((item) => {
                                const formId = `trans-${item.key.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
                                return (
                                <tr
                                    className="group hover:bg-[#f6f7f7] transition-colors"
                                    key={item.key}
                                >
                                    {/* Key & Group */}
                                    <td className="px-3 py-2.5 align-top">
                                        <div className="font-mono text-[12px] font-semibold text-[#1d2327] break-all">
                                            {item.key}
                                        </div>
                                        <div className="mt-1">
                                            <span className="inline-block rounded-[3px] border border-[#dcdcde] bg-[#f0f0f1] px-1.5 py-0.2 text-[10px] uppercase text-[#646970]">
                                                {item.group}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Base English reference */}
                                    <td className="px-3 py-2.5 align-top text-[#50575e]">
                                        <div className="max-h-24 overflow-y-auto pr-1 text-[12px] whitespace-pre-wrap">
                                            {item.baseValue || <span className="italic text-[#a7aaad]">—</span>}
                                        </div>
                                    </td>

                                    {/* Translation Input (full width) */}
                                    <td className="px-3 py-2.5 align-top">
                                        <form action={saveTranslationAction} id={formId}>
                                            <input name="languageCode" type="hidden" value={locale} />
                                            <input name="key" type="hidden" value={item.key} />
                                            <input name="returnUrl" type="hidden" value={returnUrl} />
                                            <input
                                                className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                                                defaultValue={item.currentValue}
                                                dir={direction}
                                                name="value"
                                                placeholder={item.baseValue || "Enter translation..."}
                                                required
                                                type="text"
                                            />
                                        </form>
                                    </td>

                                    {/* Source Status */}
                                    <td className="px-3 py-2.5 align-top text-center">
                                        {item.isOverridden ? (
                                            <span className="inline-block rounded-[3px] border border-[#2271b1] bg-[#f0f6fc] px-1.5 py-0.5 text-[10px] font-medium text-[#2271b1]">
                                                {dict["admin.translations.table.source_override"] || "DB Override"}
                                            </span>
                                        ) : item.templateValue ? (
                                            <span className="inline-block rounded-[3px] border border-[#c3c4c7] bg-[#f6f7f7] px-1.5 py-0.5 text-[10px] font-medium text-[#50575e]">
                                                {dict["admin.translations.table.source_template"] || "File Template"}
                                            </span>
                                        ) : (
                                            <span className="inline-block rounded-[3px] border border-[#dba617] bg-[#fcf9e8] px-1.5 py-0.5 text-[10px] font-medium text-[#8a6d3b]">
                                                {dict["admin.translations.table.source_missing"] || "Untranslated"}
                                            </span>
                                        )}
                                    </td>

                                    {/* Action Column: Save Button + Reset (if overridden) */}
                                    <td className="px-3 py-2.5 align-top text-end">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 text-[12px] font-medium text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78] cursor-pointer whitespace-nowrap"
                                                form={formId}
                                                title="Save this string"
                                                type="submit"
                                            >
                                                {dict["admin.translations.table.save"] || "Save"}
                                            </button>

                                            {item.isOverridden && (
                                                <form action={deleteTranslationOverrideAction} className="inline">
                                                    <input name="languageCode" type="hidden" value={locale} />
                                                    <input name="key" type="hidden" value={item.key} />
                                                    <input name="returnUrl" type="hidden" value={returnUrl} />
                                                    <button
                                                        className="text-[12px] text-[#b32d2e] hover:text-[#a00] hover:underline cursor-pointer whitespace-nowrap"
                                                        title="Revert back to file template"
                                                        type="submit"
                                                    >
                                                        {dict["admin.translations.table.reset"] || "Reset"}
                                                    </button>
                                                </form>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Bottom Pagination */}
            <TranslationPagination
                basePath="/admincp/translations"
                currentPage={currentPage}
                dict={dict}
                filter={filter}
                group={group}
                locale={locale}
                position="bottom"
                searchQuery={searchQuery}
                totalItems={totalItems}
                totalPages={totalPages}
            />
        </div>
    );
}
