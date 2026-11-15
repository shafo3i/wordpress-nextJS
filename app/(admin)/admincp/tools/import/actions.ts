"use server"
import { RateLimitError } from "@/lib/rate-limit";
import { unstable_rethrow } from "next/navigation"
import { getAdminLanguageContext } from "@/components/admin/admin-shell"

import { revalidatePath } from "next/cache"
import { verifyAdmin } from "@/lib/authMIddleware"
import {
  importWxrXml,
  importJsonArchive,
  type ImportResult,
} from "@/services/import.service"

export async function importFileAction(formData: FormData): Promise<{
  success: boolean
  type?: "xml" | "json"
  result?: ImportResult
  error?: string
}> {
  const session = await verifyAdmin()
  try {
    const file = formData.get("file")
    if (
      !(file instanceof File) ||
      file.size < 1 ||
      file.size > 20 * 1024 * 1024 ||
      !/\.(xml|json)$/i.test(file.name)
    ) {
      const { dict } = await getAdminLanguageContext()
      return {
        success: false,
        error: dict["admin.tools.error.import_file"] || "",
      }
    }
    const filename = file.name.toLowerCase()
    const fileContent = await file.text()
    const fallbackAuthorId = session.user.id

    if (filename.endsWith(".json")) {
      const result = await importJsonArchive(fileContent, fallbackAuthorId)
      revalidatePath("/", "layout")
      revalidatePath("/admincp/posts")
      revalidatePath("/admincp/pages")
      revalidatePath("/admincp/tools/import")
      return { success: result.success, type: "json", result }
    } else {
      const result = await importWxrXml(fileContent, fallbackAuthorId)
      revalidatePath("/", "layout")
      revalidatePath("/admincp/posts")
      revalidatePath("/admincp/pages")
      revalidatePath("/admincp/tools/import")
      return { success: result.success, type: "xml", result }
    }
  } catch (error: unknown) {
    unstable_rethrow(error)
    const { dict } = await getAdminLanguageContext()
    return { success: false, error: dict[error instanceof RateLimitError ? error.message : "admin.tools.error.failed"] || "" }
  }
}
