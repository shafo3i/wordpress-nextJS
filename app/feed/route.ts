import { NextRequest, NextResponse } from "next/server";
import { generateRssFeed } from "@/services/feed.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const category = request.nextUrl.searchParams.get("category") || undefined;
    const xml = await generateRssFeed(category);
    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=7200",
      },
    });
  } catch (error: any) {
    console.error("RSS feed error:", error);
    return new NextResponse("Error generating RSS feed", { status: 500 });
  }
}
