"use client"
import { useEffect, useState } from "react"
import {
  SESSION_CHECK_INTERVAL_MS,
  SESSION_ACTIVITY_WINDOW_MS,
} from "@/lib/session-policy"
import { authFlowUrl } from "@/lib/auth-navigation"

export function AdminSessionMonitor({
  userId,
  dict,
}: {
  userId: string
  dict: Record<string, string>
}) {
  const [status, setStatus] = useState<"valid" | "expired" | "changed">("valid")
  const [loginUrl, setLoginUrl] = useState("/cms-admin")
  useEffect(() => {
    let lastActivity = Date.now(),
      busy = false,
      cancelled = false
    const activity = () => {
      lastActivity = Date.now()
    }
    const check = async () => {
      if (
        busy ||
        document.hidden ||
        Date.now() - lastActivity > SESSION_ACTIVITY_WINDOW_MS
      )
        return
      busy = true
      try {
        const response = await fetch("/api/auth/get-session", {
          credentials: "same-origin",
          cache: "no-store",
        })
        if (!response.ok && response.status !== 401) return
        const data = await response.json()
        if (!cancelled) {
          setStatus(
            !data?.user?.id
              ? "expired"
              : data.user.id !== userId
                ? "changed"
                : "valid"
          )
          setLoginUrl(
            authFlowUrl(
              "/cms-admin",
              location.pathname + location.search,
              "/cms-admin",
              document.documentElement.lang
            )
          )
        }
      } catch {
        /* A network failure is not proof that a session has expired. */
      } finally {
        busy = false
      }
    }
    const focus = () => {
      activity()
      void check()
    }
    for (const event of ["keydown", "pointerdown", "scroll"])
      window.addEventListener(event, activity, { passive: true })
    window.addEventListener("focus", focus)
    const timer = window.setInterval(check, SESSION_CHECK_INTERVAL_MS)
    void check()
    return () => {
      cancelled = true
      clearInterval(timer)
      for (const event of ["keydown", "pointerdown", "scroll"])
        window.removeEventListener(event, activity)
      window.removeEventListener("focus", focus)
    }
  }, [userId])
  if (status === "valid") return null
  return (
    <div
      role="alert"
      className="border-s-4 border-[#dba617] bg-[#fcf9e8] p-3 text-[13px] text-[#1d2327]"
    >
      {dict[`admin.session.${status}`]}{" "}
      <a
        href={loginUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#2271b1] underline"
      >
        {dict["admin.session.sign_in"]}
      </a>
    </div>
  )
}
