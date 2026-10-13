"use client";

import { useState } from "react";
import { useUserList, useCreateUser, useUpdateUser, useToggleUser } from "@/hooks/use-users";
import { useSession } from "@/lib/session-context";
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
  RoleBadge,
  Select,
  SkeletonRows,
  StatusBadge,
  TableWrap,
} from "@/components/ui";
import { Icon } from "@/components/icons";
import type { Role, UserRow } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

type FormValues = {
  nama: string;
  email: string;
  password: string;
  role: Role;
  telepon: string;
};

const empty: FormValues = { nama: "", email: "", password: "", role: "viewer", telepon: "" };

function toValues(u: UserRow): FormValues {
  return {
    nama: u.nama,
    email: u.email,
    password: "",
    role: u.role,
    telepon: u.telepon ?? "",
  };
}

export default function UsersPage() {
  const session = useSession();
  const isAdmin = session?.role === "admin";

  const { data, isPending, error } = useUserList(isAdmin);
  const [modal, setModal] = useState<{ mode: "create" | "edit"; row?: UserRow } | null>(null);
  const [values, setValues] = useState<FormValues>(empty);
  const [toToggle, setToToggle] = useState<UserRow | null>(null);

  const create = useCreateUser(() => setModal(null));
  const update = useUpdateUser(() => setModal(null));
  const toggle = useToggleUser();

  const pending = create.isPending || update.isPending;
  const actionError =
    create.result?.serverError ?? update.result?.serverError ?? toggle.result?.serverError;

  const set = <K extends keyof FormValues>(k: K, v: FormValues[K]) =>
    setValues((s) => ({ ...s, [k]: v }));

  const submit = () => {
    if (modal?.mode === "edit" && modal.row) {
      update.execute({
        id: modal.row.id,
        data: {
          nama: values.nama,
          email: values.email,
          role: values.role,
          telepon: values.telepon || null,
          password: values.password || undefined,
        },
      });
    } else {
      create.execute({
        nama: values.nama,
        email: values.email,
        password: values.password,
        role: values.role,
        telepon: values.telepon || null,
      });
    }
  };

  const self = (id: number) => id === session?.sub;

  return (
    <>
      <PageHeader
        title="Pengguna"
        subtitle="Kelola akun, peran, dan status akses"
        actions={
          isAdmin ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setValues(empty);
                setModal({ mode: "create" });
              }}
            >
              <Icon name="plus" size={16} />
              Tambah Pengguna
            </button>
          ) : undefined
        }
      />

      <Panel>
        {error && <Empty title="Gagal memuat data" text={(error as Error).message} icon="alert" />}
        {isPending && <SkeletonRows rows={5} cols={6} />}

        {data && data.length === 0 && (
          <Empty
            title="Belum ada pengguna"
            text="Akun pengguna menentukan siapa yang bisa mengelola inventaris."
            icon="users"
          />
        )}

        {data && data.length > 0 && (
          <TableWrap>
            <table className="table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Peran</th>
                  <th>No. Telepon</th>
                  <th>Status</th>
                  <th>Terakhir Masuk</th>
                  <th className="text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.map((u) => (
                  <tr key={u.id}>
                    <td className="cell-strong">
                      {u.nama}
                      {self(u.id) && (
                        <span className="ml-2">
                          <Badge tone="info">Anda</Badge>
                        </span>
                      )}
                    </td>
                    <td className="mono">{u.email}</td>
                    <td>
                      <RoleBadge role={u.role} />
                    </td>
                    <td>{u.telepon ?? "-"}</td>
                    <td>
                      <StatusBadge aktif={u.aktif} />
                    </td>
                    <td className="whitespace-nowrap">{formatDateTime(u.lastLoginAt)}</td>
                    <td>
                      <div className="flex gap-2 justify-end">
                        {isAdmin && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              setValues(toValues(u));
                              setModal({ mode: "edit", row: u });
                            }}
                          >
                            Ubah
                          </button>
                        )}
                        {isAdmin && self(u.id) && (
                          <Badge tone="neutral">Akun sendiri</Badge>
                        )}
                        {isAdmin && !self(u.id) && (
                          <button
                            type="button"
                            className="btn btn-quiet btn-sm"
                            onClick={() => setToToggle(u)}
                          >
                            {u.aktif ? "Nonaktifkan" : "Aktifkan"}
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
        title={modal?.mode === "edit" ? "Ubah Pengguna" : "Tambah Pengguna"}
        subtitle={
          modal?.mode === "edit"
            ? `Memperbarui akun ${modal.row?.email}`
            : "Peran menentukan hak akses pengguna di aplikasi."
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
          <Field label="Nama Lengkap" className="sm:col-span-2">
            <Input
              value={values.nama}
              onChange={(e) => set("nama", e.target.value)}
              placeholder="Budi Santoso"
              required
            />
          </Field>

          <Field label="Email" className="sm:col-span-2">
            <Input
              type="email"
              icon="mail"
              value={values.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="nama@inventaris.local"
              required
            />
          </Field>

          <Field
            label={modal?.mode === "edit" ? "Password Baru" : "Password"}
            hint={
              modal?.mode === "edit"
                ? "Kosongkan bila tidak ingin mengubah password."
                : "Minimal 8 karakter."
            }
          >
            <Input
              type="password"
              value={values.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </Field>

          <Field label="Peran">
            <Select value={values.role} onChange={(e) => set("role", e.target.value as Role)}>
              <option value="viewer">Viewer — hanya lihat</option>
              <option value="operator">Operator — kelola barang &amp; mutasi</option>
              <option value="admin">Admin — kelola semua + pengguna</option>
            </Select>
          </Field>

          <Field label="No. Telepon" className="sm:col-span-2">
            <Input
              value={values.telepon}
              onChange={(e) => set("telepon", e.target.value)}
              placeholder="0812-3456-7890"
            />
          </Field>
        </div>

        <ActionError message={actionError} />
      </Modal>

      <ConfirmDialog
        open={!!toToggle}
        title={toToggle?.aktif ? "Nonaktifkan pengguna" : "Aktifkan pengguna"}
        message={
          <>
            {toToggle?.aktif ? "Nonaktifkan" : "Aktifkan"} akun <b>{toToggle?.nama}</b> (
            {toToggle?.email})? {toToggle?.aktif ? "Pengguna tidak akan bisa masuk." : "Pengguna kembali bisa masuk."}
          </>
        }
        confirmLabel={toToggle?.aktif ? "Nonaktifkan" : "Aktifkan"}
        tone={toToggle?.aktif ? "danger" : "primary"}
        onCancel={() => setToToggle(null)}
        onConfirm={() => toToggle && toggle.execute({ id: toToggle.id })}
        pending={toggle.isPending}
      />
    </>
  );
}