// Skrip verifikasi: menandatangani token sesi memakai JWT_SECRET milik aplikasi,
// supaya pengujian UI bisa dijalankan tanpa mengetik password siapa pun.
import { SignJWT } from "jose";
import postgres from "postgres";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const sql = postgres(process.env.DATABASE_URL, { max: 1 });

const rows = await sql`select id, nama, email, role from "user" where email = ${"admin@inventaris.local"}`;
await sql.end();

const user = rows[0];
const token = await new SignJWT({ role: user.role, nama: user.nama, email: user.email })
  .setSubject(String(user.id))
  .setProtectedHeader({ alg: "HS256" })
  .setIssuedAt()
  .setExpirationTime("7d")
  .sign(secret);

console.log(`${user.id}\t${user.role}\t${user.nama}`);
console.log(token);
