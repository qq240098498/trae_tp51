import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Booking,
  BookingServiceItem,
  DepositStatus,
  DraftBooking,
  RefundRule,
  Room,
  RoomType,
  Service,
} from "@/types";
import { createSeedData, type DBShape } from "@/data/seed";
import { eachNight } from "@/lib/date";
import { genCode, genId } from "@/lib/format";
import {
  calcOrderTotal,
  calcRefund,
  isAvailableForRange,
  matchRefundRule,
  priceForDate,
} from "@/services/pricing";

type CreateResult = { ok: boolean; bookingId?: string; error?: string };
type CancelResult = { refundAmount: number; rule: RefundRule | null } | null;

interface StoreState extends DBShape {
  addRoomType: (rt: Omit<RoomType, "id">) => void;
  updateRoomType: (id: string, patch: Partial<RoomType>) => void;
  deleteRoomType: (id: string) => void;
  addRoom: (roomTypeId: string, label: string) => void;
  updateRoom: (id: string, patch: Partial<Room>) => void;
  deleteRoom: (id: string) => void;
  setHoliday: (date: string, name: string) => void;
  removeHoliday: (date: string) => void;
  setInventoryOverride: (roomTypeId: string, date: string, delta: number, closed: boolean) => void;
  removeInventoryOverride: (id: string) => void;
  createBooking: (draft: DraftBooking) => CreateResult;
  collectDeposit: (id: string, amount: number) => void;
  cancelBooking: (id: string) => CancelResult;
  changeBookingDates: (id: string, checkIn: string, checkOut: string) => CreateResult;
  checkInBooking: (id: string, info: { idCard: string; guests: number; roomId: string }) => void;
  checkOutBooking: (id: string, info: { deduction: number; deductionNote: string }) => void;
  markNoShow: (id: string) => void;
  addRefundRule: (rule: Omit<RefundRule, "id">) => void;
  updateRefundRule: (id: string, patch: Partial<RefundRule>) => void;
  deleteRefundRule: (id: string) => void;
  addService: (svc: Omit<Service, "id">) => void;
  updateService: (id: string, patch: Partial<Service>) => void;
  deleteService: (id: string) => void;
  resetData: () => void;
}

