"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-[10px] " +
  "transition-all duration-150 active:scale-[0.98] disabled:opacity-50 " +
  "disabled:cursor-not-allowed select-none whitespace-nowrap " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
  "focus-visible:ring-[var(--color-brand-500)]";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--color-brand-500)] text-white hover:bg-[var(--color-brand-600)] " +
    "shadow-[0_1px_2px_rgba(0,0,0,0.05)]",
  secondary:
    "bg-[var(--color-carbon)] text-white hover:bg-black",
  outline:
    "bg-white text-[var(--color-carbon)] border border-[var(--color-pebble)] " +
    "hover:bg-[var(--color-fog)] hover:border-[var(--color-carbon)]",
  ghost:
    "bg-transparent text-[var(--color-carbon)] hover:bg-[var(--color-fog)]",
  danger:
    "bg-[var(--color-accent-coral)] text-white hover:opacity-90",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-[13px]",
  md: "h-11 px-4 text-[14px]",
  lg: "h-12 px-6 text-[15px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading,
      fullWidth,
      className,
      children,
      disabled,
      ...rest
    },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        base,
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden
          className="inline-block h-4 w-4 rounded-full border-2 border-current border-r-transparent animate-spin"
        />
      )}
      {children}
    </button>
  ),
);
Button.displayName = "Button";
