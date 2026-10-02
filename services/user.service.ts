import { count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { DB, db } from "@/db";
import { user } from "@/db/schema/auth-schema";
import { wpPosts } from "@/db/schema/cms-posts";
import { wpOptions } from "@/db/schema/cms-options";
import { getOption } from "@/services/settings.service";

export interface UserItem {
  id: string;
  name: string | null;
  email: string;
  role: string;
  image: string | null;
  emailVerified: boolean;
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
  twoFactorEnabled: boolean | null;
  createdAt: Date;
  _count: {
    posts: number;
    comments: number;
  };
}

export interface UserRoleOption {
  value: string;
  label: string;
  isDefault?: boolean;
}

export interface Counts {
  all: number;
  byRole: Record<string, number>;
}

export interface UsersListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}

export { generateSecurePassword } from "@/lib/password";

export async function getAvailableRoles(database: DB = db): Promise<UserRoleOption[]> {
  const defaultRoles: UserRoleOption[] = [
    { value: "admin", label: "Administrator", isDefault: true },
    { value: "editor", label: "Editor", isDefault: true },
    { value: "author", label: "Author", isDefault: true },
    { value: "contributor", label: "Contributor", isDefault: true },
    { value: "subscriber", label: "Subscriber", isDefault: true },
    { value: "user", label: "User", isDefault: true },
  ];

  try {
    const raw = await getOption("cms_custom_roles", "[]", database);
    let customRoles: UserRoleOption[] = [];
    try {
      customRoles = JSON.parse(raw);
    } catch {}

    const existingValues = new Set(defaultRoles.map((r) => r.value));
    const merged = [...defaultRoles];

    for (const r of customRoles) {
      if (r.value && !existingValues.has(r.value)) {
        merged.push({ ...r, isDefault: false });
        existingValues.add(r.value);
      }
    }

    return merged;
  } catch {
    return defaultRoles;
  }
}

export async function getUsersCounts(database: DB = db): Promise<Counts> {
  const [totalRes] = await database.select({ count: count() }).from(user);
  const total = Number(totalRes?.count || 0);

  const roleCounts = await database
    .select({
      role: user.role,
      count: count(),
    })
    .from(user)
    .groupBy(user.role);

  const byRole: Record<string, number> = {};
  for (const r of roleCounts) {
    if (r.role) {
      byRole[r.role] = Number(r.count || 0);
    }
  }

  return {
    all: total,
    byRole,
  };
}

export async function getUsersList(
  { page = 1, limit = 20, search, role }: UsersListParams,
  database: DB = db
) {
  const conditions = [];

  if (search && search.trim()) {
    const q = `%${search.trim()}%`;
    conditions.push(or(ilike(user.name, q), ilike(user.email, q)));
  }

  if (role && role !== "ALL") {
    conditions.push(eq(user.role, role));
  }

  const whereClause = conditions.length > 0 ? or(...conditions) : undefined;

  const [countRes] = await database
    .select({ count: count() })
    .from(user)
    .where(whereClause);

  const total = Number(countRes?.count || 0);
  const pages = Math.ceil(total / limit) || 1;
  const safePage = Math.max(1, Math.min(page, pages));
  const offset = (safePage - 1) * limit;

  const usersList = await database
    .select()
    .from(user)
    .where(whereClause)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(user.createdAt));

  const userIds = usersList.map((u) => u.id);

  const postCounts =
    userIds.length > 0
      ? await database
          .select({
            authorId: wpPosts.postAuthor,
            count: count(),
          })
          .from(wpPosts)
          .where(inArray(wpPosts.postAuthor, userIds))
          .groupBy(wpPosts.postAuthor)
      : [];

  const postCountMap = new Map(
    postCounts.map((p) => [p.authorId, Number(p.count)])
  );

  const mappedUsers: UserItem[] = usersList.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role || "subscriber",
    image: u.image,
    emailVerified: u.emailVerified,
    banned: u.banned,
    banReason: u.banReason,
    banExpires: u.banExpires,
    twoFactorEnabled: u.twoFactorEnabled,
    createdAt: u.createdAt,
    _count: {
      posts: postCountMap.get(u.id) || 0,
      comments: 0,
    },
  }));

  return {
    users: mappedUsers,
    total,
    pages,
    currentPage: safePage,
  };
}

