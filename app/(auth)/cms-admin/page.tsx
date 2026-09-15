import Link from "next/link";
import { ShieldCheck, Newspaper, ArrowLeft } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-[#f0f0f1] px-4 py-8 text-[#2c3338]">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-[#1d2327] text-white shadow-md">
          <Newspaper className="size-6 text-[#2271b1]" />
        </div>
        <h2 className="text-xl font-black uppercase tracking-tight text-[#1d2327]">
          PressForge Newsroom
        </h2>
        <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          <ShieldCheck className="size-3.5 text-emerald-600" /> Administrative Console
        </span>
      </div>

      <section className="w-full max-w-sm rounded-[3px] border border-[#c3c4c7] bg-white p-6 shadow-sm">
        <header className="mb-5 border-b border-[#dcdcde] pb-3">
          <h1 className="text-lg font-bold text-[#1d2327]">Sign In to AdminCP</h1>
          <p className="mt-0.5 text-xs text-[#646970]">
            Enter your credentials to access editorial and system controls.
          </p>
        </header>

        <LoginForm accountType="admin" redirectTo="/admincp" />

        <div className="mt-5 border-t border-[#dcdcde] pt-3 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#2271b1] hover:text-[#135e96] hover:underline"
          >
            <ArrowLeft className="size-3" /> Back to Publication
          </Link>
        </div>
      </section>
    </main>
  );
}
