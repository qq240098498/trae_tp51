import { useState } from "react";
import { CalendarPlus, Star, X } from "lucide-react";
import { Link } from "react-router-dom";
import type { Holiday } from "@/types";
import { useStore } from "@/store/useStore";
import { formatDate } from "@/lib/date";
import { yuan } from "@/lib/format";
import {
  effectiveAvailabilityForDate,
  effectiveOverride,
  priceForDate,
  dateTier,
  TIER_LABEL,
} from "@/services/pricing";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { TextInput, Toggle } from "@/components/ui/Field";
import Badge from "@/components/ui/Badge";

export default function DayDetail({
  open,
  onClose,
  date,
  holidays,
}: {
  open: boolean;
  onClose: () => void;
  date: string | null;
  holidays: Holiday[];
}) {
  const { roomTypes, bookings, inventoryOverrides, setHoliday, removeHoliday, setInventoryOverride, removeInventoryOverride } = useStore();
  const [holidayName, setHolidayName] = useState("");

  if (!date) return null;
  const tier = dateTier(date, holidays);
  const holiday = holidays.find((h) => h.date === date);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={formatDate(date)}
      subtitle={`${TIER_LABEL[tier]} · 点击房型可调整当日库存`}
      size="lg"
      footer={<Button onClick={onClose}>关闭</Button>}
    >
      {/* holiday control */}
      <div className="mb-5 rounded-lg border border-wheat-200 bg-wheat-50/60 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Star size={15} className="text-wheat-600" />
          <span className="text-sm font-medium text-ink">节假日标记</span>
          {holiday && (
            <Badge tone="wheat" dot>
              {holiday.name}
            </Badge>
          )}
        </div>
        {holiday ? (
          <Button variant="ghost" size="sm" onClick={() => removeHoliday(date)} className="text-clay-500">
            取消节假日标记
          </Button>
        ) : (
          <div className="flex gap-2">
            <TextInput
              value={holidayName}
              onChange={(e) => setHolidayName(e.target.value)}
              placeholder="如：丰收采摘节"
              onKeyDown={(e) => {
                if (e.key === "Enter" && holidayName.trim()) {
                  setHoliday(date, holidayName.trim());
                  setHolidayName("");
                }
              }}
            />
            <Button
              size="sm"
              icon={<Star size={14} />}
              disabled={!holidayName.trim()}
              onClick={() => {
                setHoliday(date, holidayName.trim());
                setHolidayName("");
              }}
            >
              标记
            </Button>
          </div>
        )}
      </div>

      {/* per room type availability */}
      <div className="space-y-3">
        {roomTypes.map((rt) => {
          const price = priceForDate(rt, date, holidays);
          const avail = effectiveAvailabilityForDate(rt, date, bookings, inventoryOverrides);
          const ov = effectiveOverride(rt.id, date, inventoryOverrides);
          return (
            <div key={rt.id} className="rounded-lg border border-ink/10 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-ink">{rt.name}</div>
                  <div className="text-xs text-muted">
                    单价 <span className="num text-ink">{yuan(price)}</span> ·{" "}
                    可售 <span className="num text-ink">{avail}</span>/{rt.unitCount}
                    {ov?.closed && <span className="ml-1 text-clay-500">· 已关闭销售</span>}
                  </div>
                </div>
                <Link
                  to={`/bookings/new`}
                  className="inline-flex items-center gap-1 rounded-lg bg-forest-500/10 px-2.5 py-1 text-xs font-medium text-forest-700 transition hover:bg-forest-500/20"
                >
                  <CalendarPlus size={13} /> 预订
                </Link>
              </div>
              <div className="mt-3 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">库存调整</span>
                  <button
                    className="h-7 w-7 rounded border border-ink/15 text-ink hover:bg-ink/5"
                    onClick={() => setInventoryOverride(rt.id, date, (ov?.delta ?? 0) - 1, ov?.closed ?? false)}
                  >
                    −
                  </button>
                  <span className="num w-8 text-center text-sm font-medium text-ink">
                    {ov ? (ov.delta >= 0 ? `+${ov.delta}` : ov.delta) : 0}
                  </span>
                  <button
                    className="h-7 w-7 rounded border border-ink/15 text-ink hover:bg-ink/5"
                    onClick={() => setInventoryOverride(rt.id, date, (ov?.delta ?? 0) + 1, ov?.closed ?? false)}
                  >
                    +
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Toggle checked={!!ov?.closed} onChange={(v) => setInventoryOverride(rt.id, date, ov?.delta ?? 0, v)} />
                  <span className="text-xs text-muted">关闭销售</span>
                </div>
                {ov && (
                  <button
                    onClick={() => ov && removeInventoryOverride(ov.id)}
                    className="ml-auto inline-flex items-center gap-1 text-xs text-clay-500 hover:underline"
                  >
                    <X size={12} /> 清除
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
