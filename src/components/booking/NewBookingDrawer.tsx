import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, AlertTriangle, Minus, Plus } from "lucide-react";
import type { DraftBooking } from "@/types";
import { useStore } from "@/store/useStore";
import { todayStr, addDays } from "@/lib/date";
import { yuan } from "@/lib/format";
import {
  calcOrderTotal,
  isAvailableForRange,
  TIER_LABEL,
  TIER_COLOR,
} from "@/services/pricing";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import { Field, TextInput, Textarea, Select } from "@/components/ui/Field";
import { RoomModeBadge } from "@/components/ui/StatusBadge";

export default function NewBookingDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { roomTypes, services, holidays, bookings, inventoryOverrides, createBooking } = useStore();

  const today = todayStr();
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(addDays(today, 1));
  const [roomTypeId, setRoomTypeId] = useState(roomTypes[0]?.id ?? "");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [idCard, setIdCard] = useState("");
  const [guests, setGuests] = useState(2);
  const [svcQty, setSvcQty] = useState<Record<string, number>>({});
  const [deposit, setDeposit] = useState(0);
  const [depositTouched, setDepositTouched] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && !roomTypeId && roomTypes[0]) setRoomTypeId(roomTypes[0].id);
  }, [open, roomTypeId, roomTypes]);

  const rt = roomTypes.find((r) => r.id === roomTypeId) ?? null;

  const draft: DraftBooking = useMemo(
    () => ({
      guestName, guestPhone, idCard, guests,
      roomTypeId, mode: rt?.mode ?? "single",
      checkIn, checkOut,
      services: Object.entries(svcQty)
        .filter(([, q]) => q > 0)
        .map(([serviceId, qty]) => ({ serviceId, qty })),
      deposit, note,
    }),
    [guestName, guestPhone, idCard, guests, roomTypeId, rt, checkIn, checkOut, svcQty, deposit, note]
  );

  const total = useMemo(
    () => (rt ? calcOrderTotal(draft, rt, holidays, services) : null),
    [rt, draft, holidays, services]
  );

  const avail = useMemo(
    () =>
      rt
        ? isAvailableForRange(rt, checkIn, checkOut, bookings, undefined, inventoryOverrides)
        : { ok: false },
    [rt, checkIn, checkOut, bookings, inventoryOverrides]
  );

  // default deposit = first night price (unless user edited)
  useEffect(() => {
    if (depositTouched || !total || total.breakdown.length === 0) return;
    setDeposit(total.breakdown[0].price);
  }, [total, depositTouched]);

  const reset = () => {
    setGuestName(""); setGuestPhone(""); setIdCard(""); setGuests(2);
    setSvcQty({}); setDeposit(0); setDepositTouched(false); setNote(""); setError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCreate = () => {
    setError("");
    if (!guestName.trim()) return setError("请填写入住人姓名");
    if (!guestPhone.trim()) return setError("请填写联系电话");
    if (!rt) return setError("请选择房型");
    if (guests < 1) return setError("入住人数至少为 1");
    const res = createBooking(draft);
    if (!res.ok) return setError(res.error ?? "创建失败");
    const id = res.bookingId;
    reset();
    onClose();
    if (id) navigate(`/bookings/${id}`);
  };

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title="新建预订"
      subtitle="选择日期与房型，系统按平/旺/节假日自动计价并校验库存"
      width="xl"
      footer={
        <div className="flex w-full items-center justify-between gap-4">
          <div className="text-sm">
            <span className="text-muted">合计 </span>
            <span className="num text-xl font-bold text-ink">{yuan(total?.total ?? 0)}</span>
            <span className="ml-3 text-muted">押金 </span>
            <span className="num font-semibold text-clay-500">{yuan(deposit)}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleClose}>取消</Button>
            <Button icon={<CheckCircle2 size={16} />} onClick={handleCreate}>确认下单并收押金</Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* dates & room type */}
        <section>
          <SectionTitle index={1} title="日期与房型" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="入住日期" required>
              <TextInput type="date" value={checkIn} min={today} onChange={(e) => { setCheckIn(e.target.value); setDepositTouched(false); }} />
            </Field>
            <Field label="退房日期" required>
              <TextInput type="date" value={checkOut} min={addDays(checkIn, 1)} onChange={(e) => { setCheckOut(e.target.value); setDepositTouched(false); }} />
            </Field>
          </div>
          <Field label="房型 / 整院" required className="mt-3">
            <Select value={roomTypeId} onChange={(e) => setRoomTypeId(e.target.value)}>
              {roomTypes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}（{r.mode === "courtyard" ? "整院" : "单间"}）
                </option>
              ))}
            </Select>
          </Field>
          {rt && (
            <div className="mt-2 flex items-center gap-2">
              <RoomModeBadge mode={rt.mode} />
              <span className="text-xs text-muted">
                平日 {yuan(rt.weekdayPrice)} · 周末 {yuan(rt.weekendPrice)} · 节假日 {yuan(rt.holidayPrice)} · 容量 {rt.capacity}人
              </span>
            </div>
          )}
          <div className="mt-3">
            {checkOut <= checkIn ? (
              <Notice tone="warn" text="退房日期需晚于入住日期" />
            ) : avail.ok ? (
              <Notice tone="ok" text={`所选日期可订，共 ${total?.nights ?? 0} 晚`} />
            ) : (
              <Notice tone="warn" text={`日期 ${avail.conflictDate} 已满房或已关闭销售，请调整日期或房型`} />
            )}
          </div>
        </section>

        {/* guest info */}
        <section>
          <SectionTitle index={2} title="入住信息" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="入住人姓名" required>
              <TextInput value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="如：李文静" />
            </Field>
            <Field label="联系电话" required>
              <TextInput value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="11位手机号" />
            </Field>
            <Field label="入住人数" required>
              <TextInput type="number" min={1} value={guests} onChange={(e) => setGuests(Number(e.target.value))} />
            </Field>
            <Field label="身份证号" hint="入住时登记亦可">
              <TextInput value={idCard} onChange={(e) => setIdCard(e.target.value)} placeholder="选填，入住时登记" />
            </Field>
          </div>
        </section>

        {/* services */}
        <section>
          <SectionTitle index={3} title="特色服务" />
          <div className="space-y-2">
            {services.filter((s) => s.enabled).map((s) => {
              const q = svcQty[s.id] ?? 0;
              return (
                <div key={s.id} className="flex items-center gap-3 rounded-lg border border-ink/10 bg-paper/40 px-3 py-2">
                  <span className="text-xl">{s.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-ink">{s.name}</div>
                    <div className="text-xs text-muted">{yuan(s.price)}/{s.unit} · {s.description}</div>
                  </div>
                  <Stepper
                    value={q}
                    onChange={(v) => setSvcQty((p) => ({ ...p, [s.id]: Math.max(0, v) }))}
                  />
                  <span className="num w-16 text-right text-sm font-medium text-ink">{yuan(s.price * q)}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* price breakdown */}
        {total && total.breakdown.length > 0 && (
          <section>
            <SectionTitle index={4} title="费用明细" />
            <div className="overflow-hidden rounded-lg border border-ink/10">
              {total.breakdown.map((n) => (
                <div key={n.date} className="flex items-center justify-between border-b border-ink/5 px-3 py-2 last:border-b-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-ink">{n.date}</span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] ${TIER_COLOR[n.tier]}`}>{TIER_LABEL[n.tier]}</span>
                  </div>
                  <span className="num text-sm text-ink">{yuan(n.price)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between bg-paper/60 px-3 py-2">
                <span className="text-xs text-muted">房费小计</span>
                <span className="num text-sm font-semibold text-ink">{yuan(total.roomTotal)}</span>
              </div>
              {total.serviceTotal > 0 && (
                <div className="flex items-center justify-between bg-paper/60 px-3 py-2 border-t border-ink/5">
                  <span className="text-xs text-muted">特色服务费</span>
                  <span className="num text-sm font-semibold text-ink">{yuan(total.serviceTotal)}</span>
                </div>
              )}
            </div>

            <Field label="收取押金（元）" className="mt-3" hint="默认收取首晚房费，可调整">
              <div className="flex gap-2">
                <TextInput
                  type="number"
                  min={0}
                  value={deposit}
                  onChange={(e) => { setDeposit(Number(e.target.value)); setDepositTouched(true); }}
                />
                <Button variant="subtle" size="sm" onClick={() => { setDeposit(total.breakdown[0].price); setDepositTouched(true); }}>
                  首晚
                </Button>
                <Button variant="subtle" size="sm" onClick={() => { setDeposit(Math.round(total.total * 0.3)); setDepositTouched(true); }}>
                  30%
                </Button>
              </div>
            </Field>
          </section>
        )}

        <Field label="备注">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="特殊需求，如加床、靠山景等" />
        </Field>

        {error && <Notice tone="warn" text={error} />}
      </div>
    </Drawer>
  );
}

function SectionTitle({ index, title }: { index: number; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-forest-500 text-[11px] font-bold text-paper">{index}</span>
      <h4 className="font-serif text-base font-semibold text-ink">{title}</h4>
    </div>
  );
}

function Stepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onChange(value - 1)} className="h-7 w-7 rounded border border-ink/15 text-ink hover:bg-ink/5">
        <Minus size={13} className="mx-auto" />
      </button>
      <span className="num w-6 text-center text-sm font-medium text-ink">{value}</span>
      <button onClick={() => onChange(value + 1)} className="h-7 w-7 rounded border border-ink/15 text-ink hover:bg-ink/5">
        <Plus size={13} className="mx-auto" />
      </button>
    </div>
  );
}

function Notice({ tone, text }: { tone: "ok" | "warn"; text: string }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
        tone === "ok" ? "bg-forest-50 text-forest-700" : "bg-clay-50 text-clay-600"
      }`}
    >
      {tone === "ok" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
      {text}
    </div>
  );
}
