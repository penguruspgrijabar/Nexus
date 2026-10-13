/**
 * Server action (next-safe-action) mengembalikan { data } | { serverError } | { validationErrors }.
 * Untuk dipakai di dalam `queryFn` TanStack Query, hasilnya perlu di-unwrap agar error
 * dilempar dan ditangkap oleh react-query.
 */
export function unwrap<T = unknown>(result: unknown): T {
  const r = result as
    | { data?: T; serverError?: unknown; validationErrors?: unknown }
    | null
    | undefined;

  if (!r) throw new Error("Tidak ada respons dari server.");
  if (r.validationErrors) throw new Error("Input tidak valid.");
  if (r.serverError) {
    throw new Error(
      typeof r.serverError === "string" ? r.serverError : "Terjadi kesalahan di server.",
    );
  }
  return r.data as T;
}