export async function getUserById(id: string, database: DB = db) {
  const [found] = await database.select().from(user).where(eq(user.id, id)).limit(1);
  return found || null;
}

export async function updateUser(
  data: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    role: string;
    emailVerified: boolean;
    banned?: boolean | null;
    banReason?: string | null;
    banExpires?: Date | null;
    twoFactorEnabled?: boolean | null;
  },
  database: DB = db
) {
  await database
    .update(user)
    .set({
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      image: data.image ? data.image.trim() : null,
      role: data.role,
      emailVerified: data.emailVerified,
      banned: data.banned ?? false,
      banReason: data.banned ? data.banReason : null,
      banExpires: data.banned && data.banExpires ? data.banExpires : null,
      twoFactorEnabled: data.twoFactorEnabled ?? false,
      updatedAt: new Date(),
    })
    .where(eq(user.id, data.id));

  return { success: true };
}

export async function updateUserRole(userId: string, role: string, database: DB = db) {
  await database
    .update(user)
    .set({ role, updatedAt: new Date() })
    .where(eq(user.id, userId));
  return { success: true };
}

export async function bulkUpdateUsersRole(
  userIds: string[],
  role: string,
  database: DB = db
) {
  if (!userIds.length) return { success: false, error: "No users provided." };

  await database
    .update(user)
    .set({ role, updatedAt: new Date() })
    .where(inArray(user.id, userIds));
  return { success: true, count: userIds.length };
}

export async function deleteUser(userId: string, database: DB = db) {
  await database.delete(user).where(eq(user.id, userId));
  return { success: true };
}

export async function bulkDeleteUsers(userIds: string[], database: DB = db) {
  if (!userIds.length) return { success: false, error: "No users provided." };

  await database.delete(user).where(inArray(user.id, userIds));
  return { success: true, count: userIds.length };
}

export async function addCustomRole(
  value: string,
  label: string,
  database: DB = db
) {
  const cleanVal = value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
  if (!cleanVal || !label.trim()) {
    throw new Error("Invalid role value or label.");
  }

  const raw = await getOption("cms_custom_roles", "[]", database);
  let currentCustom: UserRoleOption[] = [];
  try {
    currentCustom = JSON.parse(raw);
  } catch {}

  if (currentCustom.some((r) => r.value === cleanVal)) {
    throw new Error("Role already exists.");
  }

  currentCustom.push({ value: cleanVal, label: label.trim() });
  await database
    .insert(wpOptions)
    .values({
      optionName: "cms_custom_roles",
      optionValue: JSON.stringify(currentCustom),
      autoload: "yes",
    })
    .onConflictDoUpdate({
      target: wpOptions.optionName,
      set: { optionValue: JSON.stringify(currentCustom) },
    });

  return await getAvailableRoles(database);
}

export async function deleteCustomRole(value: string, database: DB = db) {
  if (
    [
      "admin",
      "editor",
      "author",
      "contributor",
      "subscriber",
      "user",
    ].includes(value)
  ) {
    throw new Error("Default roles cannot be deleted.");
  }

  const raw = await getOption("cms_custom_roles", "[]", database);
  let currentCustom: UserRoleOption[] = [];
  try {
    currentCustom = JSON.parse(raw);
  } catch {}

  const filtered = currentCustom.filter((r) => r.value !== value);
  await database
    .insert(wpOptions)
    .values({
      optionName: "cms_custom_roles",
      optionValue: JSON.stringify(filtered),
      autoload: "yes",
    })
    .onConflictDoUpdate({
      target: wpOptions.optionName,
      set: { optionValue: JSON.stringify(filtered) },
    });

  return await getAvailableRoles(database);
}
