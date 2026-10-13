"use server";

import { z } from "zod";
import { count, eq } from "drizzle-orm";
import { returnServerError } from "next-safe-action";
import { db } from "@/server/db";
import { barang, mutasiBarang, ruangan } from "@/server/db/schema";
import {
  createBarangSchema,
  mutasiInputSchema,
  updateBarangSchema,
} from "@/server/db/validation";
import { adminActionClient, operatorActionClient } from "@/lib/safe-action";

async function generateKodeBarang(): Promise<string> {
  const year = new Date().getFullYear();
  const [{ total }] = await db.select({ total: count() }).from(barang);
  for (let i = total + 1; i <= total + 50; i++) {
    const kode = `BRG-${year}-${String(i).padStart(4, "0")}`;
    const exists = await db
      .select({ id: barang.id })
      .from(barang)
      .where(eq(barang.kodeBarang, kode))
      .limit(1);
    if (!exists.length) return kode;
  }
  return `BRG-${year}-${Date.now()}`;
}

async function assertKodeBarangUnik(kode: string): Promise<void> {
  const dup = await db
    .select({ id: barang.id })
    .from(barang)
    .where(eq(barang.kodeBarang, kode))
    .limit(1);
  if (dup.length) returnServerError(`Kode barang "${kode}" sudah dipakai`);
}

export const createBarangAction = operatorActionClient
  .inputSchema(createBarangSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { unitCount, ...base } = parsedInput;

    // Pastikan ruangan ada bila disertikan
    if (base.ruanganId) {
      const [r] = await db
        .select({ id: ruangan.id })
        .from(ruangan)
        .where(eq(ruangan.id, base.ruanganId))
        .limit(1);
      if (!r) returnServerError("Ruangan tidak ditemukan");
    }

    const rows: { id: number; kodeBarang: string }[] = [];
    for (let i = 0; i < unitCount; i++) {
      const kode = await generateKodeBarang();
      const [b] = await db
        .insert(barang)
        .values({
          ...base,
          kodeBarang: kode,
          ruanganId: base.ruanganId ?? null,
          dicatatOleh: ctx.user.sub,
        })
        .returning({ id: barang.id, kodeBarang: barang.kodeBarang });
      rows.push({ id: b.id, kodeBarang: b.kodeBarang });
    }
    return { total: rows.length, barang: rows };
  });

const updateBarangInput = z.object({
  id: z.number().int().positive(),
  data: updateBarangSchema,
});

export const updateBarangAction = operatorActionClient
  .inputSchema(updateBarangInput)
  .action(async ({ parsedInput }) => {
    const { id, data } = parsedInput;

    const [target] = await db
      .select()
      .from(barang)
      .where(eq(barang.id, id))
      .limit(1);
    if (!target) returnServerError("Barang tidak ditemukan");

    const safe: Record<string, unknown> = { ...data };
    delete safe.id;
    delete safe.createdAt;
    delete safe.updatedAt;
    delete safe.dicatatOleh;
    delete safe.kodeBarang;

    if ((safe as any).hargaBeli !== undefined) safe.hargaBeli = (safe as any).hargaBeli || null;

    const [b] = await db
      .update(barang)
      .set({ ...safe, updatedAt: new Date() })
      .where(eq(barang.id, id))
      .returning();

    return { barang: b };
  });

export const deleteBarangAction = adminActionClient
  .inputSchema(z.object({ id: z.number().int().positive() }))
  .action(async ({ parsedInput }) => {
    const [target] = await db
      .select()
      .from(barang)
      .where(eq(barang.id, parsedInput.id))
      .limit(1);
    if (!target) returnServerError("Barang tidak ditemukan");

    await db.delete(barang).where(eq(barang.id, parsedInput.id));
    return { id: parsedInput.id, kode: target.kodeBarang };
  });

/**
 * Pindahkan barang (seluruh stok) ke ruangan lain + catat riwayat mutasi.
 * Bila barang sudah berada di ruangan tujuan → ditolak.
 */
export const mutasiBarangAction = operatorActionClient
  .inputSchema(mutasiInputSchema)
  .action(async ({ parsedInput, ctx }) => {
    return await db.transaction(async (tx) => {
      const [b] = await tx
        .select()
        .from(barang)
        .where(eq(barang.id, parsedInput.barangId))
        .limit(1);
      if (!b) returnServerError("Barang tidak ditemukan");

      // ruanganTujuan: null/undefined = tanpa ruangan; positive number = ruangan spesifik
      const targetRuanganId = parsedInput.ruanganTujuan ?? null;

      // Cek: barang sudah di ruangan tujuan?
      // Jika targetRuanganId adalah null (tanpa ruangan), cek apakah barang ALREADY tanpa ruangan
      if (targetRuanganId !== null && b.ruanganId === targetRuanganId)
        returnServerError("Barang sudah berada di ruangan tersebut");
      // Jika targetRuanganId adalah null dan barang sudah tanpa ruangan → izinkan (bisa dipindah ke ruangan lain dari situ)
      // Jika targetRuanganId adalah number dan b.ruanganId sama dengan itu → error

      let tujuan = null;
      if (targetRuanganId) {
        const [r] = await tx
          .select()
          .from(ruangan)
          .where(eq(ruangan.id, targetRuanganId))
          .limit(1);
        if (!r) returnServerError("Ruangan tujuan tidak ditemukan");
        tujuan = r;
      }

      const [updated] = await tx
        .update(barang)
        .set({ ruanganId: targetRuanganId, updatedAt: new Date() })
        .where(eq(barang.id, b.id))
        .returning();

      const [m] = await tx
        .insert(mutasiBarang)
        .values({
          barangId: b.id,
          ruanganAsal: b.ruanganId,
          ruanganTujuan: targetRuanganId,
          petugasId: ctx.user.sub,
          keterangan: parsedInput.keterangan ?? null,
        })
        .returning();

      return { mutasi: m, barang: updated };
    });
  });
