import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LogIn,
  LogOut,
  BedDouble,
  Wallet,
  TrendingUp,
  ArrowRight,
  CalendarCheck,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { todayStr, formatDateShort } from "@/lib/date";
import { yuan } from "@/lib/format";
import {
  arrivalsToday,
  departuresToday,
  inStay,
  depositHeld,
  revenueToday,
  availabilityTotal,
  next7Days,
} from "@/lib/selectors";
import StatCard from "@/components/ui/StatCard";
import { BookingStatusBadge } from "@/components/ui/StatusBadge";
import { TIER_LABEL } from "@/services/pricing";

function roomTypeName(map: Record<string, string>, id: string) {
  return map[id] ?? "—";
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { bookings, roomTypes, holidays, inventoryOverrides } = useStore();
  const today = todayStr();

  const rtMap = useMemo(
    () => Object.fromEntries(roomTypes.map((r) => [r.id, r.name])),
    [roomTypes]
  );

  const arrivals = arrivalsToday(bookings);
  const departures = departuresToday(bookings);
  const staying = inStay(bookings);
  const avail = availabilityTotal(roomTypes, bookings, today, inventoryOverrides);
  const held = depositHeld(bookings);
  const revenue = revenueToday(bookings);
  const week = next7Days(roomTypes, bookings, holidays, inventoryOverrides);
  const recent = [...bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-ink">今日山舍</h1>
        <p className="mt-1 text-sm text-muted">
          {formatDateShort(today)} 的运营概览，今日有 {arrivals.length} 位客人待入住、{departures.length} 位待退房。
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="今日入住" value={arrivals.length} unit="间" accent="forest" icon={<LogIn size={16} />} />
        <StatCard label="今日退房" value={departures.length} unit="间" accent="clay" icon={<LogOut size={16} />} />
        <StatCard label="在住" value={staying.length} unit="间" accent="wheat" icon={<BedDouble size={16} />} />
        <StatCard label="今日可售" value={avail.available} unit={`/ ${avail.total}`} icon={<CalendarCheck size={16} />} />
        <StatCard label="押金在押" value={yuan(held)} accent="clay" icon={<Wallet size={16} />} />
        <StatCard label="今日营收" value={yuan(revenue)} accent="forest" icon={<TrendingUp size={16} />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TodoList
          title="今日待入住"
          empty="今日没有待入住订单"
          items={arrivals.map((b) => ({
            id: b.id,
            name: b.guestName,
            sub: roomTypeName(rtMap, b.roomTypeId),
            action: "办理入住",
            onAction: () => navigate(`/frontdesk?checkin=${b.id}`),
          }))}
        />
        <TodoList
          title="今日待退房"
          empty="今日没有待退房订单"
          items={departures.map((b) => ({
            id: b.id,
            name: b.guestName,
            sub: roomTypeName(rtMap, b.roomTypeId),
            action: "办理退房",
            onAction: () => navigate(`/frontdesk?checkout=${b.id}`),
          }))}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-1">
          <h3 className="mb-4 font-serif text-lg font-semibold text-ink">近7日房态</h3>
          <div className="space-y-2.5">
            {week.map((d) => {
              const ratio = d.total ? d.available / d.total : 0;
              return (
                <div key={d.date} className="flex items-center gap-3">
                  <span className="w-14 text-xs text-muted">{formatDateShort(d.date)}</span>
                  <div className="relative h-5 flex-1 overflow-hidden rounded bg-ink/5">
                    <div
                      className="h-full rounded bg-forest-400/70"
                      style={{ width: `${Math.max(ratio * 100, 4)}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-end pr-2 text-[11px] font-medium text-ink">
                      {d.available}/{d.total}
                    </span>
                  </div>
                  <span className="w-12 text-right text-[11px] text-muted">{TIER_LABEL[d.tier as keyof typeof TIER_LABEL]}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-serif text-lg font-semibold text-ink">近期订单</h3>
            <Link to="/bookings" className="inline-flex items-center gap-1 text-xs text-forest-600 hover:underline">
              查看全部 <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-ink/5">
            {recent.map((b) => (
              <Link
                key={b.id}
                to={`/bookings/${b.id}`}
                className="flex items-center justify-between py-2.5 transition hover:bg-ink/5 -mx-2 px-2 rounded"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-ink">{b.guestName}</span>
                    <BookingStatusBadge status={b.status} />
                  </div>
                  <div className="mt-0.5 text-xs text-muted">
                    {roomTypeName(rtMap, b.roomTypeId)} · {formatDateShort(b.checkIn)} → {formatDateShort(b.checkOut)}
                  </div>
                </div>
                <div className="num text-sm font-semibold text-ink">{yuan(b.roomTotal + b.serviceTotal)}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TodoList({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: { id: string; name: string; sub: string; action: string; onAction: () => void }[];
}) {
  return (
    <div className="card p-5">
      <h3 className="mb-4 font-serif text-lg font-semibold text-ink">{title}</h3>
      {items.length === 0 ? (
        <div className="flex h-24 items-center justify-center text-sm text-muted">{empty}</div>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <div
              key={it.id}
              className="flex items-center justify-between rounded-lg border border-ink/5 bg-paper/40 px-3 py-2.5"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-ink">{it.name}</div>
                <div className="text-xs text-muted">{it.sub}</div>
              </div>
              <button
                onClick={it.onAction}
                className="shrink-0 rounded-lg bg-forest-500 px-3 py-1.5 text-xs font-medium text-paper transition hover:bg-forest-600"
              >
                {it.action}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
