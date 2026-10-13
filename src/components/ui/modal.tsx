"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/icons";

/**
 * Modal aksesibel: fokus masuk otomatis, Esc menutup, fokus terkunci di dalam
 * dialog, dan klik di luar menutup. Scroll body dikunci selama terbuka.
 */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // `onClose` sering dikirim sebagai arrow inline → identitasnya berubah tiap
  // render induk. Simpan di ref agar effect fokus hanya bergantung pada `open`.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;

      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Fokus awal HANYA saat modal dibuka / berpindah isi — bukan tiap render,
    // supaya kursor tidak melompat saat pengguna mengetik.
    const target = dialogRef.current?.querySelector<HTMLElement>(
      "input, select, textarea, button",
    );
    target?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  const maxWidth = size === "lg" ? "48rem" : size === "sm" ? "26rem" : undefined;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="modal"
        style={maxWidth ? { maxWidth } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-head">
          <div>
            <h3 className="modal-title" id={titleId}>
              {title}
            </h3>
            {subtitle && <p className="modal-subtitle">{subtitle}</p>}
          </div>
          <button
            type="button"
            className="btn btn-quiet btn-sm btn-icon"
            onClick={onClose}
            aria-label="Tutup"
          >
            <Icon name="x" size={16} />
          </button>
        </header>

        <div className="modal-body">{children}</div>

        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title = "Konfirmasi",
  message,
  confirmLabel = "Hapus",
  tone = "danger",
  onConfirm,
  onCancel,
  pending,
}: {
  open: boolean;
  title?: string;
  message: ReactNode;
  confirmLabel?: string;
  tone?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
  pending?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Batal
          </button>
          <button
            type="button"
            className={cn("btn", tone === "danger" ? "btn-danger" : "btn-primary")}
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? "Memproses..." : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
        {message}
      </p>
    </Modal>
  );
}
