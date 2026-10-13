import { cn } from "@/lib/utils";

/**
 * Logo NEXUS — Titik hubung Barang, Kode, Ruangan.
 *
 * Filosofi visual:
 * - Lingkaran  = sistem/ruangan (wadah terpadu)
 * - Belah ketupat = aset/unit (bentuk fisik yang elegan)
 * - Titik putih = kode unik (identitas yang tak terhapuskan)
 */

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-8 w-8", className)}
      aria-hidden="true"
    >
      <circle
        cx="24"
        cy="24"
        r="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <rect
        x="16"
        y="16"
        width="16"
        height="16"
        rx="2"
        fill="currentColor"
        transform="rotate(45 24 24)"
      />
      <circle cx="24" cy="24" r="3" fill="white" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className="h-8 w-8 text-accent" />
      <div className="flex flex-col leading-none">
        <span className="text-lg font-bold tracking-widest text-foreground">
          NEXUS
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Sistem Inventaris
        </span>
      </div>
    </div>
  );
}
