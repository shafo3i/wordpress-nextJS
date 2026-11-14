import "server-only";
import { verifyAdmin, verifyPostEditor } from "@/lib/authMIddleware";
import { cache } from "react";
import { eq, lte, asc, and, count, sql, inArray } from "drizzle-orm";
import { readFileSync, readdirSync, existsSync, lstatSync } from "node:fs";
import { resolve } from "node:path";
import { DB, db } from "@/db";
import {
    languagesTable,
    translationsTable,
    postTranslationsTable,
    termTranslationsTable,
    createLanguageSchema,
    languageCodeSchema, translationKeySchema, translationBatchSchema, translationQuerySchema, translationGroupSchema,
    updateLanguageSchema,
    createTranslationSchema,
    InsertLanguage,
    SelectLanguage,
    SelectTranslation,
} from "@/db/schema/cms-languages";
import { wpPosts } from "@/db/schema/cms-posts";
import { wpTerms, wpTermTaxonomy, categoryIdSchema } from "@/db/schema/cms-taxonomy";

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
            .filter((file) => file.endsWith(".json") && languageCodeSchema.safeParse(file.slice(0, -5)).success)
            .map((file) => file.replace(/\.json$/, ""));
    } catch {
        return [];
    }
}

/**
 * Reads a JSON language template file from `templates/language/[code].json`.
 */
