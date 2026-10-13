import { and, asc, count, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/server/db";
import { barang, mutasiBarang, ruangan, users } from "@/server/db/schema";
import type { BarangFilter } from "@/server/db/validation";
import type { BarangRow, MutasiRow, RuanganRow, UserRow } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Barang                                                              */
/* ------------------------------------------------------------------ */

const barangSelection = {
  id: barang.id,
  kodeBarang: barang.kodeBarang,
  namaBarang: barang.namaBarang,
  kategori: barang.kategori,
  merk: barang.merk,
  spesifikasi: barang.spesifikasi,
  kondisi: barang.kondisi,
  ruanganId: barang.ruanganId,
  hargaBeli: barang.hargaBeli,
  tanggalPerolehan: barang.tanggalPerolehan,
  foto: barang.foto,
  ruanganNama: ruangan.namaRuangan,
  ruanganKode: ruangan.kodeRuangan,
  dicatatOlehNama: users.nama,
  createdAt: barang.createdAt,
  updatedAt: barang.updatedAt,
};

type RawBarang = {
  createdAt: Date;
  updatedAt: Date;
  tanggalPerolehan: string | null;
  [k: string]: unknown;
};

function serializeBarang(row: RawBarang): BarangRow {
  return {
    ...(row as unknown as BarangRow),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    tanggalPerolehan: row.tanggalPerolehan ?? null,
  };
}

function barangWhere(filter: Partial<BarangFilter>): SQL | undefined {
  const conds: SQL[] = [];
  if (filter.search) {
    const q = `%${filter.search}%`;
    const searchCond = or(
      ilike(barang.namaBarang, q),
      ilike(barang.kodeBarang, q),
      ilike(barang.merk, q),
      ilike(barang.kategori, q),
    );
    if (searchCond) conds.push(searchCond);
  }
  if (filter.ruanganId !== undefined) {
    if (filter.ruanganId === -1) {
      conds.push(sql`${barang.ruanganId} is null`);
    } else {
      conds.push(eq(barang.ruanganId, filter.ruanganId));
    }
  }
  if (filter.kategori) conds.push(eq(barang.kategori, filter.kategori));
  if (filter.kondisi) conds.push(eq(barang.kondisi, filter.kondisi));
  return conds.length ? and(...conds) : undefined;
}

export async function listBarang(filter: BarangFilter) {
  const where = barangWhere(filter);
  const offset = (filter.page - 1) * filter.limit;

  const [rows, [{ total }], kategoriRows] = await Promise.all([
    db
      .select(barangSelection)
      .from(barang)
      .leftJoin(ruangan, eq(barang.ruanganId, ruangan.id))
      .leftJoin(users, eq(barang.dicatatOleh, users.id))
      .where(where)
      .orderBy(desc(barang.updatedAt))
      .limit(filter.limit)
      .offset(offset),
    db.select({ total: count() }).from(barang).where(where),
    db
      .selectDistinct({ kategori: barang.kategori })
      .from(barang)
      .where(sql`${barang.kategori} is not null and ${barang.kategori} <> ''`)
      .orderBy(asc(barang.kategori)),
  ]);

  return {
    data: rows.map(serializeBarang),
    total,
    page: filter.page,
    limit: filter.limit,
    totalPages: Math.max(1, Math.ceil(total / filter.limit)),
    kategoriList: kategoriRows.map((k) => k.kategori!).filter(Boolean),
  };
}

export async function getBarang(id: number) {
  const [row] = await db
    .select(barangSelection)
    .from(barang)
    .leftJoin(ruangan, eq(barang.ruanganId, ruangan.id))
    .leftJoin(users, eq(barang.dicatatOleh, users.id))
    .where(eq(barang.id, id))
    .limit(1);

  if (!row) return null;
  const mutasi = await listMutasi({ barangId: id });
  return { barang: serializeBarang(row), mutasi };
}

/** Semua barang (tanpa pagination) — untuk laporan & export. */
export async function listBarangForLaporan(filter: {
  ruanganId?: number;
  kategori?: string;
  kondisi?: "baik" | "rusak_ringan" | "rusak_berat";
}) {
  const rows = await db
    .select(barangSelection)
    .from(barang)
    .leftJoin(ruangan, eq(barang.ruanganId, ruangan.id))
    .leftJoin(users, eq(barang.dicatatOleh, users.id))
    .where(barangWhere(filter))
    .orderBy(asc(barang.namaBarang));
  return rows.map(serializeBarang);
}

/* ------------------------------------------------------------------ */
/* Ruangan                                                             */
/* ------------------------------------------------------------------ */

export async function listRuangan(): Promise<RuanganRow[]> {
  const rows = await db
    .select({
      id: ruangan.id,
      kodeRuangan: ruangan.kodeRuangan,
      namaRuangan: ruangan.namaRuangan,
      lantai: ruangan.lantai,
      deskripsi: ruangan.deskripsi,
      penanggungJawabId: ruangan.penanggungJawabId,
      penanggungJawabNama: users.nama,
      jumlahBarang: sql<number>`(
        select coalesce(count(*), 0)::int from ${barang} where ${barang.ruanganId} = ${ruangan.id}
      )`,
      createdAt: ruangan.createdAt,
      updatedAt: ruangan.updatedAt,
    })
    .from(ruangan)
    .leftJoin(users, eq(ruangan.penanggungJawabId, users.id))
    .orderBy(asc(ruangan.kodeRuangan));

  return rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

/* ------------------------------------------------------------------ */
/* User                                                                */
/* ------------------------------------------------------------------ */

export async function listUsers(): Promise<UserRow[]> {
  const rows = await db
    .select({
      id: users.id,
      nama: users.nama,
      email: users.email,
      role: users.role,
      telepon: users.telepon,
      aktif: users.aktif,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(asc(users.nama));

  return rows.map((u) => ({
    ...u,
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
  }));
}

/** Ringkas: id + nama, untuk dropdown penanggung jawab. */
export async function listUserRingkas() {
  return db
    .select({ id: users.id, nama: users.nama, role: users.role })
    .from(users)
    .where(eq(users.aktif, true))
    .orderBy(asc(users.nama));
}

/* ------------------------------------------------------------------ */
/* Mutasi                                                              */
/* ------------------------------------------------------------------ */

async function listMutasi(opts: { barangId?: number; limit?: number }): Promise<MutasiRow[]> {
  const rows = await db.execute<{
    id: number;
    barang_id: number;
    barang_kode: string;
    barang_nama: string;
    asal_nama: string | null;
    asal_kode: string | null;
    tujuan_nama: string | null;
    tujuan_kode: string | null;
    petugas_nama: string | null;
    keterangan: string | null;
    created_at: Date;
  }>(sql`
    select m.id,
           m.barang_id,
           b.kode_barang as barang_kode,
           b.nama_barang as barang_nama,
           ra.nama_ruangan as asal_nama,
           ra.kode_ruangan as asal_kode,
           rt.nama_ruangan as tujuan_nama,
           rt.kode_ruangan as tujuan_kode,
           u.nama as petugas_nama,
           m.keterangan,
           m.created_at
      from ${mutasiBarang} m
      join ${barang} b on b.id = m.barang_id
      left join ${ruangan} ra on ra.id = m.ruangan_asal
      left join ${ruangan} rt on rt.id = m.ruangan_tujuan
      left join ${users} u on u.id = m.petugas_id
     ${opts.barangId ? sql`where m.barang_id = ${opts.barangId}` : sql``}
     order by m.created_at desc
     ${opts.limit ? sql`limit ${opts.limit}` : sql``}
  `);

  return rows.map((r) => ({
    id: r.id,
    barangId: r.barang_id,
    barangKode: r.barang_kode,
    barangNama: r.barang_nama,
    asalNama: r.asal_nama,
    asalKode: r.asal_kode,
    tujuanNama: r.tujuan_nama,
    tujuanKode: r.tujuan_kode,
    petugasNama: r.petugas_nama,
    keterangan: r.keterangan,
    createdAt: new Date(r.created_at).toISOString(),
  }));
}

export async function listMutasiGlobal(limit = 100): Promise<MutasiRow[]> {
  return listMutasi({ limit });
}

export async function listMutasiBarang(barangId: number): Promise<MutasiRow[]> {
  return listMutasi({ barangId });
}

/* ------------------------------------------------------------------ */
/* Dasbor & Laporan                                                    */
/* ------------------------------------------------------------------ */

export async function getDashboard() {
  const [
    agregat,
    [jumlahRuangan],
    recentMutasi,
  ] = await Promise.all([
    db
      .select({
        jenisBarang: count(),
        tanpaRuangan: sql<number>`coalesce(sum(case when ${barang.ruanganId} is null then 1 else 0 end), 0)::int`,
        rusak: sql<number>`coalesce(sum(case when ${barang.kondisi} <> 'baik' then 1 else 0 end), 0)::int`,
        nilaiTotal: sql<number>`coalesce(sum(${barang.hargaBeli}), 0)::float8`,
      })
      .from(barang),
    db.select({ total: count() }).from(ruangan),
    listMutasi({ limit: 8 }),
  ]);

  return {
    totalBarang: agregat[0]?.jenisBarang ?? 0,
    totalRuangan: jumlahRuangan?.total ?? 0,
    tanpaRuangan: agregat[0]?.tanpaRuangan ?? 0,
    rusak: agregat[0]?.rusak ?? 0,
    nilaiTotal: agregat[0]?.nilaiTotal ?? 0,
    recentMutasi,
  };
}

export async function getLaporan(filter: {
  ruanganId?: number;
  kategori?: string;
  kondisi?: "baik" | "rusak_ringan" | "rusak_berat";
}) {
  const items = await listBarangForLaporan(filter);

  const group = <T extends string>(keyFn: (b: BarangRow) => T) => {
    const map = new Map<T, { jumlah: number }>();
    for (const b of items) {
      const k = keyFn(b);
      const prev = map.get(k) ?? { jumlah: 0 };
      map.set(k, { jumlah: prev.jumlah + 1 });
    }
    return map;
  };

  const byRuangan = [...group((b) => b.ruanganNama ?? "Tanpa Ruangan").entries()]
    .map(([ruangan, v]) => ({ ruangan, ...v }))
    .sort((a, b) => b.jumlah - a.jumlah);
  const byKategori = [...group((b) => b.kategori ?? "Tanpa Kategori").entries()]
    .map(([kategori, v]) => ({ kategori, ...v }))
    .sort((a, b) => b.jumlah - a.jumlah);
  const byKondisi = [...group((b) => b.kondisi).entries()]
    .map(([kondisi, v]) => ({ kondisi, ...v }))
    .sort((a, b) => b.jumlah - a.jumlah);

  return {
    totals: {
      totalBarang: items.length,
      nilai: items.reduce(
        (s, b) => s + (b.hargaBeli ? Number(b.hargaBeli) : 0),
        0,
      ),
    },
    byRuangan,
    byKategori,
    byKondisi,
    items,
  };
}
