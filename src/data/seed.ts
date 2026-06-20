import type {
  Booking,
  BookingServiceItem,
  Holiday,
  InventoryOverride,
  NearbyAttraction,
  RefundRule,
  Room,
  RoomType,
  Service,
} from "@/types";
import { addDays, eachNight, todayStr } from "@/lib/date";
import { priceForDate } from "@/services/pricing";
import { genCode, genId } from "@/lib/format";

export interface DBShape {
  roomTypes: RoomType[];
  rooms: Room[];
  inventoryOverrides: InventoryOverride[];
  bookings: Booking[];
  bookingServices: BookingServiceItem[];
  services: Service[];
  refundRules: RefundRule[];
  holidays: Holiday[];
  nearbyAttractions: NearbyAttraction[];
}

export const DEFAULT_SERVICES: Service[] = [
  { id: "svc_picking", name: "田园采摘", icon: "🌾", price: 38, unit: "人", enabled: true, description: "当季果蔬采摘，篮具免费" },
  { id: "svc_fishing", name: "湖畔垂钓", icon: "🎣", price: 50, unit: "人", enabled: true, description: "含鱼竿鱼饵，渔获可代烹" },
  { id: "svc_bbq", name: "庭院烧烤", icon: "🔥", price: 120, unit: "次", enabled: true, description: "含炉具炭火与食材套餐" },
  { id: "svc_mahjong", name: "棋牌娱乐", icon: "♟", price: 30, unit: "场", enabled: true, description: "麻将/棋牌室半日使用" },
  { id: "svc_meal", name: "农家团餐", icon: "🍲", price: 80, unit: "人", enabled: true, description: "土灶柴火饭，十人起订" },
];

export const DEFAULT_REFUND_RULES: RefundRule[] = [
  { id: "rr_7", name: "提前7天以上", daysBeforeMin: 7, daysBeforeMax: 0, refundPercent: 100, changeAllowed: true, enabled: true },
  { id: "rr_3", name: "提前3-7天", daysBeforeMin: 3, daysBeforeMax: 7, refundPercent: 50, changeAllowed: true, enabled: true },
  { id: "rr_1", name: "提前1-3天", daysBeforeMin: 1, daysBeforeMax: 3, refundPercent: 20, changeAllowed: false, enabled: true },
  { id: "rr_0", name: "入住前1天内", daysBeforeMin: 0, daysBeforeMax: 1, refundPercent: 0, changeAllowed: false, enabled: true },
];

