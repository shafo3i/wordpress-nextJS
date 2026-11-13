"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { verifyAdmin } from "@/lib/authMIddleware";
import { getAdminLanguageContext } from "@/components/admin/admin-shell";
import { getEmailLanguage } from "@/lib/email-language";
import { env } from "@/lib/env";
import {
  UserManagementError,
  createManagedUser,
  resetManagedUserPassword,
  updateUser,
  updateUserRole,
  bulkUpdateUsersRole,
  deleteUser,
  bulkDeleteUsers,
  addCustomRole,
  deleteCustomRole,
  type UserRoleOption,
} from "@/services/user.service";
import {
  createManagedUserSchema,
  resetManagedPasswordSchema,
  type CreateManagedUserInput,
  type UpdateManagedUserInput,
} from "@/db/schema/cms-users";

export type ActionResult<T = object> =
  ({ success: true; warning?: string } & T) | { success: false; error: string };

async function mutation<T extends object>(
  operation: () => Promise<T>
): Promise<ActionResult<T>> {
  await verifyAdmin();
  try {
    const result = await operation();
    revalidatePath("/admincp/users");
    return { success: true, ...result };
  } catch (error) {
    unstable_rethrow(error);
    const { dict } = await getAdminLanguageContext();
    const key =
      error instanceof UserManagementError
        ? error.key
        : error instanceof ZodError
          ? "admin.users.security.invalid"
          : "admin.users.security.failed";
    return {
      success: false,
      error: dict[key] || dict["admin.users.security.failed"] || "",
    };
  }
}
async function notifyPasswordSetup(email: string): Promise<string | undefined> {
  try {
    const language = await getEmailLanguage();
    const redirectTo = new URL("/password-reset", env.NEXT_PUBLIC_APP_URL);
    redirectTo.searchParams.set("lang", language.code);
    // Send an expiring reset link through the existing escaped/localized mail
    // flow. Never place the account's password in an email.
    await auth.api.requestPasswordReset({
      body: { email, redirectTo: redirectTo.href },
    });
  } catch {
    const { dict } = await getAdminLanguageContext();
    return dict["admin.users.security.email_failed"] || "";
  }
}
export async function createUserAction(
  input: CreateManagedUserInput
): Promise<ActionResult<{ id: string; plainPassword: string }>> {
  return mutation(async () => {
    const data = createManagedUserSchema.parse(input);
    const result = await createManagedUser(data);
    const warning = data.sendEmailNotification
      ? await notifyPasswordSetup(result.email)
      : undefined;
    return {
      id: result.id,
      plainPassword: result.plainPassword,
      ...(warning ? { warning } : {}),
    };
  });
}
export async function updateUserAction(
  data: UpdateManagedUserInput
): Promise<ActionResult> {
  return mutation(async () => {
    await updateUser(data);
    return {};
  });
}
export async function resetPasswordAction(input: {
  userId: string;
  newPassword?: string;
  sendEmailNotification?: boolean;
}): Promise<ActionResult<{ plainPassword: string }>> {
  return mutation(async () => {
    const data = resetManagedPasswordSchema.parse(input);
    const result = await resetManagedUserPassword(data);
    const warning = data.sendEmailNotification
      ? await notifyPasswordSetup(result.email)
      : undefined;
    return {
      plainPassword: result.plainPassword,
      ...(warning ? { warning } : {}),
    };
  });
}
export async function deleteUserAction(userId: string): Promise<ActionResult> {
  return mutation(async () => {
    await deleteUser(userId);
    return {};
  });
}
export async function bulkDeleteUsersAction(
  userIds: string[]
): Promise<ActionResult<{ count: number }>> {
  return mutation(async () => {
    const result = await bulkDeleteUsers(userIds);
    return { count: result.count };
  });
}
export async function updateUserRoleAction(
  userId: string,
  role: string
): Promise<ActionResult> {
  return mutation(async () => {
    await updateUserRole(userId, role);
    return {};
  });
}
export async function bulkUpdateUsersRoleAction(
  userIds: string[],
  role: string
): Promise<ActionResult<{ count: number }>> {
  return mutation(async () => {
    const result = await bulkUpdateUsersRole(userIds, role);
    return { count: result.count };
  });
}
export async function addRoleAction(
  valueOrObject: string | { value: string; label: string },
  label?: string
): Promise<ActionResult<{ roles: UserRoleOption[] }>> {
  return mutation(async () => ({
    roles: await addCustomRole(
      typeof valueOrObject === "string" ? valueOrObject : valueOrObject.value,
      typeof valueOrObject === "string"
        ? label || valueOrObject
        : valueOrObject.label
    ),
  }));
}
export async function deleteRoleAction(
  value: string
): Promise<ActionResult<{ roles: UserRoleOption[] }>> {
  return mutation(async () => ({ roles: await deleteCustomRole(value) }));
}
