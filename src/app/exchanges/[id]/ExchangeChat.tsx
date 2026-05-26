"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";

type Msg = {
  messageNo: number;
  senderId: string;
  content: string;
  createdAt: string | Date;
};

type Person = { id: string; username: string; avatarName: string | null };

export function ExchangeChat({
  exchangeId,
  me,
  other,
  initial,
  canChat,
}: {
  exchangeId: string;
  me: Person;
  other: Person;
  initial: Msg[];
  canChat: boolean;
}) {
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const { push } = useToast();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Hafif polling — her 6 saniyede yeni mesajları çek
  useEffect(() => {
    if (!canChat) return;
    const t = setInterval(async () => {
      try {
        const res = await fetch(`/api/exchanges/${exchangeId}/messages`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.messages)) {
          setMessages((prev) =>
            data.messages.length > prev.length ? data.messages : prev,
          );
        }
      } catch {}
    }, 6000);
    return () => clearInterval(t);
  }, [exchangeId, canChat]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/exchanges/${exchangeId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Mesaj gönderilemedi");
      setMessages((m) => [...m, data.message]);
      setText("");
    } catch (err) {
      push({
        title: err instanceof Error ? err.message : "Hata",
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white border border-[var(--color-mist)] rounded-[20px] overflow-hidden flex flex-col h-[520px]">
      <div className="px-5 py-3 border-b border-[var(--color-mist)] flex items-center gap-3">
        <Avatar name={other.avatarName ?? other.username} size={36} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[14px] truncate">
            {other.avatarName ?? other.username}
          </p>
          <p className="text-[11px] text-[var(--color-slate)]">Takas sohbeti</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 scrollbar-thin bg-[var(--color-fog)]/40">
        {messages.length === 0 && (
          <div className="text-center text-[13px] text-[var(--color-slate)] py-12">
            {canChat
              ? "Henüz mesaj yok. Selam vererek başla!"
              : "Sohbet, teklif kabul edildikten sonra açılır."}
          </div>
        )}

        {messages.map((m) => {
          const mine = m.senderId === me.id;
          return (
            <div
              key={m.messageNo}
              className={`flex items-end gap-2 ${
                mine ? "justify-end" : "justify-start"
              }`}
            >
              {!mine && (
                <Avatar
                  name={other.avatarName ?? other.username}
                  size={28}
                />
              )}
              <div
                className={
                  "max-w-[70%] px-3.5 py-2 rounded-[16px] text-[14px] leading-snug " +
                  (mine
                    ? "bg-[var(--color-brand-500)] text-white rounded-br-sm"
                    : "bg-white border border-[var(--color-mist)] text-[var(--color-carbon)] rounded-bl-sm")
                }
              >
                {m.content}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {canChat ? (
        <form
          onSubmit={send}
          className="px-3 py-3 border-t border-[var(--color-mist)] flex items-center gap-2 bg-white"
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Mesaj yaz..."
            className="flex-1 h-11 px-4 rounded-full bg-[var(--color-fog)] border border-transparent focus:bg-white focus:border-[var(--color-pebble)] outline-none text-[14px]"
          />
          <button
            type="submit"
            disabled={busy || !text.trim()}
            className="w-11 h-11 rounded-full bg-[var(--color-brand-500)] text-white grid place-items-center disabled:opacity-50 hover:bg-[var(--color-brand-600)]"
          >
            <Icon.Send size={16} />
          </button>
        </form>
      ) : (
        <div className="px-5 py-3 border-t border-[var(--color-mist)] text-[12px] text-[var(--color-slate)] bg-white">
          Mesajlaşma, teklif kabul edildiğinde aktif olur.
        </div>
      )}
    </div>
  );
}
