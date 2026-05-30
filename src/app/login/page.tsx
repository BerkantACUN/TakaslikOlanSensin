"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/";

  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrUsername, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Giriş başarısız");
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2">
      {/* Sol panel — formu */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[12px] font-semibold text-[var(--color-slate)] hover:text-[var(--color-carbon)] mb-8"
          >
            <Icon.ArrowLeft size={14} /> Ana sayfaya dön
          </Link>

          <h1 className="text-[32px] font-bold tracking-tight mb-1">
            Tekrar hoş geldin
          </h1>
          <p className="text-[14px] text-[var(--color-slate)] mb-7">
            Kaynaklarını takas etmeye kaldığın yerden devam et.
          </p>

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <Input
              label="E-posta veya kullanıcı adı"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              placeholder="ornek@uni.edu.tr"
              required
              leftIcon={<Icon.Mail size={16} />}
            />
            <Input
              label="Şifre"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              leftIcon={<Icon.Lock size={16} />}
              error={error ?? undefined}
            />

            <Button type="submit" loading={loading} fullWidth size="lg">
              Giriş yap
            </Button>
          </form>

          <div className="mt-6 text-center text-[13px] text-[var(--color-slate)]">
            Hesabın yok mu?{" "}
            <Link
              href="/register"
              className="font-semibold text-[var(--color-carbon)] underline underline-offset-2"
            >
              Üye ol
            </Link>
          </div>

          <div className="mt-10 p-4 rounded-[14px] bg-[var(--color-fog)] border border-[var(--color-mist)]">
            <p className="text-[12px] font-semibold mb-1">Demo hesaplar</p>
            <p className="text-[12px] text-[var(--color-slate)]">
              berkant@example.com · elif@example.com
              <br />
              Şifre: <span className="font-mono">test1234</span>
            </p>
          </div>
        </div>
      </div>

      {/* Sağ panel — görsel */}
      <div className="hidden lg:block relative">
        <div className="absolute inset-6 rounded-[28px] bg-gradient-to-br from-[var(--color-brand-600)] via-[var(--color-brand-500)] to-[#7aa8ff] overflow-hidden">
          <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.6),transparent_40%),radial-gradient(circle_at_70%_80%,rgba(245,158,11,0.4),transparent_45%)]" />
          <div className="relative h-full flex flex-col justify-between p-10 text-white">
            <div className="flex items-center gap-2">
              <span className="w-10 h-10 grid place-items-center rounded-[12px] bg-white/20 backdrop-blur font-bold">
                cs
              </span>
              <span className="font-bold text-[18px]">CampusSwap</span>
            </div>

            <div>
              <p className="text-[28px] font-bold leading-tight mb-3">
                "Geçen dönem 600 TL'lik kitabı, bu dönem ihtiyacım olan notlarla
                değiştirdim. Tam olarak istediğim şeydi."
              </p>
              <p className="text-white/80 text-[13px]">
                — Bilgisayar Mühendisliği, 3. Sınıf
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
