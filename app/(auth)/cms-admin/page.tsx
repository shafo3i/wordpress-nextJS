import { LoginForm } from "@/components/auth/login-form";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted px-4 py-8">
      <section className="w-full max-w-sm border border-border bg-background p-6 shadow-sm">
        <header className="mb-6 border-b border-border pb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            CMS Administration
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Administrator access only.
          </p>
        </header>
        <LoginForm accountType="admin" redirectTo="/admincp" />
      </section>
    </main>
  );
}
