"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useSession } from "@/lib/session-context";
import { useBarangDetail, useMutasiBarang } from "@/hooks/use-barang";
import { useRuanganList } from "@/hooks/use-ruangan";
import { PageHeader } from "@/components/app-shell";
import { ActionError, Empty, Field, Input, KondisiBadge, Modal, Panel, Select, TableWrap } from "@/components/ui";
import { Icon } from "@/components/icons";
import { formatDateTime, formatRupiah, formatTanggal } from "@/lib/utils";

export default function BarangDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const session = useSession();
  const canWrite = session?.role === "admin" || session?.role === "operator";

  const { data, isPending, error } = useBarangDetail(id);
  const { data: ruanganList } = useRuanganList(true);

  const [open, setOpen] = useState(false);
  const [tujuan, setTujuan] = useState("");
  const [keterangan, setKeterangan] = useState("");

  const mutasi = useMutasiBarang(() => {
    setOpen(false);
    setTujuan("");
    setKeterangan("");
  });

  if (isPending) {
    return (
      <>
        <PageHeader title="Detail Barang" />
        <div className="card flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <span className="skeleton" key={i} style={{ width: `${80 - i * 8}%` }} />
          ))}
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title="Detail Barang" />
        <Panel>
          <Empty title="Gagal memuat detail" text={(error as Error).message} icon="alert" />
        </Panel>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <PageHeader title="Detail Barang" />
        <Panel>
          <Empty
            title="Barang tidak ditemukan"
            text="Data mungkin sudah dihapus atau tautannya tidak valid."
            icon="box"
            action={
              <Link href="/barang" className="btn btn-ghost btn-sm mt-1">
                <Icon name="arrowLeft" size={15} />
                Kembali ke daftar
              </Link>
            }
          />
        </Panel>
      </>
    );
  }

  const b = data.barang;

  const info: [string, React.ReactNode][] = [
    ["Kode Barang", <span key="kode" className="mono">{b.kodeBarang}</span>],
    ["Kategori", b.kategori ?? "-"],
    ["Merk", b.merk ?? "-"],
    ["Jumlah", "1 unit"],
    ["Kondisi", <KondisiBadge key="kondisi" kondisi={b.kondisi} />],
    ["Ruangan", b.ruanganNama ? `${b.ruanganKode} · ${b.ruanganNama}` : "Belum ditempatkan"],
    ["Tanggal Perolehan", formatTanggal(b.tanggalPerolehan)],
    ["Harga Beli", formatRupiah(b.hargaBeli)],
    ["Dicatat Oleh", b.dicatatOlehNama ?? "-"],
    ["Spesifikasi", b.spesifikasi ?? "-"],
  ];

  return (
    <>
      <PageHeader
        title={b.namaBarang}
        subtitle={`${b.kodeBarang} · ${b.kategori ?? "tanpa kategori"}`}
        actions={
          canWrite ? (
            <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
              <Icon name="transfer" size={16} />
              Pindah Ruangan
            </button>
          ) : undefined
        }
      />

      <div className="toolbar" style={{ display: "flex", marginBottom: "1rem" }}>
        <Link href="/barang" className="btn btn-quiet btn-sm">
          <Icon name="arrowLeft" size={15} />
          Daftar Barang
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Informasi Barang" className="lg:col-span-1">
          <div className="panel-body">
            <dl>
              {info.map(([label, value]) => (
                <div className="def-row" key={label}>
                  <dt className="def-key">{label}</dt>
                  <dd className="def-val">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Panel>

        <Panel
          title={`Riwayat Mutasi (${data.mutasi.length})`}
          className="lg:col-span-2"
        >
          {data.mutasi.length === 0 ? (
            <Empty
              title="Belum ada perpindahan"
              text="Riwayat akan tercatat setiap kali barang dipindahkan antar ruangan."
              icon="transfer"
            />
          ) : (
            <TableWrap>
              <table className="table">
                <thead>
                  <tr>
                    <th>Waktu</th>
                    <th>Dari</th>
                    <th>Ke</th>
                    <th className="num">Jumlah</th>
                    <th>Petugas</th>
                    <th>Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {data.mutasi.map((m) => (
                    <tr key={m.id}>
                      <td className="whitespace-nowrap">{formatDateTime(m.createdAt)}</td>
                      <td>{m.asalNama ?? "Tanpa ruangan"}</td>
                      <td>{m.tujuanNama ?? "-"}</td>
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
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Pindah Ruangan"
        subtitle={b.namaBarang}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
              Batal
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!tujuan || mutasi.isPending}
              onClick={() =>
                mutasi.execute({
                  barangId: b.id,
                  ruanganTujuan: Number(tujuan),
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
          <Field label="Ruangan Saat Ini">
            <Input value={b.ruanganNama ?? "Belum ditempatkan"} disabled readOnly />
          </Field>

          <Field label="Ruangan Tujuan">
            <Select value={tujuan} onChange={(e) => setTujuan(e.target.value)}>
              <option value="">— Pilih ruangan —</option>
              {ruanganList
                ?.filter((r) => r.id !== b.ruanganId)
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
              placeholder="Relokasi gudang A ke gudang B"
            />
          </Field>

          <ActionError message={mutasi.result?.serverError} />
        </div>
      </Modal>
    </>
  );
}
