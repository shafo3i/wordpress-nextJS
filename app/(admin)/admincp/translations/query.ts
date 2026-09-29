import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import {
    getAllLanguages,
    getDefaultLanguage,
    getLanguageByCode,
    getTranslationCatalog,
    TranslationCatalogItem,
} from "@/services/language.service";
import { SelectLanguage } from "@/db/schema/cms-languages";

export interface GetTranslationsQueryOptions {
    locale?: string;
    group?: string;
    filter?: "all" | "missing" | "overridden";
    search?: string;
    page?: number;
    limit?: number;
}

export async function getTranslationsPageData(options: GetTranslationsQueryOptions = {}) {
    await verifyAdminOrEditor();

    const [allLanguages, defaultLang] = await Promise.all([
        getAllLanguages(),
        getDefaultLanguage(),
    ]);

    const activeLocale = options.locale || defaultLang?.code || allLanguages[0]?.code || "en";
    const currentLanguage = await getLanguageByCode(activeLocale);

    const catalog = await getTranslationCatalog(activeLocale, {
        search: options.search,
        group: options.group,
        filter: options.filter,
    });

    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 20;
    const offset = (page - 1) * limit;

    const total = catalog.items.length;
    const paginatedItems = catalog.items.slice(offset, offset + limit);

    return {
        languages: allLanguages,
        currentLanguage,
        activeLocale,
        items: paginatedItems,
        total,
        stats: catalog.stats,
        groups: catalog.groups,
    };
}
