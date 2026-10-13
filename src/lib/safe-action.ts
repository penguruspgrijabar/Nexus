import {
  createSafeActionClient,
  returnServerError,
} from "next-safe-action";
import { getSession } from "@/server/auth/session";
import type { SessionUser } from "@/server/auth/jwt";

/** Client untuk aksi publik (login/logout) — tanpa cek session. */
export const publicActionClient = createSafeActionClient({
  defaultValidationErrorsShape: "flattened",
});

/**
 * Client utama: semua aksi wajib punya session JWT valid.
 * Bila tidak ada / token invalid → returnServerError("UNAUTHORIZED").
 */
export const actionClient = publicActionClient.use(async ({ next }) => {
  const user = await getSession();
  if (!user) returnServerError("UNAUTHORIZED");
  return next({ ctx: { user: user! } });
});

/** Middleware tambahan: gate berdasar role. */
export function roleAction(roles: SessionUser["role"][]) {
  return actionClient.use(async ({ next, ctx }) => {
    if (!ctx.user || !roles.includes(ctx.user.role)) returnServerError("FORBIDDEN");
    return next({ ctx });
  });
}

/** Khusus admin (kelola user + hapus ruangan). */
export const adminActionClient = roleAction(["admin"]);
/** Admin + operator (tulis barang & mutasi). */
export const operatorActionClient = roleAction(["admin", "operator"]);
