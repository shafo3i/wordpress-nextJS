import { eq, desc, asc, and, count, sql, inArray } from "drizzle-orm";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { DB, db } from "@/db";
import {
    languagesTable,
    translationsTable,
    postTranslationsTable,
    createLanguageSchema,
    updateLanguageSchema,
    createTranslationSchema,
    InsertLanguage,
    SelectLanguage,
    InsertTranslation,
    SelectTranslation,
} from "@/db/schema/cms-languages";
import { wpPosts } from "@/db/schema/cms-posts";

// ---------------------------------------------------------------------------
// Template File Helpers
// ---------------------------------------------------------------------------

function getTemplatesDir(): string {
    return resolve(process.cwd(), "templates", "language");
}

/**
 * Returns a list of language codes that have template JSON files in `templates/language`.
 */
export function getAvailableTemplateLocales(): string[] {
    try {
        const dir = getTemplatesDir();
        if (!existsSync(dir)) return [];
        return readdirSync(dir)
            .filter((file) => file.endsWith(".json"))
            .map((file) => file.replace(/\.json$/, ""));
    } catch {
        return [];
    }
}

/**
 * Reads a JSON language template file from `templates/language/[code].json`.
 */
export function getTemplateTranslations(code: string): Record<string, string> {
    try {
        const filePath = resolve(getTemplatesDir(), `${code}.json`);
        if (!existsSync(filePath)) return {};
        const content = readFileSync(filePath, "utf8");
        return JSON.parse(content) as Record<string, string>;
    } catch {
        return {};
    }
}

// ---------------------------------------------------------------------------
// Language Management
// ---------------------------------------------------------------------------

export async function getAllLanguages(database: DB = db): Promise<SelectLanguage[]> {
    return database
        .select()
        .from(languagesTable)
        .orderBy(asc(languagesTable.displayOrder), asc(languagesTable.code));
}

export async function getActiveLanguages(database: DB = db): Promise<SelectLanguage[]> {
    return database
        .select()
        .from(languagesTable)
        .where(eq(languagesTable.isActive, true))
        .orderBy(asc(languagesTable.displayOrder), asc(languagesTable.code));
}

export async function getDefaultLanguage(database: DB = db): Promise<SelectLanguage | null> {
    const [defaultLang] = await database
        .select()
        .from(languagesTable)
        .where(eq(languagesTable.isDefault, true))
        .limit(1);

    if (defaultLang) return defaultLang;

    // Fallback to English or the first language in database
    const [fallback] = await database
        .select()
        .from(languagesTable)
        .where(eq(languagesTable.code, "en"))
        .limit(1);

    if (fallback) return fallback;

    const [first] = await database
        .select()
        .from(languagesTable)
        .limit(1);

    return first ?? null;
}

export async function getLanguageByCode(code: string, database: DB = db): Promise<SelectLanguage | null> {
    const [lang] = await database
        .select()
        .from(languagesTable)
        .where(eq(languagesTable.code, code))
        .limit(1);

    return lang ?? null;
}

export async function createLanguage(
    input: InsertLanguage,
    database: DB = db
): Promise<SelectLanguage> {
    const validated = createLanguageSchema.parse(input);

    // If marked as default, unset other defaults
    if (validated.isDefault) {
        await database
            .update(languagesTable)
            .set({ isDefault: false });
    } else {
        // If this is the first language being created, make it default
        const [existing] = await database
            .select({ total: count() })
            .from(languagesTable);
        if (!existing || existing.total === 0) {
            validated.isDefault = true;
        }
    }

    const [created] = await database
        .insert(languagesTable)
        .values({
            code: validated.code.toLowerCase().trim(),
            name: validated.name.trim(),
            nativeName: (validated.nativeName ?? "").trim(),
            direction: validated.direction ?? "ltr",
            isDefault: validated.isDefault ?? false,
            isActive: validated.isActive ?? true,
            displayOrder: validated.displayOrder ?? 0,
        })
        .returning();

    return created;
}

export async function updateLanguage(
    code: string,
    input: Partial<InsertLanguage>,
    database: DB = db
): Promise<SelectLanguage | null> {
    const validated = updateLanguageSchema.parse(input);

    if (validated.isDefault) {
        await database
            .update(languagesTable)
            .set({ isDefault: false });
    }

    const [updated] = await database
        .update(languagesTable)
        .set({
            ...validated,
            updatedAt: new Date(),
        })
        .where(eq(languagesTable.code, code))
        .returning();

    return updated ?? null;
}

export async function deleteLanguage(
    code: string,
    database: DB = db
): Promise<{ success: boolean; message?: string }> {
    const target = await getLanguageByCode(code, database);
    if (!target) {
        return { success: false, message: "Language not found." };
    }

    if (target.isDefault) {
        return { success: false, message: "Cannot delete the default language." };
    }

    const [totalLangs] = await database
        .select({ total: count() })
        .from(languagesTable);

    if (totalLangs && totalLangs.total <= 1) {
        return { success: false, message: "Cannot delete the only configured language." };
    }

    await database
        .delete(languagesTable)
        .where(eq(languagesTable.code, code));

    return { success: true };
}

