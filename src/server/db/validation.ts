import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";
import { users, ruangan, barang } from "./schema";

// Entity
export const selectUserSchema = createSelectSchema(users);
export const insertUserSchema = createInsertSchema(users, {
  password: z.string().min(8, "Password minimal 8 karakter"),
  nama: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
});
export const updateUserSchema = createUpdateSchema(users)
  .omit({ password: true })
  .extend({ nama: z.string().min(2, "Nama minimal 2 karakter").optional(), email: z.string().email("Email tidak valid").optional() });

export const insertRuanganSchema = createInsertSchema(ruangan, {
  kodeRuangan: z.string().min(2, "Kode ruangan minimal 2 karakter").optional(),
  namaRuangan: z.string().min(2, "Nama ruangan minimal 2 karakter"),
});
export const updateRuanganSchema = createUpdateSchema(ruangan);

export const insertBarangSchema = createInsertSchema(barang, {
  namaBarang: z.string().min(2, "Nama barang minimal 2 karakter"),
}).omit({ kodeBarang: true });
export const updateBarangSchema = createUpdateSchema(barang).omit({ kodeBarang: true });

// Input tambah: bisa generate N unit dengan kode unik
export const createBarangSchema = insertBarangSchema.extend({
  unitCount: z
    .number()
    .int("Jumlah unit harus bilangan bulat")
    .min(1, "Minimal 1 unit")
    .max(100, "Maksimal 100 unit per input")
    .default(1),
});

// Zod umum
export const loginSchema = z.object({ email: z.string().email("Email tidak valid"), password: z.string().min(1, "Password wajib diisi") });
export const idSchema = z.object({ id: z.coerce.number().int().positive() });

export const barangFilterSchema = z.object({
  search: z.string().trim().optional(),
  ruanganId: z.coerce.number().int().optional(),
  kategori: z.string().trim().optional(),
  kondisi: z.enum(["baik", "rusak_ringan", "rusak_berat"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
export type BarangFilter = z.infer<typeof barangFilterSchema>;

export const laporanFilterSchema = z.object({
  ruanganId: z.coerce.number().int().optional(),
  kategori: z.string().trim().optional(),
  kondisi: z.enum(["baik", "rusak_ringan", "rusak_berat"]).optional(),
});
export type LaporanFilter = z.infer<typeof laporanFilterSchema>;

export const mutasiInputSchema = z.object({
  barangId: z.number().int().positive("Pilih barang"),
  ruanganTujuan: z.number().int().optional(),
  keterangan: z.string().max(255).optional(),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type InsertRuangan = z.infer<typeof insertRuanganSchema>;
export type UpdateRuangan = z.infer<typeof updateRuanganSchema>;
export type InsertBarang = z.infer<typeof insertBarangSchema>;
export type CreateBarang = z.infer<typeof createBarangSchema>;
export type UpdateBarang = z.infer<typeof updateBarangSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type MutasiInput = z.infer<typeof mutasiInputSchema>;
