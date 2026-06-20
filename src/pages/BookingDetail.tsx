import { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Ban,
  CalendarClock,
  Wallet,
  KeyRound,
  LogOut,
  ScrollText,
  Map,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { formatDate, todayStr, addDays, eachNight, daysBetween } from "@/lib/date";
import { yuan, maskIdCard, maskPhone } from "@/lib/format";
import {
  matchRefundRule,
  calcRefund,
  priceForDate,
  dateTier,
  TIER_LABEL,
  TIER_COLOR,
} from "@/services/pricing";
import { getRecommendations } from "@/services/nearbyRecommendation";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Field, TextInput } from "@/components/ui/Field";
import {
  BookingStatusBadge,
  DepositStatusBadge,
  RoomModeBadge,
} from "@/components/ui/StatusBadge";
import NearbyRecommendationCard from "@/components/booking/NearbyRecommendationCard";

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    bookings, roomTypes, bookingServices, services, holidays, refundRules, nearbyAttractions,
    cancelBooking, changeBookingDates, collectDeposit,
  } = useStore();

  const booking = bookings.find((b) => b.id === id);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);
  const [newCheckIn, setNewCheckIn] = useState(booking?.checkIn ?? todayStr());
  const [newCheckOut, setNewCheckOut] = useState(booking?.checkOut ?? addDays(todayStr(), 1));
  const [changeErr, setChangeErr] = useState("");

  const rt = booking ? roomTypes.find((r) => r.id === booking.roomTypeId) : null;

  const rule = useMemo(
    () => (booking ? matchRefundRule(booking.checkIn, refundRules) : null),
    [booking, refundRules]
  );
  const refundPreview = booking ? calcRefund(booking.deposit, rule) : 0;
  const daysBefore = booking ? daysBetween(todayStr(), booking.checkIn) : 0;

  const recommendations = useMemo(
    () => (booking ? getRecommendations(nearbyAttractions, booking.guests, booking.checkIn, 6) : []),
    [booking, nearbyAttractions]
  );

  if (!booking || !rt) {
    return (
      <div className="animate-fade-in">
        <p className="text-muted">订单不存在。</p>
        <Link to="/bookings" className="text-forest-600 hover:underline">返回列表</Link>
      </div>
    );
  }

  const bsvc = bookingServices.filter((bs) => bs.bookingId === booking.id);
  const nights = eachNight(booking.checkIn, booking.checkOut);

  const handleCancel = () => {
    cancelBooking(booking.id);
    setCancelOpen(false);
    navigate("/bookings");
  };

  const handleChange = () => {
    setChangeErr("");
    const res = changeBookingDates(booking.id, newCheckIn, newCheckOut);
    if (!res.ok) return setChangeErr(res.error ?? "改期失败");
    setChangeOpen(false);
  };

  const isActive = booking.status === "pending" || booking.status === "checked_in";

  return (
    <div className="animate-fade-in">
      <button onClick={() => navigate("/bookings")} className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft size={15} /> 返回订单列表
      </button>

      <PageHeader
        title={`${booking.guestName} 的订单`}
        description={`${booking.code} · 创建于 ${booking.createdAt}`}
        actions={
          <div className="flex flex-wrap gap-2">
            {booking.depositStatus === "unpaid" && booking.status === "pending" && (
              <Button variant="secondary" icon={<Wallet size={15} />} onClick={() => collectDeposit(booking.id, Math.round((booking.roomTotal + booking.serviceTotal) * 0.3))}>
                收取押金
              </Button>
            )}
            {booking.status === "pending" && (
              <>
                <Link to={`/frontdesk?checkin=${booking.id}`}>
                  <Button icon={<KeyRound size={15} />}>办理入住</Button>
                </Link>
                <Button variant="subtle" icon={<CalendarClock size={15} />} onClick={() => { setNewCheckIn(booking.checkIn); setNewCheckOut(booking.checkOut); setChangeOpen(true); }}>
                  改期
                </Button>
                <Button variant="danger" icon={<Ban size={15} />} onClick={() => setCancelOpen(true)}>
                  退订
                </Button>
              </>
            )}
            {booking.status === "checked_in" && (
              <Link to={`/frontdesk?checkout=${booking.id}`}>
                <Button variant="danger" icon={<LogOut size={15} />}>办理退房</Button>
              </Link>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* main info */}
        <div className="card p-6 lg:col-span-2">
          <div className="mb-4 flex items-center gap-3">
            <h3 className="font-serif text-xl font-semibold text-ink">{rt.name}</h3>
            <RoomModeBadge mode={rt.mode} />
            <BookingStatusBadge status={booking.status} />
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <Info label="入住日期" value={formatDate(booking.checkIn)} />
            <Info label="退房日期" value={formatDate(booking.checkOut)} />
            <Info label="入住晚数" value={`${booking.nights} 晚`} />
            <Info label="入住人数" value={`${booking.guests} 人`} />
            <Info label="联系电话" value={maskPhone(booking.guestPhone)} />
            <Info label="身份证号" value={booking.idCard ? maskIdCard(booking.idCard) : "未登记"} />
          </div>
          {booking.note && (
            <div className="mt-4 rounded-lg bg-paper/60 p-3 text-sm text-muted">
              <span className="font-medium text-ink">备注：</span>{booking.note}
            </div>
          )}
          {booking.deductionNote && (
            <div className="mt-2 rounded-lg bg-clay-50 p-3 text-sm text-clay-600">
              <span className="font-medium">扣款说明：</span>{booking.deductionNote}（¥{booking.deduction}）
            </div>
          )}

          <h4 className="mt-6 mb-3 font-serif text-base font-semibold text-ink">房费明细</h4>
          <div className="overflow-hidden rounded-lg border border-ink/10">
            {nights.map((d) => (
              <div key={d} className="flex items-center justify-between border-b border-ink/5 px-3 py-2 last:border-b-0">
                <div className="flex items-center gap-2">
                  <span className="num text-sm text-ink">{d}</span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] ${TIER_COLOR[dateTier(d, holidays)]}`}>{TIER_LABEL[dateTier(d, holidays)]}</span>
                </div>
                <span className="num text-sm text-ink">{yuan(priceForDate(rt, d, holidays))}</span>
              </div>
            ))}
          </div>
          {bsvc.length > 0 && (
            <>
              <h4 className="mt-5 mb-3 font-serif text-base font-semibold text-ink">特色服务</h4>
              <div className="space-y-1.5">
                {bsvc.map((bs) => {
                  const svc = services.find((s) => s.id === bs.serviceId);
                  return (
                    <div key={bs.id} className="flex items-center justify-between rounded-lg bg-paper/50 px-3 py-2 text-sm">
                      <span className="text-ink">{svc?.icon} {svc?.name} × {bs.qty}{svc?.unit}</span>
                      <span className="num text-ink">{yuan(bs.subtotal)}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* nearby recommendations */}
          {recommendations.length > 0 && (
            <>
              <h4 className="mt-6 mb-3 flex items-center gap-1 font-serif text-base font-semibold text-ink">
                <Map size={16} className="text-forest-600" />
                周边游玩推荐
              </h4>
              <p className="mb-3 text-xs text-muted">
                基于您的入住日期和{booking.guests}人出行，为您推荐以下周边景点
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {recommendations.map((rec) => (
                  <NearbyRecommendationCard key={rec.attraction.id} recommendation={rec} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* summary */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="mb-4 font-serif text-lg font-semibold text-ink">结算</h3>
            <Row label="房费小计" value={yuan(booking.roomTotal)} />
            <Row label="特色服务费" value={yuan(booking.serviceTotal)} />
            <div className="my-3 border-t border-ink/10" />
            <Row label="订单总额" value={yuan(booking.roomTotal + booking.serviceTotal)} bold />
            <div className="my-3 border-t border-ink/10" />
            <Row label="已收押金" value={yuan(booking.deposit)} />
            <div className="mt-1"><DepositStatusBadge status={booking.depositStatus} /></div>
            {booking.refundAmount > 0 && (
              <Row label="已退款" value={yuan(booking.refundAmount)} className="text-clay-500" />
            )}
          </div>

          <div className="card p-5">
            <div className="mb-3 flex items-center gap-2">
              <ScrollText size={16} className="text-forest-600" />
              <h3 className="font-serif text-lg font-semibold text-ink">退改规则</h3>
            </div>
            {rule ? (
              <>
                <p className="text-sm text-ink">
                  距入住 <span className="num font-semibold">{daysBefore}</span> 天，适用规则：
                </p>
                <p className="mt-1 text-sm font-medium text-forest-700">「{rule.name}」</p>
                <p className="mt-1 text-xs text-muted">
                  退订退还押金的 <span className="num">{rule.refundPercent}%</span>
                  {rule.changeAllowed ? " · 允许改期" : " · 不允许改期"}
                </p>
                {isActive && (
                  <div className="mt-3 rounded-lg bg-paper/60 p-3 text-xs text-muted">
                    若现在退订，将退还 <span className="num font-semibold text-clay-500">{yuan(refundPreview)}</span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted">暂无匹配的退改规则</p>
            )}
          </div>
        </div>
      </div>

      {/* cancel modal */}
      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="确认退订"
        subtitle="系统将按退改规则计算退款并释放库存"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelOpen(false)}>再想想</Button>
            <Button variant="danger" onClick={handleCancel}>确认退订</Button>
          </>
        }
      >
        <div className="space-y-3 text-sm">
          <Row label="客人" value={booking.guestName} />
          <Row label="房型" value={rt.name} />
          <Row label="已收押金" value={yuan(booking.deposit)} />
          <Row label="适用规则" value={rule?.name ?? "—"} />
          <Row label="退款比例" value={`${rule?.refundPercent ?? 0}%`} />
          <div className="rounded-lg bg-clay-50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-clay-600">将退还押金</span>
              <span className="num text-lg font-bold text-clay-500">{yuan(refundPreview)}</span>
            </div>
            {booking.deposit - refundPreview > 0 && (
              <div className="mt-1 text-xs text-muted">押金扣留 ¥{booking.deposit - refundPreview}</div>
            )}
          </div>
        </div>
      </Modal>

      {/* change dates modal */}
      <Modal
        open={changeOpen}
        onClose={() => setChangeOpen(false)}
        title="改期"
        subtitle="校验新日期库存后迁移订单，房费将重新计算"
        footer={
          <>
            <Button variant="ghost" onClick={() => setChangeOpen(false)}>取消</Button>
            <Button icon={<CalendarClock size={15} />} onClick={handleChange}>确认改期</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="新入住日期">
            <TextInput type="date" value={newCheckIn} min={todayStr()} onChange={(e) => setNewCheckIn(e.target.value)} />
          </Field>
          <Field label="新退房日期">
            <TextInput type="date" value={newCheckOut} min={addDays(newCheckIn, 1)} onChange={(e) => setNewCheckOut(e.target.value)} />
          </Field>
        </div>
        {changeErr && <p className="mt-3 rounded-lg bg-clay-50 px-3 py-2 text-xs text-clay-600">{changeErr}</p>}
      </Modal>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-0.5 text-sm font-medium text-ink">{value}</div>
    </div>
  );
}

function Row({ label, value, bold, className }: { label: string; value: string; bold?: boolean; className?: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-muted">{label}</span>
      <span className={`num text-sm ${bold ? "text-base font-bold text-ink" : "text-ink"} ${className ?? ""}`}>{value}</span>
    </div>
  );
}
