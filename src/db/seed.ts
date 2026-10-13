import { count, eq } from "drizzle-orm";
import { db } from "../server/db";
import { barang, ruangan, users } from "../server/db/schema";
import { hashPassword } from "../server/auth/password";

async function seed() {
  console.log("Seeding database inventaris...");

  // ---------- Users ----------
  const akun = [
    { nama: "Administrator", email: "admin@inventaris.local", password: "admin12345", role: "admin" as const, telepon: "081234567890" },
    { nama: "Budi Operator", email: "operator@inventaris.local", password: "operator12345", role: "operator" as const, telepon: "081234567891" },
    { nama: "Siti Viewer", email: "viewer@inventaris.local", password: "viewer12345", role: "viewer" as const, telepon: "081234567892" },
  ];

  for (const a of akun) {
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, a.email)).limit(1);
    if (existing.length) {
      console.log(`  - user ${a.email} sudah ada, dilewati`);
      continue;
    }
    await db.insert(users).values({
      nama: a.nama,
      email: a.email,
      password: await hashPassword(a.password),
      role: a.role,
      telepon: a.telepon,
    });
    console.log(`  + user ${a.email} (${a.role})`);
  }

  const [admin] = await db.select().from(users).where(eq(users.email, "admin@inventaris.local")).limit(1);
  const [operator] = await db.select().from(users).where(eq(users.email, "operator@inventaris.local")).limit(1);

  // ---------- Ruangan ----------
  const daftarRuangan = [
    { kodeRuangan: "R-001", namaRuangan: "Gudang Utama", lantai: "1", deskripsi: "Penyimpanan barang masuk", penanggungJawabId: operator?.id ?? null },
    { kodeRuangan: "R-002", namaRuangan: "Ruang IT", lantai: "2", deskripsi: "Perangkat komputer & jaringan", penanggungJawabId: operator?.id ?? null },
    { kodeRuangan: "R-003", namaRuangan: "Ruang Rapat", lantai: "2", deskripsi: "Meja rapat, proyektor", penanggungJawabId: admin?.id ?? null },
    { kodeRuangan: "R-004", namaRuangan: "Ruang Arsip", lantai: "1", deskripsi: "Dokumen dan arsip", penanggungJawabId: null },
  ];

  for (const r of daftarRuangan) {
    const existing = await db.select({ id: ruangan.id }).from(ruangan).where(eq(ruangan.kodeRuangan, r.kodeRuangan)).limit(1);
    if (existing.length) continue;
    await db.insert(ruangan).values(r);
    console.log(`  + ruangan ${r.kodeRuangan} ${r.namaRuangan}`);
  }

  const ruanganRows = await db.select().from(ruangan);
  const byKode = (kode: string) => ruanganRows.find((r) => r.kodeRuangan === kode)?.id ?? null;

  // ---------- Barang (1 baris = 1 unit fisik, kode unik) ----------
  const [{ total }] = await db.select({ total: count() }).from(barang);
  if (total === 0) {
    const year = new Date().getFullYear();
    // `unit` = berapa banyak baris (unit fisik) yang dibuat untuk tiap jenis.
    const daftarBarang = [
      { namaBarang: "Laptop Lenovo ThinkPad E14", kategori: "Elektronik", merk: "Lenovo", spesifikasi: "Core i5, RAM 16GB, SSD 512GB", unit: 6, kondisi: "baik" as const, ruanganId: byKode("R-002"), hargaBeli: "9500000.00" },
      { namaBarang: "Monitor Dell 24 inch", kategori: "Elektronik", merk: "Dell", spesifikasi: "IPS 1920x1080", unit: 8, kondisi: "baik" as const, ruanganId: byKode("R-002"), hargaBeli: "1850000.00" },
      { namaBarang: "Meja Kerja Kayu", kategori: "Furnitur", merk: "Local", spesifikasi: "120x60 cm", unit: 12, kondisi: "baik" as const, ruanganId: byKode("R-003"), hargaBeli: "850000.00" },
      { namaBarang: "Kursi Rapat", kategori: "Furnitur", merk: "Chitose", spesifikasi: "Stoff hitam", unit: 20, kondisi: "rusak_ringan" as const, ruanganId: byKode("R-003"), hargaBeli: "620000.00" },
      { namaBarang: "Proyektor Epson EB-X06", kategori: "Elektronik", merk: "Epson", spesifikasi: "3600 lumens XGA", unit: 2, kondisi: "baik" as const, ruanganId: byKode("R-003"), hargaBeli: "6200000.00" },
      { namaBarang: "Lemari Arsip Besi", kategori: "Furnitur", merk: "Brother", spesifikasi: "4 pintu, 2 laci", unit: 5, kondisi: "baik" as const, ruanganId: byKode("R-004"), hargaBeli: "2750000.00" },
      { namaBarang: "Printer HP LaserJet M404", kategori: "Elektronik", merk: "HP", spesifikasi: "Monochrome laser", unit: 3, kondisi: "rusak_berat" as const, ruanganId: byKode("R-001"), hargaBeli: "3450000.00" },
      { namaBarang: "Kertas HVS A4 70gsm", kategori: "Alat Tulis", merk: "Sinar Dunia", spesifikasi: "500 lembar/rim", unit: 40, kondisi: "baik" as const, ruanganId: byKode("R-001"), hargaBeli: "52000.00" },
      { namaBarang: "Kabel UTP Cat6", kategori: "Jaringan", merk: "Belden", spesifikasi: "305 m/roll", unit: 4, kondisi: "baik" as const, ruanganId: byKode("R-002"), hargaBeli: "1450000.00" },
      { namaBarang: "Switch Cisco 24 Port", kategori: "Jaringan", merk: "Cisco", spesifikasi: "SG250-24", unit: 2, kondisi: "baik" as const, ruanganId: byKode("R-002"), hargaBeli: "4700000.00" },
      { namaBarang: "Whiteboard 120x90", kategori: "Alat Tulis", merk: "Snowman", spesifikasi: "Magnetik", unit: 2, kondisi: "baik" as const, ruanganId: byKode("R-003"), hargaBeli: "480000.00" },
      { namaBarang: "AC Split 1 PK", kategori: "Elektronik", merk: "Daikin", spesifikasi: "Inverter", unit: 4, kondisi: "baik" as const, ruanganId: null, hargaBeli: "4300000.00" },
    ];

    const rows: (typeof barang.$inferInsert)[] = [];
    let seq = 1;
    for (const { unit, ...b } of daftarBarang) {
      for (let n = 0; n < unit; n++) {
        rows.push({
          ...b,
          kodeBarang: `BRG-${year}-${String(seq++).padStart(4, "0")}`,
          dicatatOleh: admin?.id ?? null,
          tanggalPerolehan: `${year}-01-15`,
        });
      }
    }

    await db.insert(barang).values(rows);
    console.log(`  + ${rows.length} unit barang (${daftarBarang.length} jenis)`);
  } else {
    console.log(`  - barang sudah ada (${total}), dilewati`);
  }

  console.log("Selesai. Akun: admin@inventaris.local / admin12345");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed gagal:", err);
  process.exit(1);
});
