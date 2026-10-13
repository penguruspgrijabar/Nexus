// Tipe respons action — dipakai hooks (client) dan server action.

export type Role = "admin" | "operator" | "viewer";
export type Kondisi = "baik" | "rusak_ringan" | "rusak_berat";

export type SessionInfo = {
  sub: number;
  role: Role;
  nama: string;
  email: string;
};

export type BarangRow = {
  id: number;
  kodeBarang: string;
  namaBarang: string;
  kategori: string | null;
  merk: string | null;
  spesifikasi: string | null;
  kondisi: Kondisi;
  ruanganId: number | null;
  hargaBeli: string | null;
  tanggalPerolehan: string | null;
  foto: string | null;
  ruanganNama: string | null;
  ruanganKode: string | null;
  dicatatOlehNama: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BarangFilterInput = {
  search?: string;
  ruanganId?: number;
  kategori?: string;
  kondisi?: Kondisi;
  page?: number;
  limit?: number;
};

export type BarangListResponse = {
  data: BarangRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  kategoriList: string[];
};

export type BarangDetailResponse = {
  barang: BarangRow;
  mutasi: MutasiRow[];
};

export type RuanganRow = {
  id: number;
  kodeRuangan: string;
  namaRuangan: string;
  lantai: string | null;
  deskripsi: string | null;
  penanggungJawabId: number | null;
  penanggungJawabNama: string | null;
  jumlahBarang: number;
  createdAt: string;
  updatedAt: string;
};

export type UserRow = {
  id: number;
  nama: string;
  email: string;
  role: Role;
  telepon: string | null;
  aktif: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

export type MutasiRow = {
  id: number;
  barangId: number;
  barangKode: string;
  barangNama: string;
  asalNama: string | null;
  asalKode: string | null;
  tujuanNama: string | null;
  tujuanKode: string | null;
  petugasNama: string | null;
  keterangan: string | null;
  createdAt: string;
};

export type DashboardData = {
  totalBarang: number;
  totalRuangan: number;
  tanpaRuangan: number;
  rusak: number;
  nilaiTotal: number;
  recentMutasi: MutasiRow[];
};

export type LaporanData = {
  totals: { totalBarang: number; nilai: number };
  byRuangan: { ruangan: string; jumlah: number }[];
  byKategori: { kategori: string; jumlah: number }[];
  byKondisi: { kondisi: string; jumlah: number }[];
  items: BarangRow[];
};
