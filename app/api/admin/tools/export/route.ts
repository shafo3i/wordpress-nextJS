import { NextRequest, NextResponse } from "next/server";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import {
  exportWxrXml,
  exportSqlDump,
  exportJsonArchive,
  ExportFilters,
} from "@/services/export.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await verifyAdminOrEditor();

    const searchParams = request.nextUrl.searchParams;
    const format = (searchParams.get("format") || "xml").toLowerCase();
    const content = (searchParams.get("content") || "all") as ExportFilters["content"];
    const status = searchParams.get("status") || "all";
    const authorId = searchParams.get("authorId") || "all";
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const filters: ExportFilters = {
      format: format as any,
      content,
      status,
      authorId,
      startDate,
      endDate,
    };

    const dateStamp = new Date().toISOString().slice(0, 10);
    let output = "";
    let contentType = "text/plain";
    let filename = `pressforge-export-${dateStamp}.txt`;

    if (format === "sql") {
      output = await exportSqlDump();
      contentType = "application/sql; charset=utf-8";
      filename = `pressforge-backup-${dateStamp}.sql`;
    } else if (format === "json") {
      output = await exportJsonArchive();
      contentType = "application/json; charset=utf-8";
      filename = `pressforge-archive-${dateStamp}.json`;
    } else {
      // default: WordPress WXR XML
      output = await exportWxrXml(filters);
      contentType = "application/xml; charset=utf-8";
      filename = `pressforge-wxr-${content || "all"}-${dateStamp}.xml`;
    }

    return new NextResponse(output, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate export file" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
