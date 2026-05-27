"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { useEducation } from "@/components/educational/EducationalProvider";

export function ProfileActions({
  userId,
  username,
  authed,
  isMine,
}: {
  userId: string;
  username: string;
  authed: boolean;
  isMine: boolean;
}) {
  const router = useRouter();
  const { push } = useToast();
  const { trigger } = useEducation();
  const [busy, setBusy] = useState(false);

  if (isMine) {
    return (
      <Button variant="outline" onClick={() => router.push("/settings")}>
        Profili düzenle
      </Button>
    );
  }

  async function openDM() {
    if (!authed) {
      router.push(`/login?next=/profile/${userId}`);
      return;
    }
    setBusy(true);
    try {
      trigger("profile-message", { profileId: userId, username });
      const res = await fetch("/api/dm/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId: userId }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Sohbet açılamadı");
      router.push(`/messages/${d.conversation.id}`);
    } catch (e) {
      push({ title: e instanceof Error ? e.message : "Hata", tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button data-edu="profile-message" onClick={openDM} loading={busy}>
        <Icon.MessageCircle size={16} />
        Mesaj at
      </Button>
      <Button
        variant="outline"
        onClick={async () => {
          if (!authed) {
            router.push(`/login?next=/profile/${userId}`);
            return;
          }
          const reason = prompt(
            "Bu kullanıcıyı neden raporlamak istiyorsun? (SPAM/INAPPROPRIATE/FRAUD/HARASSMENT/OTHER)",
            "INAPPROPRIATE",
          );
          if (!reason) return;
          const details = prompt("Detay (opsiyonel)") ?? "";
          const res = await fetch("/api/reports", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              targetType: "USER",
              targetId: userId,
              reportedUserId: userId,
              reason,
              details,
            }),
          });
          if (res.ok) push({ title: "Raporun alındı", tone: "success" });
          else push({ title: "Raporlama başarısız", tone: "error" });
        }}
      >
        <Icon.Flag size={16} />
        Raporla
      </Button>
    </div>
  );
}
