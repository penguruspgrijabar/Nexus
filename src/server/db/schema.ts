import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  date,
  decimal,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------- Enums ----------
export const roleEnum = pgEnum("role", ["admin", "operator", "viewer"]);
export const kondisiEnum = pgEnum("kondisi", ["baik", "rusak_ringan", "rusak_berat"]);

// ---------- 1. USER ----------
export const users = pgTable(
  "user",
  {
    id: serial("id").primaryKey(),
    nama: varchar("nama", { length: 100 }).notNull(),
    email: varchar("email", { length: 150 }).notNull().unique(),
    password: text("password").notNull(), // argon2 hash
    role: roleEnum("role").notNull().default("viewer"),
    telepon: varchar("telepon", { length: 20 }),
    aktif: boolean("aktif").notNull().default(true),
    lastLoginAt: timestamp("last_login_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("idx_user_role").on(t.role)],
);

// ---------- 2. RUANGAN ----------
export const ruangan = pgTable(
  "ruangan",
  {
    id: serial("id").primaryKey(),
    kodeRuangan: varchar("kode_ruangan", { length: 20 }).notNull().unique(),
    namaRuangan: varchar("nama_ruangan", { length: 100 }).notNull(),
    lantai: varchar("lantai", { length: 20 }),
    deskripsi: text("deskripsi"),
    penanggungJawabId: integer("penanggung_jawab_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("idx_ruangan_nama").on(t.namaRuangan)],
);

// ---------- 3. BARANG ----------
export const barang = pgTable(
  "barang",
  {
    id: serial("id").primaryKey(),
    kodeBarang: varchar("kode_barang", { length: 30 }).notNull().unique(),
    namaBarang: varchar("nama_barang", { length: 150 }).notNull(),
    kategori: varchar("kategori", { length: 50 }),
    merk: varchar("merk", { length: 80 }),
    spesifikasi: text("spesifikasi"),
    kondisi: kondisiEnum("kondisi").notNull().default("baik"),
    ruanganId: integer("ruangan_id").references(() => ruangan.id, { onDelete: "set null" }),
    dicatatOleh: integer("dicatat_oleh").references(() => users.id, { onDelete: "set null" }),
    tanggalPerolehan: date("tanggal_perolehan"),
    hargaBeli: decimal("harga_beli", { precision: 15, scale: 2 }),
    foto: varchar("foto", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("idx_barang_ruangan").on(t.ruanganId),
    index("idx_barang_kategori").on(t.kategori),
  ],
);

// ---------- 4. MUTASI ----------
export const mutasiBarang = pgTable("mutasi_barang", {
  id: serial("id").primaryKey(),
  barangId: integer("barang_id").notNull().references(() => barang.id, { onDelete: "cascade" }),
  ruanganAsal: integer("ruangan_asal").references(() => ruangan.id, { onDelete: "set null" }),
  ruanganTujuan: integer("ruangan_tujuan").references(() => ruangan.id, { onDelete: "set null" }),
  petugasId: integer("petugas_id").references(() => users.id, { onDelete: "set null" }),
  keterangan: varchar("keterangan", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------- Relasi ----------
export const usersRelations = relations(users, ({ many }) => ({ daftarRuangan: many(ruangan), daftarBarang: many(barang) }));
export const ruanganRelations = relations(ruangan, ({ one, many }) => ({ penanggungJawab: one(users, { fields: [ruangan.penanggungJawabId], references: [users.id] }), daftarBarang: many(barang) }));
export const barangRelations = relations(barang, ({ one, many }) => ({ ruangan: one(ruangan, { fields: [barang.ruanganId], references: [ruangan.id] }), dicatatOlehUser: one(users, { fields: [barang.dicatatOleh], references: [users.id] }), mutasi: many(mutasiBarang) }));
export const mutasiRelations = relations(mutasiBarang, ({ one }) => ({ barang: one(barang, { fields: [mutasiBarang.barangId], references: [barang.id] }), ruanganAsalRef: one(ruangan, { fields: [mutasiBarang.ruanganAsal], references: [ruangan.id] }), ruanganTujuanRef: one(ruangan, { fields: [mutasiBarang.ruanganTujuan], references: [ruangan.id] }), petugas: one(users, { fields: [mutasiBarang.petugasId], references: [users.id] }) }));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Ruangan = typeof ruangan.$inferSelect;
export type NewRuangan = typeof ruangan.$inferInsert;
export type Barang = typeof barang.$inferSelect;
export type NewBarang = typeof barang.$inferInsert;
export type Mutasi = typeof mutasiBarang.$inferSelect;
export type NewMutasi = typeof mutasiBarang.$inferInsert;
