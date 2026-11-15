import { rateLimitResponse } from "@/lib/rate-limit"
import { NextRequest, NextResponse } from "next/server"
import { unstable_rethrow } from "next/navigation"
import { verifyAdmin } from "@/lib/authMIddleware"
import { exportFiltersSchema } from "@/db/schema/cms-tools"
import {
  exportWxrXml,
  exportSqlDump,
  exportJsonArchive,
} from "@/services/export.service"
import { getAdminLanguageContext } from "@/components/admin/admin-shell"
export const dynamic = "force-dynamic"
export async function GET(request: NextRequest) {
  await verifyAdmin()
  const parsed = exportFiltersSchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams)
  )
  if (!parsed.success)
    return NextResponse.json(
      { error: "invalid_export_filters" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    )
  try {
    const filters = parsed.data,
      date = new Date().toISOString().slice(0, 10)
    const output =
      filters.format === "sql"
        ? await exportSqlDump()
        : filters.format === "json"
          ? await exportJsonArchive(filters)
          : await exportWxrXml(filters)
    return new NextResponse(output, {
      headers: {
        "Content-Type":
          filters.format === "sql"
            ? "application/sql; charset=utf-8"
            : filters.format === "json"
              ? "application/json; charset=utf-8"
              : "application/xml; charset=utf-8",
        "Content-Disposition": `attachment; filename="pressforge-content-${date}.${filters.format}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    })
  } catch (error) {
    const limited = rateLimitResponse(error)
    if (limited) return limited
    unstable_rethrow(error)
    const { dict } = await getAdminLanguageContext()
    return NextResponse.json(
      { error: dict["admin.tools.error.failed"] || "" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    )
  }
}
export async function POST(request: NextRequest) {
  return GET(request)
}
