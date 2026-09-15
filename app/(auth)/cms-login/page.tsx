import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";

export default function UserLoginPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted px-4 py-8">
      <section className="w-full max-w-sm border border-border bg-background p-6 shadow-sm">
        <header className="mb-6 border-b border-border pb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Site Account
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Access your account and content tools.
          </p>
        </header>
        <LoginForm accountType="user" redirectTo="/" />
        <p className="mt-5 border-t border-border pt-4 text-center text-sm text-muted-foreground">
          New to this site?{" "}
          <Link className="font-medium text-primary underline underline-offset-4" href="/cms-login/signup">
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}
