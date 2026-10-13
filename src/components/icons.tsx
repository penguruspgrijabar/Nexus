import type { ReactNode, SVGProps } from "react";

/**
 * Satu sumber ikon aplikasi. Menambah ikon = menambah satu entri pada tabel
 * PATHS; tidak ada percabangan di komponen. `currentColor` membuat ikon ikut
 * warna teks induknya.
 */
const PATHS = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7.5" height="8.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="5" rx="1.5" />
      <rect x="13.5" y="11" width="7.5" height="10" rx="1.5" />
      <rect x="3" y="14.5" width="7.5" height="6.5" rx="1.5" />
    </>
  ),
  box: (
    <>
      <path d="M20.5 8.2 12 3.4 3.5 8.2v7.6L12 20.6l8.5-4.8z" />
      <path d="M3.5 8.2 12 13l8.5-4.8M12 13v7.6" />
    </>
  ),
  room: (
    <>
      <path d="M3 21h18M5 21V8.5L12 3.5l7 5V21" />
      <path d="M9.75 21v-5.5h4.5V21" />
    </>
  ),
  transfer: (
    <>
      <path d="M4 8.5h13.5" />
      <path d="m14.5 5.5 3 3-3 3" />
      <path d="M20 15.5H6.5" />
      <path d="m9.5 12.5-3 3 3 3" />
    </>
  ),
  chart: (
    <>
      <path d="M4 4v16h16" />
      <path d="M8 17v-5M12.5 17V8M17 17v-7" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.4" />
      <path d="M3 20c0-3.2 2.7-5.4 6-5.4s6 2.2 6 5.4" />
      <path d="M16.4 5.2a3.4 3.4 0 0 1 0 6.5M17.8 14.9c2.1.6 3.2 2.1 3.2 4.1" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  x: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  logout: (
    <>
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 8.5 6.5 12 10 15.5M6.5 12H15" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  chevronLeft: <path d="m14 6-6 6 6 6" />,
  chevronRight: <path d="m10 6 6 6-6 6" />,
  alert: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.2h.01" />
    </>
  ),
  check: <path d="m5.5 12.5 4.5 4.5L18.5 7" />,
  lock: (
    <>
      <rect x="4.5" y="10" width="15" height="10.5" rx="2.5" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m3.8 7.5 8.2 5.8 8.2-5.8" />
    </>
  ),
  print: (
    <>
      <path d="M7.5 9V4h9v5" />
      <rect x="4" y="9" width="16" height="8" rx="2" />
      <path d="M7.5 14h9v6h-9z" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v11M8 11.5l4 4 4-4" />
      <path d="M4.5 20h15" />
    </>
  ),
  pencil: (
    <>
      <path d="M4 20h4L19 9l-4-4L4 16z" />
      <path d="m14.5 5.5 4 4" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M9.5 7V5h5v2" />
      <path d="m6.5 7 1 12.5h9L17.5 7" />
    </>
  ),
  arrowLeft: (
    <>
      <path d="M19 12H5.5" />
      <path d="m11 6.5-5.5 5.5L11 17.5" />
    </>
  ),
  filter: <path d="M4 6.5h16M7 12h10M10 17.5h4" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.8v2.2M12 19v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.8 12H5M19 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" />
    </>
  ),
  moon: <path d="M20 14.2A8.4 8.4 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2z" />,
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M10.6 6.1A9.7 9.7 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3.1 3.8M6.6 7.4A16.6 16.6 0 0 0 2.5 12S6 18 12 18a9.6 9.6 0 0 0 3.7-.7" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" />
    </>
  ),
  monitor: (
    <>
      <rect x="3" y="4.5" width="18" height="12" rx="2" />
      <path d="M9 20h6M12 16.5V20" />
    </>
  ),
  inbox: (
    <>
      <path d="M4 13h4l1.5 3h5L16 13h4" />
      <path d="M5.5 5h13l1.5 8v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4z" />
    </>
  ),
  building: (
    <>
      <rect x="4.5" y="3.5" width="9" height="17" rx="1.5" />
      <path d="M13.5 9h6v11.5h-6" />
      <path d="M7.5 7.5h3M7.5 11h3M7.5 14.5h3M16 12.5h1.5M16 16h1.5M3 20.5h18" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 18,
  className,
  ...rest
}: { name: IconName; size?: number } & Omit<SVGProps<SVGSVGElement>, "name">) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
