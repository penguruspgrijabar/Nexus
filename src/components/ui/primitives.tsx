"use client";

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/icons";

/* ---------------- Field wrapper ---------------- */

export function Field({
  label,
  hint,
  error,
  children,
  className,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={cn("field", className)}>
      <label className="field-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="field-hint">{hint}</p>
      )}
    </div>
  );
}

/* ---------------- Kontrol input ---------------- */

type InputProps = InputHTMLAttributes<HTMLInputElement> & { icon?: IconName };

export function Input({ icon, className, ...props }: InputProps) {
  if (!icon) return <input className={cn("input", className)} {...props} />;
  return (
    <div className="input-group">
      <Icon name={icon} size={16} className="input-icon" />
      <input className={cn("input", "input-with-icon", className)} {...props} />
    </div>
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn("select", className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("textarea", className)} {...props} />;
}

/* ---------------- Badge ---------------- */

export type Tone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

export function Badge({
  tone = "neutral",
  dot,
  children,
}: {
  tone?: Tone;
  dot?: boolean;
  children: ReactNode;
}) {
  return <span className={cn("badge", `badge-${tone}`, dot && "badge-dot")}>{children}</span>;
}

const KONDISI: Record<string, { tone: Tone; label: string }> = {
  baik: { tone: "success", label: "Baik" },
  rusak_ringan: { tone: "warning", label: "Rusak Ringan" },
  rusak_berat: { tone: "danger", label: "Rusak Berat" },
};

export function KondisiBadge({ kondisi }: { kondisi: string }) {
  const item = KONDISI[kondisi] ?? { tone: "neutral" as Tone, label: kondisi };
  return (
    <Badge tone={item.tone} dot>
      {item.label}
    </Badge>
  );
}

const ROLE_TONE: Record<string, Tone> = {
  admin: "brand",
  operator: "info",
  viewer: "neutral",
};

export function RoleBadge({ role, label }: { role: string; label?: string }) {
  return <Badge tone={ROLE_TONE[role] ?? "neutral"}>{label ?? role}</Badge>;
}

export function StatusBadge({ aktif }: { aktif: boolean }) {
  return (
    <Badge tone={aktif ? "success" : "neutral"} dot>
      {aktif ? "Aktif" : "Nonaktif"}
    </Badge>
  );
}

/* ---------------- Umpan balik ---------------- */

export function ActionError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="alert alert-danger" role="alert">
      <Icon name="alert" size={16} />
      <span>{message}</span>
    </div>
  );
}

export function Empty({
  title = "Belum ada data",
  text,
  icon = "inbox",
  action,
}: {
  title?: string;
  text?: string;
  icon?: IconName;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon name={icon} size={20} />
      </span>
      <p className="empty-title">{title}</p>
      {text && <p className="empty-desc">{text}</p>}
      {action}
    </div>
  );
}

/** Rangka pemuat untuk baris tabel — memberi bentuk, bukan teks "memuat...". */
export function SkeletonRows({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="table-wrap" aria-hidden="true">
      <table className="table">
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((__, c) => (
                <td key={c}>
                  <span className="skeleton" style={{ width: `${[70, 45, 60, 35, 55][c % 5]}%` }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Panel & tabel ---------------- */

export function Panel({
  title,
  actions,
  children,
  className,
}: {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("panel", className)}>
      {(title || actions) && (
        <div className="panel-head">
          {title && <h2 className="section-title">{title}</h2>}
          {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="table-wrap">{children}</div>;
}

export function Pagination({
  page,
  totalPages,
  total,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPage: (p: number) => void;
}) {
  return (
    <div className="pagination">
      <span>
        <b className="num">{total}</b> data · halaman <b className="num">{page}</b> dari{" "}
        <b className="num">{totalPages}</b>
      </span>
      <div className="pagination-controls">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <Icon name="chevronLeft" size={15} />
          Sebelumnya
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          Berikutnya
          <Icon name="chevronRight" size={15} />
        </button>
      </div>
    </div>
  );
}
