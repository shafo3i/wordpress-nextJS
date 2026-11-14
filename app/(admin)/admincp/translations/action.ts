"use server";
import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { verifyAdmin } from "@/lib/authMIddleware";
import { saveTranslation, deleteTranslationOverride } from "@/services/language.service";
import { createTranslationSchema, translationReturnUrlSchema } from "@/db/schema/cms-languages";
import { getAdminLanguageContext } from "@/components/admin/admin-shell";
async function mutation<T>(operation: () => Promise<T>): Promise<T> {
  try { return await operation(); } catch (error) {
    unstable_rethrow(error);
    const { dict } = await getAdminLanguageContext();
    throw new Error(dict["admin.languages.error.failed"] || "");
  }
}
function returnUrl(value: FormDataEntryValue | null, code: string) {
  return translationReturnUrlSchema.safeParse(value).data || `/admincp/translations?locale=${encodeURIComponent(code)}`;
}
export async function saveTranslationAction(formData: FormData) {
  await verifyAdmin();
  const data = await mutation(async () => {
    const data = createTranslationSchema.parse(Object.fromEntries(formData));
    await saveTranslation(data.languageCode, data.key, data.value); return data;
  });
  revalidatePath("/", "layout"); redirect(returnUrl(formData.get("returnUrl"), data.languageCode));
}
export async function deleteTranslationOverrideAction(formData: FormData) {
  await verifyAdmin();
  const data = await mutation(async () => {
    const data = createTranslationSchema.pick({ languageCode: true, key: true }).parse(Object.fromEntries(formData));
    await deleteTranslationOverride(data.languageCode, data.key); return data;
  });
  revalidatePath("/", "layout"); redirect(returnUrl(formData.get("returnUrl"), data.languageCode));
}