export const DEFAULT_NEARBY_ATTRACTIONS: NearbyAttraction[] = [
  {
    id: "attr_green_valley",
    name: "翠竹谷风景区",
    type: "scenic_spot",
    description: "万亩竹海，空气清新，是徒步踏青的好去处。沿途有瀑布、溪流，适合家庭出游。",
    address: "浙江省杭州市临安区天目山镇翠竹谷",
    latitude: 30.3158,
    longitude: 119.4326,
    distance: 5.2,
    travelTime: 15,
    price: 68,
    rating: 4.7,
    season: ["春", "夏", "秋"],
    suitablePeople: ["家庭", "情侣", "朋友"],
    imageUrl: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800",
    contactPhone: "0571-88888888",
    enabled: true,
    notes: "建议穿舒适的运动鞋，带好防晒用品。",
  },
  {
    id: "attr_strawberry_farm",
    name: "甜蜜草莓采摘园",
    type: "picking",
    description: "有机草莓种植基地，全程无公害种植。采摘体验包含免费品尝，带走按斤计价。",
    address: "浙江省杭州市临安区太湖源镇草莓村",
    latitude: 30.3312,
    longitude: 119.4567,
    distance: 8.5,
    travelTime: 20,
    price: 48,
    rating: 4.8,
    season: ["冬", "春"],
    suitablePeople: ["家庭", "亲子", "情侣"],
    imageUrl: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800",
    contactPhone: "13800138001",
    enabled: true,
    notes: "采摘入园费包含1斤草莓，超出部分30元/斤。",
  },
  {
    id: "attr_grape_vineyard",
    name: "龙泉葡萄庄园",
    type: "picking",
    description: "拥有200亩葡萄园，种植10余个品种的葡萄。可参观葡萄酒酿造工艺。",
    address: "浙江省杭州市临安区於潜镇龙泉村",
    latitude: 30.2876,
    longitude: 119.3987,
    distance: 12.3,
    travelTime: 25,
    price: 58,
    rating: 4.6,
    season: ["夏", "秋"],
    suitablePeople: ["家庭", "亲子", "朋友", "团建"],
    imageUrl: "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=800",
    contactPhone: "13900139002",
    enabled: true,
    notes: "7-10月为最佳采摘期，提供免费停车。",
  },
  {
    id: "attr_white_water_rafting",
    name: "龙井峡漂流",
    type: "rafting",
    description: "全长3公里，落差120米，漂流时长约1.5小时。两岸风景秀丽，刺激与休闲并存。",
    address: "浙江省杭州市临安区龙岗镇龙井村",
    latitude: 30.2654,
    longitude: 119.3654,
    distance: 18.7,
    travelTime: 35,
    price: 168,
    rating: 4.5,
    season: ["夏"],
    suitablePeople: ["情侣", "朋友", "团建", "家庭（1.4米以上）"],
    imageUrl: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800",
    contactPhone: "0571-66666666",
    enabled: true,
    notes: "建议携带换洗衣物，漂流鞋需另行购买。身高1.4米以下儿童谢绝参与。",
  },
  {
    id: "attr_ski_resort",
    name: "大明山滑雪场",
    type: "skiing",
    description: "华东地区最大的高山滑雪场，拥有初、中、高级多条雪道，配套设施完善。",
    address: "浙江省杭州市临安区清凉峰镇大明山景区",
    latitude: 30.1234,
    longitude: 119.2876,
    distance: 35.6,
    travelTime: 55,
    price: 298,
    rating: 4.7,
    season: ["冬"],
    suitablePeople: ["家庭", "情侣", "朋友", "团建"],
    imageUrl: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800",
    contactPhone: "0571-77777777",
    enabled: true,
    notes: "滑雪票包含雪板、雪鞋、雪杖，储物柜和教练费另计。建议提前3天预订。",
  },
  {
    id: "attr_tea_garden",
    name: "云雾山茶园",
    type: "scenic_spot",
    description: "海拔800米的高山茶园，种植西湖龙井、安吉白茶等名优茶。可体验采茶、炒茶。",
    address: "浙江省杭州市临安区太湖源镇云雾村",
    latitude: 30.3456,
    longitude: 119.4789,
    distance: 10.2,
    travelTime: 22,
    price: 38,
    rating: 4.6,
    season: ["春", "夏", "秋"],
    suitablePeople: ["家庭", "情侣", "朋友", "老人"],
    imageUrl: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800",
    contactPhone: "13700137003",
    enabled: true,
    notes: "采茶体验需提前预约，春季为最佳体验期。",
  },
  {
    id: "attr_peach_orchard",
    name: "十里桃花采摘园",
    type: "picking",
    description: "千亩桃园，种植水蜜桃、黄桃、油桃等多个品种。春季可赏花，夏秋可采摘。",
    address: "浙江省杭州市临安区太阳镇十里村",
    latitude: 30.2987,
    longitude: 119.4123,
    distance: 15.4,
    travelTime: 28,
    price: 42,
    rating: 4.5,
    season: ["夏"],
    suitablePeople: ["家庭", "亲子", "情侣", "朋友"],
    imageUrl: "https://images.unsplash.com/photo-1564093497595-593b96d80180?w=800",
    contactPhone: "13600136004",
    enabled: true,
    notes: "6-8月为采摘旺季，入园可免费品尝，带走按市价称重。",
  },
  {
    id: "attr_canyon_rafting",
    name: "天目大峡谷漂流",
    type: "rafting",
    description: "穿越原始峡谷，全程绿荫遮蔽，沿途可观奇石、飞瀑。漂流河道自然形成，惊险刺激。",
    address: "浙江省杭州市临安区天目山镇大峡谷村",
    latitude: 30.3210,
    longitude: 119.3765,
    distance: 22.8,
    travelTime: 40,
    price: 188,
    rating: 4.6,
    season: ["夏"],
    suitablePeople: ["情侣", "朋友", "团建"],
    imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800",
    contactPhone: "0571-99999999",
    enabled: true,
    notes: "漂流会全身湿透，请备齐换洗衣物。老人和12岁以下儿童不建议参加。",
  },
];

export const HOTEL_LOCATION = {
  latitude: 30.3200,
  longitude: 119.4200,
  name: "山舍民宿",
};

