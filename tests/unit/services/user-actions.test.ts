import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/templates/language/en.json";
const mocks = vi.hoisted(() => ({
  guard: vi.fn(),
  create: vi.fn(),
  reset: vi.fn(),
  update: vi.fn(),
  role: vi.fn(),
  roles: vi.fn(),
  remove: vi.fn(),
  bulkRemove: vi.fn(),
  addRole: vi.fn(),
  deleteRole: vi.fn(),
  notify: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("@/lib/authMIddleware", () => ({ verifyAdmin: mocks.guard }));
vi.mock("@/auth", () => ({
  auth: { api: { requestPasswordReset: mocks.notify } },
}));
vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_APP_URL: "https://site.test" },
}));
vi.mock("@/lib/email-language", () => ({
  getEmailLanguage: async () => ({ code: "ar" }),
}));
vi.mock("@/components/admin/admin-shell", () => ({
  getAdminLanguageContext: async () => ({ dict: en }),
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({ unstable_rethrow: () => {} }));
vi.mock("@/services/user.service", () => ({
  UserManagementError: class extends Error {},
  createManagedUser: mocks.create,
  resetManagedUserPassword: mocks.reset,
  updateUser: mocks.update,
  updateUserRole: mocks.role,
  bulkUpdateUsersRole: mocks.roles,
  deleteUser: mocks.remove,
  bulkDeleteUsers: mocks.bulkRemove,
  addCustomRole: mocks.addRole,
  deleteCustomRole: mocks.deleteRole,
}));
import {
  createUserAction,
  resetPasswordAction,
  updateUserAction,
  deleteUserAction,
  bulkDeleteUsersAction,
  updateUserRoleAction,
  bulkUpdateUsersRoleAction,
  addRoleAction,
  deleteRoleAction,
} from "@/app/(admin)/admincp/users/action";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.guard.mockResolvedValue({ user: { id: "admin-1", role: "admin" } });
  mocks.notify.mockResolvedValue({ status: true });
});
describe("user action security", () => {
  it("requires an administrator for every directly callable action", async () => {
    mocks.guard.mockRejectedValue(new Error("Forbidden"));
    const actions = [
      () =>
        createUserAction({
          name: "Reader",
          email: "reader@example.test",
          role: "admin",
        }),
      () => resetPasswordAction({ userId: "user-2" }),
      () =>
        updateUserAction({
          id: "user-2",
          name: "Reader",
          email: "reader@example.test",
          role: "admin",
          emailVerified: true,
        }),
      () => deleteUserAction("user-2"),
      () => bulkDeleteUsersAction(["user-2"]),
      () => updateUserRoleAction("user-2", "admin"),
      () => bulkUpdateUsersRoleAction(["user-2"], "admin"),
      () => addRoleAction("reviewer", "Reviewer"),
      () => deleteRoleAction("reviewer"),
    ];
    for (const action of actions)
      await expect(action()).rejects.toThrow("Forbidden");
    for (const service of [
      mocks.create,
      mocks.reset,
      mocks.update,
      mocks.role,
      mocks.roles,
      mocks.remove,
      mocks.bulkRemove,
      mocks.addRole,
      mocks.deleteRole,
      mocks.notify,
    ])
      expect(service).not.toHaveBeenCalled();
  });
  it("returns a minimal creation result and emails only a setup link", async () => {
    mocks.create.mockResolvedValue({
      id: "user-2",
      email: "reader@example.test",
      plainPassword: "NewPassword123!",
      secret: "never-return",
      user: { secret: "never-return" },
    });
    const result = await createUserAction({
      name: "Reader",
      email: "reader@example.test",
      role: "subscriber",
      sendEmailNotification: true,
    });
    expect(result).toEqual({
      success: true,
      id: "user-2",
      plainPassword: "NewPassword123!",
    });
    expect(mocks.notify).toHaveBeenCalledWith({
      body: {
        email: "reader@example.test",
        redirectTo: "https://site.test/password-reset?lang=ar",
      },
    });
    expect(JSON.stringify(mocks.notify.mock.calls)).not.toContain(
      "NewPassword123!"
    );
  });
  it("keeps a saved password reset successful if mail delivery fails", async () => {
    mocks.reset.mockResolvedValue({
      email: "reader@example.test",
      plainPassword: "NewPassword123!",
    });
    mocks.notify.mockRejectedValue(
      new Error("SMTP credentials or transport internals")
    );
    expect(
      await resetPasswordAction({
        userId: "user-2",
        sendEmailNotification: true,
      })
    ).toEqual({
      success: true,
      plainPassword: "NewPassword123!",
      warning: en["admin.users.security.email_failed"],
    });
  });
  it("does not disclose internal errors or send mail after a failed save", async () => {
    mocks.create.mockRejectedValue(new Error("SELECT private password hash"));
    expect(
      await createUserAction({
        name: "Reader",
        email: "reader@example.test",
        role: "subscriber",
        sendEmailNotification: true,
      })
    ).toEqual({ success: false, error: en["admin.users.security.failed"] });
    expect(mocks.notify).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});
