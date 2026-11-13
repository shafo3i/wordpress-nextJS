import { z } from "zod";
import { createInsertSchema } from "drizzle-orm/zod";
import { user } from "./auth-schema";

export const SYSTEM_USER_ROLES = [
  "admin",
  "editor",
  "author",
  "contributor",
  "subscriber",
  "user",
] as const;
export const userIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[a-zA-Z0-9_-]+$/);
export const userRoleKeySchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[a-z][a-z0-9_-]*$/)
  .refine(
    (value) => !["__proto__", "prototype", "constructor"].includes(value)
  );
export const managedPasswordSchema = z.string().min(12).max(128);
const optionalPasswordSchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  managedPasswordSchema.optional()
);
const userFields = createInsertSchema(user, {
  name: () => z.string().trim().min(1).max(200),
  email: () => z.string().trim().toLowerCase().email().max(254),
  image: () =>
    z
      .string()
      .trim()
      .max(2048)
      .refine((value) => {
        if (value.startsWith("/uploads/") && !/[\\\s]/.test(value)) return true;
        try {
          const url = new URL(value);
          return (
            ["https:", "http:"].includes(url.protocol) &&
            !url.username &&
            !url.password
          );
        } catch {
          return false;
        }
      })
      .nullable()
      .optional(),
  role: () => userRoleKeySchema,
  emailVerified: () => z.boolean(),
  banned: () => z.boolean().optional(),
  banReason: () => z.string().trim().max(1000).nullable().optional(),
  banExpires: () =>
    z
      .date()
      .refine((value) => Number.isFinite(value.getTime()))
      .nullable()
      .optional(),
});
export const createManagedUserSchema = userFields
  .pick({ name: true, email: true, role: true, emailVerified: true })
  .extend({
    role: userRoleKeySchema,
    emailVerified: z.boolean().default(false),
    customPassword: optionalPasswordSchema,
    sendEmailNotification: z.boolean().optional(),
  })
  .strict();
export const updateManagedUserSchema = userFields
  .pick({
    name: true,
    email: true,
    image: true,
    role: true,
    emailVerified: true,
    banned: true,
    banReason: true,
    banExpires: true,
  })
  .extend({
    id: userIdSchema,
    role: userRoleKeySchema,
    banned: z.boolean().optional(),
  })
  .strict();
export const userIdsSchema = z
  .array(userIdSchema)
  .min(1)
  .max(100)
  .transform((ids) => [...new Set(ids)]);
export const userRoleChangeSchema = z
  .object({ userIds: userIdsSchema, role: userRoleKeySchema })
  .strict();
export const resetManagedPasswordSchema = z
  .object({
    userId: userIdSchema,
    newPassword: optionalPasswordSchema,
    sendEmailNotification: z.boolean().optional(),
  })
  .strict();
export const customUserRoleSchema = z.object({
  value: userRoleKeySchema,
  label: z.string().trim().min(1).max(100),
});
export const customUserRolesSchema = z.array(customUserRoleSchema).max(50);
export const usersListSchema = z.object({
  page: z.number().int().min(1).max(100000).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(200).optional(),
  role: z.preprocess(
    (value) =>
      value === "all" || value === "ALL" || value === "" ? undefined : value,
    userRoleKeySchema.optional()
  ),
});
export type CreateManagedUserInput = z.input<typeof createManagedUserSchema>;
export type UpdateManagedUserInput = z.input<typeof updateManagedUserSchema>;
