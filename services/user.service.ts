import "server-only";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { isPasswordCompromised } from "better-auth/plugins/haveibeenpwned";
import {
  and,
  count,
  desc,
  eq,
  ilike,
  inArray,
  like,
  or,
  sql,
} from "drizzle-orm";
import { type DB, db } from "@/db";
import {
  user,
  account,
  session,
  rateLimit,
  verification,
} from "@/db/schema/auth-schema";
import { wpPosts } from "@/db/schema/cms-posts";
import { wpOptions } from "@/db/schema/cms-options";
import { verifyAdmin } from "@/lib/authMIddleware";
import { generateSecurePassword } from "@/lib/password";
import {
  SYSTEM_USER_ROLES,
  createManagedUserSchema,
  updateManagedUserSchema,
  userIdSchema,
  userIdsSchema,
  userRoleChangeSchema,
  resetManagedPasswordSchema,
  customUserRoleSchema,
  customUserRolesSchema,
  usersListSchema,
  type CreateManagedUserInput,
  type UpdateManagedUserInput,
} from "@/db/schema/cms-users";

export { generateSecurePassword } from "@/lib/password";
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
const userFields = {
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  image: user.image,
  emailVerified: user.emailVerified,
  banned: user.banned,
  banReason: user.banReason,
  banExpires: user.banExpires,
  twoFactorEnabled: user.twoFactorEnabled,
  createdAt: user.createdAt,
};
type UserRow = Pick<typeof user.$inferSelect, keyof typeof userFields>;
export interface UserItem extends Omit<UserRow, "role"> {
  role: string;
  _count: { posts: number; comments: number };
}
export class UserManagementError extends Error {
  constructor(public readonly key: string) {
    super(key);
  }
}
const fail = (suffix: string): never => {
  throw new UserManagementError(`admin.users.security.${suffix}`);
};

