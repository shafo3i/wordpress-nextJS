import { NextResponse } from "next/server";
import { generateNewsSitemapXml } from "@/services/sitemap.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const xml = await generateNewsSitemapXml();
    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
      },
    });
  } catch (error: any) {
    console.error("News sitemap generation error:", error);
    return new NextResponse("Error generating Google News sitemap", { status: 500 });
  }
}
