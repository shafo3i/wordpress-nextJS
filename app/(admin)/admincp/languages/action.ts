"use server";
import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { cookies } from "next/headers";
import { verifyAdmin, verifyPostEditor } from "@/lib/authMIddleware";
import { createLanguage, updateLanguage, deleteLanguage, setDefaultLanguage, getLanguageByCode, LanguageMutationError } from "@/services/language.service";
import { createLanguageSchema, updateLanguageSchema, languageCodeSchema } from "@/db/schema/cms-languages";
import { getAdminLanguageContext } from "@/components/admin/admin-shell";
import { ZodError } from "zod";
async function mutation<T>(operation: () => Promise<T>): Promise<T> {
  try { return await operation(); } catch (error) {
    unstable_rethrow(error);
    const { dict } = await getAdminLanguageContext();
    const key = error instanceof LanguageMutationError ? error.key : error instanceof ZodError ? "admin.languages.error.invalid" : "admin.languages.error.failed";
    throw new Error(dict[key] || dict["admin.languages.error.failed"] || "");
  }
}
function refresh() { revalidatePath("/", "layout"); }
export async function createLanguageAction(formData: FormData) {
  await verifyAdmin();
  await mutation(() => createLanguage(createLanguageSchema.parse(Object.fromEntries(formData))));
  refresh(); redirect("/admincp/languages");
}
export async function updateLanguageAction(formData: FormData) {
  await verifyAdmin();
  await mutation(() => updateLanguage(languageCodeSchema.parse(formData.get("originalCode") || formData.get("code")), updateLanguageSchema.parse(Object.fromEntries(formData))));
  refresh(); redirect("/admincp/languages");
}
export async function deleteLanguageAction(formData: FormData) {
  await verifyAdmin();
  await mutation(() => deleteLanguage(languageCodeSchema.parse(formData.get("code"))));
  refresh(); redirect("/admincp/languages");
}
export async function setDefaultLanguageAction(formData: FormData) {
  await verifyAdmin();
  await mutation(() => setDefaultLanguage(languageCodeSchema.parse(formData.get("code"))));
  refresh(); redirect("/admincp/languages");
}
export async function toggleLanguageStatusAction(formData: FormData) {
  await verifyAdmin();
  await mutation(() => updateLanguage(languageCodeSchema.parse(formData.get("code")), updateLanguageSchema.pick({ isActive: true }).parse({ isActive: formData.get("isActive") })));
  refresh(); redirect("/admincp/languages");
}
export async function switchAdminLanguageAction(formData: FormData) {
  await verifyPostEditor();
  await mutation(async () => {
    const code = languageCodeSchema.parse(formData.get("code"));
    const language = await getLanguageByCode(code);
    if (!language?.isActive) throw new LanguageMutationError("admin.languages.error.missing");
    (await cookies()).set("admin_lang", code, { path: "/", maxAge: 31536000, httpOnly: true, sameSite: "lax", secure: (process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "").startsWith("https://") });
  });
  revalidatePath("/admincp", "layout");
}
export async function syncLanguageTemplatesAction() {
  await verifyAdmin();
  try {
    const { syncMissingTranslations } = await import("@/services/language-sync.service");
    const result = await syncMissingTranslations(); refresh();
    return { success: true as const, ...result };
  } catch (error) { unstable_rethrow(error); return { success: false as const }; }
}
