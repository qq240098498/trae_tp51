import type { BookingStatus, DepositStatus, RoomMode } from "@/types";
import type { Tone } from "@/components/ui/Badge";

export const BOOKING_STATUS_META: Record<
  BookingStatus,
  { label: string; tone: Tone }
> = {
  pending: { label: "待入住", tone: "wheat" },
  checked_in: { label: "在住", tone: "forest" },
  checked_out: { label: "已离店", tone: "muted" },
  cancelled: { label: "已取消", tone: "clay" },
  no_show: { label: "未到店", tone: "clay" },
};

export const DEPOSIT_STATUS_META: Record<
  DepositStatus,
  { label: string; tone: Tone }
> = {
  unpaid: { label: "未收押金", tone: "clay" },
  paid: { label: "押金已收", tone: "forest" },
  refunded: { label: "押金已退", tone: "muted" },
};

export const ROOM_MODE_META: Record<RoomMode, { label: string; tone: Tone }> = {
  single: { label: "单间", tone: "forest" },
  courtyard: { label: "整院", tone: "clay" },
};
