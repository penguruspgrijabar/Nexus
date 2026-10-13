"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { loginAction } from "@/server/actions/auth.action";
import { ActionError, Field, Input } from "@/components/ui";
import { Icon } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoMark } from "@/components/ui/app-logo";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const nextUrl = params.get("next") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { execute, result, isPending } = useAction(loginAction, {
    onSuccess: () => {
      router.push(nextUrl);
      router.refresh();
    },
  });

  const serverError = result?.serverError;
  const fieldErrors = result?.validationErrors?.fieldErrors;

  return (
    <main className="auth relative overflow-hidden">
      {/* 3D Background */}
      <div className="auth-bg" aria-hidden="true">
        <div className="auth-bg-ring" />
        <div className="auth-bg-diamond" />
        <div className="auth-bg-orb auth-bg-orb-1" />
        <div className="auth-bg-orb auth-bg-orb-2" />
        <div className="auth-bg-orb auth-bg-orb-3" />
      </div>
      <section className="auth-aside">
        <div className="auth-brand">
          <LogoMark className="auth-logo h-8 w-8 text-accent" />
          <span className="auth-brand-name">NEXUS</span>
        </div>

        <h1 className="auth-headline">Catat setiap barang, ketahui setiap ruangan.</h1>
        <p className="auth-sub">
          Satu tempat untuk data barang, penempatan ruangan, dan riwayat mutasi — rapi,
          terlacak, dan mudah dipertanggungjawabkan.
        </p>

        <ul className="auth-points">
          <li>
            <Icon name="check" size={16} />
            Pencatatan barang &amp; kondisi secara terpusat
          </li>
          <li>
            <Icon name="check" size={16} />
            Penempatan per ruangan dan lantai
          </li>
          <li>
            <Icon name="check" size={16} />
            Riwayat mutasi yang dapat diaudit
          </li>
        </ul>

        <div className="auth-showcase" aria-hidden="true">
          <div className="showcase-glow" />
          <div className="showcase-orbit showcase-orbit-back" />
          <div className="showcase-orbit showcase-orbit-front" />
          <div className="showcase-card showcase-card-main">
            <div className="showcase-card-top">
              <span className="showcase-dot" />
              <span>Inventaris terpantau</span>
              <span className="showcase-menu">•••</span>
            </div>
            <div className="showcase-number">1.284</div>
            <div className="showcase-label">unit tercatat</div>
            <div className="showcase-bars">
              <span /><span /><span /><span /><span /><span /><span /><span />
            </div>
          </div>
          <div className="showcase-card showcase-card-float">
            <span className="showcase-float-icon"><Icon name="check" size={13} /></span>
            <span>Data tersinkron</span>
          </div>
          <div className="showcase-node showcase-node-one" />
          <div className="showcase-node showcase-node-two" />
        </div>
      </section>

      <section className="auth-panel">
        <ThemeToggle className="auth-theme" />

        <div className="auth-card">
          <header className="auth-card-head">
            <h2 className="auth-title">Masuk ke akun Anda</h2>
            <p className="auth-desc">Gunakan email dan password yang terdaftar.</p>
          </header>

          <form
            className="auth-form"
            onSubmit={(e) => {
              e.preventDefault();
              execute({ email, password });
            }}
          >
            <Field label="Email" error={fieldErrors?.email?.[0]}>
              <Input
                type="email"
                icon="mail"
                autoComplete="username"
                placeholder="nama@inventaris.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </Field>

            <Field label="Password" error={fieldErrors?.password?.[0]}>
              <div className="auth-password">
                <Input
                  type={showPassword ? "text" : "password"}
                  icon="lock"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="auth-reveal"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  <Icon name={showPassword ? "eyeOff" : "eye"} size={16} />
                </button>
              </div>
            </Field>

            <ActionError message={serverError} />

            <button className="btn btn-primary auth-submit" type="submit" disabled={isPending}>
              {isPending ? "Memproses…" : "Masuk"}
            </button>
          </form>

          <p className="auth-foot">
            Belum punya akses? Hubungi administrator untuk pembuatan akun.
          </p>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}