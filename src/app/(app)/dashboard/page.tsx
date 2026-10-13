"use client";

import Link from "next/link";
import { useDashboard } from "@/hooks/use-misc";
import { PageHeader } from "@/components/app-shell";
import { Empty, Panel, StatCard, TableWrap } from "@/components/ui";
import { formatDateTime, formatRupiah } from "@/lib/utils";

export default function DashboardPage() {
  const { data, isPending, error } = useDashboard();

  return (
    <>
      <PageHeader title="Dasbor" subtitle="Ringkasan kondisi inventaris" />

      {error && (
        <div className="card">
          <Empty
            title="Gagal memuat data"
            text={(error as Error).message}
            icon="alert"
          />
        </div>
      )}

      {isPending && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="stat" key={i}>
              <span className="skeleton" style={{ width: "45%" }} />
              <span className="skeleton" style={{ width: "65%", height: "1.5rem" }} />
            </div>
          ))}
        </div>
      )}

      {data && (
        <>
          <div className="stat-hero">
            <StatCard
              label="Total Barang"
              value={data.totalBarang}
              icon="box"
              tone="brand"
              hint="Semua unit tercatat"
            />
            <StatCard
              label="Nilai Persediaan"
              value={formatRupiah(data.nilaiTotal)}
              icon="chart"
              tone="brand"
              hint="Total nilai seluruh barang"
            />
          </div>

          <div className="stat-grid">
            <StatCard label="Ruangan" value={data.totalRuangan} icon="room" />
            <StatCard
              label="Tanpa Ruangan"
              value={data.tanpaRuangan}
              icon="alert"
              tone={data.tanpaRuangan > 0 ? "warning" : "neutral"}
              hint={data.tanpaRuangan > 0 ? "Perlu ditempatkan" : "Semua barang sudah ditempatkan"}
            />
            <StatCard
              label="Rusak"
              value={data.rusak}
              icon="alert"
              tone={data.rusak > 0 ? "danger" : "success"}
              hint="Rusak ringan + berat"
            />
          </div>

          <Panel
            className="mt-6"
            title="Mutasi Terakhir"
            actions={
              <Link href="/mutasi" className="btn btn-ghost btn-sm">
                Lihat semua
              </Link>
            }
          >
            {data.recentMutasi.length === 0 ? (
              <Empty
                title="Belum ada mutasi"
                text="Riwayat perpindahan barang antar ruangan akan muncul di sini."
                icon="transfer"
              />
            ) : (
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
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentMutasi.map((m) => (
                      <tr key={m.id}>
                        <td className="whitespace-nowrap">{formatDateTime(m.createdAt)}</td>
                        <td>
                          <Link
                            href={`/barang/${m.barangId}`}
                            className="cell-strong hover:underline"
                          >
                            {m.barangNama}
                          </Link>
                          <div className="cell-sub mono">{m.barangKode}</div>
                        </td>
                        <td>{m.asalNama ?? "Tanpa ruangan"}</td>
                        <td>{m.tujuanNama ?? "-"}</td>
                        <td className="num">1 unit</td>
                        <td>{m.petugasNama ?? "-"}</td>
                      </tr>
                    ))}
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
