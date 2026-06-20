import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LogIn, LogOut, BedDouble } from "lucide-react";
import { useStore } from "@/store/useStore";
import { todayStr, formatDateShort } from "@/lib/date";
import { yuan } from "@/lib/format";
import PageHeader from "@/components/ui/PageHeader";
import { BookingStatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";
import CheckInPanel from "@/components/frontdesk/CheckInPanel";
import CheckOutPanel from "@/components/frontdesk/CheckOutPanel";

export default function Frontdesk() {
  const [params, setParams] = useSearchParams();
  const bookings = useStore((s) => s.bookings);
  const roomTypes = useStore((s) => s.roomTypes);
  const today = todayStr();

  const rtMap = useMemo(
    () => Object.fromEntries(roomTypes.map((r) => [r.id, r.name])),
    [roomTypes]
  );

  const pending = bookings.filter((b) => b.status === "pending");
  const staying = bookings.filter((b) => b.status === "checked_in");

  const checkinId = params.get("checkin");
  const checkoutId = params.get("checkout");
  const initialId = checkinId ?? checkoutId;
  const [selectedId, setSelectedId] = useState<string | null>(initialId);

  useEffect(() => {
    if (initialId) setSelectedId(initialId);
  }, [initialId]);

  const selected = bookings.find((b) => b.id === selectedId) ?? null;

  const select = (id: string, type: "checkin" | "checkout") => {
    setSelectedId(id);
    const next = new URLSearchParams();
    next.set(type, id);
    setParams(next, { replace: true });
  };

  const clear = () => {
    setSelectedId(null);
    setParams({}, { replace: true });
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="入住退房"
        description="今日入住与退房办理，登记身份证、收退押金"
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <BookingList
            title="待办理入住"
            icon={<LogIn size={15} />}
            tone="forest"
            todayLabel="今日入住"
            todayCount={pending.filter((b) => b.checkIn === today).length}
            items={pending}
            rtMap={rtMap}
            selectedId={selectedId}
            onSelect={(id) => select(id, "checkin")}
          />
          <BookingList
            title="在住 / 待办理退房"
            icon={<LogOut size={15} />}
            tone="clay"
            todayLabel="今日退房"
            todayCount={staying.filter((b) => b.checkOut === today).length}
            items={staying}
            rtMap={rtMap}
            selectedId={selectedId}
            onSelect={(id) => select(id, "checkout")}
          />
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-24">
            {!selected ? (
              <div className="card flex h-64 flex-col items-center justify-center gap-2 text-muted">
                <BedDouble size={32} className="opacity-40" />
                <p className="text-sm">从左侧选择订单办理入住或退房</p>
              </div>
            ) : selected.status === "pending" ? (
              <div className="card p-5">
                <CheckInPanel booking={selected} onDone={clear} />
              </div>
            ) : selected.status === "checked_in" ? (
              <div className="card p-5">
                <CheckOutPanel booking={selected} onDone={clear} />
              </div>
            ) : (
              <div className="card flex h-64 flex-col items-center justify-center gap-2 text-muted">
                <p className="text-sm">该订单状态为「{statusLabel(selected.status)}」，无需办理</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function statusLabel(s: string) {
  return { pending: "待入住", checked_in: "在住", checked_out: "已离店", cancelled: "已取消", no_show: "未到店" }[s] ?? s;
}

function BookingList({
  title,
  icon,
  tone,
  todayLabel,
  todayCount,
  items,
  rtMap,
  selectedId,
  onSelect,
}: {
  title: string;
  icon: React.ReactNode;
  tone: "forest" | "clay";
  todayLabel: string;
  todayCount: number;
  items: { id: string; guestName: string; guestPhone: string; roomTypeId: string; checkIn: string; checkOut: string; status: string; deposit: number }[];
  rtMap: Record<string, string>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-serif text-lg font-semibold text-ink">
          <span className={cn(tone === "forest" ? "text-forest-600" : "text-clay-500")}>{icon}</span>
          {title}
        </h3>
        <span className="rounded-full bg-ink/5 px-2.5 py-0.5 text-xs text-muted">
          {todayLabel} <span className="num font-semibold text-ink">{todayCount}</span>
        </span>
      </div>
      {items.length === 0 ? (
        <div className="flex h-20 items-center justify-center text-sm text-muted">暂无</div>
      ) : (
        <div className="space-y-2">
          {items.map((b) => (
            <button
              key={b.id}
              onClick={() => onSelect(b.id)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition",
                selectedId === b.id
                  ? "border-forest-400 bg-forest-50/60"
                  : "border-ink/10 bg-paper/40 hover:border-ink/20"
              )}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-ink">{b.guestName}</span>
                  <BookingStatusBadge status={b.status as never} />
                </div>
                <div className="mt-0.5 text-xs text-muted">
                  {rtMap[b.roomTypeId]} · {formatDateShort(b.checkIn)} → {formatDateShort(b.checkOut)}
                </div>
              </div>
              <div className="text-right">
                <div className="num text-xs text-muted">押金</div>
                <div className="num text-sm font-semibold text-clay-500">{yuan(b.deposit)}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
