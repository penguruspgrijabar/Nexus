import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Next.js membaca .env otomatis; fallback untuk script (drizzle-kit / tsx)
const connectionString =
  process.env.DATABASE_URL ??
  "postgres://postgres:[REDACTED]@localhost:5432/inventaris";

// Supabase transaction pooler (PgBouncer) tidak mendukung prepared statements.
const client = postgres(connectionString, {
  max: 5,
  prepare: false,
});

export const db = drizzle(client, { schema });
export type DB = typeof db;
