import type {
  Booking,
  DateTier,
  DraftBooking,
  Holiday,
  InventoryOverride,
  NightBreakdown,
  OrderTotal,
  RefundRule,
  RoomType,
  Service,
} from "@/types";
import { eachNight, daysBetween, isWeekend, todayStr } from "@/lib/date";

export function dateTier(date: string, holidays: Holiday[]): DateTier {
  if (holidays.some((h) => h.date === date)) return "holiday";
  return isWeekend(date) ? "weekend" : "weekday";
}

export function priceForDate(
  roomType: RoomType,
  date: string,
  holidays: Holiday[]
): number {
  const tier = dateTier(date, holidays);
  if (tier === "holiday") return roomType.holidayPrice;
  if (tier === "weekend") return roomType.weekendPrice;
  return roomType.weekdayPrice;
}

export function tierPrice(roomType: RoomType, tier: DateTier): number {
  if (tier === "holiday") return roomType.holidayPrice;
  if (tier === "weekend") return roomType.weekendPrice;
  return roomType.weekdayPrice;
}

const ACTIVE_STATUSES: Booking["status"][] = ["pending", "checked_in"];

function bookingOccupies(booking: Booking, date: string): boolean {
  if (!ACTIVE_STATUSES.includes(booking.status)) return false;
  return date >= booking.checkIn && date < booking.checkOut;
}

export function availabilityForDate(
  roomType: RoomType,
  date: string,
  bookings: Booking[],
  excludeBookingId?: string
): number {
  let occupied = 0;
  for (const b of bookings) {
    if (excludeBookingId && b.id === excludeBookingId) continue;
    if (b.roomTypeId === roomType.id && bookingOccupies(b, date)) occupied++;
  }
  return Math.max(0, roomType.unitCount - occupied);
}

export function effectiveOverride(
  roomTypeId: string,
  date: string,
  overrides: InventoryOverride[]
): InventoryOverride | undefined {
  return overrides.find((o) => o.roomTypeId === roomTypeId && o.date === date);
}

export function effectiveAvailabilityForDate(
  roomType: RoomType,
  date: string,
  bookings: Booking[],
  overrides: InventoryOverride[] = [],
  excludeBookingId?: string
): number {
  const ov = effectiveOverride(roomType.id, date, overrides);
  if (ov?.closed) return 0;
  const cap = Math.max(0, roomType.unitCount + (ov?.delta ?? 0));
  let occupied = 0;
  for (const b of bookings) {
    if (excludeBookingId && b.id === excludeBookingId) continue;
    if (b.roomTypeId === roomType.id && bookingOccupies(b, date)) occupied++;
  }
  return Math.max(0, cap - occupied);
}

export function isAvailableForRange(
  roomType: RoomType,
  checkIn: string,
  checkOut: string,
  bookings: Booking[],
  excludeBookingId?: string,
  overrides: InventoryOverride[] = []
): { ok: boolean; conflictDate?: string } {
  const nights = eachNight(checkIn, checkOut);
  for (const date of nights) {
    if (effectiveAvailabilityForDate(roomType, date, bookings, overrides, excludeBookingId) <= 0) {
      return { ok: false, conflictDate: date };
    }
  }
  return { ok: true };
}

export function calcOrderTotal(
  draft: DraftBooking,
  roomType: RoomType,
  holidays: Holiday[],
  services: Service[]
): OrderTotal {
  const nights = eachNight(draft.checkIn, draft.checkOut);
  const breakdown: NightBreakdown[] = nights.map((date) => ({
    date,
    tier: dateTier(date, holidays),
    price: priceForDate(roomType, date, holidays),
  }));
  const roomTotal = breakdown.reduce((s, n) => s + n.price, 0);
  let serviceTotal = 0;
  for (const item of draft.services) {
    const svc = services.find((s) => s.id === item.serviceId);
    if (svc) serviceTotal += svc.price * item.qty;
  }
  return { roomTotal, serviceTotal, total: roomTotal + serviceTotal, nights: nights.length, breakdown };
}

export function matchRefundRule(
  checkIn: string,
  rules: RefundRule[]
): RefundRule | null {
  const today = todayStr();
  const daysBefore = daysBetween(today, checkIn);
  if (daysBefore < 0) {
    return rules.find((r) => r.enabled && r.daysBeforeMin === 0) ?? null;
  }
  const enabled = rules.filter((r) => r.enabled).sort((a, b) => a.daysBeforeMin - b.daysBeforeMin);
  for (const rule of enabled) {
    const max = rule.daysBeforeMax;
    if (daysBefore >= rule.daysBeforeMin && (max === 0 || daysBefore < max)) {
      return rule;
    }
  }
  return enabled[enabled.length - 1] ?? null;
}

export function calcRefund(deposit: number, rule: RefundRule | null): number {
  if (!rule) return 0;
  return Math.round((deposit * rule.refundPercent) / 100);
}

export const TIER_LABEL: Record<DateTier, string> = {
  weekday: "平日",
  weekend: "周末",
  holiday: "节假日",
};

export const TIER_COLOR: Record<DateTier, string> = {
  weekday: "bg-forest-50 text-forest-700",
  weekend: "bg-wheat-50 text-wheat-700",
  holiday: "bg-clay-50 text-clay-600",
};
