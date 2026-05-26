"use client";

import { createContext, useCallback, useContext, useState } from "react";

type Toast = { id: number; title: string; tone?: "info" | "success" | "error" };

const ToastCtx = createContext<{
  push: (t: Omit<Toast, "id">) => void;
}>({ push: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { id, ...t }]);
    setTimeout(() => setItems((s) => s.filter((x) => x.id !== id)), 3500);
  }, []);

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-sm">
        {items.map((t) => (
          <div
            key={t.id}
            className={
              "px-4 py-3 rounded-[14px] bg-white shadow-[var(--shadow-pop)] border " +
              "border-[var(--color-mist)] text-[14px] animate-fade-up flex items-start gap-2"
            }
          >
            <span
              className={
                "mt-1 w-2 h-2 rounded-full shrink-0 " +
                (t.tone === "success"
                  ? "bg-[var(--color-success)]"
                  : t.tone === "error"
                  ? "bg-[var(--color-accent-coral)]"
                  : "bg-[var(--color-brand-500)]")
              }
            />
            <span className="text-[var(--color-carbon)]">{t.title}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}
