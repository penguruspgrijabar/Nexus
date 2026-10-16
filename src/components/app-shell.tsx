"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useAction } from "next-safe-action/hooks";
import { logoutAction } from "@/server/actions/auth.action";
import { useSession } from "@/lib/session-context";
import { cn, initials, ROLE_LABEL } from "@/lib/utils";
import { Icon, type IconName } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoMark } from "@/components/ui/app-logo";

type NavItem = { href: string; label: string; icon: IconName; roles?: string[] };

/** Navigasi dikelompokkan agar enam tujuan tetap terbaca dalam satu tatapan. */
const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "Operasional",
    items: [
      { href: "/dashboard", label: "Dasbor", icon: "dashboard" },
      { href: "/barang", label: "Barang", icon: "box" },
      { href: "/ruangan", label: "Ruangan", icon: "room" },
      { href: "/mutasi", label: "Mutasi", icon: "transfer" },
    ],
  },
  { group: "Analisis", items: [{ href: "/laporan", label: "Laporan", icon: "chart" }] },
  {
    group: "Administrasi",
    items: [{ href: "/users", label: "Pengguna", icon: "users", roles: ["admin"] }],
  },
];

const TITLE_BY_HREF = new Map(
  NAV.flatMap((group) => group.items).map((item) => [item.href, item.label] as const),
);

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Jejak navigasi diturunkan dari URL — tidak ada state tambahan yang bisa basi. */
function useBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    return { href, label: TITLE_BY_HREF.get(href) ?? (index === 0 ? segment : "Detail") };
  });
}

function Sidebar({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  const session = useSession();
  const pathname = usePathname();

  return (
    <aside className={cn("sidebar", open && "is-open")} id="sidebar-nav">
      <div className="sidebar-head">
        <span className="brand-mark">
          <LogoMark className="h-5 w-5 text-white" />
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-bold tracking-widest" style={{ color: "#fff" }}>
            NEXUS
          </span>
          <span className="block text-[11px]" style={{ color: "var(--sidebar-foreground)" }}>
            Sistem Inventaris
          </span>
        </span>
      </div>

      <div className="sidebar-head-divider" />

      <nav className="sidebar-nav" aria-label="Navigasi utama">
        {NAV.map((group) => {
          const items = group.items.filter(
            (item) => !item.roles || (session && item.roles.includes(session.role)),
          );
          if (items.length === 0) return null;

          return (
            <div key={group.group}>
              <p className="sidebar-label">{group.group}</p>
              {items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="nav-item"
                    aria-current={active ? "page" : undefined}
                    onClick={onNavigate}
                  >
                    <Icon name={item.icon} size={17} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-foot">
        <span className="avatar" aria-hidden="true">
          {initials(session?.nama ?? "?")}
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-xs font-semibold" style={{ color: "#e2e8f0" }}>
            {session?.nama}
          </span>
          <span className="block text-[11px]" style={{ color: "var(--sidebar-foreground)" }}>
            {ROLE_LABEL[session?.role ?? ""] ?? session?.role}
          </span>
        </span>
      </div>
    </aside>
  );
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  const session = useSession();
  const router = useRouter();
  const crumbs = useBreadcrumb();

  const { execute, isPending } = useAction(logoutAction, {
    onSuccess: () => {
      const sessionBridge = (window as Window & { NexusSession?: { clearCookies: () => void } }).NexusSession;
      sessionBridge?.clearCookies();
      router.push("/login");
      router.refresh();
    },
  });

  return (
    <header className="topbar no-print">
      <button
        type="button"
        className="btn btn-quiet btn-sm btn-icon lg:hidden"
        onClick={onMenu}
        aria-label="Buka menu navigasi"
        aria-controls="sidebar-nav"
      >
        <Icon name="menu" size={18} />
      </button>

      <nav className="breadcrumb" aria-label="Jejak navigasi">
        <Link href="/dashboard" className="hover:underline">
          Beranda
        </Link>
        {crumbs.map((crumb, index) => (
          <span key={crumb.href} className="flex items-center gap-2">
            <Icon name="chevronRight" size={13} />
            {index === crumbs.length - 1 ? (
              <span className="font-medium" style={{ color: "var(--foreground)" }}>
                {crumb.label}
              </span>
            ) : (
              <Link href={crumb.href} className="hover:underline">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <span className="hidden sm:block text-right leading-tight">
          <span className="block text-xs font-semibold">{session?.nama}</span>
          <span className="block text-[11px]" style={{ color: "var(--muted-foreground)" }}>
            {ROLE_LABEL[session?.role ?? ""] ?? session?.role}
          </span>
        </span>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => execute()}
          disabled={isPending}
        >
          <Icon name="logout" size={15} />
          {isPending ? "Keluar..." : "Keluar"}
        </button>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Perpindahan halaman (termasuk tombol kembali browser) selalu menutup
  // panel navigasi layar kecil — penyesuaian state saat render, bukan efek.
  const [previousPath, setPreviousPath] = useState(pathname);
  if (previousPath !== pathname) {
    setPreviousPath(pathname);
    setOpen(false);
  }

  return (
    <div className="app-shell">
      <a href="#konten" className="skip-link">
        Lompat ke konten
      </a>

      <Sidebar open={open} onNavigate={() => setOpen(false)} />
      {open && (
        <div className="scrim lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />
      )}

      <div className="app-main">
        <Topbar onMenu={() => setOpen((v) => !v)} />
        <main className="app-content" id="konten">
          {children}
        </main>
        <footer className="app-footer no-print">
          NEXUS · Next.js · Drizzle · next-safe-action · TanStack Query
        </footer>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions no-print">{actions}</div>}
    </div>
  );
}