export function getTemplateTranslations(code: string): Record<string, string> {
    if (!languageCodeSchema.safeParse(code).success) return {};
    try {
        const filePath = resolve(getTemplatesDir(), `${code}.json`);
        if (!existsSync(filePath)) return {};
        const stat = lstatSync(filePath);
        if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 5000000) return {};
        const content = readFileSync(filePath, "utf8");
        const parsed = translationBatchSchema.safeParse(JSON.parse(content));
        return parsed.success ? parsed.data : {};
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

async function read_getActiveLanguages(database: DB = db): Promise<SelectLanguage[]> {
    return database
        .select()
        .from(languagesTable)
        .where(eq(languagesTable.isActive, true))
        .orderBy(asc(languagesTable.displayOrder), asc(languagesTable.code));
}

async function read_getDefaultLanguage(database: DB = db): Promise<SelectLanguage | null> {
    const [defaultLang] = await database
        .select()
        .from(languagesTable)
        .where(and(eq(languagesTable.isDefault, true), eq(languagesTable.isActive, true)))
        .limit(1);

    if (defaultLang) return defaultLang;

    // Fallback to English or the first language in database
    const [fallback] = await database
        .select()
        .from(languagesTable)
        .where(and(eq(languagesTable.code, "en"), eq(languagesTable.isActive, true)))
        .limit(1);

    if (fallback) return fallback;

    const [first] = await database
        .select()
        .from(languagesTable)
        .where(eq(languagesTable.isActive, true))
        .limit(1);

    return first ?? null;
}

export async function getLanguageByCode(code: string, database: DB = db): Promise<SelectLanguage | null> {
    code = languageCodeSchema.parse(code);
    const [lang] = await database
        .select()
        .from(languagesTable)
        .where(eq(languagesTable.code, code))
        .limit(1);

    return lang ?? null;
}

export class LanguageMutationError extends Error {
  constructor(public readonly key: string) { super(key); }
}
async function languageTransaction<T>(database: DB, operation: (tx: DB) => Promise<T>): Promise<T> {
  return database.transaction(async transaction => {
    const tx = transaction as unknown as DB;
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('pressforge:languages'))`);
    return operation(tx);
  });
}
export async function createLanguage(input: InsertLanguage, database: DB = db): Promise<SelectLanguage> {
  await verifyAdmin();
  const parsed = createLanguageSchema.parse(input);
  return languageTransaction(database, async tx => {
    const [existing] = await tx.select({ total: count() }).from(languagesTable);
    const isDefault = parsed.isDefault || Number(existing?.total ?? 0) === 0;
    if (isDefault) await tx.update(languagesTable).set({ isDefault: false });
    const [created] = await tx.insert(languagesTable).values({ ...parsed, isDefault, isActive: isDefault || parsed.isActive }).returning();
    return created;
  });
}
export async function updateLanguage(code: string, input: Partial<InsertLanguage>, database: DB = db): Promise<SelectLanguage | null> {
  await verifyAdmin();
  const targetCode = languageCodeSchema.parse(code);
  const parsed = updateLanguageSchema.parse(input);
  return languageTransaction(database, async tx => {
    const current = await getLanguageByCode(targetCode, tx);
    if (!current) throw new LanguageMutationError("admin.languages.error.missing");
    if (current.isDefault && (parsed.isDefault === false || parsed.isActive === false))
      throw new LanguageMutationError("admin.languages.error.default");
    if (parsed.isDefault) await tx.update(languagesTable).set({ isDefault: false });
    const [updated] = await tx.update(languagesTable).set({ ...parsed, ...(parsed.isDefault ? { isActive: true } : {}), updatedAt: new Date() }).where(eq(languagesTable.code, targetCode)).returning();
    return updated ?? null;
  });
}
export async function deleteLanguage(code: string, database: DB = db): Promise<{ success: boolean; message?: string }> {
  await verifyAdmin();
  const targetCode = languageCodeSchema.parse(code);
  return languageTransaction(database, async tx => {
    const target = await getLanguageByCode(targetCode, tx);
    if (!target) throw new LanguageMutationError("admin.languages.error.missing");
    if (target.isDefault) throw new LanguageMutationError("admin.languages.error.default");
    const [posts] = await tx.select({ total: count() }).from(postTranslationsTable).where(eq(postTranslationsTable.languageCode, targetCode));
    const [terms] = await tx.select({ total: count() }).from(termTranslationsTable).where(eq(termTranslationsTable.languageCode, targetCode));
    if (Number(posts?.total ?? 0) || Number(terms?.total ?? 0)) throw new LanguageMutationError("admin.languages.error.used");
    const [total] = await tx.select({ total: count() }).from(languagesTable);
    if (Number(total?.total ?? 0) <= 1) throw new LanguageMutationError("admin.languages.error.default");
    await tx.delete(languagesTable).where(eq(languagesTable.code, targetCode));
    return { success: true };
  });
}
export async function setDefaultLanguage(code: string, database: DB = db): Promise<SelectLanguage | null> {
  return updateLanguage(code, { isDefault: true, isActive: true }, database);
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
    languageCode = languageCodeSchema.parse(languageCode);
    const rows = await database
        .select({
            key: translationsTable.key,
            value: translationsTable.value,
        })
        .from(translationsTable)
        .where(eq(translationsTable.languageCode, languageCode));

    const result: Record<string, string> = Object.create(null);
    for (const row of rows) {
        if (createTranslationSchema.safeParse({ languageCode, key: row.key, value: row.value }).success) result[row.key] = row.value;
    }
    return result;
}

/**
 * Returns fully resolved translation dictionary for a given locale.
 * Priority: DB Override -> Locale Template JSON -> English Template JSON -> Key
 */
export const getTranslations = cache(async (
    locale: string,
    database: DB = db
): Promise<Record<string, string>> => {
    // 1. English baseline
    const enTemplate = getTemplateTranslations("en");

    // 2. Locale template (if not English)
    const localeTemplate = locale !== "en" ? getTemplateTranslations(locale) : {};

    // 3. Database overrides
    const dbTranslations = await getDbTranslations(locale, database);
    // Encoding-damaged overrides must not hide readable template translations.
    const readableOverrides = Object.fromEntries(
        Object.entries(dbTranslations).filter(([, value]) =>
            !/(?:^|\s)\?{2,}(?=\s|$|[.,:])/.test(value) && !value.includes("\uFFFD")
        )
    );

    return {
        ...enTemplate,
        ...localeTemplate,
        ...readableOverrides,
    };
});

/**
 * Saves or updates a single translation in the database.
 */
async function writeTranslation(languageCode: string, key: string, value: string, database: DB): Promise<SelectTranslation> {
  const parsed = createTranslationSchema.parse({ languageCode, key, value });
  const [row] = await database.insert(translationsTable).values(parsed).onConflictDoUpdate({
    target: [translationsTable.languageCode, translationsTable.key], set: { value: parsed.value, updatedAt: new Date() },
  }).returning();
  return row;
}
export async function saveTranslation(languageCode: string, key: string, value: string, database: DB = db): Promise<SelectTranslation> {
  await verifyAdmin();
  const parsed = createTranslationSchema.parse({ languageCode, key, value });
  return languageTransaction(database, async tx => {
    if (!await getLanguageByCode(parsed.languageCode, tx)) throw new LanguageMutationError("admin.languages.error.missing");
    return writeTranslation(parsed.languageCode, parsed.key, parsed.value, tx);
  });
}
export async function saveTranslationsBatch(languageCode: string, entries: Record<string, string>, database: DB = db): Promise<number> {
  await verifyAdmin();
  const code = languageCodeSchema.parse(languageCode);
  const parsed = translationBatchSchema.parse(entries);
  return languageTransaction(database, async tx => {
    if (!await getLanguageByCode(code, tx)) throw new LanguageMutationError("admin.languages.error.missing");
    for (const [key, value] of Object.entries(parsed)) await writeTranslation(code, key, value, tx);
    return Object.keys(parsed).length;
  });
}
export async function deleteTranslationOverride(languageCode: string, key: string, database: DB = db): Promise<boolean> {
  await verifyAdmin();
  const code = languageCodeSchema.parse(languageCode);
  const parsedKey = translationKeySchema.parse(key);
  return languageTransaction(database, async tx => {
    await tx.delete(translationsTable).where(and(eq(translationsTable.languageCode, code), eq(translationsTable.key, parsedKey)));
    return true;
  });
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
    await verifyAdmin();
    languageCode = languageCodeSchema.parse(languageCode);
    options = translationQuerySchema.pick({ search: true, group: true, filter: true }).parse(options);
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
        .where(eq(postTranslationsTable.postId, categoryIdSchema.parse(postId)))
        .limit(1);

    return row ?? null;
}

export async function getPostTranslations(
    postId: bigint | number | string,
    database: DB = db
): Promise<LinkedPostTranslation[]> {
    const postLang = await getPostLanguage(categoryIdSchema.parse(postId), database);
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
        .where(and(eq(postTranslationsTable.translationGroupId, postLang.translationGroupId), eq(languagesTable.isActive, true), eq(wpPosts.postStatus, "publish"), eq(wpPosts.postPassword, ""), lte(wpPosts.postDateGmt, new Date()), inArray(wpPosts.postType, ["post", "page"])));

    return rows;
}

async function authorizeContentLink(kind: "post" | "term", id: bigint | number, languageCode: string, database: DB) {
  const session = await verifyPostEditor();
  const targetId = categoryIdSchema.parse(id);
  const code = languageCodeSchema.parse(languageCode);
  const language = await getLanguageByCode(code, database);
  if (!language?.isActive) throw new LanguageMutationError("admin.languages.error.missing");
  const [target] = kind === "post"
    ? await database.select({ type: wpPosts.postType }).from(wpPosts).where(eq(wpPosts.id, targetId)).limit(1)
    : await database.select({ type: wpTermTaxonomy.taxonomy }).from(wpTermTaxonomy).where(eq(wpTermTaxonomy.termTaxonomyId, targetId)).limit(1);
  if (!target || !(kind === "post" ? ["post", "page"] : ["category", "post_tag"]).includes(target.type))
    throw new LanguageMutationError("admin.languages.error.missing");
  if (session.user.role !== "admin" && target.type !== (kind === "post" ? "post" : "post_tag")) await verifyAdmin();
  return { id: targetId, code, type: target.type };
}
export async function linkPostTranslation(postId: bigint | number, languageCode: string, translationGroupId: string, database: DB = db): Promise<void> {
  await verifyPostEditor();
  const group = translationGroupSchema.parse(translationGroupId);
  await database.transaction(async transaction => {
    const tx = transaction as unknown as DB;
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('pressforge:languages'))`);
    const target = await authorizeContentLink("post", postId, languageCode, tx);
    const siblings = await tx.select({ id: postTranslationsTable.postId, code: postTranslationsTable.languageCode, type: wpPosts.postType })
      .from(postTranslationsTable).innerJoin(wpPosts, eq(wpPosts.id, postTranslationsTable.postId)).where(eq(postTranslationsTable.translationGroupId, group));
    if (siblings.some(row => row.type !== target.type || (row.id !== target.id && row.code === target.code)))
      throw new LanguageMutationError("admin.languages.error.group");
    await tx.insert(postTranslationsTable).values({ postId: target.id, languageCode: target.code, translationGroupId: group })
      .onConflictDoUpdate({ target: postTranslationsTable.postId, set: { languageCode: target.code, translationGroupId: group, updatedAt: new Date() } });
  });
}

