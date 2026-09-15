"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTag } from "@/app/(admin)/admincp/tags/actions";

export function TagAddForm({ onCreated }: { onCreated?: () => void }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!name.trim()) {
      setErrorMessage("Please enter a tag name.");
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("name", name.trim());
        formData.set("slug", slug.trim());
        formData.set("description", description.trim());

        await createTag(formData);
        setName("");
        setSlug("");
        setDescription("");
        onCreated?.();
        router.refresh();
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : "Failed to create tag.");
      }
    });
  };

  return (
    <div className="text-[13px] text-[#2c3338]">
      <h2 className="mb-3 text-[14px] font-semibold text-[#1d2327]">
        Add New Tag
      </h2>

      {errorMessage && (
        <div className="mb-3 rounded border border-[#d63638] bg-[#fcf0f1] px-3 py-1.5 text-xs text-[#d63638]">
          {errorMessage}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#1d2327]">
            Name
          </label>
          <input
            className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
            onChange={(e) => setName(e.target.value)}
            required
            type="text"
            value={name}
          />
          <p className="mt-1 text-[11px] text-[#646970]">
            The name is how it appears on your site.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#1d2327]">
            Slug
          </label>
          <input
            className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
            onChange={(e) => setSlug(e.target.value)}
            type="text"
            value={slug}
          />
          <p className="mt-1 text-[11px] text-[#646970]">
            The “slug” is the URL-friendly version of the name. It is usually all
            lowercase and contains only letters, numbers, and hyphens.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#1d2327]">
            Description
          </label>
          <textarea
            className="w-full rounded-[3px] border border-[#8c8f94] bg-white p-2 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1]"
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            value={description}
          />
          <p className="mt-1 text-[11px] text-[#646970]">
            The description is not prominent by default; however, some themes may show
            it.
          </p>
        </div>

        <div>
          <button
            className="inline-flex items-center rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-4 py-1.5 text-[13px] font-medium text-white shadow-[0_1px_0_#135e96] hover:border-[#135e96] hover:bg-[#135e96] disabled:opacity-50"
            disabled={isPending}
            type="submit"
          >
            {isPending ? "Adding..." : "Add New Tag"}
          </button>
        </div>
      </form>
    </div>
  );
}
