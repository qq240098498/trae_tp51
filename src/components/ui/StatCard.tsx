import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function StatCard({
  label,
  value,
  unit,
  icon,
  accent = "forest",
  hint,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  icon?: ReactNode;
  accent?: "forest" | "clay" | "wheat" | "muted";
  hint?: ReactNode;
}) {
  const accents = {
    forest: "bg-forest-500",
    clay: "bg-clay-400",
    wheat: "bg-wheat-400",
    muted: "bg-ink/30",
  };
  return (
    <div className="card relative overflow-hidden p-5">
      <span className={cn("absolute left-0 top-0 h-full w-1", accents[accent])} />
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted">{label}</span>
        {icon && <span className="text-muted/70">{icon}</span>}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="num text-2xl font-semibold text-ink">{value}</span>
        {unit && <span className="text-xs text-muted">{unit}</span>}
      </div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}
