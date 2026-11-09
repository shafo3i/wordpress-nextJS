"use client"

import { FormEvent, useState } from "react"
import { authFlowUrl } from "@/lib/auth-navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function SignupForm({
  dict,
  locale,
  callbackUrl = "/",
}: {
  dict: Record<string, string>
  locale?: string
  callbackUrl?: string
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage("")
    setIsSubmitting(true)

    try {
      const result = await authClient.signUp.email({
        name,
        email,
        password,
        callbackURL: authFlowUrl(
          "/email-verified",
          callbackUrl,
          "/cms-login",
          locale
        ),
      })

      if (result.error) {
        setErrorMessage(dict["auth.requestError"])
        return
      }

      setSuccess(true)
      setPassword("")
    } catch {
      setErrorMessage(dict["auth.requestError"])
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {success && (
        <p
          role="status"
          className="border-s-4 border-green-600 bg-green-50 p-3 text-sm"
        >
          {dict["auth.emailSent"]}
        </p>
      )}
      <div className="space-y-1">
        <Label htmlFor="signup-name">{dict["auth.name"]}</Label>
        <Input
          id="signup-name"
          name="name"
          onChange={(event) => setName(event.target.value)}
          required
          type="text"
          value={name}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="signup-email">{dict["auth.email"]}</Label>
        <Input
          id="signup-email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="signup-password">{dict["auth.password"]}</Label>
        <Input
          id="signup-password"
          minLength={8}
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </div>
      {errorMessage ? (
        <p
          className="border border-destructive px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}
      <Button
        className="w-full"
        disabled={isSubmitting || success}
        type="submit"
      >
        {dict[isSubmitting ? "auth.working" : "auth.signup"]}
      </Button>
    </form>
  )
}
