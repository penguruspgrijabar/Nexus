"use client";

import { useQuery } from "@tanstack/react-query";
import { unwrap } from "@/lib/action-result";
import type { DashboardData, LaporanData, MutasiRow } from "@/lib/types";
import { dashboardAction, laporanAction, listMutasiAction } from "@/server/actions/query.action";

export type LaporanFilterInput = {
  ruanganId?: number;
  kategori?: string;
  kondisi?: "baik" | "rusak_ringan" | "rusak_berat";
};

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => unwrap<DashboardData>(await dashboardAction({})),
  });
}

export function useMutasiList(barangId?: number) {
  return useQuery({
    queryKey: ["mutasi", barangId ?? "all"],
    queryFn: async () => unwrap<MutasiRow[]>(await listMutasiAction(barangId ? { barangId } : {})),
  });
}

export function useLaporan(filter: LaporanFilterInput) {
  return useQuery({
    queryKey: ["laporan", filter],
    queryFn: async () =>
      unwrap<LaporanData>(
        await laporanAction({
          ruanganId: filter.ruanganId,
          kategori: filter.kategori || undefined,
          kondisi: filter.kondisi,
        }),
      ),
    placeholderData: (prev) => prev,
  });
}
