import { db } from "@/db";
import { wpOptions } from "@/db/schema/cms-options";
import { eq } from "drizzle-orm";

export interface RedirectItem {
  id: string;
  sourcePath: string;
  targetUrl: string;
  statusCode: 301 | 302;
  notes?: string;
  hits: number;
  lastAccessedAt?: string;
  createdAt: string;
}

const REDIRECTS_OPTION_NAME = "pressforge_redirects";

function normalizePath(p: string): string {
  if (!p) return "/";
  let clean = p.trim().toLowerCase();
  if (!clean.startsWith("http://") && !clean.startsWith("https://") && !clean.startsWith("/")) {
    clean = "/" + clean;
  }
  // remove trailing slash except root
  if (clean.length > 1 && clean.endsWith("/")) {
    clean = clean.slice(0, -1);
  }
  return clean;
}

/**
 * Retrieves all registered 301/302 redirects
 */
export async function getAllRedirects(): Promise<RedirectItem[]> {
  try {
    const row = await db
      .select({ optionValue: wpOptions.optionValue })
      .from(wpOptions)
      .where(eq(wpOptions.optionName, REDIRECTS_OPTION_NAME))
      .limit(1);

    if (row.length === 0 || !row[0].optionValue) {
      return [];
    }

    const parsed = JSON.parse(row[0].optionValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Saves redirects array back to wp_options
 */
async function saveAllRedirects(items: RedirectItem[]): Promise<void> {
  const jsonStr = JSON.stringify(items);
  const existing = await db
    .select({ optionId: wpOptions.optionId })
    .from(wpOptions)
    .where(eq(wpOptions.optionName, REDIRECTS_OPTION_NAME))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(wpOptions)
      .set({ optionValue: jsonStr })
      .where(eq(wpOptions.optionName, REDIRECTS_OPTION_NAME));
  } else {
    await db.insert(wpOptions).values({
      optionName: REDIRECTS_OPTION_NAME,
      optionValue: jsonStr,
      autoload: "yes",
    });
  }
}

/**
 * Finds a matching redirect for a given URL path
 */
export async function findMatchingRedirect(path: string): Promise<RedirectItem | null> {
  const normalized = normalizePath(path);
  const list = await getAllRedirects();
  return list.find((item) => normalizePath(item.sourcePath) === normalized) || null;
}

/**
 * Creates a new redirect
 */
export async function createRedirect(
  data: Omit<RedirectItem, "id" | "hits" | "createdAt" | "lastAccessedAt">
): Promise<RedirectItem> {
  const list = await getAllRedirects();
  const normalizedSource = normalizePath(data.sourcePath);

  // Check duplicate
  const exists = list.some((item) => normalizePath(item.sourcePath) === normalizedSource);
  if (exists) {
    throw new Error(`A redirect for source path "${data.sourcePath}" already exists.`);
  }

  const newItem: RedirectItem = {
    id: `redir-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    sourcePath: normalizedSource,
    targetUrl: data.targetUrl.trim(),
    statusCode: data.statusCode || 301,
    notes: data.notes?.trim() || "",
    hits: 0,
    createdAt: new Date().toISOString(),
  };

  list.unshift(newItem);
  await saveAllRedirects(list);
  return newItem;
}

/**
 * Updates an existing redirect
 */
export async function updateRedirect(
  id: string,
  data: Partial<Omit<RedirectItem, "id" | "hits" | "createdAt">>
): Promise<RedirectItem> {
  const list = await getAllRedirects();
  const idx = list.findIndex((item) => item.id === id);
  if (idx === -1) {
    throw new Error("Redirect not found.");
  }

  const current = list[idx];
  const updated: RedirectItem = {
    ...current,
    sourcePath: data.sourcePath ? normalizePath(data.sourcePath) : current.sourcePath,
    targetUrl: data.targetUrl ? data.targetUrl.trim() : current.targetUrl,
    statusCode: data.statusCode || current.statusCode,
    notes: data.notes !== undefined ? data.notes.trim() : current.notes,
  };

  list[idx] = updated;
  await saveAllRedirects(list);
  return updated;
}

/**
 * Deletes a redirect
 */
export async function deleteRedirect(id: string): Promise<boolean> {
  const list = await getAllRedirects();
  const filtered = list.filter((item) => item.id !== id);
  if (filtered.length === list.length) {
    return false;
  }
  await saveAllRedirects(filtered);
  return true;
}

/**
 * Increments hit count and updates last accessed date
 */
export async function recordRedirectHit(id: string): Promise<void> {
  try {
    const list = await getAllRedirects();
    const item = list.find((i) => i.id === id);
    if (item) {
      item.hits = (item.hits || 0) + 1;
      item.lastAccessedAt = new Date().toISOString();
      await saveAllRedirects(list);
    }
  } catch {
    // Non-blocking for performance
  }
}
