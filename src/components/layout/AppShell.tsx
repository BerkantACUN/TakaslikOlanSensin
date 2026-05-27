"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

/**
 * Sağdan sola kayan sayfa geçişleri + ilk yüklemede line-art loading.
 * `key={pathname}` AnimatePresence için kritik — her route değişince yeni mount.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [bootDone, setBootDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBootDone(true), 1100);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <AnimatePresence>
        {!bootDone && <LoadingScreen key="boot" label="CampusSwap" />}
      </AnimatePresence>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{
            duration: 0.28,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