function usableAdmin(
  value: Pick<UserRow, "role" | "emailVerified" | "banned" | "banExpires">
) {
  return (
    value.role === "admin" &&
    value.emailVerified &&
    (!value.banned ||
      (!!value.banExpires && value.banExpires.getTime() <= Date.now()))
  );
}
async function userTransaction<T>(
  database: DB,
  actorId: string,
  operation: (tx: DB) => Promise<T>
): Promise<T> {
  return database.transaction(async (transaction) => {
    const tx = transaction as unknown as DB;
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext('pressforge:user-management'))`
    );
    const [actor] = await tx
      .select(userFields)
      .from(user)
      .where(eq(user.id, actorId))
      .limit(1);
    if (!actor || !usableAdmin(actor)) fail("forbidden");
    return operation(tx);
  });
}
async function readCustomRoles(database: DB) {
  const [row] = await database
    .select({ value: wpOptions.optionValue })
    .from(wpOptions)
    .where(eq(wpOptions.optionName, "cms_custom_roles"))
    .limit(1);
  let parsed: unknown;
  try {
    parsed = JSON.parse(row?.value || "[]");
  } catch {
    return fail("roles_invalid");
  }
  const result = customUserRolesSchema.safeParse(parsed);
  if (!result.success) return fail("roles_invalid");
  const keys = result.data.map((role) => role.value);
  if (
    new Set(keys).size !== keys.length ||
    keys.some((key) => SYSTEM_USER_ROLES.some((role) => role === key))
  )
    fail("roles_invalid");
  return result.data;
}
async function reserveCredentialAttempt(database: DB, actorId: string) {
  // Commit the attempt independently so failed/compromised passwords still
  // consume the distributed quota. Never key this limit on spoofable headers.
  const allowed = await userTransaction(database, actorId, async (tx) => {
    const now = Date.now(),
      cutoff = now - 60000;
    const [row] = await tx
      .insert(rateLimit)
      .values({
        id: randomUUID(),
        key: `cms-user-credentials:${actorId}`,
        count: 1,
        lastRequest: now,
      })
      .onConflictDoUpdate({
        target: rateLimit.key,
        set: {
          count: sql`case when ${rateLimit.lastRequest} <= ${cutoff} then 1 else ${rateLimit.count} + 1 end`,
          lastRequest: sql`case when ${rateLimit.lastRequest} <= ${cutoff} then ${now} else ${rateLimit.lastRequest} end`,
        },
      })
      .returning({ count: rateLimit.count });
    return !!row && Number(row.count) <= 10;
  });
  if (!allowed) fail("rate_limited");
}
async function credentialHash(plainPassword: string) {
  let compromised: boolean;
  try {
    compromised = await isPasswordCompromised(plainPassword);
  } catch {
    return fail("password_check_failed");
  }
  if (compromised) fail("password_compromised");
  return hashPassword(plainPassword);
}
async function availableRoles(database: DB): Promise<UserRoleOption[]> {
  const custom = await readCustomRoles(database);
  return [
    ...SYSTEM_USER_ROLES.map((value) => ({
      value,
      label: value,
      isDefault: true,
    })),
    ...custom.map((role) => ({ ...role, isDefault: false })),
  ];
}
async function requireRole(role: string, database: DB) {
  if (!(await availableRoles(database)).some((item) => item.value === role))
    fail("role_invalid");
}
async function targets(ids: string[], database: DB): Promise<UserRow[]> {
  const rows = await database
    .select(userFields)
    .from(user)
    .where(inArray(user.id, ids));
  if (rows.length !== ids.length) fail("not_found");
  return rows;
}
async function protectAdministrators(
  tx: DB,
  actorId: string,
  rows: UserRow[],
  changes: Partial<UserRow>,
  deleting = false
) {
  if (
    rows.some((row) => row.id === actorId) &&
    (deleting ||
      (changes.role !== undefined && changes.role !== "admin") ||
      changes.banned === true ||
      changes.emailVerified === false)
  )
    fail("self");
  const admins = await tx
    .select(userFields)
    .from(user)
    .where(eq(user.role, "admin"));
  const affected = new Set(rows.map((row) => row.id));
  if (
    !admins.some((admin) =>
      !affected.has(admin.id)
        ? usableAdmin(admin)
        : !deleting && usableAdmin({ ...admin, ...changes })
    )
  )
    fail("last_admin");
}
async function revokeAccountAccess(tx: DB, ids: string[]) {
  await tx.delete(session).where(inArray(session.userId, ids));
  // Reset tokens issued before an administrative security change must not be
  // usable to replace the newly chosen credentials afterwards.
  await tx
    .delete(verification)
    .where(
      and(
        inArray(verification.value, ids),
        like(verification.identifier, "reset-password:%")
      )
    );
}

export async function getAvailableRoles(
  database: DB = db
): Promise<UserRoleOption[]> {
  await verifyAdmin();
  return availableRoles(database);
}
export async function getUsersCounts(database: DB = db): Promise<Counts> {
  await verifyAdmin();
  const [total] = await database.select({ count: count() }).from(user);
  const counts = await database
    .select({ role: user.role, count: count() })
    .from(user)
    .groupBy(user.role);
  return {
    all: Number(total?.count || 0),
    byRole: Object.fromEntries(
      counts
        .filter((row) => row.role)
        .map((row) => [row.role!, Number(row.count)])
    ),
  };
}
export async function getUsersList(
  input: UsersListParams = {},
  database: DB = db
) {
  await verifyAdmin();
  const { page, limit, search, role } = usersListSchema.parse(input);
  const conditions = [];
  if (search)
    conditions.push(
      or(ilike(user.name, `%${search}%`), ilike(user.email, `%${search}%`))
    );
  if (role) conditions.push(eq(user.role, role));
  const where = and(...conditions);
  const [countRes] = await database
    .select({ count: count() })
    .from(user)
    .where(where);
  const total = Number(countRes?.count || 0),
    pages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(page, pages);
  const rows = await database
    .select(userFields)
    .from(user)
    .where(where)
    .limit(limit)
    .offset((currentPage - 1) * limit)
    .orderBy(desc(user.createdAt), desc(user.id));
  const ids = rows.map((row) => row.id);
  const counts = ids.length
    ? await database
        .select({ authorId: wpPosts.postAuthor, count: count() })
        .from(wpPosts)
        .where(inArray(wpPosts.postAuthor, ids))
        .groupBy(wpPosts.postAuthor)
    : [];
  const byAuthor = new Map(
    counts.map((row) => [row.authorId, Number(row.count)])
  );
  const users: UserItem[] = rows.map((row) => ({
    ...row,
    role: row.role || "subscriber",
    _count: { posts: byAuthor.get(row.id) || 0, comments: 0 },
  }));
  return { users, total, pages, currentPage };
}
export async function getUserById(id: string, database: DB = db) {
  await verifyAdmin();
  const [row] = await database
    .select(userFields)
    .from(user)
    .where(eq(user.id, userIdSchema.parse(id)))
    .limit(1);
  return row || null;
}

export async function createManagedUser(
  input: CreateManagedUserInput,
  database: DB = db
) {
  const actor = await verifyAdmin();
  const data = createManagedUserSchema.parse(input);
  await reserveCredentialAttempt(database, actor.user.id);
  const plainPassword = data.customPassword || generateSecurePassword();
  const password = await credentialHash(plainPassword);
  return userTransaction(database, actor.user.id, async (tx) => {
    await requireRole(data.role, tx);
    const id = randomUUID();
    await tx
      .insert(user)
      .values({
        id,
        name: data.name,
        email: data.email,
        role: data.role,
        emailVerified: data.emailVerified,
      });
    await tx
      .insert(account)
      .values({
        id: randomUUID(),
        userId: id,
        accountId: id,
        providerId: "credential",
        password,
      });
    return { id, email: data.email, plainPassword };
  });
}
export async function updateUser(
  input: UpdateManagedUserInput,
  database: DB = db
) {
  const actor = await verifyAdmin();
  const data = updateManagedUserSchema.parse(input);
  return userTransaction(database, actor.user.id, async (tx) => {
    const [existing] = await targets([data.id], tx);
    await requireRole(data.role, tx);
    const changes = {
      name: data.name,
      email: data.email,
      role: data.role,
      emailVerified: data.emailVerified,
      ...(data.image !== undefined ? { image: data.image } : {}),
      ...(data.banned !== undefined ? { banned: data.banned } : {}),
      ...(data.banned === false
        ? { banReason: null, banExpires: null }
        : {
            ...(data.banReason !== undefined
              ? { banReason: data.banReason }
              : {}),
            ...(data.banExpires !== undefined
              ? { banExpires: data.banExpires }
              : {}),
          }),
    };
    await protectAdministrators(tx, actor.user.id, [existing], changes);
    await tx
      .update(user)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(user.id, data.id));
    if (
      existing.email !== changes.email ||
      existing.role !== changes.role ||
      existing.emailVerified !== changes.emailVerified ||
      (data.banned !== undefined && Boolean(existing.banned) !== data.banned) ||
      (data.banExpires !== undefined &&
        existing.banExpires?.getTime() !== data.banExpires?.getTime())
    ) {
      await revokeAccountAccess(tx, [data.id]);
    }
    return { success: true };
  });
}
export async function bulkUpdateUsersRole(
  userIds: string[],
  role: string,
  database: DB = db
) {
  const actor = await verifyAdmin();
  const data = userRoleChangeSchema.parse({ userIds, role });
  return userTransaction(database, actor.user.id, async (tx) => {
    const rows = await targets(data.userIds, tx);
    await requireRole(data.role, tx);
    await protectAdministrators(tx, actor.user.id, rows, { role: data.role });
    const changed = rows
      .filter((row) => row.role !== data.role)
      .map((row) => row.id);
    if (changed.length) {
      await tx
        .update(user)
        .set({ role: data.role, updatedAt: new Date() })
        .where(inArray(user.id, changed));
      await revokeAccountAccess(tx, changed);
    }
    return { success: true, count: changed.length };
  });
}
export async function updateUserRole(
  userId: string,
  role: string,
  database: DB = db
) {
  return bulkUpdateUsersRole([userId], role, database);
}
export async function bulkDeleteUsers(userIds: string[], database: DB = db) {
  const actor = await verifyAdmin();
  const ids = userIdsSchema.parse(userIds);
  return userTransaction(database, actor.user.id, async (tx) => {
    const rows = await targets(ids, tx);
    await protectAdministrators(tx, actor.user.id, rows, {}, true);
    await revokeAccountAccess(tx, ids);
    await tx.delete(user).where(inArray(user.id, ids));
    return { success: true, count: rows.length };
  });
}
export async function deleteUser(userId: string, database: DB = db) {
  return bulkDeleteUsers([userId], database);
}
export async function resetManagedUserPassword(
  input: {
    userId: string;
    newPassword?: string;
    sendEmailNotification?: boolean;
  },
  database: DB = db
) {
  const actor = await verifyAdmin();
  const data = resetManagedPasswordSchema.parse(input);
  await reserveCredentialAttempt(database, actor.user.id);
  const plainPassword = data.newPassword || generateSecurePassword();
  const password = await credentialHash(plainPassword);
  return userTransaction(database, actor.user.id, async (tx) => {
    const [target] = await targets([data.userId], tx);
    const [credential] = await tx
      .select({ id: account.id })
      .from(account)
      .where(
        and(
          eq(account.userId, data.userId),
          eq(account.providerId, "credential")
        )
      )
      .limit(1);
    if (credential)
      await tx
        .update(account)
        .set({ password, updatedAt: new Date() })
        .where(eq(account.id, credential.id));
    else
      await tx
        .insert(account)
        .values({
          id: randomUUID(),
          userId: data.userId,
          accountId: data.userId,
          providerId: "credential",
          password,
        });
    await revokeAccountAccess(tx, [data.userId]);
    return { email: target.email, plainPassword };
  });
}

async function saveCustomRoles(
  roles: { value: string; label: string }[],
  tx: DB
) {
  const optionValue = JSON.stringify(roles);
  await tx
    .insert(wpOptions)
    .values({ optionName: "cms_custom_roles", optionValue, autoload: "yes" })
    .onConflictDoUpdate({ target: wpOptions.optionName, set: { optionValue } });
}
export async function addCustomRole(
  value: string,
  label: string,
  database: DB = db
) {
  const actor = await verifyAdmin();
  const role = customUserRoleSchema.strict().parse({ value, label });
  return userTransaction(database, actor.user.id, async (tx) => {
    const roles = await readCustomRoles(tx);
    if (
      SYSTEM_USER_ROLES.some((value) => value === role.value) ||
      roles.some((item) => item.value === role.value)
    )
      fail("role_exists");
    const next = customUserRolesSchema.parse([...roles, role]);
    await saveCustomRoles(next, tx);
    return [
      ...SYSTEM_USER_ROLES.map((value) => ({
        value,
        label: value,
        isDefault: true,
      })),
      ...next.map((item) => ({ ...item, isDefault: false })),
    ];
  });
}
export async function deleteCustomRole(value: string, database: DB = db) {
  const actor = await verifyAdmin();
  const role = customUserRoleSchema.shape.value.parse(value);
  return userTransaction(database, actor.user.id, async (tx) => {
    if (SYSTEM_USER_ROLES.some((value) => value === role)) fail("system_role");
    const roles = await readCustomRoles(tx);
    if (!roles.some((item) => item.value === role)) fail("role_invalid");
    const [assigned] = await tx
      .select({ id: user.id })
      .from(user)
      .where(eq(user.role, role))
      .limit(1);
    if (assigned) fail("role_in_use");
    const next = roles.filter((item) => item.value !== role);
    await saveCustomRoles(next, tx);
    return [
      ...SYSTEM_USER_ROLES.map((value) => ({
        value,
        label: value,
        isDefault: true,
      })),
      ...next.map((item) => ({ ...item, isDefault: false })),
    ];
  });
}
