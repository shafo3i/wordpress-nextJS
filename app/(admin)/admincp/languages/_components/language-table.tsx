"use client";

import Link from "next/link";
import { SelectLanguage } from "@/db/schema/cms-languages";
import { LanguagePagination } from "./language-pagination";
import {
    deleteLanguageAction,
    setDefaultLanguageAction,
    toggleLanguageStatusAction,
} from "../action";

type Props = {
    rows: SelectLanguage[];
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    currentStatus: string;
    searchQuery: string;
    dict?: Record<string, string>;
};

export function LanguageTable({
    rows,
    currentPage,
    totalPages,
    totalItems,
    currentStatus,
    searchQuery,
    dict = {},
}: Props) {
    return (
        <div className="space-y-2">
            {/* Top Pagination */}
            <LanguagePagination
                basePath="/admincp/languages"
                currentPage={currentPage}
                currentStatus={currentStatus}
                dict={dict}
                position="top"
                searchQuery={searchQuery}
                totalItems={totalItems}
                totalPages={totalPages}
            />

            {/* Widefat Table */}
            <div className="overflow-x-auto border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
                <table className="w-full min-w-[760px] border-collapse text-start text-[13px]">
                    <thead className="border-b border-[#c3c4c7] bg-[#f6f7f7] text-[13px] text-[#2c3338]">
                        <tr>
                            <th className="px-3 py-2 font-medium w-16 text-start">
                                {dict["admin.languages.table.code"] || "Code"}
                            </th>
                            <th className="px-3 py-2 font-medium text-start">
                                {dict["admin.languages.table.name"] || "Name"}
                            </th>
                            <th className="px-3 py-2 font-medium text-start">
                                {dict["admin.languages.table.native_name"] || "Native Name"}
                            </th>
                            <th className="px-3 py-2 font-medium w-24 text-start">
                                {dict["admin.languages.table.direction"] || "Direction"}
                            </th>
                            <th className="px-3 py-2 font-medium w-24 text-start">
                                {dict["admin.languages.table.default"] || "Default"}
                            </th>
                            <th className="px-3 py-2 font-medium w-24 text-start">
                                {dict["admin.languages.table.status"] || "Status"}
                            </th>
                            <th className="px-3 py-2 font-medium w-20 text-center">
                                {dict["admin.languages.table.order"] || "Order"}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f0f1]">
                        {rows.length === 0 ? (
                            <tr>
                                <td className="px-3 py-6 text-center text-[#646970]" colSpan={7}>
                                    {dict["admin.languages.table.no_languages"] || "No languages found."}
                                </td>
                            </tr>
                        ) : (
                            rows.map((lang) => (
                                <tr
                                    className="group hover:bg-[#f6f7f7] transition-colors"
                                    key={lang.code}
                                >
                                    {/* Code */}
                                    <td className="px-3 py-2.5 font-mono text-[12px] font-semibold text-[#1d2327]">
                                        {lang.code}
                                    </td>

                                    {/* Name & Row Actions */}
                                    <td className="px-3 py-2.5">
                                        <div className="font-medium text-[#1d2327]">
                                            <Link
                                                className="text-[#2271b1] hover:text-[#135e96] hover:underline"
                                                href={`/admincp/languages?edit=${lang.code}`}
                                            >
                                                {lang.name}
                                            </Link>
                                        </div>

                                        {/* Row Actions */}
                                        <div className="mt-1 flex items-center gap-1.5 text-[12px] text-[#646970]">
                                            <Link
                                                className="text-[#2271b1] hover:text-[#135e96] hover:underline"
                                                href={`/admincp/languages?edit=${lang.code}`}
                                            >
                                                {dict["admin.languages.table.edit"] || "Edit"}
                                            </Link>
                                            <span className="text-[#c3c4c7]">|</span>
                                            <Link
                                                className="text-[#2271b1] hover:text-[#135e96] hover:underline"
                                                href={`/admincp/translations?locale=${lang.code}`}
                                            >
                                                {dict["admin.languages.table.translate"] || "Translate"}
                                            </Link>

                                            {!lang.isDefault && (
                                                <>
                                                    <span className="text-[#c3c4c7]">|</span>
                                                    <form action={setDefaultLanguageAction} className="inline">
                                                        <input name="code" type="hidden" value={lang.code} />
                                                        <button
                                                            className="text-[#2271b1] hover:text-[#135e96] hover:underline cursor-pointer"
                                                            type="submit"
                                                        >
                                                            {dict["admin.languages.table.set_default"] || "Set Default"}
                                                        </button>
                                                    </form>
                                                </>
                                            )}

                                            {!lang.isDefault && (
                                                <>
                                                    <span className="text-[#c3c4c7]">|</span>
                                                    <form action={deleteLanguageAction} className="inline">
                                                        <input name="code" type="hidden" value={lang.code} />
                                                        <button
                                                            className="text-[#b32d2e] hover:text-[#a00] hover:underline cursor-pointer"
                                                            onClick={(e) => {
                                                                if (
                                                                    !confirm(
                                                                        `Are you sure you want to delete the "${lang.name}" language? All associated custom translations will also be removed.`
                                                                    )
                                                                ) {
                                                                    e.preventDefault();
                                                                }
                                                            }}
                                                            type="submit"
                                                        >
                                                            {dict["admin.languages.table.delete"] || "Delete"}
                                                        </button>
                                                    </form>
                                                </>
                                            )}
                                        </div>
                                    </td>

                                    {/* Native Name */}
                                    <td className="px-3 py-2.5 text-[#2c3338]" dir={lang.direction}>
                                        {lang.nativeName || "—"}
                                    </td>

                                    {/* Direction */}
                                    <td className="px-3 py-2.5 uppercase text-[12px] font-mono text-[#50575e]">
                                        {lang.direction}
                                    </td>

                                    {/* Default Badge */}
                                    <td className="px-3 py-2.5">
                                        {lang.isDefault ? (
                                            <span className="inline-block rounded-[3px] border border-[#c3c4c7] bg-[#f0f0f1] px-2 py-0.5 text-[11px] font-semibold text-[#1d2327]">
                                                {dict["admin.languages.table.default"] || "Default"}
                                            </span>
                                        ) : (
                                            <span className="text-[12px] text-[#8c8f94]">—</span>
                                        )}
                                    </td>

                                    {/* Status Toggle */}
                                    <td className="px-3 py-2.5">
                                        <form action={toggleLanguageStatusAction} className="inline">
                                            <input name="code" type="hidden" value={lang.code} />
                                            <input
                                                name="isActive"
                                                type="hidden"
                                                value={lang.isActive ? "false" : "true"}
                                            />
                                            <button
                                                className={`cursor-pointer rounded-[3px] px-2 py-0.5 text-[11px] font-medium transition-colors ${lang.isActive
                                                        ? "border border-[#00a32a] bg-[#edfaef] text-[#007017] hover:bg-[#d8f5dc]"
                                                        : "border border-[#8c8f94] bg-[#f0f0f1] text-[#646970] hover:bg-[#dcdcde]"
                                                    }`}
                                                disabled={lang.isDefault && lang.isActive}
                                                title={
                                                    lang.isDefault
                                                        ? "The default language must remain active"
                                                        : lang.isActive
                                                            ? "Click to deactivate"
                                                            : "Click to activate"
                                                }
                                                type="submit"
                                            >
                                                {lang.isActive
                                                    ? dict["admin.languages.status.active"] || "Active"
                                                    : dict["admin.languages.status.inactive"] || "Inactive"}
                                            </button>
                                        </form>
                                    </td>

                                    {/* Order */}
                                    <td className="px-3 py-2.5 text-center text-[#50575e]">
                                        {lang.displayOrder}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Bottom Pagination */}
            <LanguagePagination
                basePath="/admincp/languages"
                currentPage={currentPage}
                currentStatus={currentStatus}
                dict={dict}
                position="bottom"
                searchQuery={searchQuery}
                totalItems={totalItems}
                totalPages={totalPages}
            />
        </div>
    );
}
