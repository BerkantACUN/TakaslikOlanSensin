import { cn } from "@/lib/utils";

type Tone = "neutral" | "brand" | "success" | "warning" | "danger" | "soft";

const tones: Record<Tone, string> = {
  neutral: "bg-white text-[var(--color-carbon)] border border-[var(--color-pebble)]",
  brand: "bg-[var(--color-brand-100)] text-[var(--color-brand-800)]",
  success: "bg-[var(--color-mint)] text-[var(--color-success)]",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
  soft: "bg-[var(--color-fog)] text-[var(--color-slate)]",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] " +
          "font-semibold tracking-wide whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
