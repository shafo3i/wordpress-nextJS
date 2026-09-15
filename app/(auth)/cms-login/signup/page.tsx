import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";

export default function UserSignupPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted px-4 py-8">
      <section className="w-full max-w-sm border border-border bg-background p-6 shadow-sm">
        <header className="mb-6 border-b border-border pb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Site Account
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Create account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create an account to participate on this site.
          </p>
        </header>
        <SignupForm />
        <p className="mt-5 border-t border-border pt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link className="font-medium text-primary underline underline-offset-4" href="/cms-login">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
