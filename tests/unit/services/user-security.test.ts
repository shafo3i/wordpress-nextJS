import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import { verifyPassword } from "better-auth/crypto";
import type { DB } from "@/db";
import {
  user,
  account,
  session,
  rateLimit,
  verification,
} from "@/db/schema/auth-schema";
import { wpOptions } from "@/db/schema/cms-options";
const mocks = vi.hoisted(() => ({ guard: vi.fn(), breached: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/db", () => ({ db: {} }));
vi.mock("@/lib/authMIddleware", () => ({ verifyAdmin: mocks.guard }));
vi.mock("better-auth/plugins/haveibeenpwned", () => ({
  isPasswordCompromised: mocks.breached,
}));
import {
  createManagedUser,
  updateUser,
  updateUserRole,
  bulkUpdateUsersRole,
  deleteUser,
  bulkDeleteUsers,
  resetManagedUserPassword,
  addCustomRole,
  deleteCustomRole,
  getAvailableRoles,
  getUsersCounts,
  getUsersList,
  getUserById,
} from "@/services/user.service";
import {
  createManagedUserSchema,
  updateManagedUserSchema,
  userRoleChangeSchema,
  usersListSchema,
  customUserRoleSchema,
} from "@/db/schema/cms-users";

const administrator = {
  id: "admin-1",
  name: "Admin",
  email: "admin@example.test",
  role: "admin",
  image: null,
  emailVerified: true,
  banned: false,
  banReason: null,
  banExpires: null,
  twoFactorEnabled: true,
  createdAt: new Date(),
};
const target = {
  ...administrator,
  id: "user-2",
  email: "reader@example.test",
  role: "subscriber",
};
const password = "UniqueAdminFixture123!";
type Write = {
  table: unknown;
  values?: Record<string, unknown>;
  sql?: string;
  params?: unknown[];
};
function fixture(rows: unknown[][], quota = 1, failAccount = false) {
  type Chain = {
    from: () => Chain;
    where: (condition: SQL) => Chain;
    limit: () => Chain;
    offset: () => Chain;
    orderBy: () => Chain;
    groupBy: () => Chain;
    then: Promise<unknown[]>["then"];
  };
  const writes: Write[] = [],
    predicates: { sql: string; params: unknown[] }[] = [],
    projections: unknown[] = [];
  const dialect = new PgDialect();
  let commits = 0,
    rollbacks = 0;
  const tx = {
    execute: vi.fn().mockResolvedValue(undefined),
    select: vi.fn((fields: unknown) => {
      projections.push(fields);
      const next = rows.shift();
      if (!next) throw new Error("Unexpected query");
      const pending = Promise.resolve(next);
      const chain: Chain = {
        from: () => chain,
        limit: () => chain,
        offset: () => chain,
        orderBy: () => chain,
        groupBy: () => chain,
        where: (condition) => {
          predicates.push(dialect.sqlToQuery(condition));
          return chain;
        },
        then: pending.then.bind(pending),
      };
      return chain;
    }),
    insert: vi.fn((table: unknown) => ({
      values: (values: Record<string, unknown>) => {
        writes.push({ table, values });
        const pending = () =>
          failAccount && table === account
            ? Promise.reject(new Error("account-write-failed"))
            : Promise.resolve(undefined);
        const builder = {
          then: <T>(
            resolve: (value: undefined) => T,
            reject: (error: unknown) => T
          ) => pending().then(resolve, reject),
          onConflictDoUpdate: () => builder,
          returning: async () => [{ count: quota }],
        };
        return builder;
      },
    })),
    update: vi.fn((table: unknown) => ({
      set: (values: Record<string, unknown>) => ({
        where: async (condition: SQL) => {
          writes.push({ table, values, ...dialect.sqlToQuery(condition) });
        },
      }),
    })),
    delete: vi.fn((table: unknown) => ({
      where: async (condition: SQL) => {
        writes.push({ table, ...dialect.sqlToQuery(condition) });
      },
    })),
  };
  const transaction = vi.fn(
    async (operation: (value: typeof tx) => unknown) => {
      try {
        const result = await operation(tx);
        commits++;
        return result;
      } catch (error) {
        rollbacks++;
        throw error;
      }
    }
  );
  return {
    database: { ...tx, transaction } as unknown as DB,
    tx,
    writes,
    predicates,
    projections,
    transaction,
    commits: () => commits,
    rollbacks: () => rollbacks,
  };
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.guard.mockResolvedValue({
    user: { id: administrator.id, role: "admin" },
  });
  mocks.breached.mockResolvedValue(false);
});
describe("user management authorization and validation", () => {
  it("guards every read and mutation before database access", async () => {
    mocks.guard.mockRejectedValue(new Error("Forbidden"));
    const test = fixture([]);
    const operations = [
      () => getAvailableRoles(test.database),
      () => getUsersCounts(test.database),
      () => getUsersList({}, test.database),
      () => getUserById("user-2", test.database),
      () =>
        createManagedUser(
          { name: "Reader", email: target.email, role: "subscriber" },
          test.database
        ),
      () =>
        updateUser(
          {
            id: target.id,
            name: target.name,
            email: target.email,
            role: "subscriber",
            emailVerified: true,
          },
          test.database
        ),
      () => updateUserRole(target.id, "admin", test.database),
      () => bulkUpdateUsersRole([target.id], "admin", test.database),
      () => deleteUser(target.id, test.database),
      () => bulkDeleteUsers([target.id], test.database),
      () => resetManagedUserPassword({ userId: target.id }, test.database),
      () => addCustomRole("reviewer", "Reviewer", test.database),
      () => deleteCustomRole("reviewer", test.database),
    ];
    for (const operation of operations)
      await expect(operation()).rejects.toThrow("Forbidden");
    expect(test.tx.select).not.toHaveBeenCalled();
    expect(test.transaction).not.toHaveBeenCalled();
    expect(mocks.breached).not.toHaveBeenCalled();
  });
  it("rechecks the acting administrator inside the transaction", async () => {
    const test = fixture([[{ ...administrator, role: "editor" }]]);
    await expect(deleteUser(target.id, test.database)).rejects.toThrow(
      "forbidden"
    );
    expect(test.writes).toEqual([]);
  });
  it("rejects missing users and malformed batches without partial deletion", async () => {
    const test = fixture([[administrator], [target]]);
    await expect(
      bulkDeleteUsers([target.id, "missing"], test.database)
    ).rejects.toThrow("not_found");
    expect(test.writes).toEqual([]);
    const invalid = fixture([]);
    await expect(
      bulkDeleteUsers(Array(101).fill(target.id), invalid.database)
    ).rejects.toThrow();
    expect(invalid.transaction).not.toHaveBeenCalled();
  });
  it.each(["delete", "bulk-delete", "demote", "ban", "unverify"])(
    "prevents administrator self lockout through %s",
    async (operation) => {
      const test = fixture([[administrator], [administrator], []]);
      const update = {
        id: administrator.id,
        name: administrator.name,
        email: administrator.email,
        role: "admin",
        emailVerified: true,
      };
      const run =
        operation === "delete"
          ? () => deleteUser(administrator.id, test.database)
          : operation === "bulk-delete"
            ? () => bulkDeleteUsers([administrator.id], test.database)
            : operation === "demote"
              ? () =>
                  updateUserRole(administrator.id, "subscriber", test.database)
              : () =>
                  updateUser(
                    {
                      ...update,
                      ...(operation === "ban"
                        ? { banned: true }
                        : { emailVerified: false }),
                    },
                    test.database
                  );
      await expect(run()).rejects.toThrow("self");
      expect(test.writes).toEqual([]);
    }
  );
  it("retains the last usable administrator when applying account changes", async () => {
    const test = fixture([
      [administrator],
      [{ ...target, role: "admin" }],
      [],
      [{ ...target, role: "admin" }],
    ]);
    await expect(
      updateUserRole(target.id, "subscriber", test.database)
    ).rejects.toThrow("last_admin");
    expect(test.writes).toEqual([]);
  });
  it("rejects unregistered roles", async () => {
    const test = fixture([[administrator], [target], []]);
    await expect(
      updateUserRole(target.id, "invented", test.database)
    ).rejects.toThrow("role_invalid");
    expect(test.writes).toEqual([]);
  });
  it("revokes sessions with role changes and counts distinct affected users", async () => {
    const test = fixture([[administrator], [target], [], [administrator]]);
    expect(
      await bulkUpdateUsersRole([target.id, target.id], "editor", test.database)
    ).toEqual({ success: true, count: 1 });
    expect(test.writes.map((write) => write.table)).toEqual([
      user,
      session,
      verification,
    ]);
    expect(test.writes[1].params).toContain(target.id);
    expect(test.commits()).toBe(1);
  });
  it("does not revoke sessions for an unchanged role", async () => {
    const test = fixture([
      [administrator],
      [administrator],
      [],
      [administrator],
    ]);
    expect(
      (await updateUserRole(administrator.id, "admin", test.database)).count
    ).toBe(0);
    expect(test.writes).toEqual([]);
  });
  it("preserves MFA and omitted account fields on an ordinary name edit", async () => {
    const test = fixture([[administrator], [target], [], [administrator]]);
    await updateUser(
      {
        id: target.id,
        name: "Renamed",
        email: target.email,
        role: target.role,
        emailVerified: true,
      },
      test.database
    );
    expect(test.writes).toHaveLength(1);
    expect(test.writes[0].table).toBe(user);
    for (const field of [
      "twoFactorEnabled",
      "banned",
      "image",
      "banExpires",
      "banReason",
    ])
      expect(test.writes[0].values).not.toHaveProperty(field);
  });
  it("revokes sessions when banning an account", async () => {
    const test = fixture([[administrator], [target], [], [administrator]]);
    await updateUser(
      {
        id: target.id,
        name: target.name,
        email: target.email,
        role: target.role,
        emailVerified: true,
        banned: true,
      },
      test.database
    );
    expect(test.writes.map((write) => write.table)).toEqual([
      user,
      session,
      verification,
    ]);
  });
});
describe("account credentials", () => {
  it("creates the account atomically with a Better Auth compatible hash", async () => {
    const test = fixture([[administrator], [administrator], []]);
    const result = await createManagedUser(
      {
        name: " Reader ",
        email: "READER@example.test",
        role: "subscriber",
        customPassword: password,
      },
      test.database
    );
    expect(result.email).toBe(target.email);
    expect(result.plainPassword).toBe(password);
    const writes = test.writes.filter((write) => write.table !== rateLimit);
    expect(writes.map((write) => write.table)).toEqual([user, account]);
    expect(writes[0].values).toMatchObject({
      name: "Reader",
      role: "subscriber",
      emailVerified: false,
    });
    expect(writes[0].values).not.toHaveProperty("password");
    const hash = String(writes[1].values?.password);
    expect(hash).not.toBe(password);
    expect(await verifyPassword({ password, hash })).toBe(true);
    expect(test.commits()).toBe(2);
  });
  it("does not commit user creation if credential storage fails", async () => {
    const test = fixture([[administrator], [administrator], []], 1, true);
    await expect(
      createManagedUser(
        {
          name: "Reader",
          email: target.email,
          role: "subscriber",
          customPassword: password,
        },
        test.database
      )
    ).rejects.toThrow("account-write-failed");
    expect(test.commits()).toBe(1); // quota only
    expect(test.rollbacks()).toBe(1);
  });
  it("resets credentials and revokes sessions without modifying MFA", async () => {
    const test = fixture([
      [administrator],
      [administrator],
      [target],
      [{ id: "credential-1" }],
    ]);
    const result = await resetManagedUserPassword(
      { userId: target.id, newPassword: password },
      test.database
    );
    expect(result.email).toBe(target.email);
    const writes = test.writes.filter((write) => write.table !== rateLimit);
    expect(writes.map((write) => write.table)).toEqual([
      account,
      session,
      verification,
    ]);
    expect(
      await verifyPassword({
        password,
        hash: String(writes[0].values?.password),
      })
    ).toBe(true);
    expect(writes[1].params).toEqual([target.id]);
    expect(writes[2].params).toEqual([target.id, "reset-password:%"]);
  });
  it("blocks excessive credential operations before checking or hashing passwords", async () => {
    const test = fixture([[administrator]], 11);
    await expect(
      resetManagedUserPassword(
        { userId: target.id, newPassword: password },
        test.database
      )
    ).rejects.toThrow("rate_limited");
    expect(mocks.breached).not.toHaveBeenCalled();
    expect(test.commits()).toBe(1);
    expect(test.writes.map((write) => write.table)).toEqual([rateLimit]);
  });
  it("rejects breached passwords and keeps the attempt recorded", async () => {
    mocks.breached.mockResolvedValue(true);
    const test = fixture([[administrator]]);
    await expect(
      createManagedUser(
        {
          name: "Reader",
          email: target.email,
          role: "subscriber",
          customPassword: password,
        },
        test.database
      )
    ).rejects.toThrow("password_compromised");
    expect(test.commits()).toBe(1);
    expect(test.writes.map((write) => write.table)).toEqual([rateLimit]);
  });
  it("fails closed when the breach checking service is unavailable", async () => {
    mocks.breached.mockRejectedValue(new Error("network unavailable"));
    const test = fixture([[administrator]]);
    await expect(
      resetManagedUserPassword(
        { userId: target.id, newPassword: password },
        test.database
      )
    ).rejects.toThrow("password_check_failed");
    expect(test.writes.map((write) => write.table)).toEqual([rateLimit]);
  });
});
describe("role definitions and read boundaries", () => {
  it("cannot shadow a system role or delete a role currently assigned to users", async () => {
    const duplicate = fixture([[administrator], []]);
    await expect(
      addCustomRole("admin", "Pretend role", duplicate.database)
    ).rejects.toThrow("role_exists");
    const assigned = fixture([
      [administrator],
      [{ value: JSON.stringify([{ value: "reviewer", label: "Reviewer" }]) }],
      [{ id: target.id }],
    ]);
    await expect(
      deleteCustomRole("reviewer", assigned.database)
    ).rejects.toThrow("role_in_use");
    expect(duplicate.writes).toEqual([]);
    expect(assigned.writes).toEqual([]);
  });
  it("adds a bounded custom label without granting system privileges", async () => {
    const test = fixture([[administrator], []]);
    const roles = await addCustomRole(
      "reviewer",
      "<script>Label</script>",
      test.database
    );
    expect(roles.find((role) => role.value === "reviewer")).toEqual({
      value: "reviewer",
      label: "<script>Label</script>",
      isDefault: false,
    });
    expect(test.writes.map((write) => write.table)).toEqual([wpOptions]);
  });
  it("combines search and role with AND and selects a bounded safe projection", async () => {
    const test = fixture([[{ count: 0 }], []]);
    await getUsersList(
      { search: "name", role: "editor", limit: 20 },
      test.database
    );
    expect(test.predicates[0].sql).toContain(" and ");
    expect(test.predicates[0].params).toEqual(["%name%", "%name%", "editor"]);
    expect(test.projections[1]).toHaveProperty("twoFactorEnabled");
    for (const key of [
      "password",
      "secret",
      "token",
      "backupCodes",
      "accessToken",
    ])
      expect(test.projections[1]).not.toHaveProperty(key);
    const invalid = fixture([]);
    await expect(
      getUsersList({ limit: 1000000 }, invalid.database)
    ).rejects.toThrow();
    expect(invalid.tx.select).not.toHaveBeenCalled();
  });
});
describe("user input schemas", () => {
  it("rejects privilege, MFA, URL and size tampering", () => {
    const input = { name: "Reader", email: target.email, role: "subscriber" };
    for (const patch of [
      { role: "admin,user" },
      { role: ["admin"] },
      { role: null },
      { name: " " },
      { email: "bad" },
      { customPassword: "short" },
      { twoFactorEnabled: false },
      { banned: true },
    ])
      expect(
        createManagedUserSchema.safeParse({ ...input, ...patch }).success
      ).toBe(false);
    expect(
      updateManagedUserSchema.safeParse({
        ...input,
        id: target.id,
        emailVerified: true,
        twoFactorEnabled: false,
      }).success
    ).toBe(false);
    expect(
      updateManagedUserSchema.safeParse({
        ...input,
        id: target.id,
        emailVerified: true,
        image: "javascript:alert(1)",
      }).success
    ).toBe(false);
    expect(
      userRoleChangeSchema.safeParse({
        userIds: Array(101).fill(target.id),
        role: "admin",
      }).success
    ).toBe(false);
    expect(usersListSchema.safeParse({ limit: -1 }).success).toBe(false);
    expect(
      customUserRoleSchema.safeParse({ value: "constructor", label: "Unsafe" })
        .success
    ).toBe(false);
  });
});
