"use server"

import { revalidatePath } from "next/cache"
import { verifyAdminOrEditor } from "@/lib/authMIddleware"
import {
  saveStudioPageData,
  createDraftStudioPage,
  setPageStudioMode,
} from "@/services/page.service"
import type { StudioSaveRequest, StudioSaveResult } from "@/lib/studio/types"

export async function saveStudioDocumentAction(
  input: StudioSaveRequest
): Promise<StudioSaveResult> {
  try {
    const session = await verifyAdminOrEditor()
    if (input.setAsFrontPage && session.user.role !== "admin") {
      return { success: false, error: "studio_forbidden" }
    }
    const result = await saveStudioPageData(input)

    revalidatePath("/", "layout")
    revalidatePath("/admincp/pages")
    revalidatePath(`/admincp/studio/${input.pageId}`)
    return result
  } catch {
    return { success: false, error: "studio_save_failed" }
  }
}

export async function createNewStudioPageAction(input: {
  title: string
  languageCode?: string
  translationOf?: string
}) {
  const session = await verifyAdminOrEditor()
  const pageId = await createDraftStudioPage({
    title: input.title,
    languageCode: input.languageCode,
    translationOf: input.translationOf,
    userId: session?.user?.id,
  })

  revalidatePath("/admincp/pages")
  return { success: true, pageId }
}

export async function switchPageEditorModeAction(input: {
  pageId: string
  enableStudio: boolean
}) {
  await verifyAdminOrEditor()
  await setPageStudioMode(input.pageId, input.enableStudio)

  revalidatePath("/", "layout")
  revalidatePath("/admincp/pages")
  revalidatePath(`/admincp/pages/${input.pageId}/edit`)
  revalidatePath(`/admincp/studio/${input.pageId}`)
  return { success: true }
}
