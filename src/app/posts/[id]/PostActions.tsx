"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { useEducation } from "@/components/educational/EducationalProvider";
import { exchangeStatusLabel } from "@/lib/utils";

export function PostActions({
  postId,
  ownerId,
  authed,
  isMine,
  favorited,
  myExchange,
  postActive,
}: {
  postId: string;
  ownerId: string;
  authed: boolean;
  isMine: boolean;
  favorited: boolean;
  myExchange: { id: string; status: string } | null;
  postActive: boolean;
}) {
  const router = useRouter();
  const { push } = useToast();
  const { trigger } = useEducation();
  const [fav, setFav] = useState(favorited);
  const [busy, setBusy] = useState(false);

  if (isMine) {
    return (
      <div className="grid gap-2">
        <Button
          fullWidth
          variant="outline"
          onClick={() => router.push(`/posts/edit/${postId}`)}
        >
          İlanı düzenle
        </Button>
        <button
          onClick={async () => {
            if (!confirm("İlanı silmek istediğine emin misin?")) return;
            const res = await fetch(`/api/posts/${postId}`, {
              method: "DELETE",
            });
            if (res.ok) {
              push({ title: "İlan silindi", tone: "success" });
              router.push("/posts");
              router.refresh();
            } else {
              push({ title: "Silme başarısız", tone: "error" });
            }
          }}
          className="text-[12px] font-semibold text-[var(--color-accent-coral)] hover:underline mt-1"
        >
          İlanı sil
        </button>
      </div>
    );
  }

  async function requestExchange() {
    if (!authed) return router.push(`/login?next=/posts/${postId}`);
    setBusy(true);
    try {
      const res = await fetch(`/api/posts/${postId}/exchange`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Hata");
      push({ title: "Takas isteği gönderildi", tone: "success" });
      trigger("exchange-request", { postId });
      router.refresh();
    } catch (e) {
      push({
        title: e instanceof Error ? e.message : "İstek başarısız",
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function toggleFav() {
    if (!authed) return router.push(`/login?next=/posts/${postId}`);
    setBusy(true);
    try {
      const res = await fetch(`/api/favorites/${postId}`, {
        method: fav ? "DELETE" : "POST",
      });
      if (!res.ok) throw new Error();
      const wasFav = fav;
      setFav((f) => !f);
      trigger(wasFav ? "unfavorite" : "favorite", { postId });
    } catch {
      push({ title: "İşlem başarısız", tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-2">
      {myExchange ? (
        <Button
          fullWidth
          variant="secondary"
          onClick={() => router.push(`/exchanges/${myExchange.id}`)}
        >
          Talebini görüntüle · {exchangeStatusLabel(myExchange.status)}
        </Button>
      ) : (
        <Button
          fullWidth
          size="lg"
          loading={busy}
          disabled={!postActive}
          onClick={requestExchange}
        >
          {postActive ? "Takas teklif et" : "Bu ilan kapalı"}
        </Button>
      )}

      <Button fullWidth variant="outline" onClick={toggleFav} disabled={busy}>
        {fav ? (
          <>
            <Icon.HeartFilled className="text-[var(--color-accent-coral)]" />
            Favoride
          </>
        ) : (
          <>
            <Icon.Heart />
            Favorile
          </>
        )}
      </Button>

      <button
        onClick={async () => {
          if (!authed) return router.push(`/login?next=/posts/${postId}`);
          const reason = prompt(
            "Bu ilanı neden raporlamak istiyorsun? (SPAM/INAPPROPRIATE/FRAUD/HARASSMENT/OTHER)",
            "INAPPROPRIATE",
          );
          if (!reason) return;
          const details = prompt("Detay (opsiyonel)") ?? "";
          const res = await fetch("/api/reports", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              targetType: "POST",
              targetId: postId,
              reportedUserId: ownerId,
              reason,
              details,
            }),
          });
          if (res.ok) push({ title: "Raporun alındı", tone: "success" });
          else push({ title: "Raporlama başarısız", tone: "error" });
        }}
        className="mt-1 inline-flex items-center justify-center gap-1.5 text-[12px] font-semibold text-[var(--color-slate)] hover:text-[var(--color-accent-coral)]"
      >
        <Icon.Flag size={13} />
        Raporla
      </button>
    </div>
  );
}
