"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { useEducation } from "@/components/educational/EducationalProvider";

export function ExchangeActions({
  exchangeId,
  status,
  isOwner,
  isRequester,
  myReviewed,
}: {
  exchangeId: string;
  status: string;
  isOwner: boolean;
  isRequester: boolean;
  myReviewed: boolean;
}) {
  const router = useRouter();
  const { push } = useToast();
  const { trigger } = useEducation();
  const [busy, setBusy] = useState(false);

  async function action(path: string, body?: any) {
    setBusy(true);
    try {
      const res = await fetch(`/api/exchanges/${exchangeId}${path}`, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Hata");
      }
      if (path === "/accept") trigger("exchange-accept", { exchangeId });
      router.refresh();
    } catch (e) {
      push({
        title: e instanceof Error ? e.message : "İşlem başarısız",
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function submitReview() {
    const ratingStr = prompt("1-5 arası bir puan ver:");
    const rating = parseInt(ratingStr ?? "", 10);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      push({ title: "Geçersiz puan", tone: "error" });
      return;
    }
    const comment = prompt("Yorum (opsiyonel):") ?? "";
    await action("/review", { rating, comment });
    push({ title: "Değerlendirmen kaydedildi", tone: "success" });
  }

  const buttons: React.ReactNode[] = [];

  if (status === "PENDING") {
    if (isOwner) {
      buttons.push(
        <Button key="acc" loading={busy} onClick={() => action("/accept")}>
          <Icon.Check size={16} /> Kabul et
        </Button>,
        <Button
          key="rej"
          variant="outline"
          loading={busy}
          onClick={() => action("/reject")}
        >
          <Icon.X size={16} /> Reddet
        </Button>,
      );
    }
    if (isRequester) {
      buttons.push(
        <Button
          key="cancel"
          variant="outline"
          loading={busy}
          onClick={() => action("/cancel")}
        >
          Teklifini geri çek
        </Button>,
      );
    }
  } else if (status === "ACCEPTED") {
    buttons.push(
      <Button key="done" loading={busy} onClick={() => action("/complete")}>
        <Icon.Check size={16} /> Takas tamamlandı
      </Button>,
      <Button
        key="cancel"
        variant="outline"
        loading={busy}
        onClick={() => action("/cancel")}
      >
        İptal et
      </Button>,
    );
  } else if (status === "COMPLETED" && !myReviewed) {
    buttons.push(
      <Button key="review" loading={busy} onClick={submitReview}>
        <Icon.Star size={16} /> Değerlendir
      </Button>,
    );
  }

  if (buttons.length === 0) {
    return (
      <p className="text-[13px] text-[var(--color-slate)]">
        Bu takas üzerinde alınabilecek aksiyon kalmadı.
      </p>
    );
  }

  return <div className="flex flex-wrap gap-2">{buttons}</div>;
}
