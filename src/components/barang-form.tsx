"use client";

import { useEffect, useState } from "react";
import { Field, Input, Select, Textarea } from "@/components/ui";
import { listBarangAction } from "@/server/actions/query.action";
import { useRuanganList } from "@/hooks/use-ruangan";
import type { BarangRow } from "@/lib/types";

export type BarangFormValues = {
  kodeBarang: string;
  namaBarang: string;
  kategori: string;
  merk: string;
  spesifikasi: string;
  kondisi: "baik" | "rusak_ringan" | "rusak_berat";
  ruanganId: string;
  tanggalPerolehan: string;
  hargaBeli: string;
  unitCount: number;
};

export const emptyBarang: BarangFormValues = {
  kodeBarang: "",
  namaBarang: "",
  kategori: "",
  merk: "",
  spesifikasi: "",
  kondisi: "baik",
  ruanganId: "",
  tanggalPerolehan: "",
  hargaBeli: "",
  unitCount: 1,
};

export function toFormValues(b: BarangRow): BarangFormValues {
  return {
    kodeBarang: b.kodeBarang,
    namaBarang: b.namaBarang,
    kategori: b.kategori ?? "",
    merk: b.merk ?? "",
    spesifikasi: b.spesifikasi ?? "",
    kondisi: b.kondisi,
    ruanganId: b.ruanganId ? String(b.ruanganId) : "",
    tanggalPerolehan: b.tanggalPerolehan ? b.tanggalPerolehan.slice(0, 10) : "",
    hargaBeli: b.hargaBeli ?? "",
    unitCount: 1,
  };
}

/** Ubah nilai form → payload action (string kosong jadi null/undefined). */
export function toPayload(v: BarangFormValues) {
  return {
    kodeBarang: v.kodeBarang.trim() || undefined,
    namaBarang: v.namaBarang.trim(),
    kategori: v.kategori.trim() || null,
    merk: v.merk.trim() || null,
    spesifikasi: v.spesifikasi.trim() || null,
    kondisi: v.kondisi,
    ruanganId: v.ruanganId ? Number(v.ruanganId) : null,
    tanggalPerolehan: v.tanggalPerolehan || null,
    hargaBeli: v.hargaBeli.trim() || null,
    unitCount: Number(v.unitCount) || 1,
  };
}

export function BarangForm({
  values,
  onChange,
  autoKode,
}: {
  values: BarangFormValues;
  onChange: (v: BarangFormValues) => void;
  autoKode?: boolean;
}) {
  const set = <K extends keyof BarangFormValues>(k: K, val: BarangFormValues[K]) =>
    onChange({ ...values, [k]: val });

  // Saran kategori diambil sekali dari data yang sudah ada (server action).
  const [kategoriList, setKategoriList] = useState<string[]>([]);
  useEffect(() => {
    let aktif = true;
    listBarangAction({ page: 1, limit: 1 }).then((res) => {
      if (aktif && res?.data) setKategoriList(res.data.kategoriList ?? []);
    });
    return () => {
      aktif = false;
    };
  }, []);

  // Daftar ruangan dipakai bersama; modal cukup membaca cache TanStack Query.
  const { data: ruanganList } = useRuanganList();

  return (
    <div className="flex flex-col gap-5">
      <section className="form-section">
        <h3 className="form-section-title">Identitas</h3>
        <div className="form-grid">
          <Field
            label="Kode Barang"
            hint={autoKode ? "Kosongkan untuk generate otomatis (BRG-YYYY-0001)" : undefined}
          >
            <Input
              value={values.kodeBarang}
              onChange={(e) => set("kodeBarang", e.target.value)}
              placeholder="BRG-2026-0001"
              className="mono"
            />
          </Field>

          <Field label="Nama Barang">
            <Input
              value={values.namaBarang}
              onChange={(e) => set("namaBarang", e.target.value)}
              placeholder="Laptop Lenovo ThinkPad"
              required
            />
          </Field>

          <Field label="Kategori">
            <Input
              list="kategori-list"
              value={values.kategori}
              onChange={(e) => set("kategori", e.target.value)}
              placeholder="Elektronik"
            />
            <datalist id="kategori-list">
              {kategoriList.map((k) => (
                <option key={k} value={k} />
              ))}
            </datalist>
          </Field>

          <Field label="Merk">
            <Input
              value={values.merk}
              onChange={(e) => set("merk", e.target.value)}
              placeholder="Lenovo"
            />
          </Field>
        </div>
      </section>

      <section className="form-section">
        <h3 className="form-section-title">Jumlah &amp; Penempatan</h3>
        <div className="form-grid">
          <Field label="Jumlah Unit">
            <Input
              type="number"
              min={1}
              max={100}
              value={values.unitCount}
              onChange={(e) => set("unitCount", Number(e.target.value))}
              required
            />
          </Field>

          <Field label="Kondisi">
            <Select
              value={values.kondisi}
              onChange={(e) => set("kondisi", e.target.value as BarangFormValues["kondisi"])}
            >
              <option value="baik">Baik</option>
              <option value="rusak_ringan">Rusak Ringan</option>
              <option value="rusak_berat">Rusak Berat</option>
            </Select>
          </Field>

          <Field label="Ruangan">
            <Select
              value={values.ruanganId}
              onChange={(e) => set("ruanganId", e.target.value)}
            >
              <option value="">— Belum ditempatkan —</option>
              {ruanganList?.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.kodeRuangan} · {r.namaRuangan}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </section>

      <section className="form-section">
        <h3 className="form-section-title">Perolehan &amp; Nilai</h3>
        <div className="form-grid">
          <Field label="Tanggal Perolehan">
            <Input
              type="date"
              value={values.tanggalPerolehan}
              onChange={(e) => set("tanggalPerolehan", e.target.value)}
            />
          </Field>

          <Field label="Harga Beli (Rp)">
            <Input
              type="number"
              min={0}
              step="1000"
              value={values.hargaBeli}
              onChange={(e) => set("hargaBeli", e.target.value)}
              placeholder="7500000"
            />
          </Field>
        </div>

        <div className="mt-[0.9rem]">
          <Field label="Spesifikasi">
            <Textarea
              rows={3}
              value={values.spesifikasi}
              onChange={(e) => set("spesifikasi", e.target.value)}
              placeholder="Core i5, RAM 16GB, SSD 512GB"
            />
          </Field>
        </div>
      </section>
    </div>
  );
}
