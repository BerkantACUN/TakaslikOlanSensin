"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import type { SqlScenario } from "./sqlCatalog";

export function EducationalOverlay({
  scenario,
  anchor,
  onClose,
}: {
  scenario: SqlScenario;
  anchor: DOMRect | null;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const stepCount = scenario.steps.length;
  const active = scenario.steps[step];

  // Scene değişirse step'i sıfırla
  useEffect(() => {
    setStep(0);
  }, [scenario]);

  return (
    <AnimatePresence>
      <motion.div
        key="edu-root"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[80]"
      >
        {/* Karartma — backdrop, anchor'ın etrafı korumalı */}
        <BackdropWithCutout anchor={anchor} onClose={onClose} />

        {/* Spotlight çerçevesi */}
        {anchor && (
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute pointer-events-none rounded-[18px] ring-2 ring-[#5690ff] shadow-[0_0_0_4px_rgba(86,144,255,0.25)]"
            style={{
              left: anchor.left - 6,
              top: anchor.top - 6,
              width: anchor.width + 12,
              height: anchor.height + 12,
            }}
          />
        )}

        {/* Ok — overlay'den spotlight'a */}
        {anchor && <Arrow toRect={anchor} />}

        {/* Dialog */}
        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 22, stiffness: 200 }}
          className="absolute right-6 top-6 w-[min(560px,calc(100vw-3rem))] bg-white rounded-[24px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.35)] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="p-5 border-b border-[var(--color-mist)] bg-gradient-to-br from-white to-[var(--color-brand-50)]">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-brand-700)]">
              <Icon.Sparkle size={12} /> SQL Sahnesi
              <span className="ml-auto text-[var(--color-slate)] font-semibold">
                {step + 1} / {stepCount}
              </span>
            </div>
            <h2 className="mt-2 text-[20px] font-bold tracking-tight text-[var(--color-carbon)]">
              {scenario.title}
            </h2>
            <p className="text-[13px] text-[var(--color-slate)] mt-0.5">
              {scenario.subtitle}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {scenario.tables.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono font-semibold bg-white border border-[var(--color-mist)] text-[var(--color-brand-700)]"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-500)]" />
                  {t}
                </span>
              ))}
            </div>
          </header>

          <div className="p-5">
            <p className="font-semibold text-[15px] mb-1">{active.title}</p>
            <p className="text-[13px] text-[var(--color-slate)] mb-3 leading-relaxed">
              {active.description}
            </p>
            <pre className="rounded-[14px] bg-[#0f172a] text-[#e2e8f0] font-mono text-[12.5px] leading-[1.55] p-4 overflow-x-auto scrollbar-thin">
              <code
                dangerouslySetInnerHTML={{
                  __html: highlightSql(active.sql, active.highlight),
                }}
              />
            </pre>
          </div>

          <footer className="px-5 py-3 border-t border-[var(--color-mist)] flex items-center gap-2 bg-[var(--color-fog)]">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="h-9 px-3 rounded-[10px] text-[13px] font-semibold disabled:opacity-40 hover:bg-white"
            >
              ← Önceki
            </button>
            <button
              onClick={() => setStep((s) => Math.min(stepCount - 1, s + 1))}
              disabled={step === stepCount - 1}
              className="h-9 px-3 rounded-[10px] text-[13px] font-semibold disabled:opacity-40 hover:bg-white"
            >
              Sonraki →
            </button>
            <span className="ml-auto text-[11px] text-[var(--color-slate)] hidden sm:inline">
              ESC ile kapat
            </span>
            <button
              onClick={onClose}
              className="h-9 px-3 rounded-[10px] text-[13px] font-semibold bg-[var(--color-carbon)] text-white hover:opacity-90"
            >
              Anladım
            </button>
          </footer>
        </motion.div>

        {/* Tüm ekranda boş yere tıklayınca kapat */}
        <button
          aria-label="Kapat"
          onClick={onClose}
          className="absolute inset-0 -z-10 cursor-default"
        />
      </motion.div>
    </AnimatePresence>
  );
}

function BackdropWithCutout({
  anchor,
  onClose,
}: {
  anchor: DOMRect | null;
  onClose: () => void;
}) {
  if (!anchor) {
    return (
      <button
        onClick={onClose}
        aria-label="Kapat"
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
      />
    );
  }

  const r = 18;
  // SVG mask ile anchor bölgesi delinir
  return (
    <button
      onClick={onClose}
      aria-label="Kapat"
      className="absolute inset-0 cursor-default"
      style={{ background: "transparent" }}
    >
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <mask id="edu-cutout">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={anchor.left - 8}
              y={anchor.top - 8}
              width={anchor.width + 16}
              height={anchor.height + 16}
              rx={r}
              ry={r}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(15,23,42,0.75)"
          mask="url(#edu-cutout)"
        />
      </svg>
    </button>
  );
}

function Arrow({ toRect }: { toRect: DOMRect }) {
  // Dialog ekranın sağ üstünde (right:24, top:24) — ok dialog'un sol alt köşesinden
  // anchor'ın sağ üst köşesine doğru gider.
  const fromX = window.innerWidth - 24 - 280; // dialog ortası tahmini
  const fromY = 200;
  const toX = toRect.left + toRect.width / 2;
  const toY = toRect.top + toRect.height / 2;

  const dx = toX - fromX;
  const dy = toY - fromY;

  // Bezier kontrol noktaları
  const cx1 = fromX + dx * 0.3;
  const cy1 = fromY + dy * 0.1;
  const cx2 = fromX + dx * 0.7;
  const cy2 = fromY + dy * 0.9;

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none">
      <defs>
        <marker
          id="edu-arrowhead"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 Z" fill="#2f6fff" />
        </marker>
      </defs>
      <motion.path
        d={`M ${fromX},${fromY} C ${cx1},${cy1} ${cx2},${cy2} ${toX},${toY}`}
        stroke="#2f6fff"
        strokeWidth={2.4}
        fill="none"
        strokeDasharray="6 6"
        markerEnd="url(#edu-arrowhead)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />
    </svg>
  );
}

const KEYWORDS = [
  "SELECT",
  "FROM",
  "WHERE",
  "AND",
  "OR",
  "JOIN",
  "LEFT JOIN",
  "INNER JOIN",
  "ON",
  "GROUP BY",
  "ORDER BY",
  "LIMIT",
  "INSERT",
  "INTO",
  "VALUES",
  "UPDATE",
  "SET",
  "DELETE",
  "ON CONFLICT",
  "DO NOTHING",
  "BEGIN",
  "COMMIT",
  "ROLLBACK",
  "CURRENT_TIMESTAMP",
  "AS",
  "IN",
  "MIN",
  "MAX",
];

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function highlightSql(sql: string, _: string | undefined) {
  let out = escapeHtml(sql);

  // String literal
  out = out.replace(/'([^']*)'/g, "<span style=\"color:#fcd34d\">'$1'</span>");
  // Parametreler :foo
  out = out.replace(/:([a-zA-Z_]+)/g, '<span style="color:#fb7185">:$1</span>');
  // Yorum -- ...
  out = out.replace(/(--[^\n]*)/g, '<span style="color:#64748b;font-style:italic">$1</span>');
  // Anahtar kelimeler
  const sorted = [...KEYWORDS].sort((a, b) => b.length - a.length);
  for (const k of sorted) {
    const re = new RegExp(`\\b${k.replace(/ /g, "\\s+")}\\b`, "g");
    out = out.replace(re, `<span style="color:#7dd3fc;font-weight:600">${k}</span>`);
  }
  return out;
}
