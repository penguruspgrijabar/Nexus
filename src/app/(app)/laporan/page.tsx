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
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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
    const sanitizeCsvCell = (val: unknown) => {
      let str = String(val ?? "");
      // Cegah formula injection jika diawali =, +, -, @, \t, \r
      if (/^[=+\-@\t\r]/.test(str)) {
        str = `'${str}`;
      }
      return `"${str.replace(/"/g, '""')}"`;
    };
    const csv = [KOLOM_LAPORAN, ...data.items.map(barisLaporan)]
      .map((r) => r.map(sanitizeCsvCell).join(";"))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `laporan-inventaris-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    };

    /** Export PDF: generate file PDF langsung via jsPDF & autotable, kompatibel dengan WebView Android. */
    const exportPdf = () => {
      if (!data) return;
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

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

      let y = 40;
      doc.setFontSize(16);
      doc.setTextColor(30, 58, 138);
      doc.text(judul, 40, y);
      y += 18;
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      doc.text(`Per ${tanggal} | ${filterText}`, 40, y);

      y += 15;
      const ringkasanData = [
        { title: "Per Ruangan", head: "Ruangan", rows: data.byRuangan.map((r) => [r.ruangan, r.jumlah]) },
        { title: "Per Kategori", head: "Kategori", rows: data.byKategori.map((r) => [r.kategori, r.jumlah]) },
        { title: "Per Kondisi", head: "Kondisi", rows: data.byKondisi.map((r) => [KONDISI_LABEL[r.kondisi] ?? r.kondisi, r.jumlah]) },
      ];

      ringkasanData.forEach((s, idx) => {
        doc.setFontSize(11);
        doc.setTextColor(31, 41, 55);
        doc.text(s.title, 40 + idx * 250, y + 10);
        autoTable(doc, {
          startY: y + 15,
          margin: { left: 40 + idx * 250 },
          tableWidth: 230,
          head: [[s.head, "Jumlah"]],
          body: s.rows.map((r) => [String(r[0]), String(r[1])]),
          theme: "striped",
          headStyles: { fillColor: [30, 64, 175], fontSize: 9 },
          bodyStyles: { fontSize: 8 },
          columnStyles: { 1: { halign: "right" } },
        });
      });

      const finalStartY = Math.max(
        (doc as any).lastAutoTable?.finalY || 150,
        y + 120
      );

      doc.setFontSize(12);
      doc.setTextColor(30, 58, 138);
      doc.text(`Rincian Barang (${data.items.length} unit)`, 40, finalStartY + 20);

      const detailRows = data.items.map((b) => {
        const row = barisLaporan(b);
        return [
          row[0],
          row[1],
          row[2] || "-",
          row[3] || "-",
          row[4],
          row[5],
          row[6] ? formatRupiah(Number(row[6])) : "-",
        ];
      });

      autoTable(doc, {
        startY: finalStartY + 28,
        head: [KOLOM_LAPORAN as unknown as string[]],
        body: detailRows,
        theme: "striped",
        headStyles: { fillColor: [30, 64, 175], fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 40, right: 40 },
        columnStyles: { 6: { halign: "right" } },
      });

      const totalY = (doc as any).lastAutoTable.finalY + 15;
      autoTable(doc, {
        startY: totalY,
        body: [["TOTAL NILAI PERSEDIAAN", formatRupiah(data.totals.nilai)]],
        theme: "plain",
        margin: { left: 40, right: 40 },
        styles: { fontSize: 10, fontStyle: "bold", fillColor: [241, 245, 255] },
        columnStyles: { 0: { halign: "left" }, 1: { halign: "right" } },
      });

      doc.save(`laporan-inventaris-${new Date().toISOString().slice(0, 10)}.pdf`);
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
