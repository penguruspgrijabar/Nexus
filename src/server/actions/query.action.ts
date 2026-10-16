"use server";

import { z } from "zod";
import { actionClient, adminActionClient } from "@/lib/safe-action";
import {
  barangFilterSchema,
  idSchema,
  laporanFilterSchema,
} from "@/server/db/validation";
import {
  getBarang,
  getDashboard,
  getLaporan,
  listBarang,
  listMutasiBarang,
  listMutasiGlobal,
  listRuangan,
  listUserRingkas,
  listUsers,
} from "@/server/queries";

const emptyInput = z.object({});

/* ------------------------------- Barang ------------------------------- */

export const listBarangAction = actionClient
  .inputSchema(barangFilterSchema)
  .action(async ({ parsedInput, ctx }) => listBarang(parsedInput, ctx.user?.role === "operator" ? ctx.user.sub : undefined));

export const getBarangAction = actionClient
  .inputSchema(idSchema)
  .action(async ({ parsedInput, ctx }) => getBarang(parsedInput.id, ctx.user?.role === "operator" ? ctx.user.sub : undefined));

/* ------------------------------- Ruangan ------------------------------ */

export const listRuanganAction = actionClient
  .inputSchema(z.object({ all: z.boolean().optional() }))
  .action(async ({ parsedInput, ctx }) =>
    listRuangan(
      parsedInput.all || ctx.user?.role !== "operator" ? undefined : ctx.user.sub,
    ),
  );

/* -------------------------------- User ------------------------------- */

export const listUsersAction = adminActionClient
  .inputSchema(emptyInput)
  .action(async () => listUsers());

export const listUserRingkasAction = actionClient
  .inputSchema(emptyInput)
  .action(async () => listUserRingkas());

/* ------------------------------- Mutasi ------------------------------ */

export const listMutasiAction = actionClient
  .inputSchema(
    z.object({ barangId: z.number().int().positive().optional() }),
  )
  .action(async ({ parsedInput }) =>
    parsedInput.barangId
      ? listMutasiBarang(parsedInput.barangId)
      : listMutasiGlobal(100),
  );

/* -------------------------- Dasbor & Laporan ------------------------- */

export const dashboardAction = actionClient
  .inputSchema(emptyInput)
  .action(async ({ ctx }) => getDashboard(ctx.user?.role === "operator" ? ctx.user.sub : undefined));

export const laporanAction = actionClient
  .inputSchema(laporanFilterSchema)
  .action(async ({ parsedInput, ctx }) => getLaporan(parsedInput, ctx.user?.role === "operator" ? ctx.user.sub : undefined));
