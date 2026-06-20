import type { Booking, Holiday, InventoryOverride, RoomType } from "@/types";
import { addDays, eachNight, todayStr } from "@/lib/date";
import { effectiveAvailabilityForDate, dateTier } from "@/services/pricing";

export function arrivalsToday(bookings: Booking[]): Booking[] {
  const today = todayStr();
  return bookings.filter(
    (b) =>
      b.checkIn === today &&
      (b.status === "pending" || b.status === "checked_in")
  );
}

export function pendingArrivalsToday(bookings: Booking[]): Booking[] {
  const today = todayStr();
  return bookings.filter((b) => b.checkIn === today && b.status === "pending");
}

export function departuresToday(bookings: Booking[]): Booking[] {
  const today = todayStr();
  return bookings.filter((b) => b.checkOut === today && b.status === "checked_in");
}

export function inStay(bookings: Booking[]): Booking[] {
  return bookings.filter((b) => b.status === "checked_in");
}

export function depositHeld(bookings: Booking[]): number {
  return bookings
    .filter((b) => b.depositStatus === "paid" && (b.status === "pending" || b.status === "checked_in"))
    .reduce((s, b) => s + b.deposit, 0);
}

export function revenueToday(bookings: Booking[]): number {
  const today = todayStr();
  return bookings
    .filter((b) => b.checkIn === today && b.status !== "cancelled" && b.status !== "no_show")
    .reduce((s, b) => s + b.roomTotal + b.serviceTotal, 0);
}

export function availabilityTotal(
  roomTypes: RoomType[],
  bookings: Booking[],
  date: string,
  overrides: InventoryOverride[] = []
): { available: number; total: number } {
  let total = 0;
  let available = 0;
  for (const rt of roomTypes) {
    total += rt.unitCount;
    available += effectiveAvailabilityForDate(rt, date, bookings, overrides);
  }
  return { available, total };
}

export function next7Days(
  roomTypes: RoomType[],
  bookings: Booking[],
  holidays: Holiday[],
  overrides: InventoryOverride[] = []
): { date: string; available: number; total: number; tier: string }[] {
  const today = todayStr();
  const days: { date: string; available: number; total: number; tier: string }[] = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(today, i);
    const { available, total } = availabilityTotal(roomTypes, bookings, date, overrides);
    days.push({ date, available, total, tier: dateTier(date, holidays) });
  }
  return days;
}

export function occupancyForRange(
  roomTypes: RoomType[],
  bookings: Booking[],
  checkIn: string,
  checkOut: string
): number {
  const nights = eachNight(checkIn, checkOut);
  let minAvail = Infinity;
  for (const rt of roomTypes) {
    for (const date of nights) {
      minAvail = Math.min(minAvail, effectiveAvailabilityForDate(rt, date, bookings));
    }
  }
  return minAvail === Infinity ? 0 : minAvail;
}
