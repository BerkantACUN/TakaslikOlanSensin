"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";

type Dept = { id: string; name: string; faculty: string };

export function SettingsForm({
  initial,
  departments,
}: {
  initial: {
    avatarName: string;
    bio: string;
    departmentId: string;
    skills: string[];
  };
  departments: Dept[];
}) {
  const router = useRouter();
  const { push } = useToast();
  const [form, setForm] = useState(initial);
  const [skillInput, setSkillInput] = useState("");
  const [loading, setLoading] = useState(false);

  function addSkill() {
    const s = skillInput.trim();
    if (!s || form.skills.includes(s)) return;
    setForm({ ...form, skills: [...form.skills, s] });
    setSkillInput("");
  }

  function removeSkill(s: string) {
    setForm({ ...form, skills: form.skills.filter((x) => x !== s) });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Güncellenemedi");
      }
      push({ title: "Ayarların kaydedildi", tone: "success" });
      router.refresh();
    } catch (e) {
      push({
        title: e instanceof Error ? e.message : "Hata",
        tone: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="bg-white border border-[var(--color-mist)] rounded-[20px] p-6 space-y-4">
        <Input
          label="Görünen ad"
          value={form.avatarName}
          onChange={(e) => setForm({ ...form, avatarName: e.target.value })}
          placeholder="Profilde görünen adın"
          maxLength={60}
        />
        <Textarea
          label="Hakkımda"
          rows={3}
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          placeholder="Hangi derslerle ilgileniyorsun, hangi kaynakları takas ediyorsun?"
        />
        <Select
          label="Bölüm"
          value={form.departmentId}
          onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
        >
          <option value="">Belirtmek istemiyorum</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} — {d.faculty}
            </option>
          ))}
        </Select>
      </section>

      <section className="bg-white border border-[var(--color-mist)] rounded-[20px] p-6">
        <h3 className="font-semibold text-[15px] mb-3">Yetkinlikler</h3>
        <div className="flex gap-2">
          <input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSkill();
              }
            }}
            placeholder="Örn: Python, Calculus, LaTeX"
            className="flex-1 h-11 px-4 rounded-[12px] bg-white border border-[var(--color-pebble)] text-[14px] focus:outline-none focus:border-[var(--color-carbon)]"
          />
          <Button type="button" variant="outline" onClick={addSkill}>
            Ekle
          </Button>
        </div>
        {form.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {form.skills.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => removeSkill(s)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[var(--color-fog)] text-[var(--color-carbon)] hover:bg-[var(--color-pebble)]"
              >
                {s}
                <Icon.X size={11} />
              </button>
            ))}
          </div>
        )}
      </section>

      <Button type="submit" loading={loading} size="lg">
        Kaydet
      </Button>
    </form>
  );
}
