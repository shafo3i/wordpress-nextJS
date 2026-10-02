import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets, API endpoints, admin panel, feeds, and files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/admincp") ||
    pathname.startsWith("/uploads") ||
    pathname.startsWith("/feed") ||
    pathname.startsWith("/sitemap") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Fast 301/302 redirect lookup
  try {
    const checkUrl = new URL("/api/redirects/check", request.url);
    checkUrl.searchParams.set("path", pathname);

    const res = await fetch(checkUrl.toString(), {
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      if (data.matched && data.targetUrl) {
        const target =
          data.targetUrl.startsWith("http://") || data.targetUrl.startsWith("https://")
            ? data.targetUrl
            : new URL(data.targetUrl, request.url).toString();

        return NextResponse.redirect(target, data.statusCode === 302 ? 302 : 301);
      }
    }
  } catch {
    // Non-blocking fallback
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
