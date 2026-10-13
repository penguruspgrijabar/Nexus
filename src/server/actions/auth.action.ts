"use server";

import { eq } from "drizzle-orm";
import { returnServerError } from "next-safe-action";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { loginSchema } from "@/server/db/validation";
import { verifyPassword } from "@/server/auth/password";
import { createSession, destroySession } from "@/server/auth/session";
import { actionClient, publicActionClient } from "@/lib/safe-action";

export const loginAction = publicActionClient
  .inputSchema(loginSchema)
  .action(async ({ parsedInput }) => {
    const email = parsedInput.email.trim().toLowerCase();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user || !user.aktif) returnServerError("Email atau password salah");

    const valid = await verifyPassword(user.password, parsedInput.password);
    if (!valid) returnServerError("Email atau password salah");

    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    await createSession({
      sub: user.id,
      role: user.role,
      nama: user.nama,
      email: user.email,
    });

    return { id: user.id, nama: user.nama, role: user.role };
  });

export const logoutAction = publicActionClient.action(async () => {
  await destroySession();
  return { ok: true };
});

/** Aksi contoh yang dilindungi session — dipakai untuk cek session aktif. */
export const meAction = actionClient.action(async ({ ctx }) => ctx.user);
