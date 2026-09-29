"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import {
    saveTranslation,
    deleteTranslationOverride,
} from "@/services/language.service";
import { createTranslationSchema } from "@/db/schema/cms-languages";

export async function saveTranslationAction(formData: FormData) {
    await verifyAdminOrEditor();

    const raw = Object.fromEntries(formData);
    const data = createTranslationSchema.parse({
        languageCode: raw.languageCode,
        key: raw.key,
        value: raw.value,
    });

    await saveTranslation(data.languageCode, data.key, data.value);

    const redirectUrl = raw.returnUrl?.toString() || `/admincp/translations?locale=${data.languageCode}`;
    revalidatePath("/admincp/translations");
    redirect(redirectUrl);
}

export async function deleteTranslationOverrideAction(formData: FormData) {
    await verifyAdminOrEditor();

    const languageCode = formData.get("languageCode")?.toString();
    const key = formData.get("key")?.toString();
    const returnUrl = formData.get("returnUrl")?.toString();

    if (!languageCode || !key) {
        throw new Error("Language code and key are required to reset translation");
    }

    await deleteTranslationOverride(languageCode, key);

    const redirectUrl = returnUrl || `/admincp/translations?locale=${languageCode}`;
    revalidatePath("/admincp/translations");
    redirect(redirectUrl);
}
