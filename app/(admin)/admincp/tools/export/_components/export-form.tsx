"use client";

import { useState } from "react";
import { Download, Database, FileCode, Archive, CheckCircle2, Loader2 } from "lucide-react";

interface ExportFormProps {
  categories: Array<{ termId: bigint; name: string; slug: string }>;
  authors: Array<{ id: string; name: string; email: string }>;
  stats: {
    posts: number;
    pages: number;
    comments: number;
    categories: number;
  };
  dict: Record<string, string>;
}

export function ExportForm({ categories, authors, stats, dict }: ExportFormProps) {
  const [format, setFormat] = useState<"xml" | "sql" | "json">("xml");
  const [contentType, setContentType] = useState<"all" | "post" | "page">("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAuthor, setSelectedAuthor] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const handleDownload = () => {
    setIsExporting(true);

    const params = new URLSearchParams();
    params.set("format", format);

    if (format !== "sql") {
      params.set("content", contentType);

      if (contentType === "post" && selectedCategory !== "all") {
        params.set("categoryId", selectedCategory);
      }
      if (selectedAuthor !== "all") {
        params.set("authorId", selectedAuthor);
      }
      if (selectedStatus !== "all") {
        params.set("status", selectedStatus);
      }
      if (startDate) {
        params.set("startDate", startDate);
      }
      if (endDate) {
        params.set("endDate", endDate);
      }
    }

    // Trigger direct browser download
    const exportUrl = `/api/admin/tools/export?${params.toString()}`;
    const link = document.createElement("a");
    link.href = exportUrl;
    link.setAttribute("download", "");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsExporting(false);
    }, 2000);
  };

  return (
    <div className="rounded-[3px] border border-[#dcdcde] bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.04)] space-y-6">
      <div>
        <h2 className="text-[16px] font-semibold text-[#1d2327]">
          {dict["admin.tools.choose_what_to_export"] || "Choose what to export"}
        </h2>
        <p className="text-[13px] text-[#50575e] mt-1">
          {dict["admin.tools.export_intro"] ||
            "When you click the button below, PressForge will create a downloadable export file for you to save to your computer."}
        </p>
      </div>

      {/* Format Selector */}
      <div className="space-y-3">
        <label className="text-[13px] font-semibold text-[#1d2327] block">
          {dict["admin.tools.export_format"] || "Export Format"}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setFormat("xml")}
            className={`flex items-start gap-3 p-3.5 rounded-[3px] border text-start transition-all cursor-pointer ${
              format === "xml"
                ? "border-[#2271b1] bg-[#f0f6fc] ring-1 ring-[#2271b1]"
                : "border-[#dcdcde] bg-white hover:border-[#8c8f94]"
            }`}
          >
            <FileCode className={`size-5 mt-0.5 ${format === "xml" ? "text-[#2271b1]" : "text-[#646970]"}`} />
            <div>
              <span className="text-[13px] font-semibold text-[#1d2327] block">
                {dict["admin.tools.format_wxr"] || "WordPress WXR (XML)"}
              </span>
              <span className="text-[11px] text-[#646970] mt-0.5 block">
                {dict["admin.tools.format_wxr_desc"] || "Compatible with real WordPress sites."}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFormat("sql")}
            className={`flex items-start gap-3 p-3.5 rounded-[3px] border text-start transition-all cursor-pointer ${
              format === "sql"
                ? "border-[#2271b1] bg-[#f0f6fc] ring-1 ring-[#2271b1]"
                : "border-[#dcdcde] bg-white hover:border-[#8c8f94]"
            }`}
          >
            <Database className={`size-5 mt-0.5 ${format === "sql" ? "text-[#2271b1]" : "text-[#646970]"}`} />
            <div>
              <span className="text-[13px] font-semibold text-[#1d2327] block">
                {dict["admin.tools.format_sql"] || "PostgreSQL Dump (.sql)"}
              </span>
              <span className="text-[11px] text-[#646970] mt-0.5 block">
                {dict["admin.tools.format_sql_desc"] || "Full database tables and insert statements."}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFormat("json")}
            className={`flex items-start gap-3 p-3.5 rounded-[3px] border text-start transition-all cursor-pointer ${
              format === "json"
                ? "border-[#2271b1] bg-[#f0f6fc] ring-1 ring-[#2271b1]"
                : "border-[#dcdcde] bg-white hover:border-[#8c8f94]"
            }`}
          >
            <Archive className={`size-5 mt-0.5 ${format === "json" ? "text-[#2271b1]" : "text-[#646970]"}`} />
            <div>
              <span className="text-[13px] font-semibold text-[#1d2327] block">
                {dict["admin.tools.format_json"] || "JSON Archive (.json)"}
              </span>
              <span className="text-[11px] text-[#646970] mt-0.5 block">
                {dict["admin.tools.format_json_desc"] || "Structured JSON schema for developers."}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Content Filter Options (for XML & JSON) */}
      {format !== "sql" && (
        <div className="space-y-4 border-t border-[#f0f0f1] pt-4">
          <label className="text-[13px] font-semibold text-[#1d2327] block">
            {dict["admin.tools.content_to_export"] || "Content to Export"}
          </label>

          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[#1d2327]">
              <input
                type="radio"
                name="contentType"
                value="all"
                checked={contentType === "all"}
                onChange={() => setContentType("all")}
                className="text-[#2271b1] focus:ring-[#2271b1]"
              />
              <span className="font-medium">
                {dict["admin.tools.all_content"] || "All content"}
              </span>
              <span className="text-[12px] text-[#646970]">
                ({dict["admin.tools.all_content_desc"] || "This will contain all of your posts, pages, comments, custom fields, terms, and navigation menus."})
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[#1d2327]">
              <input
                type="radio"
                name="contentType"
                value="post"
                checked={contentType === "post"}
                onChange={() => setContentType("post")}
                className="text-[#2271b1] focus:ring-[#2271b1]"
              />
              <span className="font-medium">
                {dict["admin.posts.title"] || "Posts"} ({stats.posts})
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[#1d2327]">
              <input
                type="radio"
                name="contentType"
                value="page"
                checked={contentType === "page"}
                onChange={() => setContentType("page")}
                className="text-[#2271b1] focus:ring-[#2271b1]"
              />
              <span className="font-medium">
                {dict["admin.menu.pages"] || "Pages"} ({stats.pages})
              </span>
            </label>
          </div>

          {/* Granular Post Filters */}
          {contentType === "post" && (
            <div className="ml-6 space-y-3 rounded bg-[#f6f7f7] border border-[#dcdcde] p-4 text-[13px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-[#50575e] mb-1">
                    {dict["admin.posts.table.categories"] || "Categories"}
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-2.5 py-1.5 text-[13px] text-[#2c3338] focus:border-[#2271b1] focus:outline-none"
                  >
                    <option value="all">{dict["admin.common.all"] || "All"}</option>
                    {categories.map((c) => (
                      <option key={String(c.termId)} value={String(c.termId)}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#50575e] mb-1">
                    {dict["admin.posts.table.author"] || "Authors"}
                  </label>
                  <select
                    value={selectedAuthor}
                    onChange={(e) => setSelectedAuthor(e.target.value)}
                    className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-2.5 py-1.5 text-[13px] text-[#2c3338] focus:border-[#2271b1] focus:outline-none"
                  >
                    <option value="all">{dict["admin.common.all"] || "All"}</option>
                    {authors.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name || a.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#50575e] mb-1">
                    {dict["admin.posts.table.status"] || "Status"}
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-2.5 py-1.5 text-[13px] text-[#2c3338] focus:border-[#2271b1] focus:outline-none"
                  >
                    <option value="all">{dict["admin.common.all"] || "All"}</option>
                    <option value="publish">{dict["admin.posts.status.publish"] || "Published"}</option>
                    <option value="draft">{dict["admin.posts.status.draft"] || "Draft"}</option>
                    <option value="pending">{dict["admin.posts.status.pending"] || "Pending"}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#50575e] mb-1">
                    {dict["admin.tools.date_range"] || "Date Range"}
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 py-1 text-[12px] text-[#2c3338]"
                    />
                    <span className="text-[#646970]">-</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 py-1 text-[12px] text-[#2c3338]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SQL Dump Information Notice */}
      {format === "sql" && (
        <div className="border-t border-[#f0f0f1] pt-4">
          <div className="flex items-start gap-2.5 rounded-[3px] bg-[#f0f6fc] border border-[#c5d9ed] p-3 text-[13px] text-[#1d2327]">
            <CheckCircle2 className="size-4 text-[#2271b1] mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-semibold block">
                {dict["admin.tools.sql_notice_title"] || "Full PostgreSQL Database Backup"}
              </span>
              <span className="text-[12px] text-[#50575e] block mt-0.5">
                {dict["admin.tools.sql_notice_desc"] ||
                  "The SQL export includes table data for wp_posts, wp_postmeta, wp_terms, wp_term_taxonomy, wp_comments, and wp_options formatted with valid PostgreSQL INSERT statements."}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="border-t border-[#f0f0f1] pt-5 flex items-center justify-between">
        <button
          type="button"
          disabled={isExporting}
          onClick={handleDownload}
          className="inline-flex items-center gap-2 rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-5 py-2 text-[13px] font-medium text-white hover:bg-[#135e96] transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
        >
          {isExporting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {dict["admin.tools.generating_export"] || "Generating Export..."}
            </>
          ) : (
            <>
              <Download className="size-4" />
              {dict["admin.tools.download_export_file"] || "Download Export File"}
            </>
          )}
        </button>

        <span className="text-[12px] text-[#646970]">
          {format === "xml" && (dict["admin.tools.xml_tip"] || "Produces .xml file")}
          {format === "sql" && (dict["admin.tools.sql_tip"] || "Produces .sql file")}
          {format === "json" && (dict["admin.tools.json_tip"] || "Produces .json file")}
        </span>
      </div>
    </div>
  );
}
