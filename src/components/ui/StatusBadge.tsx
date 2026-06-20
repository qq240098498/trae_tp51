import type { BookingStatus, DepositStatus, RoomMode } from "@/types";
import Badge from "@/components/ui/Badge";
import {
  BOOKING_STATUS_META,
  DEPOSIT_STATUS_META,
  ROOM_MODE_META,
} from "@/lib/statusMeta";

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const m = BOOKING_STATUS_META[status];
  return (
    <Badge tone={m.tone} dot>
      {m.label}
    </Badge>
  );
}

export function DepositStatusBadge({ status }: { status: DepositStatus }) {
  const m = DEPOSIT_STATUS_META[status];
  return <Badge tone={m.tone}>{m.label}</Badge>;
}

export function RoomModeBadge({ mode }: { mode: RoomMode }) {
  const m = ROOM_MODE_META[mode];
  return <Badge tone={m.tone}>{m.label}</Badge>;
}
