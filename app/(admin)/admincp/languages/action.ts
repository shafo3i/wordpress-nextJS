"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import {
    createLanguage,
    updateLanguage,
    deleteLanguage,
    setDefaultLanguage,
} from "@/services/language.service";
import { createLanguageSchema } from "@/db/schema/cms-languages";

export async function createLanguageAction(formData: FormData) {
    await verifyAdminOrEditor();

    const raw = Object.fromEntries(formData);
    const data = createLanguageSchema.parse({
        code: raw.code,
        name: raw.name,
        nativeName: raw.nativeName || "",
        direction: raw.direction || "ltr",
        isDefault: raw.isDefault === "on" || raw.isDefault === "true",
        isActive: raw.isActive === "on" || raw.isActive === "true" || raw.isActive === undefined,
        displayOrder: raw.displayOrder ? Number(raw.displayOrder) : 0,
    });

    await createLanguage(data);

    revalidatePath("/admincp/languages");
    redirect("/admincp/languages");
}

export async function updateLanguageAction(formData: FormData) {
    await verifyAdminOrEditor();

    const code = formData.get("originalCode")?.toString() || formData.get("code")?.toString();
    if (!code) {
        throw new Error("Language code is required to update");
    }

    const raw = Object.fromEntries(formData);
    const data = createLanguageSchema.partial().parse({
        name: raw.name,
        nativeName: raw.nativeName,
        direction: raw.direction as "ltr" | "rtl",
        isDefault: raw.isDefault ? (raw.isDefault === "on" || raw.isDefault === "true") : undefined,
        isActive: raw.isActive !== undefined ? (raw.isActive === "on" || raw.isActive === "true") : undefined,
        displayOrder: raw.displayOrder !== undefined ? Number(raw.displayOrder) : undefined,
    });

    await updateLanguage(code, data);

    revalidatePath("/admincp/languages");
    redirect("/admincp/languages");
}

export async function deleteLanguageAction(formData: FormData) {
    await verifyAdminOrEditor();

    const code = formData.get("code")?.toString();
    if (!code) {
        throw new Error("Language code is required to delete");
    }

    const result = await deleteLanguage(code);
    if (!result.success) {
        throw new Error(result.message || "Failed to delete language");
    }

    revalidatePath("/admincp/languages");
    redirect("/admincp/languages");
}

export async function setDefaultLanguageAction(formData: FormData) {
    await verifyAdminOrEditor();

    const code = formData.get("code")?.toString();
    if (!code) {
        throw new Error("Language code is required to set default");
    }

    await setDefaultLanguage(code);

    revalidatePath("/admincp/languages");
    redirect("/admincp/languages");
}

export async function toggleLanguageStatusAction(formData: FormData) {
    await verifyAdminOrEditor();

    const code = formData.get("code")?.toString();
    const isActive = formData.get("isActive") === "true";

    if (!code) {
        throw new Error("Language code is required");
    }

    await updateLanguage(code, { isActive });

    revalidatePath("/admincp/languages");
    redirect("/admincp/languages");
}

export async function switchAdminLanguageAction(formData: FormData) {
    const code = formData.get("code")?.toString();
    if (code) {
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        cookieStore.set("admin_lang", code, { path: "/", maxAge: 31536000 });
    }
    revalidatePath("/admincp");
}