export async function setPostLanguage(
    postId: bigint | number,
    languageCode: string,
    sourcePostId?: bigint | number,
    database: DB = db
): Promise<string> {
    await verifyPostEditor();
    languageCode = languageCodeSchema.parse(languageCode);
    return database.transaction(async transaction => {
      const tx = transaction as unknown as DB;
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext('pressforge:languages'))`);
      database = tx;
    if (sourcePostId !== undefined && categoryIdSchema.parse(sourcePostId) === categoryIdSchema.parse(postId)) throw new LanguageMutationError("admin.languages.error.group");
    await authorizeContentLink("post", postId, languageCode, database);
    const pid = categoryIdSchema.parse(postId);
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
    });
}

// ---------------------------------------------------------------------------
// Term (Taxonomy) Translations (WPML / Polylang group model)
// ---------------------------------------------------------------------------

export type LinkedTermTranslation = {
    termTaxonomyId: bigint;
    termId: bigint;
    slug: string;
    name: string;
    languageCode: string;
    languageName: string;
    nativeName: string;
    direction: string;
    isDefault: boolean;
};

export async function getTermLanguage(
    termTaxonomyId: bigint | number,
    database: DB = db
): Promise<{ languageCode: string; translationGroupId: string } | null> {
    const [row] = await database
        .select({
            languageCode: termTranslationsTable.languageCode,
            translationGroupId: termTranslationsTable.translationGroupId,
        })
        .from(termTranslationsTable)
        .where(eq(termTranslationsTable.termTaxonomyId, categoryIdSchema.parse(termTaxonomyId)))
        .limit(1);

    return row ?? null;
}

export async function getTermTranslations(
    termTaxonomyId: bigint | number,
    database: DB = db
): Promise<LinkedTermTranslation[]> {
    const termLang = await getTermLanguage(termTaxonomyId, database);
    if (!termLang) return [];

    const rows = await database
        .select({
            termTaxonomyId: wpTermTaxonomy.termTaxonomyId,
            termId: wpTerms.termId,
            slug: wpTerms.slug,
            name: wpTerms.name,
            languageCode: languagesTable.code,
            languageName: languagesTable.name,
            nativeName: languagesTable.nativeName,
            direction: languagesTable.direction,
            isDefault: languagesTable.isDefault,
        })
        .from(termTranslationsTable)
        .innerJoin(wpTermTaxonomy, eq(termTranslationsTable.termTaxonomyId, wpTermTaxonomy.termTaxonomyId))
        .innerJoin(wpTerms, eq(wpTermTaxonomy.termId, wpTerms.termId))
        .innerJoin(languagesTable, eq(termTranslationsTable.languageCode, languagesTable.code))
        .where(and(eq(termTranslationsTable.translationGroupId, termLang.translationGroupId), eq(languagesTable.isActive, true)));

    return rows;
}

export async function linkTermTranslation(termTaxonomyId: bigint | number, languageCode: string, translationGroupId: string, database: DB = db): Promise<void> {
  await verifyPostEditor();
  const group = translationGroupSchema.parse(translationGroupId);
  await database.transaction(async transaction => {
    const tx = transaction as unknown as DB;
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('pressforge:languages'))`);
    const target = await authorizeContentLink("term", termTaxonomyId, languageCode, tx);
    const siblings = await tx.select({ id: termTranslationsTable.termTaxonomyId, code: termTranslationsTable.languageCode, type: wpTermTaxonomy.taxonomy })
      .from(termTranslationsTable).innerJoin(wpTermTaxonomy, eq(wpTermTaxonomy.termTaxonomyId, termTranslationsTable.termTaxonomyId)).where(eq(termTranslationsTable.translationGroupId, group));
    if (siblings.some(row => row.type !== target.type || (row.id !== target.id && row.code === target.code)))
      throw new LanguageMutationError("admin.languages.error.group");
    await tx.insert(termTranslationsTable).values({ termTaxonomyId: target.id, languageCode: target.code, translationGroupId: group })
      .onConflictDoUpdate({ target: termTranslationsTable.termTaxonomyId, set: { languageCode: target.code, translationGroupId: group, updatedAt: new Date() } });
  });
}

