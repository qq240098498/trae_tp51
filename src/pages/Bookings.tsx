import { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Search, Eye } from "lucide-react";
import type { BookingStatus } from "@/types";
import { useStore } from "@/store/useStore";
import { formatDateShort } from "@/lib/date";
import { yuan, maskPhone } from "@/lib/format";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import { Select, TextInput } from "@/components/ui/Field";
import { BookingStatusBadge, DepositStatusBadge } from "@/components/ui/StatusBadge";
import NewBookingDrawer from "@/components/booking/NewBookingDrawer";

const STATUS_FILTERS: { value: BookingStatus | "all"; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "pending", label: "待入住" },
  { value: "checked_in", label: "在住" },
  { value: "checked_out", label: "已离店" },
  { value: "cancelled", label: "已取消" },
  { value: "no_show", label: "未到店" },
];

export default function Bookings({ initialOpen }: { initialOpen?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const bookings = useStore((s) => s.bookings);
  const roomTypes = useStore((s) => s.roomTypes);

  const routeOpen = location.pathname === "/bookings/new";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const open = drawerOpen || routeOpen || initialOpen;
  const [status, setStatus] = useState<BookingStatus | "all">("all");
  const [keyword, setKeyword] = useState("");

  const rtMap = useMemo(
    () => Object.fromEntries(roomTypes.map((r) => [r.id, r.name])),
    [roomTypes]
  );

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return [...bookings]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.checkIn.localeCompare(a.checkIn))
      .filter((b) => (status === "all" ? true : b.status === status))
      .filter((b) =>
        !kw
          ? true
          : b.guestName.toLowerCase().includes(kw) ||
            b.guestPhone.includes(kw) ||
            b.code.toLowerCase().includes(kw)
      );
  }, [bookings, status, keyword]);

  const closeDrawer = () => {
    setDrawerOpen(false);
    if (routeOpen) navigate("/bookings");
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="预订管理"
        description="查看与筛选全部订单，新建预订自动校验库存与退改规则"
        actions={
          <Button icon={<Plus size={16} />} onClick={() => setDrawerOpen(true)}>
            新建预订
          </Button>
        }
      />

      <div className="card mb-4 flex flex-wrap items-center gap-3 p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <TextInput
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索客人姓名 / 电话 / 订单号"
            className="pl-9"
          />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value as BookingStatus | "all")} className="w-36">
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </Select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 bg-paper/50 text-left text-xs text-muted">
                <th className="px-4 py-3 font-medium">订单</th>
                <th className="px-4 py-3 font-medium">客人</th>
                <th className="px-4 py-3 font-medium">房型</th>
                <th className="px-4 py-3 font-medium">入住 → 退房</th>
                <th className="px-4 py-3 text-right font-medium">金额</th>
                <th className="px-4 py-3 font-medium">押金</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-muted">暂无订单</td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-ink/5 transition last:border-b-0 hover:bg-ink/5"
                  >
                    <td className="px-4 py-3">
                      <div className="num text-xs font-medium text-ink">{b.code}</div>
                      <div className="text-[11px] text-muted">{b.createdAt} 创建</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink">{b.guestName}</div>
                      <div className="text-[11px] text-muted">{maskPhone(b.guestPhone)}</div>
                    </td>
                    <td className="px-4 py-3 text-ink">{rtMap[b.roomTypeId] ?? "—"}</td>
                    <td className="px-4 py-3 num text-ink">
                      {formatDateShort(b.checkIn)} → {formatDateShort(b.checkOut)}
                      <span className="ml-1 text-[11px] text-muted">{b.nights}晚</span>
                    </td>
                    <td className="px-4 py-3 text-right num font-semibold text-ink">{yuan(b.roomTotal + b.serviceTotal)}</td>
                    <td className="px-4 py-3">
                      <DepositStatusBadge status={b.depositStatus} />
                      <div className="num text-[11px] text-muted">{yuan(b.deposit)}</div>
                    </td>
                    <td className="px-4 py-3"><BookingStatusBadge status={b.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="subtle"
                        size="sm"
                        icon={<Eye size={13} />}
                        onClick={() => navigate(`/bookings/${b.id}`)}
                      >
                        详情
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NewBookingDrawer open={open} onClose={closeDrawer} />
    </div>
  );
}
