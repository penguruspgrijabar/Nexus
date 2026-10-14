import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { signToken, verifyToken, type SessionUser } from "./jwt";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";

const TOKEN_KEY = "token";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 hari, sama dengan exp JWT

/** Ambil session user dari cookie JWT dan verifikasi status aktif di database; null bila tidak ada / invalid / non-aktif. */
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(TOKEN_KEY)?.value;
  if (!token) return null;
  try {
    const verified = await verifyToken(token);
    // Verifikasi status aktif & role terkini dari database (vuln-0001)
    const [freshUser] = await db
      .select({
        id: users.id,
        nama: users.nama,
        email: users.email,
        role: users.role,
        aktif: users.aktif,
      })
      .from(users)
      .where(eq(users.id, verified.sub))
      .limit(1);

    if (!freshUser || !freshUser.aktif) {
      return null;
    }

    return {
      sub: freshUser.id,
      nama: freshUser.nama,
      email: freshUser.email,
      role: freshUser.role,
    };
  } catch {
    return null;
  }
}

/**
 * Cookie "Secure" hanya dikirim browser di atas HTTPS. Akses LAN lewat http://<ip>:3000
 * akan tampak berhasil login tapi cookie-nya dibuang -> balik ke /login.
 * Set COOKIE_SECURE=false di .env untuk mode LAN; biarkan true bila di balik HTTPS.
 */
function cookieSecure(): boolean {
  if (process.env.COOKIE_SECURE !== undefined) return process.env.COOKIE_SECURE === "true";
  return process.env.NODE_ENV === "production";
}

export async function createSession(user: SessionUser): Promise<void> {
  const token = await signToken(user);
  (await cookies()).set(TOKEN_KEY, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(TOKEN_KEY);
}
