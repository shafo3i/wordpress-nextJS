"use client";

import React, { useState } from "react";
import { Sparkles, CheckCircle2 } from "lucide-react";
import manifest from "./widget.json";
import type { WidgetModule, WidgetAdminFormProps, WidgetRenderProps } from "../types";

export function NewsletterAdminForm({ item, onChange, dict }: WidgetAdminFormProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-[12px] font-medium text-[#50575e] mb-1">
          {dict?.["admin.widgets.widget_title"] || "Widget Title"}
        </label>
        <input
          type="text"
          value={item.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-[12px] font-medium text-[#50575e] mb-1">
          Subscription Prompt Message
        </label>
        <textarea
          rows={3}
          value={item.content || ""}
          onChange={(e) => onChange({ content: e.target.value })}
          className="w-full rounded-[3px] border border-[#8c8f94] bg-white p-2 text-[12px] text-[#2c3338]"
        />
      </div>
    </div>
  );
}

export function NewsletterRender({ item, theme }: WidgetRenderProps) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  return (
    <div className="rounded-xl border border-purple-200 dark:border-purple-900/60 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-900 dark:to-purple-950/40 p-4 shadow-sm">
      <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-400 text-xs font-bold uppercase tracking-wider mb-1.5">
        <Sparkles className="size-3.5" />
        <span>{item.title}</span>
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
        {item.content || "Receive top investigative stories and digital market briefings directly in your inbox."}
      </p>
      {subscribed ? (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 p-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="size-4 text-emerald-600" />
          <span>Subscribed! Check your inbox.</span>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (email) setSubscribed(true);
          }}
          className="space-y-2"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@domain.com"
            required
            className="w-full rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
          />
          <button
            type="submit"
            style={{ backgroundColor: theme?.primaryColor || "#7c3aed" }}
            className="w-full rounded-lg py-1.5 text-xs font-bold text-white hover:opacity-90 transition-opacity"
          >
            Subscribe Free
          </button>
        </form>
      )}
    </div>
  );
}

export const newsletterWidgetModule: WidgetModule = {
  manifest: manifest as any,
  AdminForm: NewsletterAdminForm,
  render: NewsletterRender,
};

export default newsletterWidgetModule;
