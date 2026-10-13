"use server";

import { z } from "zod";
import { count, eq } from "drizzle-orm";
import { returnServerError } from "next-safe-action";
import { db } from "@/server/db";
import { barang, ruangan } from "@/server/db/schema";
import { insertRuanganSchema, updateRuanganSchema } from "@/server/db/validation";
import { adminActionClient, operatorActionClient } from "@/lib/safe-action";

async function generateKodeRuangan(): Promise<string> {
  const [{ total }] = await db.select({ total: count() }).from(ruangan);
  for (let i = total + 1; i <= total + 50; i++) {
    const kode = `R-${String(i).padStart(3, "0")}`;
    const exists = await db
      .select({ id: ruangan.id })
      .from(ruangan)
      .where(eq(ruangan.kodeRuangan, kode))
      .limit(1);
    if (!exists.length) return kode;
  }
  return `R-${Date.now()}`;
}

async function assertKodeRuanganUnik(kode: string): Promise<void> {
  const dup = await db
    .select({ id: ruangan.id })
    .from(ruangan)
    .where(eq(ruangan.kodeRuangan, kode))
    .limit(1);
  if (dup.length) returnServerError(`Kode ruangan "${kode}" sudah dipakai`);
}

export const createRuanganAction = operatorActionClient
  .inputSchema(insertRuanganSchema)
  .action(async ({ parsedInput }) => {
    let kode = parsedInput.kodeRuangan?.trim().toUpperCase() ?? "";
    if (kode) {
      await assertKodeRuanganUnik(kode);
    } else {
      kode = await generateKodeRuangan();
    }

    const [r] = await db
      .insert(ruangan)
      .values({
        ...parsedInput,
        kodeRuangan: kode,
        penanggungJawabId: parsedInput.penanggungJawabId ?? null,
      })
      .returning();

    return { ruangan: r };
  });

const updateRuanganInput = z.object({
  id: z.number().int().positive(),
  data: updateRuanganSchema,
});

export const updateRuanganAction = operatorActionClient
  .inputSchema(updateRuanganInput)
  .action(async ({ parsedInput }) => {
    const { id, data } = parsedInput;

    const [target] = await db
      .select()
      .from(ruangan)
      .where(eq(ruangan.id, id))
      .limit(1);
    if (!target) returnServerError("Ruangan tidak ditemukan");

    const safe = { ...data };
    delete safe.id;
    delete safe.createdAt;
    delete safe.updatedAt;

    if (safe.kodeRuangan) {
      const kode = safe.kodeRuangan.trim().toUpperCase();
      if (kode !== target.kodeRuangan) await assertKodeRuanganUnik(kode);
      safe.kodeRuangan = kode;
    }

    const [r] = await db
      .update(ruangan)
      .set({ ...safe, updatedAt: new Date() })
      .where(eq(ruangan.id, id))
      .returning();

    return { ruangan: r };
  });

export const deleteRuanganAction = adminActionClient
  .inputSchema(z.object({ id: z.number().int().positive() }))
  .action(async ({ parsedInput }) => {
    const [target] = await db
      .select()
      .from(ruangan)
      .where(eq(ruangan.id, parsedInput.id))
      .limit(1);
    if (!target) returnServerError("Ruangan tidak ditemukan");

    const [{ total }] = await db
      .select({ total: count() })
      .from(barang)
      .where(eq(barang.ruanganId, parsedInput.id));
    if (total > 0)
      returnServerError(
        `Ruangan masih berisi ${total} barang. Pindahkan barang dulu sebelum menghapus.`,
      );

    await db.delete(ruangan).where(eq(ruangan.id, parsedInput.id));
    return { id: parsedInput.id };
  });