export const DEFAULT_ROOM_TYPES: RoomType[] = [
  {
    id: "rt_mountain",
    name: "山景双人间",
    mode: "single",
    weekdayPrice: 268,
    weekendPrice: 358,
    holidayPrice: 458,
    capacity: 2,
    unitCount: 8,
    amenities: ["山景窗", "独立卫浴", "空调", "WiFi", "早餐"],
    description: "推窗见山，松涛入眠，适合情侣或好友二人同行。",
  },
  {
    id: "rt_family",
    name: "田园亲子房",
    mode: "single",
    weekdayPrice: 328,
    weekendPrice: 428,
    holidayPrice: 538,
    capacity: 4,
    unitCount: 6,
    amenities: ["亲子床", "独立卫浴", "空调", "WiFi", "早餐", "儿童拖鞋"],
    description: "一大一小床型，院落相邻，亲子家庭首选。",
  },
  {
    id: "rt_courtyard1",
    name: "听雨院落",
    mode: "courtyard",
    weekdayPrice: 1280,
    weekendPrice: 1880,
    holidayPrice: 2380,
    capacity: 8,
    unitCount: 1,
    amenities: ["独门独院", "厨房", "茶室", "烧烤台", "棋牌室", "停车位"],
    description: "整院出租，含四间客房与公共茶室，适合家庭聚会与团建。",
  },
  {
    id: "rt_courtyard2",
    name: "观星阁",
    mode: "courtyard",
    weekdayPrice: 1580,
    weekendPrice: 2280,
    holidayPrice: 2880,
    capacity: 6,
    unitCount: 1,
    amenities: ["独门独院", "天台望远镜", "厨房", "空调", "停车位"],
    description: "山顶独院，夜可观星，日可望云，整院私享。",
  },
];

function buildRooms(roomTypes: RoomType[]): Room[] {
  const rooms: Room[] = [];
  for (const rt of roomTypes) {
    if (rt.mode === "courtyard") {
      rooms.push({ id: genId("rm"), roomTypeId: rt.id, label: rt.name, status: "available" });
    } else {
      for (let i = 1; i <= rt.unitCount; i++) {
        rooms.push({
          id: `${rt.id}_r${i}`,
          roomTypeId: rt.id,
          label: `${rt.name.slice(-3)}${String(i).padStart(2, "0")}`,
          status: "available",
        });
      }
    }
  }
  return rooms;
}

