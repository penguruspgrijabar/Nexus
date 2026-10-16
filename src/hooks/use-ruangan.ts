"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAction } from "next-safe-action/hooks";
import { unwrap } from "@/lib/action-result";
import type { RuanganRow } from "@/lib/types";
import {
  createRuanganAction,
  deleteRuanganAction,
  updateRuanganAction,
} from "@/server/actions/ruangan.action";
import { listRuanganAction, listUserRingkasAction } from "@/server/actions/query.action";

export function useRuanganList(all?: boolean) {
  return useQuery({
    queryKey: ["ruangan", { all }],
    queryFn: async () => unwrap<RuanganRow[]>(await listRuanganAction({ all })),
  });
}

export function useUserRingkas() {
  return useQuery({
    queryKey: ["users", "ringkas"],
    queryFn: async () =>
      unwrap<{ id: number; nama: string; role: string }[]>(await listUserRingkasAction({})),
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["ruangan"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    qc.invalidateQueries({ queryKey: ["barang"] });
  };
}

export function useCreateRuangan(onDone?: () => void) {
  const invalidate = useInvalidate();
  return useAction(createRuanganAction, {
    onSuccess: () => {
      invalidate();
      onDone?.();
    },
  });
}

export function useUpdateRuangan(onDone?: () => void) {
  const invalidate = useInvalidate();
  return useAction(updateRuanganAction, {
    onSuccess: () => {
      invalidate();
      onDone?.();
    },
  });
}

export function useDeleteRuangan(onDone?: () => void) {
  const invalidate = useInvalidate();
  return useAction(deleteRuanganAction, {
    onSuccess: () => {
      invalidate();
      onDone?.();
    },
  });
}
