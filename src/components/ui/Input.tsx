"use client";

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

const fieldBase =
  "w-full bg-white border border-[var(--color-pebble)] rounded-[14px] " +
  "px-4 text-[14px] text-[var(--color-carbon)] placeholder:text-[var(--color-slate)] " +
  "transition focus:outline-none focus:border-[var(--color-carbon)] " +
  "focus:ring-2 focus:ring-[var(--color-brand-100)]";

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, leftIcon, className, id, ...rest }, ref) => {
    const fieldId = id ?? rest.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={fieldId}
            className="text-[12px] font-semibold text-[var(--color-carbon)]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-slate)]">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={fieldId}
            className={cn(
              fieldBase,
              "h-12",
              leftIcon && "pl-10",
              error && "border-[var(--color-accent-coral)] focus:border-[var(--color-accent-coral)]",
              className,
            )}
            {...rest}
          />
        </div>
        {(hint || error) && (
          <p
            className={cn(
              "text-[12px]",
              error ? "text-[var(--color-accent-coral)]" : "text-[var(--color-slate)]",
            )}
          >
            {error ?? hint}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, className, id, rows = 4, ...rest }, ref) => {
    const fieldId = id ?? rest.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={fieldId}
            className="text-[12px] font-semibold text-[var(--color-carbon)]"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={fieldId}
          rows={rows}
          className={cn(
            fieldBase,
            "py-3 resize-y min-h-[88px] leading-relaxed",
            error && "border-[var(--color-accent-coral)]",
            className,
          )}
          {...rest}
        />
        {(hint || error) && (
          <p
            className={cn(
              "text-[12px]",
              error ? "text-[var(--color-accent-coral)]" : "text-[var(--color-slate)]",
            )}
          >
            {error ?? hint}
          </p>
        )}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, className, id, children, ...rest }, ref) => {
    const fieldId = id ?? rest.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={fieldId}
            className="text-[12px] font-semibold text-[var(--color-carbon)]"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={fieldId}
          className={cn(
            fieldBase,
            "h-12 appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236a6a6a%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22/></svg>')] bg-no-repeat bg-[right_16px_center] pr-10",
            className,
          )}
          {...rest}
        >
          {children}
        </select>
        {(hint || error) && (
          <p
            className={cn(
              "text-[12px]",
              error ? "text-[var(--color-accent-coral)]" : "text-[var(--color-slate)]",
            )}
          >
            {error ?? hint}
          </p>
        )}
      </div>
    );
  },
);
Select.displayName = "Select";
