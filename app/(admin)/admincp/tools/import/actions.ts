"use server";

import { revalidatePath } from "next/cache";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import { importWxrXml, importJsonArchive, type ImportResult } from "@/services/import.service";

export async function importFileAction(
  formData: FormData
): Promise<{
  success: boolean;
  type?: "xml" | "json";
  result?: ImportResult;
  error?: string;
}> {
  try {
    const session = await verifyAdminOrEditor();
    const file = formData.get("file") as File | null;

    if (!file) {
      return { success: false, error: "No file uploaded. Please select an XML or JSON file." };
    }

    const filename = file.name.toLowerCase();
    const fileContent = await file.text();

    if (!fileContent || fileContent.trim().length === 0) {
      return { success: false, error: "The uploaded file is empty." };
    }

    const fallbackAuthorId = session.user.id;

    if (filename.endsWith(".json") || fileContent.trim().startsWith("{")) {
      const result = await importJsonArchive(fileContent, fallbackAuthorId);
      revalidatePath("/admincp/posts");
      revalidatePath("/admincp/pages");
      revalidatePath("/admincp/tools/import");
      return { success: result.success, type: "json", result };
    } else {
      const result = await importWxrXml(fileContent, fallbackAuthorId);
      revalidatePath("/admincp/posts");
      revalidatePath("/admincp/pages");
      revalidatePath("/admincp/tools/import");
      return { success: result.success, type: "xml", result };
    }
  } catch (error: any) {
    console.error("importFileAction error:", error);
    return { success: false, error: error?.message || "Failed to process import file." };
  }
}
