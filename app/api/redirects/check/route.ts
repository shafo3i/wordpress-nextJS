import { NextRequest, NextResponse } from "next/server";
import { findMatchingRedirect, recordRedirectHit } from "@/services/redirect.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const path = request.nextUrl.searchParams.get("path");
    if (!path) {
      return NextResponse.json({ matched: false });
    }

    const matched = await findMatchingRedirect(path);
    if (matched) {
      // Record hit asynchronously
      recordRedirectHit(matched.id).catch(() => {});
      return NextResponse.json({
        matched: true,
        targetUrl: matched.targetUrl,
        statusCode: matched.statusCode,
      });
    }

    return NextResponse.json({ matched: false });
  } catch (error: any) {
    return NextResponse.json({ matched: false, error: error.message });
  }
}
