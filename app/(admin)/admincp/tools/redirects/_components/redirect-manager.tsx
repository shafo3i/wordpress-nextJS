"use client";

import { useState } from "react";
import { Plus, Trash2, ExternalLink, RefreshCw, AlertCircle, CheckCircle, Search, Link as LinkIcon } from "lucide-react";
import type { RedirectItem } from "@/services/redirect.service";
import { createRedirectAction, deleteRedirectAction, fetchRedirectsAction } from "../actions";

interface RedirectManagerProps {
  initialRedirects: RedirectItem[];
  dict: Record<string, string>;
}

export function RedirectManager({ initialRedirects, dict }: RedirectManagerProps) {
  const [redirects, setRedirects] = useState<RedirectItem[]>(initialRedirects);
  const [searchTerm, setSearchTerm] = useState("");
  const [sourcePath, setSourcePath] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [statusCode, setStatusCode] = useState<"301" | "302">("301");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAddRedirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourcePath.trim() || !targetUrl.trim()) {
      setError(dict["admin.tools.redirect_required"] || "Both source path and target URL are required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await createRedirectAction({
        sourcePath,
        targetUrl,
        statusCode: Number(statusCode) as 301 | 302,
        notes,
      });

      if (!res.success) {
        throw new Error(res.error || "Failed to create redirect.");
      }

      const fresh = await fetchRedirectsAction();
      if (fresh.success && fresh.redirects) {
        setRedirects(fresh.redirects);
      }
      setSourcePath("");
      setTargetUrl("");
      setNotes("");
      setSuccess(dict["admin.tools.redirect_created"] || "Redirect created successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to add redirect.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(dict["admin.tools.confirm_delete_redirect"] || "Are you sure you want to delete this redirect?")) {
      return;
    }

    try {
      const res = await deleteRedirectAction(id);
      if (res.success) {
        const fresh = await fetchRedirectsAction();
        if (fresh.success && fresh.redirects) {
          setRedirects(fresh.redirects);
        }
      }
    } catch {
      // ignore
    }
  };

  const filtered = redirects.filter(
    (r) =>
      r.sourcePath.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.targetUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.notes && r.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Create Redirect Box */}
      <form
        onSubmit={handleAddRedirect}
        className="rounded-[3px] border border-[#dcdcde] bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.04)] space-y-4"
      >
        <div>
          <h2 className="text-[16px] font-semibold text-[#1d2327]">
            {dict["admin.tools.add_redirect_title"] || "Add New 301/302 Redirect"}
          </h2>
          <p className="text-[13px] text-[#50575e] mt-0.5">
            {dict["admin.tools.add_redirect_desc"] ||
              "Set up a URL redirect to prevent 404 errors when articles move or old URLs change."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4">
            <label className="block text-[12px] font-semibold text-[#1d2327] mb-1">
              {dict["admin.tools.source_url"] || "Source Path (Relative)"}
            </label>
            <input
              type="text"
              required
              value={sourcePath}
              onChange={(e) => setSourcePath(e.target.value)}
              placeholder="/old-news-story-2024"
              className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-3 py-1.5 text-[13px] text-[#2c3338] focus:border-[#2271b1] focus:outline-none font-mono"
            />
          </div>

          <div className="md:col-span-4">
            <label className="block text-[12px] font-semibold text-[#1d2327] mb-1">
              {dict["admin.tools.target_url"] || "Target URL"}
            </label>
            <input
              type="text"
              required
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="/posts/new-news-story"
              className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-3 py-1.5 text-[13px] text-[#2c3338] focus:border-[#2271b1] focus:outline-none font-mono"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[12px] font-semibold text-[#1d2327] mb-1">
              {dict["admin.tools.status_code"] || "Redirect Type"}
            </label>
            <select
              value={statusCode}
              onChange={(e) => setStatusCode(e.target.value as any)}
              className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-2.5 py-1.5 text-[13px] text-[#2c3338] focus:border-[#2271b1] focus:outline-none"
            >
              <option value="301">301 (Permanent)</option>
              <option value="302">302 (Temporary)</option>
            </select>
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-4 py-1.5 text-[13px] font-medium text-white hover:bg-[#135e96] transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Plus className="size-4" />
              {dict["admin.tools.add_redirect_btn"] || "Add Redirect"}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-[3px] bg-[#fcf0f1] border border-[#d63638] p-3 text-[13px] text-[#d63638]">
            <AlertCircle className="size-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-[3px] bg-[#edfaef] border border-[#00a32a] p-3 text-[13px] text-[#00a32a]">
            <CheckCircle className="size-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}
      </form>

      {/* Redirects Table */}
      <div className="rounded-[3px] border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="border-b border-[#c3c4c7] bg-[#f6f7f7] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <LinkIcon className="size-4 text-[#2271b1]" />
            <span className="text-[14px] font-semibold text-[#1d2327]">
              {dict["admin.tools.active_redirects"] || "Active 301/302 Redirects"} ({redirects.length})
            </span>
          </div>

          <div className="relative w-64">
            <Search className="size-3.5 text-[#646970] absolute left-2.5 rtl:left-auto rtl:right-2.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={dict["admin.common.search"] || "Search redirects..."}
              className="w-full rounded-[3px] border border-[#8c8f94] bg-white pl-8 pr-3 rtl:pl-3 rtl:pr-8 py-1 text-[12px] text-[#2c3338] focus:border-[#2271b1] focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-[#646970]">
              {dict["admin.tools.no_redirects"] || "No active redirects found. Create one using the form above."}
            </div>
          ) : (
            <table className="w-full text-start text-[13px] border-collapse">
              <thead className="bg-[#f6f7f7] text-[#1d2327] border-b border-[#dcdcde]">
                <tr>
                  <th className="p-3 text-start font-semibold">{dict["admin.tools.source_url"] || "Source Path"}</th>
                  <th className="p-3 text-start font-semibold">{dict["admin.tools.target_url"] || "Target URL"}</th>
                  <th className="p-3 text-start font-semibold">{dict["admin.tools.type"] || "Type"}</th>
                  <th className="p-3 text-start font-semibold">{dict["admin.tools.hits"] || "Hits"}</th>
                  <th className="p-3 text-start font-semibold">{dict["admin.tools.actions"] || "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f1]">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-[#f6f7f7]/60">
                    <td className="p-3 font-mono text-[#2271b1] font-medium max-w-xs truncate">
                      {item.sourcePath}
                    </td>
                    <td className="p-3 font-mono text-[#50575e] max-w-xs truncate">
                      {item.targetUrl}
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                          item.statusCode === 301
                            ? "bg-[#edfaef] text-[#00a32a] border-[#b2e2bd]"
                            : "bg-[#f0f6fc] text-[#2271b1] border-[#c5d9ed]"
                        }`}
                      >
                        {item.statusCode}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-[#1d2327]">
                      {item.hits}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <a
                          href={item.sourcePath}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[12px] text-[#2271b1] hover:underline"
                        >
                          <ExternalLink className="size-3" />
                          {dict["admin.tools.test"] || "Test"}
                        </a>
                        <span className="text-[#c3c4c7]">|</span>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="inline-flex items-center gap-1 text-[12px] text-[#d63638] hover:underline cursor-pointer"
                        >
                          <Trash2 className="size-3" />
                          {dict["admin.common.delete"] || "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
