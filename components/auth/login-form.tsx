"use client";

import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginFormProps = {
  accountType: "admin" | "user";
  redirectTo: string;
};

export function LoginForm({ accountType, redirectTo }: LoginFormProps) {
  const [email, setEmail] = useState(accountType === "admin" ? "admin@pressforge.local" : "");
  const [password, setPassword] = useState(accountType === "admin" ? "Admin123456!" : "");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    const result = await authClient.signIn.email({
      email,
      password,
      callbackURL: redirectTo,
    });

    if (result.error) {
      setErrorMessage(result.error.message ?? "Unable to sign in.");
      setIsSubmitting(false);
      return;
    }

    window.location.assign(redirectTo);
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {accountType === "admin" && (
        <div className="rounded border border-amber-200 bg-amber-50/90 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold uppercase tracking-wider text-[10px] text-amber-800 dark:text-amber-300">
              Default Administrator Credentials
            </span>
            <button
              type="button"
              onClick={() => {
                setEmail("admin@pressforge.local");
                setPassword("Admin123456!");
              }}
              className="text-[11px] font-semibold text-[#2271b1] hover:underline"
            >
              Fill Credentials
            </button>
          </div>
          <div className="font-mono text-[11px] space-y-0.5 text-slate-700 dark:text-slate-300">
            <div>Email: <span className="font-bold text-[#1d2327] dark:text-white">admin@pressforge.local</span></div>
            <div>Password: <span className="font-bold text-[#1d2327] dark:text-white">Admin123456!</span></div>
          </div>
        </div>
      )}
      <div className="space-y-1">
        <Label htmlFor={`${accountType}-email`}>
          Email address
        </Label>
        <Input
          id={`${accountType}-email`}
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${accountType}-password`}>
          Password
        </Label>
        <Input
          id={`${accountType}-password`}
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </div>
      {errorMessage ? (
        <p className="border border-destructive px-3 py-2 text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <Button className="w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