export async function setTermLanguage(
    termTaxonomyId: bigint | number,
    languageCode: string,
    sourceTermTaxonomyId?: bigint | number,
    database: DB = db
): Promise<string> {
    await verifyPostEditor();
    languageCode = languageCodeSchema.parse(languageCode);
    return database.transaction(async transaction => {
      const tx = transaction as unknown as DB;
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext('pressforge:languages'))`);
      database = tx;
    if (sourceTermTaxonomyId !== undefined && categoryIdSchema.parse(sourceTermTaxonomyId) === categoryIdSchema.parse(termTaxonomyId)) throw new LanguageMutationError("admin.languages.error.group");
    await authorizeContentLink("term", termTaxonomyId, languageCode, database);
    const tid = categoryIdSchema.parse(termTaxonomyId);
    let groupId: string;

    if (sourceTermTaxonomyId) {
        const sourceLang = await getTermLanguage(sourceTermTaxonomyId, database);
        if (sourceLang) {
            groupId = sourceLang.translationGroupId;
        } else {
            groupId = `term_${sourceTermTaxonomyId}`;
            const defLang = await getDefaultLanguage(database);
            await linkTermTranslation(sourceTermTaxonomyId, defLang?.code ?? "en", groupId, database);
        }
    } else {
        const existing = await getTermLanguage(tid, database);
        groupId = existing?.translationGroupId ?? `term_${tid}`;
    }

    await linkTermTranslation(tid, languageCode, groupId, database);
    return groupId;
    });
}


export const getDefaultLanguage = cache(read_getDefaultLanguage);

export const getActiveLanguages = cache(read_getActiveLanguages);
