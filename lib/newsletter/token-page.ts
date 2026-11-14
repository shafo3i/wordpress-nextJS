import { getEmailLanguage } from "@/lib/email-language"
import { escapeMediaHtml as escape } from "@/lib/post-media"
export async function newsletterTokenPage(
  request: Request,
  actionKey: string,
  resultKey?: string,
  status = 200
) {
  const url = new URL(request.url)
  const language = await getEmailLanguage({
    locale: url.searchParams.get("lang") || undefined,
    request,
  })
  const title = language.dict[resultKey || actionKey] || ""
  // GET never mutates a subscription: mail link scanners must not confirm/unsubscribe.
  return new Response(
    `<!doctype html><html lang="${escape(language.code)}" dir="${language.direction}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title><body><main><h1>${escape(title)}</h1>${resultKey ? "" : `<form method="post"><button type="submit">${escape(language.dict[actionKey] || "")}</button></form>`}</main></body></html>`,
    {
      status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        // Keep the form POST's same-origin Origin header. no-referrer makes it
        // opaque ("null") in browsers and the CSRF origin guard rejects it.
        // Cross-origin destinations still receive no referrer/token URL.
        "Referrer-Policy": "same-origin",
        "Content-Security-Policy":
          "default-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
        "X-Content-Type-Options": "nosniff",
        "Cross-Origin-Opener-Policy": "same-origin",
        "X-Frame-Options": "DENY",
        "X-Robots-Tag": "noindex, nofollow",
      },
    }
  )
}
