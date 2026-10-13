"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { returnServerError } from "next-safe-action";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { insertUserSchema, updateUserSchema } from "@/server/db/validation";
import { hashPassword } from "@/server/auth/password";
import { adminActionClient } from "@/lib/safe-action";

const updateUserInput = z.object({
  id: z.number().int().positive(),
  data: updateUserSchema.extend({
    password: z.string().min(8, "Password minimal 8 karakter").optional(),
  }),
});

export const createUserAction = adminActionClient
  .inputSchema(insertUserSchema)
  .action(async ({ parsedInput }) => {
    const email = parsedInput.email.trim().toLowerCase();

    const dup = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (dup.length) returnServerError("Email sudah terdaftar");

    const [user] = await db
      .insert(users)
      .values({
        ...parsedInput,
        email,
        password: await hashPassword(parsedInput.password),
      })
      .returning({
        id: users.id,
        nama: users.nama,
        email: users.email,
        role: users.role,
      });

    return { user };
  });

export const updateUserAction = adminActionClient
  .inputSchema(updateUserInput)
  .action(async ({ parsedInput }) => {
    const { id, data } = parsedInput;

    const [target] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!target) returnServerError("User tidak ditemukan");

    const { password, ...rest } = data;
    delete rest.id;
    delete rest.lastLoginAt;
    delete rest.createdAt;
    delete rest.updatedAt;

    if (rest.email !== undefined && rest.email !== null) {
      rest.email = rest.email.trim().toLowerCase();
      if (rest.email !== target.email) {
        const dup = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, rest.email))
          .limit(1);
        if (dup.length) returnServerError("Email sudah dipakai user lain");
      }
    }

    const values: Partial<typeof users.$inferInsert> = {
      ...rest,
      updatedAt: new Date(),
    };
    if (password) values.password = await hashPassword(password);

    const [user] = await db
      .update(users)
      .set(values)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        nama: users.nama,
        email: users.email,
        role: users.role,
        aktif: users.aktif,
      });

    return { user };
  });

export const toggleUserAction = adminActionClient
  .inputSchema(z.object({ id: z.number().int().positive() }))
  .action(async ({ parsedInput, ctx }) => {
    if (parsedInput.id === ctx.user.sub)
      returnServerError("Tidak bisa menonaktifkan akun sendiri");

    const [target] = await db
      .select()
      .from(users)
      .where(eq(users.id, parsedInput.id))
      .limit(1);
    if (!target) returnServerError("User tidak ditemukan");

    const [user] = await db
      .update(users)
      .set({ aktif: !target.aktif, updatedAt: new Date() })
      .where(eq(users.id, parsedInput.id))
      .returning({ id: users.id, aktif: users.aktif });

    return { id: user.id, aktif: user.aktif };
  });
