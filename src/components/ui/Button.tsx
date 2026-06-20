import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-forest-500 text-paper hover:bg-forest-600 shadow-sm active:translate-y-px",
  secondary:
    "border border-clay-400 text-clay-500 bg-white/60 hover:bg-clay-50",
  ghost: "text-ink hover:bg-ink/5",
  danger: "bg-clay-400 text-paper hover:bg-clay-500 shadow-sm active:translate-y-px",
  subtle: "bg-ink/5 text-ink hover:bg-ink/10",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

export default function Button({
  variant = "primary",
  size = "md",
  icon,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-500/40",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
