"use client";

import { useState } from "react";
import { useSession } from "@/lib/session-context";
import {
  useCreateRuangan,
  useDeleteRuangan,
  useRuanganList,
  useUpdateRuangan,
  useUserRingkas,
} from "@/hooks/use-ruangan";
import { PageHeader } from "@/components/app-shell";
import {
  ActionError,
  Badge,
  ConfirmDialog,
  Empty,
  Field,
  Input,
  Modal,
  Panel,
  Select,
  SkeletonRows,
  TableWrap,
  Textarea,
} from "@/components/ui";
import { Icon } from "@/components/icons";
import type { RuanganRow } from "@/lib/types";

type FormValues = {
  kodeRuangan: string;
  namaRuangan: string;
  lantai: string;
  deskripsi: string;
  penanggungJawabId: string;
};

const empty: FormValues = {
  kodeRuangan: "",
  namaRuangan: "",
  lantai: "",
  deskripsi: "",
  penanggungJawabId: "",
};

function toValues(r: RuanganRow): FormValues {
  return {
    kodeRuangan: r.kodeRuangan,
    namaRuangan: r.namaRuangan,
    lantai: r.lantai ?? "",
    deskripsi: r.deskripsi ?? "",
    penanggungJawabId: r.penanggungJawabId ? String(r.penanggungJawabId) : "",
  };
}

function toPayload(v: FormValues) {
  return {
    kodeRuangan: v.kodeRuangan.trim() || undefined,
    namaRuangan: v.namaRuangan.trim(),
    lantai: v.lantai.trim() || null,
    deskripsi: v.deskripsi.trim() || null,
    penanggungJawabId: v.penanggungJawabId ? Number(v.penanggungJawabId) : null,
  };
}

export default function RuanganPage() {
  const session = useSession();
  const canWrite = session?.role === "admin";
  const canDelete = session?.role === "admin";

  const { data, isPending, error } = useRuanganList();
  const { data: petugasList } = useUserRingkas();

  const [modal, setModal] = useState<{ mode: "create" | "edit"; row?: RuanganRow } | null>(null);
  const [values, setValues] = useState<FormValues>(empty);
  const [toDelete, setToDelete] = useState<RuanganRow | null>(null);

  const create = useCreateRuangan(() => setModal(null));
  const update = useUpdateRuangan(() => setModal(null));
  const del = useDeleteRuangan(() => setToDelete(null));

  const pending = create.isPending || update.isPending;
  const actionError =
    create.result?.serverError ?? update.result?.serverError ?? del.result?.serverError;

  const set = <K extends keyof FormValues>(k: K, v: FormValues[K]) =>
    setValues((s) => ({ ...s, [k]: v }));

  const submit = () => {
    const payload = toPayload(values);
    if (!payload.namaRuangan) return;
    if (modal?.mode === "edit" && modal.row) {
      update.execute({ id: modal.row.id, data: payload });
    } else {
      create.execute(payload);
    }
  };

  return (
    <>
      <PageHeader
        title="Data Ruangan"
        subtitle="Kelola ruangan dan penanggung jawabnya"
        actions={
          canWrite ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setValues(empty);
                setModal({ mode: "create" });
              }}
            >
              <Icon name="plus" size={16} />
              Tambah Ruangan
            </button>
          ) : undefined
        }
      />

      <Panel>
        {error && <Empty title="Gagal memuat data" text={(error as Error).message} icon="alert" />}
        {isPending && <SkeletonRows rows={4} cols={6} />}

        {data && data.length === 0 && (
          <Empty
            title="Belum ada ruangan"
            text="Ruangan dipakai untuk menempatkan barang dan mencatat mutasi."
            icon="room"
          />
        )}

        {data && data.length > 0 && (
          <TableWrap>
            <table className="table">
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Nama Ruangan</th>
                  <th>Lantai</th>
                  <th>Penanggung Jawab</th>
                  <th>Barang</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r.id}>
                    <td className="mono whitespace-nowrap">{r.kodeRuangan}</td>
                    <td className="cell-strong">{r.namaRuangan}</td>
                    <td>{r.lantai ?? "-"}</td>
                    <td>{r.penanggungJawabNama ?? "-"}</td>
                    <td>
                      <Badge tone={r.jumlahBarang > 0 ? "brand" : "neutral"}>
                        {r.jumlahBarang} jenis
                      </Badge>
                    </td>
                    <td>
                      <div className="flex gap-2 justify-end">
                        {canWrite && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              setValues(toValues(r));
                              setModal({ mode: "edit", row: r });
                            }}
                          >
                            Ubah
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => setToDelete(r)}
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
        )}
      </Panel>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "Ubah Ruangan" : "Tambah Ruangan"}
        subtitle={
          modal?.mode === "edit"
            ? `Memperbarui ${modal.row?.kodeRuangan}`
            : "Kode ruangan dibuat otomatis bila dikosongkan."
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
        <div className="form-grid">
          <Field
            label="Kode Ruangan"
            hint={modal?.mode === "create" ? "Kosongkan untuk auto-generate (R-001)" : undefined}
          >
            <Input
              className="mono"
              value={values.kodeRuangan}
              onChange={(e) => set("kodeRuangan", e.target.value)}
              placeholder="R-001"
            />
          </Field>

          <Field label="Nama Ruangan">
            <Input
              value={values.namaRuangan}
              onChange={(e) => set("namaRuangan", e.target.value)}
              placeholder="Gudang A"
              required
            />
          </Field>

          <Field label="Lantai">
            <Input
              value={values.lantai}
              onChange={(e) => set("lantai", e.target.value)}
              placeholder="1"
            />
          </Field>

          <Field label="Penanggung Jawab" className="sm:col-span-2">
            <Select
              value={values.penanggungJawabId}
              onChange={(e) => set("penanggungJawabId", e.target.value)}
            >
              <option value="">— Belum ditentukan —</option>
              {petugasList?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nama} ({u.role})
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Deskripsi" className="sm:col-span-2">
            <Textarea
              rows={3}
              value={values.deskripsi}
              onChange={(e) => set("deskripsi", e.target.value)}
              placeholder="Catatan akses atau isi ruangan"
            />
          </Field>
        </div>

        <ActionError message={actionError} />
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Hapus ruangan"
        message={
          <>
            Hapus ruangan <b>{toDelete?.namaRuangan}</b> ({toDelete?.kodeRuangan})? Ruangan yang masih
            berisi barang tidak dapat dihapus.
          </>
        }
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && del.execute({ id: toDelete.id })}
        pending={del.isPending}
      />
    </>
  );
}
