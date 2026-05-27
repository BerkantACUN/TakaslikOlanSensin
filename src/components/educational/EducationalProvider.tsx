"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { SQL_CATALOG, type SqlScenario } from "./sqlCatalog";
import { EducationalOverlay } from "./EducationalOverlay";

type EducationCtx = {
  /** Bir aksiyondan eğitim sahnesini elle aç */
  trigger: (key: string, ctx?: Record<string, unknown>) => void;
  /** Eğitim modu açık mı? */
  enabled: boolean;
  setEnabled: (b: boolean) => void;
};

const Ctx = createContext<EducationCtx>({
  trigger: () => {},
  enabled: false,
  setEnabled: () => {},
});

const FOUR_CLICK_WINDOW_MS = 700;

export function EducationalProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [scene, setScene] = useState<SqlScenario | null>(null);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const clickTimes = useRef<number[]>([]);
  const clickedEl = useRef<HTMLElement | null>(null);

  /** 4-click detector — global */
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      const now = performance.now();
      const t = clickTimes.current;
      t.push(now);
      // Pencere dışı tıkları at
      while (t.length && now - t[0] > FOUR_CLICK_WINDOW_MS * (t.length || 1)) {
        if (now - t[0] > FOUR_CLICK_WINDOW_MS) t.shift();
        else break;
      }
      // Hızlı 4 kez aynı bölgeye
      if (t.length >= 4 && t[t.length - 1] - t[t.length - 4] <= FOUR_CLICK_WINDOW_MS * 3) {
        clickedEl.current = e.target as HTMLElement;
        clickTimes.current = [];
        openFromElement(clickedEl.current);
        e.preventDefault();
        e.stopPropagation();
      }
    }
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, []);

  /** ESC ile kapat */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && scene) {
        setScene(null);
        setAnchor(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scene]);

  function openFromElement(el: HTMLElement | null) {
    if (!el) return;
    // En yakın data-edu attribute'unu bul
    const target = el.closest<HTMLElement>("[data-edu]");
    const key = target?.dataset.edu;
    let scenario: SqlScenario | undefined;
    if (key && SQL_CATALOG[key]) {
      scenario = SQL_CATALOG[key];
    } else {
      // Fallback: post kartı bağlamı vs.
      const card = el.closest<HTMLElement>("a[href^='/posts/']");
      if (card) scenario = SQL_CATALOG["post-open"];
      else scenario = SQL_CATALOG.feed;
    }
    if (!scenario) return;
    setScene(scenario);
    setAnchor((target ?? el).getBoundingClientRect());
    setEnabled(true);
  }

  const trigger = useCallback((key: string, _ctx?: Record<string, unknown>) => {
    const scenario = SQL_CATALOG[key];
    if (!scenario) return;
    // Sadece eğitim modu açıkken otomatik göster — yoksa sessiz
    if (!enabledRef.current) return;
    const target = document.querySelector<HTMLElement>(
      scenario.target ? `[data-edu='${scenario.target}']` : "",
    );
    setScene(scenario);
    setAnchor((target ?? document.body).getBoundingClientRect());
  }, []);

  /** enabled için referans — trigger closure'ı eski state görmesin */
  const enabledRef = useRef(enabled);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  function close() {
    setScene(null);
    setAnchor(null);
  }

  return (
    <Ctx.Provider value={{ trigger, enabled, setEnabled }}>
      {children}
      {scene && (
        <EducationalOverlay
          scenario={scene}
          anchor={anchor}
          onClose={close}
        />
      )}

      {/* Yardım rozeti — kullanıcı bilsin diye sağ alt köşede */}
      <button
        onClick={() => setEnabled((s) => !s)}
        title={enabled ? "Eğitim modu açık" : "Eğitim modunu aç"}
        className={
          "fixed bottom-5 left-5 z-[60] w-11 h-11 rounded-full grid place-items-center text-[18px] font-bold transition-all shadow-[var(--shadow-pop)] " +
          (enabled
            ? "bg-[var(--color-brand-500)] text-white scale-105"
            : "bg-white text-[var(--color-carbon)] border border-[var(--color-mist)] hover:scale-105")
        }
      >
        SQL
      </button>

      {enabled && (
        <div className="fixed bottom-5 left-20 z-[60] text-[11px] font-semibold text-[var(--color-brand-700)] bg-[var(--color-brand-50)] border border-[var(--color-brand-100)] px-3 py-1.5 rounded-full pointer-events-none animate-fade-up">
          Eğitim modu • bir karta 4 kere hızlı tıkla
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useEducation() {
  return useContext(Ctx);
}
