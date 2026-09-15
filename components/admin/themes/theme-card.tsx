"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Theme } from "@/lib/themes/types";
import { activateThemeAction } from "@/app/(admin)/admincp/themes/actions";

export function ThemeCard({ theme }: { theme: Theme }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleActivate = () => {
    startTransition(async () => {
      await activateThemeAction(theme.slug);
      router.refresh();
    });
  };

  // Theme screenshot mockup presets
  const renderThemePreview = () => {
    switch (theme.slug) {
      case "ledger-dark":
        return (
          <div className="flex h-44 w-full flex-col justify-between bg-slate-950 p-4 text-slate-200">
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <span className="font-mono text-xs font-bold tracking-widest text-emerald-400">LEDGER // DARK</span>
              <span className="text-[10px] text-slate-500 font-mono">LIVE ED.</span>
            </div>
            <div className="space-y-1.5 my-auto">
              <div className="h-3.5 w-3/4 rounded bg-slate-700"></div>
              <div className="h-2 w-full rounded bg-slate-800"></div>
              <div className="h-2 w-5/6 rounded bg-slate-800"></div>
            </div>
            <div className="flex gap-2 text-[10px] text-slate-500">
              <span>● Nightly News</span>
              <span>● Terminals</span>
            </div>
          </div>
        );
      case "ledger-reader":
        return (
          <div className="flex h-44 w-full flex-col justify-between bg-[#fdfbf7] p-4 text-slate-800">
            <div className="text-center border-b border-amber-100 pb-2">
              <span className="font-serif text-sm font-semibold tracking-wide text-stone-800">The Reader Review</span>
            </div>
            <div className="space-y-2 max-w-xs mx-auto my-auto text-center">
              <div className="h-4 w-5/6 mx-auto rounded bg-stone-300"></div>
              <div className="h-2 w-full rounded bg-stone-200"></div>
              <div className="h-2 w-4/5 mx-auto rounded bg-stone-200"></div>
            </div>
            <div className="text-center text-[10px] text-stone-400">
              Longform • Focus Mode
            </div>
          </div>
        );
      case "ledger-magazine":
        return (
          <div className="flex h-44 w-full flex-col justify-between bg-white p-3 text-slate-900">
            <div className="flex justify-between items-center border-b border-rose-200 pb-1.5">
              <span className="font-black text-xs uppercase tracking-tighter text-rose-600">MAGAZINE 24/7</span>
              <span className="bg-rose-100 text-rose-800 text-[9px] px-1.5 font-bold rounded">HOT</span>
            </div>
            <div className="grid grid-cols-2 gap-2 my-auto">
              <div className="h-20 bg-rose-50 rounded border border-rose-100 flex items-end p-1.5">
                <div className="h-2 w-full bg-rose-300 rounded"></div>
              </div>
              <div className="space-y-1.5 py-1">
                <div className="h-2.5 w-full bg-slate-300 rounded"></div>
                <div className="h-2 w-5/6 bg-slate-200 rounded"></div>
                <div className="h-2 w-4/6 bg-slate-200 rounded"></div>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 flex justify-between">
              <span>Multimedia</span>
              <span>Trending</span>
            </div>
          </div>
        );
      default: // ledger-classic
        return (
          <div className="flex h-44 w-full flex-col justify-between bg-white p-4 text-slate-900">
            <div className="text-center border-b-2 border-slate-900 pb-2">
              <span className="font-serif text-base font-bold tracking-tight text-slate-900">THE DAILY SIGNAL</span>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest">The Independent News Journal</p>
            </div>
            <div className="grid grid-cols-3 gap-2 my-auto">
              <div className="col-span-2 space-y-1.5">
                <div className="h-3.5 w-full rounded bg-slate-800"></div>
                <div className="h-2 w-full rounded bg-slate-200"></div>
                <div className="h-2 w-4/5 rounded bg-slate-200"></div>
              </div>
              <div className="h-16 bg-slate-100 rounded border border-slate-200"></div>
            </div>
            <div className="text-[10px] text-slate-500 flex justify-between border-t border-slate-100 pt-1">
              <span>Front Page</span>
              <span>Editorial Desk</span>
            </div>
          </div>
        );
    }
  };

  const isActive = Boolean(theme.isActive);

  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-[3px] border bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-md ${
        isActive ? "border-[#2271b1] ring-2 ring-[#2271b1]" : "border-[#dcdcde]"
      }`}
    >
      {/* Theme Screenshot Container */}
      <div className="relative border-b border-[#dcdcde]">
        {renderThemePreview()}

        {/* Hover Action Overlay for Inactive Themes */}
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 backdrop-blur-[1px] transition-opacity group-hover:opacity-100">
            <button
              type="button"
              disabled={isPending}
              onClick={handleActivate}
              className="rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-3.5 py-1.5 text-[13px] font-medium text-white shadow hover:bg-[#135e96] transition-colors disabled:opacity-50"
            >
              {isPending ? "Activating..." : "Activate"}
            </button>
            <Link
              href={`/admincp/customize?theme=${theme.slug}`}
              className="rounded-[3px] border border-white bg-white/95 px-3 py-1.5 text-[13px] font-medium text-[#2c3338] shadow hover:bg-white transition-colors"
            >
              Live Preview
            </Link>
          </div>
        )}
      </div>

      {/* Theme Details Bar */}
      <div className="p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-semibold text-[#1d2327]">
            {theme.name}
          </h3>
          <span className="text-[11px] text-[#646970]">v{theme.version}</span>
        </div>

        <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[#50575e]">
          {theme.description}
        </p>

        {/* Card Footer Bar */}
        <div className="mt-3 flex items-center justify-between border-t border-[#f0f0f1] pt-2.5">
          {isActive ? (
            <>
              <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#2271b1]">
                <span className="flex size-2 rounded-full bg-[#2271b1]"></span>
                <span>Active Theme</span>
              </div>
              <Link
                href="/admincp/customize"
                className="rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-3 py-1 text-[12px] font-medium text-white hover:bg-[#135e96] transition-colors"
              >
                Customize
              </Link>
            </>
          ) : (
            <>
              <span className="text-[11px] text-[#646970]">
                By {theme.author}
              </span>
              <button
                type="button"
                disabled={isPending}
                onClick={handleActivate}
                className="rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-2.5 py-1 text-[12px] font-medium text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78] transition-colors disabled:opacity-50"
              >
                {isPending ? "Activating..." : "Activate"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
