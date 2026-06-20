import { useState } from "react";
import { LogOut, Receipt } from "lucide-react";
import type { Booking } from "@/types";
import { useStore } from "@/store/useStore";
import { formatDate } from "@/lib/date";
import { yuan } from "@/lib/format";
import Button from "@/components/ui/Button";
import { Field, TextInput, Textarea } from "@/components/ui/Field";

export default function CheckOutPanel({
  booking,
  onDone,
}: {
  booking: Booking;
  onDone: () => void;
}) {
  const { roomTypes, bookingServices, services, checkOutBooking } = useStore();
  const rt = roomTypes.find((r) => r.id === booking.roomTypeId)!;
  const bsvc = bookingServices.filter((bs) => bs.bookingId === booking.id);

  const [deduction, setDeduction] = useState(0);
  const [deductionNote, setDeductionNote] = useState("");

  const refund = Math.max(0, booking.deposit - deduction);

  const handleCheckOut = () => {
    checkOutBooking(booking.id, { deduction, deductionNote });
    onDone();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-clay-400 text-paper">
          <LogOut size={16} />
        </span>
        <div>
          <h3 className="font-serif text-lg font-semibold text-ink">办理退房</h3>
          <p className="text-xs text-muted">核对消费明细，结算并退还押金</p>
        </div>
      </div>

      <div className="rounded-lg border border-ink/10 bg-paper/40 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-ink">{booking.guestName}</div>
            <div className="mt-0.5 text-xs text-muted">
              {rt.name} · {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}
            </div>
          </div>
          <div className="text-right text-xs text-muted">
            入住人 <span className="num text-ink">{booking.guests}</span> 人
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-ink/10">
        <div className="flex items-center gap-2 border-b border-ink/10 bg-paper/50 px-3 py-2">
          <Receipt size={14} className="text-muted" />
          <span className="text-xs font-medium text-muted">消费明细</span>
        </div>
        <Row label={`房费 ${booking.nights} 晚`} value={yuan(booking.roomTotal)} />
        {bsvc.map((bs) => {
          const svc = services.find((s) => s.id === bs.serviceId);
          return (
            <Row
              key={bs.id}
              label={`${svc?.icon ?? ""} ${svc?.name ?? ""} × ${bs.qty}`}
              value={yuan(bs.subtotal)}
            />
          );
        })}
        <div className="flex items-center justify-between border-t border-ink/10 bg-paper/50 px-3 py-2">
          <span className="text-sm font-medium text-ink">消费合计</span>
          <span className="num text-sm font-bold text-ink">{yuan(booking.roomTotal + booking.serviceTotal)}</span>
        </div>
      </div>

      <div className="rounded-lg bg-paper/60 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">已收押金</span>
          <span className="num text-ink">{yuan(booking.deposit)}</span>
        </div>
        <Field label="扣除金额（损坏/超时等，可填 0）" className="mt-3">
          <TextInput type="number" min={0} max={booking.deposit} value={deduction} onChange={(e) => setDeduction(Math.max(0, Number(e.target.value)))} />
        </Field>
        <Field label="扣款说明" className="mt-3">
          <Textarea value={deductionNote} onChange={(e) => setDeductionNote(e.target.value)} placeholder="如：地毯污渍清理费" />
        </Field>
        <div className="mt-3 flex items-center justify-between rounded-lg bg-forest-50 px-3 py-2.5">
          <span className="text-sm font-medium text-forest-700">应退还押金</span>
          <span className="num text-xl font-bold text-forest-700">{yuan(refund)}</span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-ink/10 pt-4">
        <Button variant="ghost" onClick={onDone}>取消</Button>
        <Button variant="danger" icon={<LogOut size={16} />} onClick={handleCheckOut}>确认退房并退押金</Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 text-sm">
      <span className="text-muted">{label}</span>
      <span className="num text-ink">{value}</span>
    </div>
  );
}
