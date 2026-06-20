import { useMemo, useState } from "react";
import { KeyRound, UserCheck } from "lucide-react";
import type { Booking } from "@/types";
import { useStore } from "@/store/useStore";
import { formatDate } from "@/lib/date";
import { yuan } from "@/lib/format";
import Button from "@/components/ui/Button";
import { Field, TextInput, Select } from "@/components/ui/Field";
import { RoomModeBadge, DepositStatusBadge } from "@/components/ui/StatusBadge";

export default function CheckInPanel({
  booking,
  onDone,
}: {
  booking: Booking;
  onDone: () => void;
}) {
  const { rooms, roomTypes, collectDeposit, checkInBooking } = useStore();
  const rt = roomTypes.find((r) => r.id === booking.roomTypeId)!;

  const availableRooms = useMemo(
    () => rooms.filter((r) => r.roomTypeId === booking.roomTypeId && r.status === "available"),
    [rooms, booking.roomTypeId]
  );

  const [idCard, setIdCard] = useState(booking.idCard);
  const [guests, setGuests] = useState(booking.guests);
  const [roomId, setRoomId] = useState(availableRooms[0]?.id ?? "");
  const [error, setError] = useState("");

  const handleCheckIn = () => {
    setError("");
    if (!idCard.trim()) return setError("请登记身份证号");
    if (idCard.trim().length < 15) return setError("身份证号格式有误");
    if (!roomId && rt.mode === "single") return setError("请分配房号");
    checkInBooking(booking.id, { idCard: idCard.trim(), guests, roomId: roomId || availableRooms[0]?.id || "" });
    onDone();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest-500 text-paper">
          <KeyRound size={16} />
        </span>
        <div>
          <h3 className="font-serif text-lg font-semibold text-ink">办理入住</h3>
          <p className="text-xs text-muted">登记身份证、分配房号并确认押金</p>
        </div>
      </div>

      <div className="rounded-lg border border-ink/10 bg-paper/40 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-ink">{booking.guestName}</span>
              <RoomModeBadge mode={booking.mode} />
            </div>
            <div className="mt-0.5 text-xs text-muted">
              {rt.name} · {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)} · {booking.nights}晚
            </div>
          </div>
          <DepositStatusBadge status={booking.depositStatus} />
        </div>
        {booking.depositStatus === "unpaid" && (
          <div className="mt-3 flex items-center justify-between rounded-lg bg-clay-50 px-3 py-2">
            <span className="text-xs text-clay-600">押金未收，建议收取 {yuan(Math.round((booking.roomTotal + booking.serviceTotal) * 0.3))}</span>
            <Button size="sm" variant="secondary" onClick={() => collectDeposit(booking.id, Math.round((booking.roomTotal + booking.serviceTotal) * 0.3))}>
              收取押金
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="入住人姓名">
          <TextInput value={booking.guestName} disabled />
        </Field>
        <Field label="联系电话">
          <TextInput value={booking.guestPhone} disabled />
        </Field>
        <Field label="身份证号" required>
          <TextInput value={idCard} onChange={(e) => setIdCard(e.target.value)} placeholder="18位身份证号" />
        </Field>
        <Field label="实住人数">
          <TextInput type="number" min={1} value={guests} onChange={(e) => setGuests(Number(e.target.value))} />
        </Field>
        {rt.mode === "single" ? (
          <Field label="分配房号" required className="col-span-2">
            <Select value={roomId} onChange={(e) => setRoomId(e.target.value)}>
              {availableRooms.length === 0 && <option value="">无可用房号</option>}
              {availableRooms.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </Select>
          </Field>
        ) : (
          <Field label="院落单元" className="col-span-2">
            <TextInput value={availableRooms[0]?.label ?? rt.name} disabled />
          </Field>
        )}
      </div>

      {error && <p className="rounded-lg bg-clay-50 px-3 py-2 text-xs text-clay-600">{error}</p>}

      <div className="flex items-center justify-between border-t border-ink/10 pt-4">
        <div className="text-sm">
          <span className="text-muted">应收押金 </span>
          <span className="num font-semibold text-clay-500">{yuan(booking.deposit)}</span>
        </div>
        <Button icon={<UserCheck size={16} />} onClick={handleCheckIn}>确认入住</Button>
      </div>
    </div>
  );
}
