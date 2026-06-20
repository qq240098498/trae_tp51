import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Tone = "forest" | "clay" | "wheat" | "muted" | "ink";

const TONES: Record<Tone, string> = {
  forest: "bg-forest-50 text-forest-700 border-forest-200",
  clay: "bg-clay-50 text-clay-600 border-clay-200",
  wheat: "bg-wheat-50 text-wheat-700 border-wheat-200",
  muted: "bg-ink/5 text-muted border-ink/10",
  ink: "bg-ink text-paper border-ink",
};

export default function Badge({
  tone = "muted",
  children,
  className,
  dot,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        TONES[tone],
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}
