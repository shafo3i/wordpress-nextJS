import { auth } from "@/auth"; // path to your auth file
import { toNextJsHandler } from "better-auth/next-js";

const handlers = toNextJsHandler(auth);

async function handle(request: Request, method: "GET" | "POST") {
  let path: string;
  try { path = decodeURIComponent(new URL(request.url).pathname).replace(/\/+/g, "/"); }
  catch { return Response.json({ error: "BAD_REQUEST" }, { status: 400 }); }
  // The CMS owns user-management invariants (role validation, MFA preservation,
  // self/last-admin protection and session revocation). The plugin's generic
  // admin HTTP endpoints must not provide a second way around those checks.
  if (/^\/api\/auth\/admin(?:\/|$)/.test(path)) {
    return Response.json({ error: "FORBIDDEN" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }
  return handlers[method](request);
}
export async function GET(request: Request) { return handle(request, "GET"); }
export async function POST(request: Request) { return handle(request, "POST"); }
