"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import { getOption } from "@/services/settings.service";
import { sendEmail } from "@/lib/email";
import {
  generateSecurePassword,
  updateUser as updateUserInService,
  updateUserRole as updateRoleInService,
  bulkUpdateUsersRole as bulkUpdateRoleInService,
  deleteUser as deleteUserInService,
  bulkDeleteUsers as bulkDeleteInService,
  addCustomRole as addRoleInService,
  deleteCustomRole as deleteRoleInService,
} from "@/services/user.service";
import { db } from "@/db";
import { user } from "@/db/schema/auth-schema";
import { eq } from "drizzle-orm";

export type ActionResult<T = unknown> =
  | ({ success: true } & T)
  | { success: false; error: string };

export async function createUserAction({
  name,
  email,
  role,
  customPassword,
  sendEmailNotification,
  emailVerified = true,
}: {
  name: string;
  email: string;
  role: string;
  customPassword?: string;
  sendEmailNotification?: boolean;
  emailVerified?: boolean;
}): Promise<ActionResult<{ plainPassword: string; user: any }>> {
  await verifyAdminOrEditor();
  const plainPassword = customPassword || generateSecurePassword(14);

  try {
    const res = await auth.api.createUser({
      body: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: plainPassword,
        role: (role === "admin" ? "admin" : "user") as any,
      },
      headers: await headers(),
    });

    if (!res || !res.user) {
      return { success: false, error: "Failed to create user." };
    }

    // Set actual CMS role and emailVerified status
    await db
      .update(user)
      .set({
        role: role || "subscriber",
        ...(emailVerified ? { emailVerified: true } : {}),
      })
      .where(eq(user.id, res.user.id));

    if (sendEmailNotification) {
      try {
        const siteName = await getOption("blogname", "PressForge News");
        const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/cms-login`;
        await sendEmail({
          to: email.trim(),
          subject: `${siteName} - Your Account Credentials / بيانات حسابك`,
          html: `<div style="font-family:sans-serif;padding:16px;">
            <h2>Account Created / تم إنشاء الحساب</h2>
            <p>Your account has been created on <strong>${siteName}</strong>.</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Password:</strong> <code style="background:#f0f0f1;padding:3px 6px;border-radius:3px;">${plainPassword}</code></p>
            <p><a href="${loginUrl}" style="display:inline-block;padding:8px 16px;background:#2271b1;color:#fff;text-decoration:none;border-radius:4px;">Log In / تسجيل الدخول</a></p>
          </div>`,
          text: `Account created at ${siteName}. Email: ${email}, Password: ${plainPassword}, Login URL: ${loginUrl}`,
        });
      } catch (mailErr) {
        console.error("Failed to send welcome email:", mailErr);
      }
    }

    revalidatePath("/admincp/users");
    return {
      success: true,
      user: res.user,
      plainPassword,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to create user.",
    };
  }
}

export async function updateUserAction(data: {
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
}): Promise<ActionResult> {
  await verifyAdminOrEditor();

  try {
    await updateUserInService(data);
    revalidatePath("/admincp/users");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update user." };
  }
}

export async function resetPasswordAction({
  userId,
  newPassword,
  sendEmailNotification,
}: {
  userId: string;
  newPassword?: string;
  sendEmailNotification?: boolean;
}): Promise<ActionResult<{ plainPassword: string }>> {
  await verifyAdminOrEditor();
  const plainPassword = newPassword || generateSecurePassword(14);

  try {
    await auth.api.setUserPassword({
      body: {
        userId,
        newPassword: plainPassword,
      },
      headers: await headers(),
    });

    if (sendEmailNotification) {
      try {
        const [targetUser] = await db
          .select({ email: user.email })
          .from(user)
          .where(eq(user.id, userId))
          .limit(1);

        if (targetUser?.email) {
          const siteName = await getOption("blogname", "PressForge News");
          const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/cms-login`;
          await sendEmail({
            to: targetUser.email,
            subject: `${siteName} - Password Reset / إعادة تعيين كلمة المرور`,
            html: `<div style="font-family:sans-serif;padding:16px;">
              <h2>Password Reset / تم تعيين كلمة المرور</h2>
              <p>Your password for <strong>${siteName}</strong> has been updated by an administrator.</p>
              <p><strong>New Password:</strong> <code style="background:#f0f0f1;padding:3px 6px;border-radius:3px;">${plainPassword}</code></p>
              <p><a href="${loginUrl}" style="display:inline-block;padding:8px 16px;background:#2271b1;color:#fff;text-decoration:none;border-radius:4px;">Log In / تسجيل الدخول</a></p>
            </div>`,
            text: `Your password for ${siteName} has been reset. New Password: ${plainPassword}, Login URL: ${loginUrl}`,
          });
        }
      } catch (mailErr) {
        console.error("Failed to send password reset email:", mailErr);
      }
    }

    return { success: true, plainPassword };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to reset password." };
  }
}

export async function deleteUserAction(userId: string): Promise<ActionResult> {
  const session = await verifyAdminOrEditor();
  if (session.user.id === userId) {
    return { success: false, error: "You cannot delete your own account." };
  }

  try {
    await deleteUserInService(userId);
    revalidatePath("/admincp/users");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete user." };
  }
}

export async function bulkDeleteUsersAction(userIds: string[]): Promise<ActionResult<{ count: number }>> {
  const session = await verifyAdminOrEditor();
  const safeIds = userIds.filter((id) => id !== session.user.id);
  if (!safeIds.length) {
    return { success: false, error: "No eligible users to delete." };
  }

  try {
    await bulkDeleteInService(safeIds);
    revalidatePath("/admincp/users");
    return { success: true, count: safeIds.length };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete users." };
  }
}

export async function updateUserRoleAction(userId: string, role: string): Promise<ActionResult> {
  await verifyAdminOrEditor();
  try {
    await updateRoleInService(userId, role);
    revalidatePath("/admincp/users");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update role." };
  }
}

export async function bulkUpdateUsersRoleAction(userIds: string[], role: string): Promise<ActionResult<{ count: number }>> {
  await verifyAdminOrEditor();
  if (!userIds.length) return { success: false, error: "No users selected." };

  try {
    const res = await bulkUpdateRoleInService(userIds, role);
    revalidatePath("/admincp/users");
    return { success: true, count: res.count ?? userIds.length };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update roles." };
  }
}

export async function addRoleAction(valueOrObj: string | { value: string; label: string }, labelArg?: string): Promise<ActionResult<{ roles: any }>> {
  await verifyAdminOrEditor();
  const value = typeof valueOrObj === "string" ? valueOrObj : valueOrObj.value;
  const label = typeof valueOrObj === "string" ? labelArg || valueOrObj : valueOrObj.label;

  try {
    const roles = await addRoleInService(value, label);
    revalidatePath("/admincp/users");
    return { success: true, roles };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to add role." };
  }
}

export async function deleteRoleAction(value: string): Promise<ActionResult<{ roles: any }>> {
  await verifyAdminOrEditor();
  try {
    const roles = await deleteRoleInService(value);
    revalidatePath("/admincp/users");
    return { success: true, roles };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete role." };
  }
}