const seed = createSeedData();

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...seed,

      addRoomType: (rt) =>
        set((s) => ({
          roomTypes: [...s.roomTypes, { ...rt, id: genId("rt") }],
        })),
      updateRoomType: (id, patch) =>
        set((s) => ({
          roomTypes: s.roomTypes.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),
      deleteRoomType: (id) =>
        set((s) => ({
          roomTypes: s.roomTypes.filter((r) => r.id !== id),
          rooms: s.rooms.filter((r) => r.roomTypeId !== id),
        })),

      addRoom: (roomTypeId, label) =>
        set((s) => ({
          rooms: [...s.rooms, { id: genId("rm"), roomTypeId, label, status: "available" }],
        })),
      updateRoom: (id, patch) =>
        set((s) => ({ rooms: s.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
      deleteRoom: (id) => set((s) => ({ rooms: s.rooms.filter((r) => r.id !== id) })),

      setHoliday: (date, name) =>
        set((s) => {
          const exists = s.holidays.find((h) => h.date === date);
          if (exists) {
            return { holidays: s.holidays.map((h) => (h.date === date ? { ...h, name } : h)) };
          }
          return { holidays: [...s.holidays, { id: genId("hl"), date, name }] };
        }),
      removeHoliday: (date) =>
        set((s) => ({ holidays: s.holidays.filter((h) => h.date !== date) })),

      setInventoryOverride: (roomTypeId, date, delta, closed) =>
        set((s) => {
          const existing = s.inventoryOverrides.find(
            (o) => o.roomTypeId === roomTypeId && o.date === date
          );
          if (existing) {
            return {
              inventoryOverrides: s.inventoryOverrides.map((o) =>
                o.id === existing.id ? { ...o, delta, closed } : o
              ),
            };
          }
          return {
            inventoryOverrides: [
              ...s.inventoryOverrides,
              { id: genId("ov"), roomTypeId, date, delta, closed },
            ],
          };
        }),
      removeInventoryOverride: (id) =>
        set((s) => ({ inventoryOverrides: s.inventoryOverrides.filter((o) => o.id !== id) })),

      createBooking: (draft) => {
        const { roomTypes, holidays, services, bookings, inventoryOverrides } = get();
        const rt = roomTypes.find((r) => r.id === draft.roomTypeId);
        if (!rt) return { ok: false, error: "房型不存在" };
        if (draft.checkOut <= draft.checkIn) return { ok: false, error: "退房日期需晚于入住日期" };
        const avail = isAvailableForRange(rt, draft.checkIn, draft.checkOut, bookings, undefined, inventoryOverrides);
        if (!avail.ok) return { ok: false, error: `所选日期 ${avail.conflictDate} 已满房或已关闭销售` };

        const total = calcOrderTotal(draft, rt, holidays, services);
        const rule = matchRefundRule(draft.checkIn, get().refundRules);
        const id = genId("bk");
        const depositStatus: DepositStatus = draft.deposit > 0 ? "paid" : "unpaid";
        const booking: Booking = {
          id,
          code: genCode("SS"),
          guestName: draft.guestName,
          guestPhone: draft.guestPhone,
          idCard: draft.idCard,
          guests: draft.guests,
          roomTypeId: draft.roomTypeId,
          roomId: null,
          mode: draft.mode,
          checkIn: draft.checkIn,
          checkOut: draft.checkOut,
          nights: total.nights,
          roomTotal: total.roomTotal,
          serviceTotal: total.serviceTotal,
          deposit: draft.deposit,
          depositStatus,
          refundAmount: 0,
          refundRuleId: rule?.id ?? null,
          deduction: 0,
          deductionNote: "",
          status: "pending",
          note: draft.note,
          createdAt: new Date().toISOString().slice(0, 10),
        };
        const bsvc: BookingServiceItem[] = draft.services
          .filter((x) => x.qty > 0)
          .map((x) => {
            const svc = services.find((s) => s.id === x.serviceId)!;
            return {
              id: genId("bs"),
              bookingId: id,
              serviceId: x.serviceId,
              qty: x.qty,
              subtotal: svc.price * x.qty,
            };
          });
        set((s) => ({
          bookings: [...s.bookings, booking],
          bookingServices: [...s.bookingServices, ...bsvc],
        }));
        return { ok: true, bookingId: id };
      },

      collectDeposit: (id, amount) =>
        set((s) => ({
          bookings: s.bookings.map((b) =>
            b.id === id
              ? { ...b, deposit: amount, depositStatus: amount > 0 ? "paid" : "unpaid" }
              : b
          ),
        })),

      cancelBooking: (id) => {
        const b = get().bookings.find((x) => x.id === id);
        if (!b) return null;
        const rule = matchRefundRule(b.checkIn, get().refundRules);
        const refund = b.depositStatus === "paid" ? calcRefund(b.deposit, rule) : 0;
        set((s) => ({
          bookings: s.bookings.map((x) =>
            x.id === id
              ? {
                  ...x,
                  status: "cancelled",
                  refundRuleId: rule?.id ?? null,
                  refundAmount: refund,
                  depositStatus: refund > 0 ? "refunded" : x.depositStatus,
                }
              : x
          ),
          rooms: releaseRoom(s.rooms, b.roomId),
        }));
        return { refundAmount: refund, rule };
      },

      changeBookingDates: (id, checkIn, checkOut) => {
        const { bookings, roomTypes, holidays, services, inventoryOverrides } = get();
        const b = bookings.find((x) => x.id === id);
        if (!b) return { ok: false, error: "订单不存在" };
        if (b.status !== "pending") return { ok: false, error: "仅待入住订单可改期" };
        const rt = roomTypes.find((r) => r.id === b.roomTypeId)!;
        if (checkOut <= checkIn) return { ok: false, error: "退房日期需晚于入住日期" };
        const avail = isAvailableForRange(rt, checkIn, checkOut, bookings, id, inventoryOverrides);
        if (!avail.ok) return { ok: false, error: `所选日期 ${avail.conflictDate} 已满房或已关闭销售` };
        const nights = eachNight(checkIn, checkOut);
        const roomTotal = nights.reduce((sum, d) => sum + priceForDate(rt, d, holidays), 0);
        const rule = matchRefundRule(checkIn, get().refundRules);
        set((s) => ({
          bookings: s.bookings.map((x) =>
            x.id === id
              ? { ...x, checkIn, checkOut, nights: nights.length, roomTotal, refundRuleId: rule?.id ?? null }
              : x
          ),
        }));
        void services;
        return { ok: true, bookingId: id };
      },

      checkInBooking: (id, info) =>
        set((s) => ({
          bookings: s.bookings.map((b) =>
            b.id === id
              ? {
                  ...b,
                  idCard: info.idCard,
                  guests: info.guests,
                  roomId: info.roomId,
                  status: "checked_in",
                  depositStatus: b.deposit > 0 ? "paid" : b.depositStatus,
                }
              : b
          ),
          rooms: s.rooms.map((r) =>
            r.id === info.roomId ? { ...r, status: "occupied" } : r
          ),
        })),

      checkOutBooking: (id, info) =>
        set((s) => {
          const b = s.bookings.find((x) => x.id === id);
          const refund = b ? Math.max(0, b.deposit - info.deduction) : 0;
          return {
            bookings: s.bookings.map((x) =>
              x.id === id
                ? {
                    ...x,
                    status: "checked_out",
                    deduction: info.deduction,
                    deductionNote: info.deductionNote,
                    refundAmount: refund,
                    depositStatus: "refunded",
                  }
                : x
            ),
            rooms: releaseRoom(s.rooms, b?.roomId ?? null),
          };
        }),

      markNoShow: (id) =>
        set((s) => ({
          bookings: s.bookings.map((b) =>
            b.id === id ? { ...b, status: "no_show", refundAmount: 0, depositStatus: "refunded" } : b
          ),
        })),

      addRefundRule: (rule) =>
        set((s) => ({ refundRules: [...s.refundRules, { ...rule, id: genId("rr") }] })),
      updateRefundRule: (id, patch) =>
        set((s) => ({
          refundRules: s.refundRules.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),
      deleteRefundRule: (id) =>
        set((s) => ({ refundRules: s.refundRules.filter((r) => r.id !== id) })),

      addService: (svc) =>
        set((s) => ({ services: [...s.services, { ...svc, id: genId("svc") }] })),
      updateService: (id, patch) =>
        set((s) => ({ services: s.services.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
      deleteService: (id) =>
        set((s) => ({ services: s.services.filter((r) => r.id !== id) })),

      resetData: () => {
        const fresh = createSeedData();
        set({ ...fresh });
      },
    }),
    {
      name: "shanshe_db_v1",
      version: 1,
      partialize: (s) => ({
        roomTypes: s.roomTypes,
        rooms: s.rooms,
        inventoryOverrides: s.inventoryOverrides,
        bookings: s.bookings,
        bookingServices: s.bookingServices,
        services: s.services,
        refundRules: s.refundRules,
        holidays: s.holidays,
      }),
    }
  )
);

function releaseRoom(rooms: Room[], roomId: string | null): Room[] {
  if (!roomId) return rooms;
  return rooms.map((r) => (r.id === roomId ? { ...r, status: "available" } : r));
}
