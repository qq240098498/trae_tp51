import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useStore } from "@/store/useStore";
import { monthMatrix, monthLabel, todayStr } from "@/lib/date";
import {
  dateTier,
  effectiveAvailabilityForDate,
  effectiveOverride,
  priceForDate,
} from "@/services/pricing";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import DayDetail from "@/components/calendar/DayDetail";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

export default function CalendarPage() {
  const { roomTypes, bookings, holidays, inventoryOverrides } = useStore();
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [selected, setSelected] = useState<string | null>(null);

  const cells = useMemo(() => monthMatrix(cursor.y, cursor.m), [cursor]);
  const today = todayStr();

  const totalAvailable = (date: string) => {
    let a = 0;
    let t = 0;
    for (const rt of roomTypes) {
      a += effectiveAvailabilityForDate(rt, date, bookings, inventoryOverrides);
      t += rt.unitCount;
    }
    return { a, t };
  };

  const go = (delta: number) => {
    const d = new Date(cursor.y, cursor.m + delta, 1);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="房态日历"
        description="按月查看每日可售库存，区分平日/周末/节假日价格，点击日期管理库存与节假日"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" icon={<ChevronLeft size={16} />} onClick={() => go(-1)} />
            <span className="min-w-[110px] text-center font-serif text-lg font-semibold text-ink">
              {monthLabel(cursor.y, cursor.m)}
            </span>
            <Button variant="ghost" size="sm" icon={<ChevronRight size={16} />} onClick={() => go(1)} />
            <Button
              variant="subtle"
              size="sm"
              icon={<CalendarDays size={14} />}
              onClick={() => {
                const d = new Date();
                setCursor({ y: d.getFullYear(), m: d.getMonth() });
              }}
            >
              今天
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs">
        <Legend color="bg-white border border-ink/15" label="平日" />
        <Legend color="bg-forest-50 border border-forest-200" label="周末" />
        <Legend color="bg-clay-50 border border-clay-200" label="节假日" />
        <Legend color="bg-ink/10" label="已关闭销售" />
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-ink/10 bg-paper/50">
          {WEEKDAYS.map((w) => (
            <div key={w} className="px-2 py-2.5 text-center text-xs font-medium text-muted">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((c, idx) => {
            const tier = dateTier(c.date, holidays);
            const closed = roomTypes.some(
              (rt) => effectiveOverride(rt.id, c.date, inventoryOverrides)?.closed
            );
            const { a, t } = totalAvailable(c.date);
            const isToday = c.date === today;
            return (
              <button
                key={c.date}
                onClick={() => setSelected(c.date)}
                className={cn(
                  "relative min-h-[96px] border-b border-r border-ink/10 p-2 text-left transition hover:shadow-soft hover:z-10",
                  (idx % 7) === 6 && "border-r-0",
                  idx >= 35 && "border-b-0",
                  !c.inMonth && "bg-paper/30 opacity-50",
                  closed ? "bg-ink/10" : tier === "holiday" ? "bg-clay-50/60" : tier === "weekend" ? "bg-forest-50/50" : "bg-card"
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      c.inMonth ? "text-ink" : "text-muted",
                      isToday && "flex h-5 w-5 items-center justify-center rounded-full bg-forest-500 text-paper"
                    )}
                  >
                    {c.day}
                  </span>
                  {tier === "holiday" && <span className="h-1.5 w-1.5 rounded-full bg-wheat-500" title="节假日" />}
                </div>
                {c.inMonth && (
                  <div className="mt-1.5">
                    <div className="num text-[11px] text-muted">
                      可售 <span className={cn("font-semibold", a === 0 ? "text-clay-500" : "text-forest-700")}>{a}</span>/{t}
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {roomTypes.slice(0, 3).map((rt) => {
                        const p = priceForDate(rt, c.date, holidays);
                        return (
                          <div key={rt.id} className="flex items-center justify-between text-[10px]">
                            <span className="truncate text-muted">{rt.name.slice(0, 4)}</span>
                            <span className="num text-muted/80">¥{p}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <DayDetail
        open={!!selected}
        onClose={() => setSelected(null)}
        date={selected}
        holidays={holidays}
      />
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted">
      <span className={cn("h-3 w-3 rounded", color)} />
      {label}
    </span>
  );
}
