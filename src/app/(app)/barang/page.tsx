"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "@/lib/session-context";
import {
  useBarangList,
  useCreateBarang,
  useDeleteBarang,
  useUpdateBarang,
} from "@/hooks/use-barang";
import { useRuanganList } from "@/hooks/use-ruangan";
import { PageHeader } from "@/components/app-shell";
import {
  ActionError,
  Badge,
  ConfirmDialog,
  Empty,
  Field,
  Input,
  KondisiBadge,
  Modal,
  Pagination,
  Panel,
  Select,
  SkeletonRows,
  TableWrap,
} from "@/components/ui";
import { Icon } from "@/components/icons";
import {
  BarangForm,
  emptyBarang,
  toFormValues,
  toPayload,
  type BarangFormValues,
} from "@/components/barang-form";
import type { BarangFilterInput, BarangRow } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";

export default function BarangPage() {
  const session = useSession();
  const canWrite = session?.role === "admin" || session?.role === "operator";
  const canDelete = session?.role === "admin";

  const [filter, setFilter] = useState<BarangFilterInput>({ page: 1, limit: 10 });
  const [searchInput, setSearchInput] = useState("");
  const [modal, setModal] = useState<{ mode: "create" | "edit"; row?: BarangRow } | null>(null);
  const [values, setValues] = useState<BarangFormValues>(emptyBarang);
  const [toDelete, setToDelete] = useState<BarangRow | null>(null);

  const { data, isPending, error } = useBarangList(filter);
  const { data: ruanganList } = useRuanganList();

  const create = useCreateBarang(() => setModal(null));
  const update = useUpdateBarang(() => setModal(null));
  const del = useDeleteBarang(() => setToDelete(null));

  const pending = create.isPending || update.isPending;
  const actionError =
    create.result?.serverError ?? update.result?.serverError ?? del.result?.serverError;

  const patchFilter = (patch: Partial<BarangFilterInput>) =>
    setFilter((f) => ({ ...f, ...patch, page: 1 }));

  const applySearch = () => patchFilter({ search: searchInput || undefined });

  const openCreate = () => {
    setValues(emptyBarang);
    setModal({ mode: "create" });
  };

  const openEdit = (row: BarangRow) => {
    setValues(toFormValues(row));
    setModal({ mode: "edit", row });
  };

  const submit = () => {
    const payload = toPayload(values);
    if (!payload.namaBarang) return;
    if (modal?.mode === "edit" && modal.row) {
      update.execute({ id: modal.row.id, data: payload });
    } else {
      create.execute(payload);
    }
  };

  const hasFilter = Boolean(
    filter.search || filter.ruanganId || filter.kategori || filter.kondisi,
  );

  return (
    <>
      <PageHeader
        title="Data Barang"
        subtitle="Kelola seluruh barang inventaris"
        actions={
          canWrite ? (
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              <Icon name="plus" size={16} />
              Tambah Barang
            </button>
          ) : undefined
        }
      />

      <div className="card mb-4">
        <div className="toolbar" style={{ marginBottom: "0.75rem" }}>
          <Field label="Cari" htmlFor="cari-barang">
            <Input
              id="cari-barang"
              icon="search"
              value={searchInput}
              placeholder="Nama, kode, atau merk"
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applySearch();
              }}
            />
          </Field>

          <Field label="Ruangan" htmlFor="filter-ruangan">
            <Select
              id="filter-ruangan"
              value={filter.ruanganId ?? ""}
              onChange={(e) =>
                patchFilter({
                  ruanganId:
                    e.target.value === ""
                      ? undefined
                      : Number(e.target.value),
                })
              }
            >
              <option value="">Semua ruangan</option>
              <option value="-1">Tanpa ruangan</option>
              {ruanganList?.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.kodeRuangan} · {r.namaRuangan}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Kategori" htmlFor="filter-kategori">
            <Select
              id="filter-kategori"
              value={filter.kategori ?? ""}
              onChange={(e) => patchFilter({ kategori: e.target.value || undefined })}
            >
              <option value="">Semua kategori</option>
              {data?.kategoriList.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Kondisi" htmlFor="filter-kondisi">
            <Select
              id="filter-kondisi"
              value={filter.kondisi ?? ""}
              onChange={(e) =>
                patchFilter({ kondisi: (e.target.value || undefined) as BarangFilterInput["kondisi"] })
              }
            >
              <option value="">Semua kondisi</option>
              <option value="baik">Baik</option>
              <option value="rusak_ringan">Rusak Ringan</option>
              <option value="rusak_berat">Rusak Berat</option>
            </Select>
          </Field>

          <div className="flex items-end gap-2">
            <button type="button" className="btn btn-ghost btn-sm" onClick={applySearch}>
              <Icon name="search" size={15} />
              Terapkan
            </button>
            {hasFilter && (
              <button
                type="button"
                className="btn btn-quiet btn-sm"
                onClick={() => {
                  setSearchInput("");
                  setFilter({ page: 1, limit: 10 });
                }}
              >
                <Icon name="x" size={15} />
                Reset filter
              </button>
            )}
          </div>
        </div>
      </div>

      <Panel>
        {error && <Empty title="Gagal memuat data" text={(error as Error).message} icon="alert" />}

        {isPending && <SkeletonRows rows={6} cols={7} />}

        {data && data.data.length === 0 && (
          <Empty
            title={hasFilter ? "Tidak ada barang sesuai filter" : "Belum ada barang"}
            text={
              hasFilter
                ? "Ubah atau reset filter untuk melihat hasil lain."
                : "Tambahkan barang pertama untuk mulai mencatat inventaris."
            }
            icon="box"
            action={
              canWrite && !hasFilter ? (
                <button type="button" className="btn btn-primary btn-sm mt-1" onClick={openCreate}>
                  <Icon name="plus" size={15} />
                  Tambah Barang
                </button>
              ) : undefined
            }
          />
        )}

        {data && data.data.length > 0 && (
          <>
            <TableWrap>
              <table className="table">
                <thead>
                  <tr>
                    <th>Kode</th>
                    <th>Nama</th>
                    <th>Kategori</th>
                    <th>Ruangan</th>
                    <th className="num">Jumlah</th>
                    <th>Kondisi</th>
                    <th className="num">Harga Beli</th>
                    <th className="text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((b) => (
                    <tr key={b.id}>
                      <td className="mono whitespace-nowrap">{b.kodeBarang}</td>
                      <td>
                        <Link href={`/barang/${b.id}`} className="cell-strong hover:underline">
                          {b.namaBarang}
                        </Link>
                        {b.merk && <div className="cell-sub">{b.merk}</div>}
                      </td>
                      <td>{b.kategori ?? "-"}</td>
                      <td>
                        {b.ruanganNama ? (
                          <>
                            <div>{b.ruanganNama}</div>
                            <div className="cell-sub mono">{b.ruanganKode}</div>
                          </>
                        ) : (
                          <Badge tone="warning">Tanpa ruangan</Badge>
                        )}
                      </td>
                      <td className="num">1 unit</td>
                      <td>
                        <KondisiBadge kondisi={b.kondisi} />
                      </td>
                      <td className="num whitespace-nowrap">{formatRupiah(b.hargaBeli)}</td>
                      <td>
                                              <div className="flex gap-2 justify-center">
                                                <Link href={`/barang/${b.id}`} className="btn btn-ghost btn-sm">
                                                  Detail
                                                </Link>
                          {canWrite && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => openEdit(b)}
                            >
                              Ubah
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => setToDelete(b)}
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>

            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              total={data.total}
              onPage={(p) => setFilter((f) => ({ ...f, page: p }))}
            />
          </>
        )}
      </Panel>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        size="lg"
        title={modal?.mode === "edit" ? "Ubah Barang" : "Tambah Barang"}
        subtitle={
          modal?.mode === "edit"
            ? `Memperbarui data ${modal.row?.kodeBarang}`
            : "Kode barang akan dibuat otomatis bila dikosongkan."
        }
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>
              Batal
            </button>
            <button type="button" className="btn btn-primary" onClick={submit} disabled={pending}>
              {pending ? "Menyimpan..." : "Simpan"}
            </button>
          </>
        }
      >
        <BarangForm
          values={values}
          onChange={setValues}
          autoKode={modal?.mode === "create"}
        />
        <ActionError message={actionError} />
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Hapus barang"
        message={
          <>
            Hapus barang <b>{toDelete?.namaBarang}</b> ({toDelete?.kodeBarang})? Riwayat mutasinya
            juga akan ikut terhapus.
          </>
        }
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && del.execute({ id: toDelete.id })}
        pending={del.isPending}
      />
    </>
  );
}
