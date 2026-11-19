import { NextResponse, type NextRequest } from "next/server"
import { buildReportOnlyCsp, createCspNonce, isCspPagePath } from "@/lib/security/csp"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const next = () => {
    const headers = new Headers(request.headers)
    // Never let callers select a nonce or override Next's internal CSP input.
    headers.delete("x-nonce")
    headers.delete("content-security-policy")
    headers.delete("content-security-policy-report-only")
    const nonce = isCspPagePath(pathname) ? createCspNonce() : undefined
    const policy = nonce ? buildReportOnlyCsp(nonce, process.env.NODE_ENV === "development") : undefined
    if (nonce && policy) {
      headers.set("x-nonce", nonce)
      // Request-side CSP lets Next attach this nonce to its bootstrap/stream scripts.
      // This is internal renderer input, not an enforcing browser response header.
      headers.set("content-security-policy", policy)
    }
    headers.set("x-cms-pathname", pathname)
    const hint =
      request.nextUrl.searchParams.get("lang") || pathname.split("/")[1] || ""
    headers.set(
      "x-cms-locale",
      /^[a-z]{2,3}(?:-[a-z0-9]{2,8}){0,2}$/i.test(hint) ? hint : ""
    )
    const callback = request.nextUrl.searchParams.get("callbackUrl") || ""
    const callbackSegment = callback.split("/")[1] || ""
    headers.set(
      "x-cms-callback-locale",
      callback.startsWith("/") &&
        !callback.startsWith("//") &&
        !callback.startsWith("/admincp")
        ? /^[a-z]{2,3}(?:-[a-z0-9]{2,8}){0,2}$/i.test(callbackSegment)
          ? callbackSegment
          : "default"
        : ""
    )
    const response = NextResponse.next({ request: { headers } })
    if (policy) {
      response.headers.set("Content-Security-Policy-Report-Only", policy)
      // A nonce-bearing document and its policy must never be shared between visitors.
      response.headers.set("Cache-Control", "private, no-store, max-age=0")
    }
    // Remember explicit public language navigation, independently of admin_lang.
    const segment = pathname.split("/")[1] || ""
    const authPath =
      /^\/(?:cms-login|cms-admin|forgot-password|password-reset|magic-link|email-otp|verify-email|email-verified|verify-2fa)(?:\/|$)/.test(
        pathname
      )
    const publicCode = request.nextUrl.searchParams.get("lang") || segment
    if (
      !pathname.startsWith("/admincp") &&
      !pathname.startsWith("/api") &&
      !pathname.startsWith("/_next") &&
      !pathname.startsWith("/uploads")
    ) {
      if (
        /^[a-z]{2,3}(?:-[a-z0-9]{2,8}){0,2}$/i.test(publicCode) &&
        (request.nextUrl.searchParams.has("lang") ||
          (!authPath && /^[a-z]{2,3}(?:-|$)/i.test(segment)))
      ) {
        response.cookies.set("site_lang", publicCode, {
          path: "/",
          sameSite: "lax",
          httpOnly: true,
          secure: request.nextUrl.protocol === "https:",
          maxAge: 31536000,
        })
      } else if (pathname === "/") {
        response.cookies.delete("site_lang")
      }
    }
    return response
  }

  // Skip static assets, API endpoints, admin panel, feeds, and files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/admincp") ||
    pathname.startsWith("/uploads") ||
    pathname.startsWith("/feed") ||
    pathname.startsWith("/sitemap") ||
    /(?:^|\/)opengraph-image(?:\/|$)/.test(pathname) ||
    pathname.includes(".")
  ) {
    return next()
  }

  // Fast 301/302 redirect lookup
  try {
    const checkUrl = new URL("/api/redirects/check", request.url)
    checkUrl.searchParams.set("path", pathname)

    const res = await fetch(checkUrl.toString(), {
      cache: "no-store",
    })

    if (res.ok) {
      const data = await res.json()
      if (data.matched && data.targetUrl) {
        const target =
          data.targetUrl.startsWith("http://") ||
          data.targetUrl.startsWith("https://")
            ? data.targetUrl
            : new URL(data.targetUrl, request.url).toString()

        return NextResponse.redirect(
          target,
          data.statusCode === 302 ? 302 : 301
        )
      }
    }
  } catch {
    // Non-blocking fallback
  }

  return next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
