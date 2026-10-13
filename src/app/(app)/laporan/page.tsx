"use client";

import { useMemo, useState } from "react";
import { useLaporan } from "@/hooks/use-misc";
import { useRuanganList } from "@/hooks/use-ruangan";
import { PageHeader } from "@/components/app-shell";
import {
  Empty,
  Field,
  Panel,
  Select,
  StatCard,
  TableWrap,
} from "@/components/ui";
import { Icon } from "@/components/icons";
import { KONDISI_LABEL, formatRupiah } from "@/lib/utils";
import type { BarangRow } from "@/lib/types";

type RingkasTable = {
  title: string;
  key: string;
  head: string;
  rows: (string | number)[][];
};

/** Kolom laporan — dipakai CSV dan PDF agar formatnya sama. */
const KOLOM_LAPORAN = [
  "Kode",
  "Nama",
  "Kategori",
  "Merk",
  "Ruangan",
  "Kondisi",
  "Harga Beli",
] as const;

/** Satu baris data laporan, urutannya mengikuti KOLOM_LAPORAN. */
function barisLaporan(b: BarangRow): string[] {
  return [
    b.kodeBarang,
    b.namaBarang,
    b.kategori ?? "",
    b.merk ?? "",
    b.ruanganNama ?? "Tanpa Ruangan",
    KONDISI_LABEL[b.kondisi] ?? b.kondisi,
    b.hargaBeli ?? "",
  ];
}

