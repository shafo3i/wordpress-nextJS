import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import { db } from "@/db";
import { languagesTable } from "@/db/schema/cms-languages";
import { and, count, desc, asc, eq, sql } from "drizzle-orm";
import { SelectLanguage } from "@/db/schema/cms-languages";

export interface GetLanguagesOptions {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
}

export async function getAllLanguagesQuery(options: GetLanguagesOptions = {}) {
    await verifyAdminOrEditor();

    const { status, search, page = 1, limit = 20 } = options;
    const offset = Math.max(0, (page - 1) * limit);

    const conditions = [];

    if (status === "active") {
        conditions.push(eq(languagesTable.isActive, true));
    } else if (status === "inactive") {
        conditions.push(eq(languagesTable.isActive, false));
    }

    if (search && search.trim().length > 0) {
        const term = `%${search.trim()}%`;
        conditions.push(
            sql`(${languagesTable.name} ILIKE ${term} OR ${languagesTable.nativeName} ILIKE ${term} OR ${languagesTable.code} ILIKE ${term})`
        );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, countRes] = await Promise.all([
        db
            .select()
            .from(languagesTable)
            .where(whereClause)
            .orderBy(asc(languagesTable.displayOrder), asc(languagesTable.code))
            .limit(limit)
            .offset(offset),
        db
            .select({ total: count() })
            .from(languagesTable)
            .where(whereClause),
    ]);

    return {
        languages: rows,
        total: Number(countRes[0]?.total ?? 0),
    };
}

export async function getLanguageByCodeQuery(code: string): Promise<SelectLanguage | null> {
    await verifyAdminOrEditor();

    const [row] = await db
        .select()
        .from(languagesTable)
        .where(eq(languagesTable.code, code))
        .limit(1);

    return row ?? null;
}

export async function getLanguageCounts() {
    await verifyAdminOrEditor();

    const [allCount, activeCount, inactiveCount] = await Promise.all([
        db.select({ total: count() }).from(languagesTable),
        db.select({ total: count() }).from(languagesTable).where(eq(languagesTable.isActive, true)),
        db.select({ total: count() }).from(languagesTable).where(eq(languagesTable.isActive, false)),
    ]);

    return {
        all: Number(allCount[0]?.total ?? 0),
        active: Number(activeCount[0]?.total ?? 0),
        inactive: Number(inactiveCount[0]?.total ?? 0),
    };
}
