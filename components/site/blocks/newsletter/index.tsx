"use client";

import React, { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import { DEFAULT_THEME } from "@/components/site/utils";

/**
 * 13. NEWSLETTER SUBSCRIPTION STRIP
 */
export function NewsletterBlock({
  title,
  theme = DEFAULT_THEME,
}: {
  title: string;
  theme?: FrontEndThemeContext;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "homepage_block" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubscribed(true);
      } else {
        setError(data.error || "Subscription failed. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="theme-widget rounded-2xl border border-[var(--theme-widget-border,var(--theme-border))] bg-[var(--theme-widget-bg,var(--theme-surface))] text-[var(--theme-widget-text,var(--theme-text))] p-8 shadow-sm text-center">
      <span className="text-2xl">✉️</span>
      <h3 className="theme-widget-title text-2xl font-bold font-serif text-[var(--theme-widget-title-color,var(--theme-heading))] mt-2 mb-1">{title}</h3>
      <p className="text-xs text-[var(--theme-muted)] max-w-lg mx-auto mb-5 leading-relaxed">
        Delivering essential morning intelligence, editorial analysis, and business reports straight to your inbox before markets open.
      </p>

      {subscribed ? (
        <div className="max-w-md mx-auto flex items-center justify-center gap-2 rounded-xl bg-theme-success/10 border border-theme-success/30 p-3.5 text-xs font-semibold text-theme-success">
          <CheckCircle2 className="size-4 text-theme-success" />
          <span>Subscribed successfully! Thank you for joining our daily briefing.</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="px-4 py-2 text-xs theme-input rounded text-[var(--theme-text)] focus:outline-none focus:border-[var(--theme-primary)] flex-1 placeholder:opacity-60"
          />
          <button
            type="submit"
            disabled={loading}
            className="theme-btn px-5 py-2 text-xs font-bold  rounded hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : "Subscribe"}
          </button>
        </form>
      )}

      {error && <p className="text-xs text-theme-danger mt-2">{error}</p>}
    </section>
  );
}
