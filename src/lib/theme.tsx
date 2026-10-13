"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "inventaris-theme";

/** Urutan tombol tema: terang → gelap → ikut sistem. */
export const THEME_CYCLE: ThemeMode[] = ["light", "dark", "system"];

export const THEME_LABEL: Record<ThemeMode, string> = {
  light: "Terang",
  dark: "Gelap",
  system: "Ikut sistem",
};

export const THEME_ICON: Record<ThemeMode, "sun" | "moon" | "monitor"> = {
  light: "sun",
  dark: "moon",
  system: "monitor",
};

function isMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

function resolve(mode: ThemeMode): ResolvedTheme {
  if (mode !== "system") return mode;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Dijalankan inline di <head> sebelum cat pertama: menentukan `data-theme` dari
 * localStorage + preferensi OS. Tanpa ini, pengguna tema gelap melihat kilatan
 * putih saat halaman dimuat.
 */
export const themeInitScript = `(function(){try{var m=localStorage.getItem("${STORAGE_KEY}");var d=m==="dark"||m!=="light"&&(m==="system"||!m)&&matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.dataset.theme=d?"dark":"light";}catch(e){document.documentElement.dataset.theme="light";}})();`;

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  cycle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Preferensi tersimpan dibaca sekali saat inisialisasi state (bukan di dalam
  // efek) sehingga tidak memicu render bertingkat; markup server tetap netral.
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "system";
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isMode(stored) ? stored : "system";
  });

  // Satu efek = satu tempat tema diterapkan dan diikuti perubahan OS.
  useEffect(() => {
    const apply = (next: ResolvedTheme) => {
      document.documentElement.dataset.theme = next;
    };

    apply(resolve(mode));
    if (mode !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply(resolve("system"));
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [mode]);

  // Menyimpan hanya saat pengguna memilih — bukan efek samping render.
  const setMode = useCallback((next: ThemeMode) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    setModeState(next);
  }, []);

  const cycle = useCallback(() => {
    setModeState((current) => {
      const next = THEME_CYCLE[(THEME_CYCLE.indexOf(current) + 1) % THEME_CYCLE.length];
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, setMode, cycle }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme harus dipakai di dalam <ThemeProvider>");
  return ctx;
}