export async function setDefaultLanguage(
    code: string,
    database: DB = db
): Promise<SelectLanguage | null> {
    const target = await getLanguageByCode(code, database);
    if (!target) return null;

    await database
        .update(languagesTable)
        .set({ isDefault: false });

    const [updated] = await database
        .update(languagesTable)
        .set({ isDefault: true, isActive: true, updatedAt: new Date() })
        .where(eq(languagesTable.code, code))
        .returning();

    return updated ?? null;
}

// ---------------------------------------------------------------------------
// Translations Management
// ---------------------------------------------------------------------------

/**
 * Retrieves all database translation overrides for a specific language code.
 */
export async function getDbTranslations(
    languageCode: string,
    database: DB = db
): Promise<Record<string, string>> {
    const rows = await database
        .select({
            key: translationsTable.key,
            value: translationsTable.value,
        })
        .from(translationsTable)
        .where(eq(translationsTable.languageCode, languageCode));

    const result: Record<string, string> = {};
    for (const row of rows) {
        result[row.key] = row.value;
    }
    return result;
}

/**
 * Returns fully resolved translation dictionary for a given locale.
 * Priority: DB Override -> Locale Template JSON -> English Template JSON -> Key
 */
export async function getTranslations(
    locale: string,
    database: DB = db
): Promise<Record<string, string>> {
    // 1. English baseline
    const enTemplate = getTemplateTranslations("en");

    // 2. Locale template (if not English)
    const localeTemplate = locale !== "en" ? getTemplateTranslations(locale) : {};

    // 3. Database overrides
    const dbTranslations = await getDbTranslations(locale, database);

    return {
        ...enTemplate,
        ...localeTemplate,
        ...dbTranslations,
    };
}

/**
 * Saves or updates a single translation in the database.
 */
export async function saveTranslation(
    languageCode: string,
    key: string,
    value: string,
    database: DB = db
): Promise<SelectTranslation> {
    const validated = createTranslationSchema.parse({ languageCode, key, value });

    const [result] = await database
        .insert(translationsTable)
        .values({
            languageCode: validated.languageCode,
            key: validated.key,
            value: validated.value,
        })
        .onConflictDoUpdate({
            target: [translationsTable.languageCode, translationsTable.key],
            set: {
                value: validated.value,
                updatedAt: new Date(),
            },
        })
        .returning();

    return result;
}

/**
 * Saves a batch of translations to the database.
 */
export async function saveTranslationsBatch(
    languageCode: string,
    entries: Record<string, string>,
    database: DB = db
): Promise<number> {
    const keys = Object.keys(entries);
    if (keys.length === 0) return 0;

    for (const [key, value] of Object.entries(entries)) {
        await saveTranslation(languageCode, key, value, database);
    }

    return keys.length;
}

/**
 * Deletes a translation override from the database, falling back to file template.
 */
export async function deleteTranslationOverride(
    languageCode: string,
    key: string,
    database: DB = db
): Promise<boolean> {
    const result = await database
        .delete(translationsTable)
        .where(
            and(
                eq(translationsTable.languageCode, languageCode),
                eq(translationsTable.key, key)
            )
        );

    return true;
}

// ---------------------------------------------------------------------------
// Translation Catalog (for Admin CP Editor)
// ---------------------------------------------------------------------------

export interface TranslationCatalogItem {
    key: string;
    group: string;
    baseValue: string;
    templateValue: string;
    dbValue: string | null;
    currentValue: string;
    isOverridden: boolean;
    isMissing: boolean;
}

/**
 * Compiles a full translation catalog for a given language code.
 * Collects all keys from English base, target template, and DB overrides.
 */
