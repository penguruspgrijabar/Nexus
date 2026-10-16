"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutasiList } from "@/hooks/use-misc";
import { useBarangList, useMutasiBarang } from "@/hooks/use-barang";
import { useRuanganList } from "@/hooks/use-ruangan";
import { useSession } from "@/lib/session-context";
import { PageHeader } from "@/components/app-shell";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  ActionError,
  Empty,
  Field,
  Input,
  Panel,
  Select,
  SkeletonRows,
  TableWrap,
} from "@/components/ui/primitives";
import { Modal } from "@/components/ui/modal";
import { Icon } from "@/components/icons";
import { formatDateTime } from "@/lib/utils";

export default function MutasiPage() {
  const session = useSession();
  const canWrite = session?.role === "admin" || session?.role === "operator";

  const [barangIdFilter, setBarangIdFilter] = useState<number | undefined>();
  const [searchBarang, setSearchBarang] = useState("");
  const { data, isPending, error } = useMutasiList(barangIdFilter);
  const { data: barangList } = useBarangList({ page: 1, limit: 100 });
  const { data: ruanganList } = useRuanganList(true);

  // Filter barang list berdasarkan search dan urutkan prioritas
  const filteredBarang = barangList?.data.filter((b) =>
    b.kodeBarang.toLowerCase().includes(searchBarang.toLowerCase()) ||
    b.namaBarang.toLowerCase().includes(searchBarang.toLowerCase())
  ) ?? [];

  // Urutkan: barang yang cocok kode dulu, lalu nama, lalu sisanya
  const sortedBarang = [...filteredBarang].sort((a, b) => {
    const aCodeMatch = a.kodeBarang.toLowerCase().includes(searchBarang.toLowerCase());
    const aNameMatch = a.namaBarang.toLowerCase().includes(searchBarang.toLowerCase());
    const bCodeMatch = b.kodeBarang.toLowerCase().includes(searchBarang.toLowerCase());
    const bNameMatch = b.namaBarang.toLowerCase().includes(searchBarang.toLowerCase());

    // Code match lebih utama dari name match
    if (aCodeMatch && !bCodeMatch) return -1;
    if (!aCodeMatch && bCodeMatch) return 1;
    if (aNameMatch && !bNameMatch) return -1;
    if (!aNameMatch && bNameMatch) return 1;
    return 0;
  });

  const [open, setOpen] = useState(false);
  const [barangId, setBarangId] = useState("");
  const [tujuan, setTujuan] = useState("");
  const [keterangan, setKeterangan] = useState("");

  const mutasi = useMutasiBarang(() => {
    setOpen(false);
    setBarangId("");
    setTujuan("");
    setKeterangan("");
  });

  const barangDipilih = barangList?.data.find((b) => b.id === Number(barangId));

  return (
    <>
      <PageHeader
        title="Mutasi Barang"
        subtitle="Riwayat perpindahan barang antar ruangan"
        actions={
          canWrite ? (
            <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
              <Icon name="transfer" size={16} />
              Pindah Barang
            </button>
          ) : undefined
        }
      />

      <div className="card mb-4">
        <Field label="Filter Barang" htmlFor="filter-barang" className="max-w-md">
          <Select
            id="filter-barang"
            value={barangIdFilter ?? ""}
            onChange={(e) => setBarangIdFilter(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">Semua barang</option>
            {sortedBarang.map((b) => (
              <option key={b.id} value={b.id}>
                {b.kodeBarang} · {b.namaBarang}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="card mb-4">
        <Field label="Cari Barang">
          <Input
            id="cari-barang-mutasi"
            icon="search"
            placeholder="Cari kode atau nama barang..."
            onChange={(e) => setSearchBarang(e.target.value)}
          />
        </Field>
      </div>

      <Panel>
        {error && <Empty title="Gagal memuat riwayat" text={(error as Error).message} icon="alert" />}
        {isPending && <SkeletonRows rows={5} cols={6} />}

        {data && data.length === 0 && (
          <Empty
            title="Belum ada riwayat mutasi"
            text="Setiap perpindahan barang antar ruangan akan tercatat di sini."
            icon="transfer"
            action={
              canWrite ? (
                <button type="button" className="btn btn-primary btn-sm mt-1" onClick={() => setOpen(true)}>
                  <Icon name="transfer" size={15} />
                  Pindah Barang
                </button>
              ) : undefined
            }
          />
        )}

        {data && data.length > 0 && (
          <TableWrap>
            <table className="table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Barang</th>
                  <th>Dari</th>
                  <th>Ke</th>
                  <th className="num">Jumlah</th>
                  <th>Petugas</th>
                  <th>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {data.map((m) => (
                  <tr key={m.id}>
                    <td className="whitespace-nowrap">{formatDateTime(m.createdAt)}</td>
                    <td>
                      <Link href={`/barang/${m.barangId}`} className="hover:underline">
                        <span className="block cell-strong">{m.barangNama}</span>
                        <span className="block cell-sub mono">{m.barangKode}</span>
                      </Link>
                    </td>
                    <td>{m.asalNama ? `${m.asalKode} · ${m.asalNama}` : "Tanpa ruangan"}</td>
                    <td>{m.tujuanNama ? `${m.tujuanKode} · ${m.tujuanNama}` : "-"}</td>
                    <td className="num">1 unit</td>
                    <td>{m.petugasNama ?? "-"}</td>
                    <td>{m.keterangan ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Panel>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Pindah Barang antar Ruangan"
        subtitle="Barang akan dicatat sebagai mutasi ke ruangan tujuan."
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
              Batal
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!barangId || !tujuan || mutasi.isPending}
              onClick={() =>
                mutasi.execute({
                  barangId: Number(barangId),
                  ruanganTujuan:
                    tujuan === "-1" ? undefined : Number(tujuan),
                  keterangan: keterangan.trim() || undefined,
                })
              }
            >
              {mutasi.isPending ? "Memproses..." : "Pindahkan"}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Barang">
            <SearchableSelect
              options={sortedBarang.map((b) => ({
                value: b.id.toString(),
                label: `${b.kodeBarang} · ${b.namaBarang} (1 unit)`
              }))}
              value={barangId ?? ""}
              onValueChange={(val: string) => setBarangId(val ? val : "")}
              placeholder="— Pilih barang —"
              searchPlaceholder="Cari kode atau nama..."
              emptyMessage="Tidak ada barang yang cocok"
            />
          </Field>

          {barangDipilih && (
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Ruangan saat ini: <b>{barangDipilih.ruanganNama ?? "Belum ditempatkan"}</b>
            </p>
          )}

          <Field label="Ruangan Tujuan">
            <Select value={tujuan} onChange={(e) => setTujuan(e.target.value)}>
              <option value="">— Pilih ruangan —</option>
              <option value="-1">Tanpa ruangan</option>
              {ruanganList
                ?.filter((r) => r.id !== barangDipilih?.ruanganId)
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.kodeRuangan} · {r.namaRuangan}
                  </option>
                ))}
            </Select>
          </Field>

          <Field label="Keterangan" hint="Opsional — alasan atau catatan perpindahan.">
            <Input
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Alasan / catatan perpindahan"
            />
          </Field>

          <ActionError message={mutasi.result?.serverError} />
        </div>
      </Modal>
    </>
  );
}
