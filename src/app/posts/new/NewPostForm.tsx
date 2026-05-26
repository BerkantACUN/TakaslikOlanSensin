"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";

type Dept = { id: string; name: string; faculty: string };

const TYPES = [
  ["BOOK", "Kitap"],
  ["PDF", "PDF"],
  ["NOTES", "Ders notu"],
  ["SLIDES", "Sunum"],
  ["EXAM", "Çıkmış sınav"],
  ["PROJECT", "Proje"],
  ["OTHER", "Diğer"],
] as const;

export function NewPostForm({ departments }: { departments: Dept[] }) {
  const router = useRouter();
  const { push } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    offerTitle: "",
    offerType: "BOOK",
    offerDescription: "",
    offerDepartmentId: "",
    requestTitle: "",
    requestType: "NOTES",
    requestDescription: "",
    requestDepartmentId: "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Oluşturulamadı");
      push({ title: "İlanın yayında!", tone: "success" });
      router.push(`/posts/${data.post.id}`);
      router.refresh();
    } catch (err) {
      push({
        title: err instanceof Error ? err.message : "Hata",
        tone: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {/* Genel */}
      <section className="bg-white border border-[var(--color-mist)] rounded-[20px] p-6">
        <h2 className="font-semibold text-[18px] mb-4">İlan başlığı ve açıklaması</h2>
        <div className="space-y-4">
          <Input
            label="Başlık"
            placeholder="Örn: Calculus kitabımı, algoritma notlarıyla takas ediyorum"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            maxLength={120}
          />
          <Textarea
            label="Açıklama"
            placeholder="Kaynağın durumu, takasla ilgili tercihlerin, buluşma yöntemi vb."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
          />
        </div>
      </section>

      {/* Veriyor */}
      <section className="bg-white border border-[var(--color-mist)] rounded-[20px] p-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-7 h-7 rounded-[8px] bg-[var(--color-brand-500)] text-white grid place-items-center">
            <Icon.Book size={14} />
          </span>
          <h2 className="font-semibold text-[18px]">Senin sunduğun</h2>
        </div>
        <p className="text-[13px] text-[var(--color-slate)] mb-4">
          Karşı tarafa vereceğin kaynak.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            label="Kaynak adı"
            value={form.offerTitle}
            onChange={(e) => setForm({ ...form, offerTitle: e.target.value })}
            required
            placeholder="Örn: Stewart Calculus 8. Baskı"
          />
          <Select
            label="Tür"
            value={form.offerType}
            onChange={(e) => setForm({ ...form, offerType: e.target.value })}
          >
            {TYPES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
          <Select
            label="Bölüm (opsiyonel)"
            value={form.offerDepartmentId}
            onChange={(e) =>
              setForm({ ...form, offerDepartmentId: e.target.value })
            }
          >
            <option value="">Belirtmek istemiyorum</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
          <Textarea
            label="Detay (opsiyonel)"
            value={form.offerDescription}
            onChange={(e) =>
              setForm({ ...form, offerDescription: e.target.value })
            }
            rows={2}
            placeholder="Yıpranma durumu, baskı yılı, kapsam..."
            className="sm:col-span-2"
          />
        </div>
      </section>

      {/* İstiyor */}
      <section className="bg-white border border-[var(--color-mist)] rounded-[20px] p-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-7 h-7 rounded-[8px] bg-[var(--color-accent-amber)] text-white grid place-items-center">
            <Icon.Sparkle size={14} />
          </span>
          <h2 className="font-semibold text-[18px]">Karşılığında istediğin</h2>
        </div>
        <p className="text-[13px] text-[var(--color-slate)] mb-4">
          Hangi kaynağa ihtiyacın var?
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            label="Kaynak adı"
            value={form.requestTitle}
            onChange={(e) => setForm({ ...form, requestTitle: e.target.value })}
            required
            placeholder="Örn: Algoritma final notları"
          />
          <Select
            label="Tür"
            value={form.requestType}
            onChange={(e) => setForm({ ...form, requestType: e.target.value })}
          >
            {TYPES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
          <Select
            label="Bölüm (opsiyonel)"
            value={form.requestDepartmentId}
            onChange={(e) =>
              setForm({ ...form, requestDepartmentId: e.target.value })
            }
          >
            <option value="">Belirtmek istemiyorum</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
          <Textarea
            label="Detay (opsiyonel)"
            value={form.requestDescription}
            onChange={(e) =>
              setForm({ ...form, requestDescription: e.target.value })
            }
            rows={2}
            placeholder="Ne tür içerik, hangi yarıyıl..."
            className="sm:col-span-2"
          />
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={loading} size="lg">
          İlanı yayınla
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/posts")}
        >
          Vazgeç
        </Button>
      </div>
    </form>
  );
}