export async function getTranslationCatalog(
    languageCode: string,
    options: {
        search?: string;
        group?: string;
        filter?: "all" | "missing" | "overridden";
    } = {},
    database: DB = db
): Promise<{
    items: TranslationCatalogItem[];
    stats: {
        total: number;
        translated: number;
        overridden: number;
        missing: number;
    };
    groups: string[];
}> {
    const baseTemplate = getTemplateTranslations("en");
    const langTemplate = languageCode !== "en" ? getTemplateTranslations(languageCode) : baseTemplate;
    const dbOverrides = await getDbTranslations(languageCode, database);

    // Merge all unique keys
    const allKeysSet = new Set<string>([
        ...Object.keys(baseTemplate),
        ...Object.keys(langTemplate),
        ...Object.keys(dbOverrides),
    ]);

    const allKeys = Array.from(allKeysSet).sort();
    const groupsSet = new Set<string>();

    const items: TranslationCatalogItem[] = [];
    let translatedCount = 0;
    let overriddenCount = 0;
    let missingCount = 0;

    for (const key of allKeys) {
        const parts = key.split(".");
        const group = parts.length > 1 ? parts[0] : "general";
        groupsSet.add(group);

        const baseValue = baseTemplate[key] ?? "";
        const templateVal = langTemplate[key] ?? "";
        const dbVal = dbOverrides[key] ?? null;

        const currentValue = dbVal !== null ? dbVal : (templateVal || baseValue);
        const isOverridden = dbVal !== null;
        const isMissing = !templateVal && !dbVal;

        if (currentValue && !isMissing) {
            translatedCount++;
        } else {
            missingCount++;
        }

        if (isOverridden) {
            overriddenCount++;
        }

        // Apply filters
        if (options.group && options.group !== "all" && group !== options.group) {
            continue;
        }

        if (options.filter === "missing" && !isMissing) {
            continue;
        }

        if (options.filter === "overridden" && !isOverridden) {
            continue;
        }

        if (options.search) {
            const query = options.search.toLowerCase();
            const matchesKey = key.toLowerCase().includes(query);
            const matchesBase = baseValue.toLowerCase().includes(query);
            const matchesCurrent = currentValue.toLowerCase().includes(query);
            if (!matchesKey && !matchesBase && !matchesCurrent) {
                continue;
            }
        }

        items.push({
            key,
            group,
            baseValue,
            templateValue: templateVal,
            dbValue: dbVal,
            currentValue,
            isOverridden,
            isMissing,
        });
    }

    return {
        items,
        stats: {
            total: allKeys.length,
            translated: translatedCount,
            overridden: overriddenCount,
            missing: missingCount,
        },
        groups: Array.from(groupsSet).sort(),
    };
}

// ---------------------------------------------------------------------------
// Post Translations (WPML / Polylang group model)
// ---------------------------------------------------------------------------

export type LinkedPostTranslation = {
    postId: bigint;
    slug: string;
    title: string;
    languageCode: string;
    languageName: string;
    nativeName: string;
    direction: string;
    isDefault: boolean;
};

export async function getPostLanguage(
    postId: bigint | number,
    database: DB = db
): Promise<{ languageCode: string; translationGroupId: string } | null> {
    const [row] = await database
        .select({
            languageCode: postTranslationsTable.languageCode,
            translationGroupId: postTranslationsTable.translationGroupId,
        })
        .from(postTranslationsTable)
        .where(eq(postTranslationsTable.postId, BigInt(postId)))
        .limit(1);

    return row ?? null;
}

export async function getPostTranslations(
    postId: bigint | number,
    database: DB = db
): Promise<LinkedPostTranslation[]> {
    const postLang = await getPostLanguage(postId, database);
    if (!postLang) return [];

    const rows = await database
        .select({
            postId: wpPosts.id,
            slug: wpPosts.postName,
            title: wpPosts.postTitle,
            languageCode: languagesTable.code,
            languageName: languagesTable.name,
            nativeName: languagesTable.nativeName,
            direction: languagesTable.direction,
            isDefault: languagesTable.isDefault,
        })
        .from(postTranslationsTable)
        .innerJoin(wpPosts, eq(postTranslationsTable.postId, wpPosts.id))
        .innerJoin(languagesTable, eq(postTranslationsTable.languageCode, languagesTable.code))
        .where(eq(postTranslationsTable.translationGroupId, postLang.translationGroupId));

    return rows;
}

export async function linkPostTranslation(
    postId: bigint | number,
    languageCode: string,
    translationGroupId: string,
    database: DB = db
): Promise<void> {
    const pid = BigInt(postId);
    const existing = await getPostLanguage(pid, database);

    if (existing) {
        await database
            .update(postTranslationsTable)
            .set({
                languageCode,
                translationGroupId,
                updatedAt: new Date(),
            })
            .where(eq(postTranslationsTable.postId, pid));
    } else {
        await database
            .insert(postTranslationsTable)
            .values({
                postId: pid,
                languageCode,
                translationGroupId,
            });
    }
}

export async function setPostLanguage(
    postId: bigint | number,
    languageCode: string,
    sourcePostId?: bigint | number,
    database: DB = db
): Promise<string> {
    const pid = BigInt(postId);
    let groupId: string;

    if (sourcePostId) {
        const sourceLang = await getPostLanguage(sourcePostId, database);
        if (sourceLang) {
            groupId = sourceLang.translationGroupId;
        } else {
            groupId = `post_${sourcePostId}`;
            const defLang = await getDefaultLanguage(database);
            await linkPostTranslation(sourcePostId, defLang?.code ?? "en", groupId, database);
        }
    } else {
        const existing = await getPostLanguage(pid, database);
        groupId = existing?.translationGroupId ?? `post_${pid}`;
    }

    await linkPostTranslation(pid, languageCode, groupId, database);
    return groupId;
}
