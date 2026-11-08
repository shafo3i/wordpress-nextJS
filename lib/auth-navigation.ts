/** Authentication redirects must remain on this application. */
export function safeAuthRedirect(value: unknown, fallback = "/"): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//")
  )
    return fallback
  try {
    const decoded = decodeURIComponent(value)
    if (decoded.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(decoded))
      return fallback
    const url = new URL(value, "https://auth.invalid")
    return url.origin === "https://auth.invalid"
      ? url.pathname + url.search + url.hash
      : fallback
  } catch {
    return fallback
  }
}

export function authFlowUrl(path: string, callbackUrl: string, login: string) {
  return `${path}?${new URLSearchParams({ callbackUrl: safeAuthRedirect(callbackUrl), login: login === "/cms-admin" ? login : "/cms-login" })}`
}

export function requiresTwoFactor(data: unknown): boolean {
  return (
    typeof data === "object" &&
    data !== null &&
    "twoFactorRedirect" in data &&
    data.twoFactorRedirect === true
  )
}