export function createSeedData(): DBShape {
  const services = DEFAULT_SERVICES.map((s) => ({ ...s }));
  const refundRules = DEFAULT_REFUND_RULES.map((r) => ({ ...r }));
  const roomTypes = DEFAULT_ROOM_TYPES.map((r) => ({ ...r }));
  const rooms = buildRooms(roomTypes);
  const nearbyAttractions = DEFAULT_NEARBY_ATTRACTIONS.map((a) => ({ ...a }));

  const today = todayStr();
  const holidays: Holiday[] = [
    { id: genId("hl"), date: addDays(today, 4), name: "丰收采摘节" },
    { id: genId("hl"), date: addDays(today, 12), name: "山谷星空节" },
    { id: genId("hl"), date: addDays(today, 18), name: "乡村艺术节" },
  ];

  const bookingServices: BookingServiceItem[] = [];
  const bookings: Booking[] = [];

  function makeBooking(p: {
    guestName: string;
    guestPhone: string;
    idCard: string;
    guests: number;
    roomTypeId: string;
    roomId: string | null;
    checkIn: string;
    checkOut: string;
    status: Booking["status"];
    depositStatus: Booking["depositStatus"];
    svc: { serviceId: string; qty: number }[];
    note: string;
    createdAtOffset: number;
  }): Booking {
    const rt = roomTypes.find((r) => r.id === p.roomTypeId)!;
    const nights = eachNight(p.checkIn, p.checkOut);
    const roomTotal = nights.reduce((s, d) => s + priceForDate(rt, d, holidays), 0);
    let serviceTotal = 0;
    const bsvc: BookingServiceItem[] = [];
    for (const item of p.svc) {
      const svc = services.find((s) => s.id === item.serviceId)!;
      const subtotal = svc.price * item.qty;
      serviceTotal += subtotal;
      bsvc.push({ id: genId("bs"), bookingId: "", serviceId: item.serviceId, qty: item.qty, subtotal });
    }
    const deposit = Math.round((roomTotal + serviceTotal) * 0.3);
    const booking: Booking = {
      id: genId("bk"),
      code: genCode("SS"),
      guestName: p.guestName,
      guestPhone: p.guestPhone,
      idCard: p.idCard,
      guests: p.guests,
      roomTypeId: p.roomTypeId,
      roomId: p.roomId,
      mode: rt.mode,
      checkIn: p.checkIn,
      checkOut: p.checkOut,
      nights: nights.length,
      roomTotal,
      serviceTotal,
      deposit,
      depositStatus: p.depositStatus,
      refundAmount: 0,
      refundRuleId: p.status === "cancelled" ? "rr_3" : null,
      deduction: 0,
      deductionNote: "",
      status: p.status,
      note: p.note,
      createdAt: addDays(today, p.createdAtOffset),
    };
    bsvc.forEach((bs) => (bs.bookingId = booking.id));
    bookingServices.push(...bsvc);
    bookings.push(booking);
    return booking;
  }

  const mountainRoom = rooms.find((r) => r.roomTypeId === "rt_mountain")!;
  const familyRoom = rooms.find((r) => r.roomTypeId === "rt_family")!;
  const courtyardRoom = rooms.find((r) => r.roomTypeId === "rt_courtyard1")!;
  const starRoom = rooms.find((r) => r.roomTypeId === "rt_courtyard2")!;

  makeBooking({
    guestName: "李文静", guestPhone: "13812345678", idCard: "330106199203072345",
    guests: 2, roomTypeId: "rt_mountain", roomId: mountainRoom.id,
    checkIn: today, checkOut: addDays(today, 2), status: "pending",
    depositStatus: "paid", svc: [],
    note: "首次入住，希望安排安静的房间。", createdAtOffset: -3,
  });
  makeBooking({
    guestName: "王志强", guestPhone: "13900001111", idCard: "",
    guests: 3, roomTypeId: "rt_family", roomId: familyRoom.id,
    checkIn: addDays(today, -2), checkOut: today, status: "checked_in",
    depositStatus: "paid", svc: [{ serviceId: "svc_mahjong", qty: 1 }, { serviceId: "svc_meal", qty: 4 }],
    note: "带老人小孩，需要加床一张。", createdAtOffset: -5,
  });
  makeBooking({
    guestName: "陈晓东", guestPhone: "13722223333", idCard: "110108198801014567",
    guests: 8, roomTypeId: "rt_courtyard1", roomId: courtyardRoom.id,
    checkIn: addDays(today, -1), checkOut: addDays(today, 2), status: "checked_in",
    depositStatus: "paid", svc: [{ serviceId: "svc_bbq", qty: 1 }, { serviceId: "svc_meal", qty: 8 }, { serviceId: "svc_fishing", qty: 4 }],
    note: "公司团建，使用棋牌室与烧烤台。", createdAtOffset: -6,
  });
  makeBooking({
    guestName: "赵敏", guestPhone: "13655556666", idCard: "440305199512126789",
    guests: 6, roomTypeId: "rt_courtyard2", roomId: starRoom.id,
    checkIn: addDays(today, 3), checkOut: addDays(today, 5), status: "pending",
    depositStatus: "paid", svc: [{ serviceId: "svc_picking", qty: 6 }],
    note: "庆祝生日，需提前布置。", createdAtOffset: -1,
  });
  makeBooking({
    guestName: "孙建军", guestPhone: "13577778888", idCard: "420102197606061234",
    guests: 2, roomTypeId: "rt_mountain", roomId: null,
    checkIn: addDays(today, -6), checkOut: addDays(today, -4), status: "checked_out",
    depositStatus: "refunded", svc: [{ serviceId: "svc_fishing", qty: 2 }],
    note: "", createdAtOffset: -9,
  });
  makeBooking({
    guestName: "周婷", guestPhone: "13499990000", idCard: "",
    guests: 2, roomTypeId: "rt_family", roomId: null,
    checkIn: addDays(today, 1), checkOut: addDays(today, 3), status: "cancelled",
    depositStatus: "refunded", svc: [],
    note: "客人临时有事取消，按规则退50%。", createdAtOffset: -2,
  });

  return { roomTypes, rooms, inventoryOverrides: [], bookings, bookingServices, services, refundRules, holidays, nearbyAttractions };
}
