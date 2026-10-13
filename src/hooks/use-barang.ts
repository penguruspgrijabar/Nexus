"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAction } from "next-safe-action/hooks";
import { unwrap } from "@/lib/action-result";
import type { BarangDetailResponse, BarangFilterInput, BarangListResponse } from "@/lib/types";
import {
  createBarangAction,
  deleteBarangAction,
  mutasiBarangAction,
  updateBarangAction,
} from "@/server/actions/barang.action";
import { getBarangAction, listBarangAction } from "@/server/actions/query.action";

export type { BarangFilterInput };

export function useBarangList(filter: BarangFilterInput) {
  return useQuery({
    queryKey: ["barang", filter],
    queryFn: async () =>
      unwrap<BarangListResponse>(
        await listBarangAction({
          page: filter.page ?? 1,
          limit: filter.limit ?? 10,
          search: filter.search || undefined,
          ruanganId: filter.ruanganId,
          kategori: filter.kategori,
          kondisi: filter.kondisi,
        }),
      ),
    placeholderData: (prev) => prev,
  });
}

export function useBarangDetail(id: number) {
  return useQuery({
    queryKey: ["barang", "detail", id],
    queryFn: async () => unwrap<BarangDetailResponse | null>(await getBarangAction({ id })),
    enabled: Number.isFinite(id) && id > 0,
  });
}

/** Invalidate semua query barang + turunannya. */
export function useInvalidateBarang() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["barang"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    qc.invalidateQueries({ queryKey: ["mutasi"] });
    qc.invalidateQueries({ queryKey: ["ruangan"] });
    qc.invalidateQueries({ queryKey: ["laporan"] });
  };
}

export function useCreateBarang(onDone?: () => void) {
  const invalidate = useInvalidateBarang();
  return useAction(createBarangAction, {
    onSuccess: () => {
      invalidate();
      onDone?.();
    },
  });
}

export function useUpdateBarang(onDone?: () => void) {
  const invalidate = useInvalidateBarang();
  return useAction(updateBarangAction, {
    onSuccess: () => {
      invalidate();
      onDone?.();
    },
  });
}

export function useDeleteBarang(onDone?: () => void) {
  const invalidate = useInvalidateBarang();
  return useAction(deleteBarangAction, {
    onSuccess: () => {
      invalidate();
      onDone?.();
    },
  });
}

export function useMutasiBarang(onDone?: () => void) {
  const invalidate = useInvalidateBarang();
  return useAction(mutasiBarangAction, {
    onSuccess: () => {
      invalidate();
      onDone?.();
    },
  });
}
