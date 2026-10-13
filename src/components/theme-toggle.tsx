"use client";

import { useSyncExternalStore } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { THEME_ICON, THEME_LABEL, useTheme } from "@/lib/theme";

/**
 * Satu tombol yang memutar mode tema (terang → gelap → ikut sistem). Ikon baru
 * dirender setelah mount agar markup server dan klien identik saat hidrasi.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { mode, cycle } = useTheme();
  // Boolean "sudah terhidrasi" dibaca lewat useSyncExternalStore — bukan
  // setState di dalam efek — agar markup server dan klien tetap identik.
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!hydrated) {
    return (
      <button
        type="button"
        className={cn("btn btn-ghost btn-sm btn-icon", className)}
        aria-label="Ubah tema tampilan"
      >
        <span className="theme-placeholder" aria-hidden="true" />
      </button>
    );
  }

  return (
    <button
      type="button"
      className={cn("btn btn-ghost btn-sm btn-icon", className)}
      onClick={cycle}
      aria-label="Ubah tema tampilan"
      title={`Tema: ${THEME_LABEL[mode]}`}
    >
      <Icon name={THEME_ICON[mode]} size={16} />
    </button>
  );
}
