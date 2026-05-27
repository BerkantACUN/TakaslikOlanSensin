"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { useEducation } from "@/components/educational/EducationalProvider";

type Msg = {
  id: string;
  senderId: string;
  content: string;
  createdAt: string | Date;
};
type Person = { id: string; username: string; avatarName: string | null };

export function DMChat({
  conversationId,
  me,
  other,
  initial,
}: {
  conversationId: string;
  me: Person;
  other: Person;
  initial: Msg[];
}) {
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const { push } = useToast();
  const { trigger } = useEducation();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const res = await fetch(`/api/dm/${conversationId}/messages`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const d = await res.json();
        if (Array.isArray(d.messages)) {
          setMessages((prev) =>
            d.messages.length > prev.length ? d.messages : prev,
          );
        }
      } catch {}
    }, 6000);
    return () => clearInterval(t);
  }, [conversationId]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/dm/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text.trim() }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Mesaj gönderilemedi");
      setMessages((m) => [...m, d.message]);
      setText("");
      trigger("dm-send", { otherId: other.id, content: d.message.content });
    } catch (e) {
      push({ title: e instanceof Error ? e.message : "Hata", tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col h-[68vh]">
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 scrollbar-thin bg-[var(--color-fog)]/40">
        {messages.length === 0 && (
          <div className="text-center text-[13px] text-[var(--color-slate)] py-12">
            Bu, {other.avatarName ?? other.username} ile sohbetinin başlangıcı.
            <br /> İlk mesajı yaz!
          </div>
        )}

        {messages.map((m) => {
          const mine = m.senderId === me.id;
          return (
            <div
              key={m.id}
              className={`flex items-end gap-2 ${
                mine ? "justify-end" : "justify-start"
              } animate-fade-up`}
            >
              {!mine && (
                <Avatar
                  name={other.avatarName ?? other.username}
                  size={28}
                />
              )}
              <div
                className={
                  "max-w-[72%] px-3.5 py-2 rounded-[18px] text-[14px] leading-snug " +
                  (mine
                    ? "bg-[var(--color-brand-500)] text-white rounded-br-[4px]"
                    : "bg-white border border-[var(--color-mist)] text-[var(--color-carbon)] rounded-bl-[4px]")
                }
              >
                {m.content}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={send}
        data-edu="dm-input"
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
          aria-label="Gönder"
          className="w-11 h-11 rounded-full bg-[var(--color-brand-500)] text-white grid place-items-center disabled:opacity-50 hover:bg-[var(--color-brand-600)] transition"
        >
          <Icon.Send size={16} />
        </button>
      </form>
    </div>
  );
}