/** Escape HTML untuk dokumen print. */
function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default function LaporanPage() {
  const [ruanganId, setRuanganId] = useState<number | undefined>();
  const [kategori, setKategori] = useState("");
  const [kondisi, setKondisi] = useState<"" | "baik" | "rusak_ringan" | "rusak_berat">("");

  const { data: ruanganList } = useRuanganList();
  const { data, isPending, error } = useLaporan({
    ruanganId,
    kategori: kategori || undefined,
    kondisi: kondisi || undefined,
  });

  const kategoriOptions = useMemo(() => {
    const set = new Set<string>();
    data?.byKategori.forEach((k) => {
      if (k.kategori !== "Tanpa Kategori") set.add(k.kategori);
    });
    return [...set].sort();
  }, [data]);

  const exportCsv = () => {
      if (!data) return;
      const csv = [KOLOM_LAPORAN, ...data.items.map(barisLaporan)]
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
        .join("\r\n");

      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `laporan-inventaris-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    };

    /** Cetak PDF: dokumen print tersendiri dengan format tabel = format CSV. */
    const exportPdf = () => {
      if (!data) return;
      const judul = "Laporan Inventaris Barang";
      const tanggal = new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const ruanganNama = ruanganId
        ? ruanganList?.find((r) => r.id === ruanganId)
        : undefined;
      const filterText = [
        ruanganNama ? `Ruangan: ${ruanganNama.namaRuangan}` : "Semua ruangan",
        kategori ? `Kategori: ${kategori}` : "",
        kondisi ? `Kondisi: ${KONDISI_LABEL[kondisi]}` : "",
      ]
        .filter(Boolean)
        .join(" · ");

      const ringkasHtml = ringkasan
        .map(
          (s) => `
        <h2>${escHtml(s.title)}</h2>
        <table class="ringkas">
          <thead><tr><th>${escHtml(s.head)}</th><th>Jumlah</th></tr></thead>
          <tbody>
            ${s.rows.map((r) => `<tr><td>${escHtml(String(r[0]))}</td><td class="num">${escHtml(String(r[1]))}</td></tr>`).join("")}
          </tbody>
        </table>`,
        )
        .join("");

      const detailRows = data.items
        .map((b) => {
          const cells = barisLaporan(b)
            .map((c, i) => {
              const harga = i === 6;
              const kode = i === 0;
              const cls = harga ? ' class="num"' : kode ? ' class="kode"' : "";
              const isi = harga && c !== "" ? formatRupiah(Number(c)) : c;
              return `<td${cls}>${escHtml(isi)}</td>`;
            })
            .join("");
          return `<tr>${cells}</tr>`;
        })
        .join("");

      const html = `<!doctype html>
  <html lang="id">
  <head>
  <meta charset="utf-8" />
  <title>${judul}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; margin: 0; padding: 0; }
    .kepala { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #1d4ed8; padding-bottom: .6rem; margin-bottom: 1.2rem; }
    .kepala h1 { font-size: 1.35rem; margin: 0; }
    .kepala .meta { font-size: .8rem; color: #4b5563; text-align: right; }
    .filter { font-size: .8rem; color: #374151; margin: .2rem 0 1rem; }
    h2 { font-size: .95rem; margin: 1.1rem 0 .45rem; color: #1f2937; }
    table { width: 100%; border-collapse: collapse; font-size: .78rem; }
    .ringkas { max-width: 26rem; }
    th, td { border: 1px solid #d1d5db; padding: .32rem .5rem; text-align: left; vertical-align: top; }
    th { background: #eff6ff; color: #1e3a8a; font-weight: 600; }
    .num { text-align: right; white-space: nowrap; }
    .kode { font-family: Consolas, 'Courier New', monospace; }
    .detail th { background: #1d4ed8; color: #fff; }
    .detail tr:nth-child(even) td { background: #f9fafb; }
    .total-row td { border-top: 2px solid #1d4ed8; font-weight: 700; background: #eff6ff; }
    @media print {
      .halaman { padding: 0; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; }
    }
  </style>
  </head>
  <body>
    <div class="halaman">
      <div class="kepala">
        <h1>${judul}</h1>
        <div class="meta">Per ${tanggal}<br />${escHtml(filterText)}</div>
      </div>

      ${ringkasHtml}

      <h2>Rincian Barang (${data.items.length})</h2>
      <table class="detail">
        <thead>
          <tr>${KOLOM_LAPORAN.map((k) => `<th>${escHtml(k)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${detailRows}
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="6">Total (${data.items.length} unit)</td>
            <td class="num">${escHtml(formatRupiah(data.totals.nilai))}</td>
          </tr>
        </tfoot>
      </table>
    </div>
    <script>window.onload = function(){ window.print(); };</script>
  </body>
  </html>`;

      const win = window.open("", "_blank", "width=900,height=700");
      if (!win) return;
      win.document.open();
      win.document.write(html);
      win.document.close();
    };

  const ringkasan: RingkasTable[] = data
    ? [
        {
          title: "Per Ruangan",
          key: "ruangan",
          head: "Ruangan",
          rows: data.byRuangan.map((r) => [r.ruangan, r.jumlah]),
        },
        {
          title: "Per Kategori",
          key: "kategori",
          head: "Kategori",
          rows: data.byKategori.map((r) => [r.kategori, r.jumlah]),
        },
        {
          title: "Per Kondisi",
          key: "kondisi",
          head: "Kondisi",
          rows: data.byKondisi.map((r) => [KONDISI_LABEL[r.kondisi] ?? r.kondisi, r.jumlah]),
        },
      ]
    : [];

  return (
    <>
      <PageHeader
        title="Laporan"
        subtitle="Rekap persediaan per ruangan, kategori, dan kondisi"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={exportPdf}
              disabled={!data}
            >
              <Icon name="print" size={15} />
              Cetak PDF
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={exportCsv}
              disabled={!data || data.items.length === 0}
            >
              <Icon name="download" size={15} />
              Export CSV
            </button>
          </div>
        }
      />

      <div className="card mb-4 no-print">
        <div className="toolbar" style={{ marginBottom: "0.75rem" }}>
          <Field label="Ruangan" htmlFor="lap-ruangan">
            <Select
              id="lap-ruangan"
              value={ruanganId ?? ""}
              onChange={(e) => setRuanganId(e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">Semua ruangan</option>
              {ruanganList?.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.kodeRuangan} · {r.namaRuangan}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Kategori" htmlFor="lap-kategori">
            <Select id="lap-kategori" value={kategori} onChange={(e) => setKategori(e.target.value)}>
              <option value="">Semua kategori</option>
              {kategoriOptions.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Kondisi" htmlFor="lap-kondisi">
            <Select
              id="lap-kondisi"
              value={kondisi}
              onChange={(e) => setKondisi(e.target.value as typeof kondisi)}
            >
              <option value="">Semua kondisi</option>
              <option value="baik">Baik</option>
              <option value="rusak_ringan">Rusak Ringan</option>
              <option value="rusak_berat">Rusak Berat</option>
            </Select>
          </Field>
        </div>
      </div>

      {isPending && (
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div className="stat" key={i}>
              <span className="skeleton" style={{ width: "50%" }} />
              <span className="skeleton" style={{ width: "70%", height: "1.5rem" }} />
            </div>
          ))}
        </div>
      )}

      {error && (
        <Panel>
          <Empty title="Gagal menghitung laporan" text={(error as Error).message} icon="alert" />
        </Panel>
      )}

      {data && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 mb-4">
            <StatCard label="Total Barang" value={data.totals.totalBarang} icon="box" tone="brand" />
            <StatCard label="Nilai Persediaan" value={formatRupiah(data.totals.nilai)} icon="chart" tone="success" />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {ringkasan.map((section) => (
              <Panel key={section.key} title={section.title}>
                {section.rows.length === 0 ? (
                  <Empty title="Tidak ada data" icon="inbox" />
                ) : (
                  <TableWrap>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>{section.head}</th>
                          <th className="num">Jumlah</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.rows.map((r, i) => (
                          <tr key={i}>
                            <td>{r[0]}</td>
                            <td className="num">{r[1]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </TableWrap>
                )}
              </Panel>
            ))}
          </div>

          <Panel className="mt-4" title={`Rincian Barang (${data.items.length})`}>
            {data.items.length === 0 ? (
              <Empty
                title="Tidak ada barang sesuai filter"
                text="Ubah filter untuk melihat rincian lain."
                icon="filter"
              />
            ) : (
              <TableWrap>
                <table className="table">
                  <thead>
                    <tr>
                      {KOLOM_LAPORAN.map((k) => (
                        <th key={k} className={k === "Harga Beli" ? "num" : undefined}>
                          {k}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((b) => {
                      const [kode, nama, kat, merk, ruang, kond, harga] = barisLaporan(b);
                      return (
                        <tr key={b.id}>
                          <td className="mono whitespace-nowrap">{kode}</td>
                          <td className="cell-strong">{nama}</td>
                          <td>{kat || "-"}</td>
                          <td>{merk || "-"}</td>
                          <td>{ruang}</td>
                          <td>{kond}</td>
                          <td className="num whitespace-nowrap">
                            {harga === "" ? "-" : formatRupiah(Number(harga))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </TableWrap>
            )}
          </Panel>
        </>
      )}
    </>
  );
}
