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

interface EducationCtx {
  /** Bir aksiyondan eğitim sahnesini elle aç */
  trigger: (key: string, ctx?: Record<string, unknown>) => void;
  /** Eğitim modu açık mı? */
  enabled: boolean;
  setEnabled: (b: boolean) => void;
}

const Ctx = createContext<EducationCtx>({
  trigger: () => {},
  enabled: false,
  setEnabled: () => {},
});

/** 4 click'in tamamının içine sığması gereken pencere (ms). */
const FOUR_CLICK_WINDOW_MS = 800;
const REQUIRED_CLICKS = 4;

export function EducationalProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [scene, setScene] = useState<SqlScenario | null>(null);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const clickTimes = useRef<number[]>([]);

  // Closure'lar eski state görmesin diye ref'ler
  const enabledRef = useRef(enabled);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const sceneRef = useRef<SqlScenario | null>(null);
  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);

  /**
   * Click detection — capture phase'de yakalanır ki Link/button navigate
   * gerçekleşmeden önce 4. click'i durdurabilelim. Tek tık her zaman
   * normal davranışı çalıştırır (yönlendirme/aksiyon); ancak 4 tık
   * FOUR_CLICK_WINDOW_MS içinde gelirse 4. click iptal edilir ve
   * eğitim overlay'i açılır.
   */
  useEffect(() => {
    function onClickCapture(e: MouseEvent) {
      if (sceneRef.current) return;

      const targetEl = e.target as HTMLElement | null;
      if (targetEl?.closest("[data-edu-ui]")) return;

      const now = performance.now();
      const filtered = clickTimes.current.filter(
        (t) => now - t <= FOUR_CLICK_WINDOW_MS,
      );
      filtered.push(now);
      clickTimes.current = filtered;

      if (filtered.length >= REQUIRED_CLICKS) {
        e.preventDefault();
        e.stopPropagation();
        clickTimes.current = [];
        openFromElement(targetEl);
      }
    }
    document.addEventListener("click", onClickCapture, true);
    return () => document.removeEventListener("click", onClickCapture, true);
  }, []);

  /** ESC ile kapat */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && sceneRef.current) {
        setScene(null);
        setAnchor(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function openFromElement(el: HTMLElement | null): void {
    if (!el) return;
    const target = el.closest<HTMLElement>("[data-edu]");
    const key = target?.dataset.edu;
    let scenario: SqlScenario | undefined;
    if (key && SQL_CATALOG[key]) {
      scenario = SQL_CATALOG[key];
    } else {
      const card = el.closest<HTMLElement>("a[href^='/posts/']");
      if (card) scenario = SQL_CATALOG["post-open"];
      else scenario = SQL_CATALOG.feed;
    }
    if (!scenario) return;
    setScene(scenario);
    setAnchor((target ?? el).getBoundingClientRect());
    setEnabled(true);
  }

  const trigger = useCallback(
    (key: string, _ctx?: Record<string, unknown>): void => {
      const scenario = SQL_CATALOG[key];
      if (!scenario) return;
      if (!enabledRef.current) return;
      const target = scenario.target
        ? document.querySelector<HTMLElement>(`[data-edu='${scenario.target}']`)
        : null;
      setScene(scenario);
      setAnchor((target ?? document.body).getBoundingClientRect());
    },
    [],
  );

  function close(): void {
    setScene(null);
    setAnchor(null);
  }

  return (
    <Ctx.Provider value={{ trigger, enabled, setEnabled }}>
      {children}
      {scene && (
        <EducationalOverlay scenario={scene} anchor={anchor} onClose={close} />
      )}

      <button
        data-edu-ui="badge"
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
        <div
          data-edu-ui="hint"
          className="fixed bottom-5 left-20 z-[60] text-[11px] font-semibold text-[var(--color-brand-700)] bg-[var(--color-brand-50)] border border-[var(--color-brand-100)] px-3 py-1.5 rounded-full pointer-events-none animate-fade-up"
        >
          Bir karta 4 kere hızlı tıkla
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useEducation() {
  return useContext(Ctx);
}
