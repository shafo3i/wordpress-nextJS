"use client";

export function ThemePreviewVisual({ slug }: { slug: string }) {
  switch (slug) {
    case "pressforge-midnight":
    case "ledger-dark":
      return (
        <div className="flex h-44 w-full flex-col justify-between bg-[#0a0f1d] p-4 text-slate-200 select-none">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-mono text-xs font-bold tracking-widest text-emerald-400">
              TERMINAL // MIDNIGHT
            </span>
            <span className="rounded bg-emerald-950 px-1.5 py-0.5 text-[9px] font-mono text-emerald-300">
              LIVE ED.
            </span>
          </div>
          <div className="my-auto space-y-2">
            <div className="h-4 w-3/4 rounded bg-slate-800"></div>
            <div className="h-2 w-full rounded bg-slate-850 bg-slate-800/60"></div>
            <div className="h-2 w-5/6 rounded bg-slate-850 bg-slate-800/60"></div>
          </div>
          <div className="flex justify-between border-t border-slate-800 pt-1.5 text-[10px] text-slate-500">
            <span>● Nightly Wire</span>
            <span>● High-Velocity Desk</span>
          </div>
        </div>
      );

    case "pressforge-longform":
    case "ledger-reader":
      return (
        <div className="flex h-44 w-full flex-col justify-between bg-[#fbf9f5] p-4 text-stone-900 select-none">
          <div className="border-b border-amber-200/60 pb-2 text-center">
            <span className="font-serif text-sm font-semibold tracking-wide text-stone-800">
              The Reader Review
            </span>
            <p className="text-[9px] text-stone-400">Focus & Distraction-Free</p>
          </div>
          <div className="my-auto max-w-xs space-y-2 text-center">
            <div className="mx-auto h-4 w-5/6 rounded bg-stone-300/80"></div>
            <div className="mx-auto h-2 w-full rounded bg-stone-200"></div>
            <div className="mx-auto h-2 w-4/5 rounded bg-stone-200"></div>
          </div>
          <div className="flex justify-between border-t border-amber-200/40 pt-1 text-[10px] text-stone-500">
            <span>Investigative</span>
            <span>Single-Column</span>
          </div>
        </div>
      );

    case "pressforge-magazine":
    case "ledger-magazine":
      return (
        <div className="flex h-44 w-full flex-col justify-between bg-white p-3 text-slate-900 select-none">
          <div className="flex items-center justify-between border-b border-rose-200 pb-1.5">
            <span className="font-black text-xs uppercase tracking-tighter text-rose-600">
              MAGAZINE 24/7
            </span>
            <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-800">
              TRENDING
            </span>
          </div>
          <div className="my-auto grid grid-cols-2 gap-2">
            <div className="flex h-20 items-end rounded border border-rose-100 bg-rose-50 p-1.5">
              <div className="h-2 w-full rounded bg-rose-300"></div>
            </div>
            <div className="space-y-1.5 py-1">
              <div className="h-2.5 w-full rounded bg-slate-300"></div>
              <div className="h-2 w-5/6 rounded bg-slate-200"></div>
              <div className="h-2 w-4/6 rounded bg-slate-200"></div>
            </div>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-1 text-[10px] text-slate-400">
            <span>Bento Visuals</span>
            <span>Multimedia</span>
          </div>
        </div>
      );

    default: // pressforge-broadsheet / ledger-classic
      return (
        <div className="flex h-44 w-full flex-col justify-between bg-white p-4 text-slate-900 select-none">
          <div className="border-b-2 border-slate-900 pb-2 text-center">
            <span className="font-serif text-base font-bold tracking-tight text-slate-900">
              THE DAILY SIGNAL
            </span>
            <p className="text-[9px] uppercase tracking-widest text-slate-500">
              The Independent News Journal
            </p>
          </div>
          <div className="my-auto grid grid-cols-3 gap-2">
            <div className="col-span-2 space-y-1.5">
              <div className="h-3.5 w-full rounded bg-slate-800"></div>
              <div className="h-2 w-full rounded bg-slate-200"></div>
              <div className="h-2 w-4/5 rounded bg-slate-200"></div>
            </div>
            <div className="h-16 rounded border border-slate-200 bg-slate-100"></div>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-1 text-[10px] text-slate-500">
            <span>Front Page</span>
            <span>Editorial Desk</span>
          </div>
        </div>
      );
  }
}
