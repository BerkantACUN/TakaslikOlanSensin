"use client";

import { motion } from "framer-motion";

/* -------------------------------------------------------------------
   Line-Art Loading Screen
   İki çizgisel karakter (öğrenci avatarları) karşılıklı kitap takasıyor;
   merkezdeki dönen çember + alt çizgide animasyonlu shimmer ile birlikte.
   Tüm yollar stroke-dasharray animasyonu ile "elden çiziliyor" izlenimi verir.
------------------------------------------------------------------- */

export function LoadingScreen({
  label = "Hazırlanıyor",
}: {
  label?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25 } }}
      className="fixed inset-0 z-[120] bg-white grid place-items-center"
    >
      <div className="flex flex-col items-center gap-8">
        <LineArtSwap />
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.32em] font-bold text-[var(--color-slate)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-500)] animate-pulse" />
            {label}
          </div>
          <div className="w-44 h-[3px] rounded-full bg-[var(--color-mist)] overflow-hidden">
            <motion.div
              className="h-full w-1/3 bg-gradient-to-r from-[var(--color-brand-400)] via-[var(--color-brand-500)] to-[var(--color-brand-700)]"
              animate={{ x: ["-100%", "300%"] }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function LineArtSwap() {
  const draw = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (i = 1) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { delay: i * 0.06, duration: 0.9, ease: "easeInOut" },
        opacity: { delay: i * 0.06, duration: 0.2 },
      },
    }),
  };

  return (
    <motion.svg
      width="280"
      height="180"
      viewBox="0 0 280 180"
      initial="hidden"
      animate="visible"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[var(--color-carbon)]"
    >
      {/* Sol karakter — kafa */}
      <motion.circle
        cx="60"
        cy="58"
        r="20"
        variants={draw}
        custom={0}
      />
      {/* Sol gövde */}
      <motion.path
        d="M40 140 C 40 105, 80 105, 80 140 M60 80 L60 130"
        variants={draw}
        custom={1}
      />
      {/* Sol kol — kitap uzatıyor */}
      <motion.path
        d="M60 100 Q 95 95, 120 100"
        variants={draw}
        custom={2}
        stroke="#2f6fff"
      />

      {/* Sağ karakter — kafa */}
      <motion.circle
        cx="220"
        cy="58"
        r="20"
        variants={draw}
        custom={0.4}
      />
      {/* Sağ gövde */}
      <motion.path
        d="M200 140 C 200 105, 240 105, 240 140 M220 80 L220 130"
        variants={draw}
        custom={1.4}
      />
      {/* Sağ kol — kitap uzatıyor */}
      <motion.path
        d="M220 100 Q 185 95, 160 100"
        variants={draw}
        custom={2.4}
        stroke="#f59e0b"
      />

      {/* Orta — iki kitap, takas oku */}
      {/* Sol kitap */}
      <motion.rect
        x="110"
        y="90"
        width="22"
        height="28"
        rx="2"
        variants={draw}
        custom={3}
        stroke="#2f6fff"
        animate={{
          x: [110, 148, 110],
          opacity: [1, 1, 1],
        }}
        transition={{
          duration: 3.2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />
      <motion.path
        d="M114 100 L 128 100 M114 106 L 128 106 M114 112 L 124 112"
        variants={draw}
        custom={3.6}
        stroke="#2f6fff"
        animate={{
          x: [0, 38, 0],
        }}
        transition={{
          duration: 3.2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* Sağ kitap */}
      <motion.rect
        x="148"
        y="90"
        width="22"
        height="28"
        rx="2"
        variants={draw}
        custom={3}
        stroke="#f59e0b"
        animate={{
          x: [148, 110, 148],
        }}
        transition={{
          duration: 3.2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />
      <motion.path
        d="M152 100 L 166 100 M152 106 L 166 106 M152 112 L 162 112"
        variants={draw}
        custom={3.6}
        stroke="#f59e0b"
        animate={{
          x: [0, -38, 0],
        }}
        transition={{
          duration: 3.2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* Zemin çizgisi */}
      <motion.path
        d="M20 160 L 260 160"
        variants={draw}
        custom={4}
        strokeDasharray="3 5"
        opacity={0.4}
      />

      {/* Orbit halkası */}
      <motion.circle
        cx="140"
        cy="104"
        r="46"
        stroke="#2f6fff"
        strokeWidth={1.2}
        strokeDasharray="2 6"
        opacity={0.3}
        animate={{ rotate: 360 }}
        style={{ transformOrigin: "140px 104px" }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </motion.svg>
  );
}
