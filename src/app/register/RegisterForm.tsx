"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";

type Dept = { id: string; name: string; faculty: string };

export function RegisterForm({ departments }: { departments: Dept[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    departmentId: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Kayıt başarısız");
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Input
        label="Kullanıcı adı"
        value={form.username}
        onChange={(e) => setForm({ ...form, username: e.target.value })}
        placeholder="ahmet_emir"
        required
        leftIcon={<Icon.User size={16} />}
      />
      <Input
        label="E-posta"
        type="email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        placeholder="ornek@uni.edu.tr"
        required
        leftIcon={<Icon.Mail size={16} />}
      />
      <Input
        label="Şifre"
        type="password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        placeholder="En az 8 karakter"
        required
        minLength={8}
        leftIcon={<Icon.Lock size={16} />}
      />
      <Select
        label="Bölüm (opsiyonel)"
        value={form.departmentId}
        onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
      >
        <option value="">Seçim yapmak istemiyorum</option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name} — {d.faculty}
          </option>
        ))}
      </Select>

      {error && (
        <p className="text-[12px] text-[var(--color-accent-coral)] -mt-2">
          {error}
        </p>
      )}

      <Button type="submit" loading={loading} fullWidth size="lg">
        Hesap oluştur
      </Button>

      <p className="text-[11px] text-[var(--color-slate)] text-center">
        Devam ederek{" "}
        <a className="underline" href="/terms">
          Kullanım Koşulları
        </a>{" "}
        ve{" "}
        <a className="underline" href="/privacy">
          Gizlilik Politikası
        </a>
        'nı kabul etmiş olursun.
      </p>
    </form>
  );
}
