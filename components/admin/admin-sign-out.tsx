"use client"

import { useState } from "react"
import { LogOut } from "lucide-react"
import { authClient } from "@/lib/auth-client"

export function AdminSignOut({ dict }: { dict: Record<string, string> }) {
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)

  async function signOut() {
    if (pending) return
    setPending(true)
    setFailed(false)
    try {
      const result = await authClient.signOut()
      if (result.error) {
        setFailed(true)
        setPending(false)
        return
      }
      // Discard the authenticated router cache after the server revokes the session.
      window.location.replace("/cms-admin")
    } catch {
      setFailed(true)
      setPending(false)
    }
  }

  return (
    <>
      <button type="button" className="wp-admin-user-link" onClick={signOut} disabled={pending} aria-busy={pending}>
        <LogOut className="size-4" aria-hidden="true" />
        {dict["admin.menu.logout"]}
      </button>
      {failed && <span role="alert">{dict["admin.profile.signout_error"]}</span>}
    </>
  )
}
