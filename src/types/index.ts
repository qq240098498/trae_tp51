export type RoomMode = "single" | "courtyard";

export type DateTier = "weekday" | "weekend" | "holiday";

export interface RoomType {
  id: string;
  name: string;
  mode: RoomMode;
  weekdayPrice: number;
  weekendPrice: number;
  holidayPrice: number;
  capacity: number;
  unitCount: number;
  amenities: string[];
  description: string;
}

export interface Room {
  id: string;
  roomTypeId: string;
  label: string;
  status: "available" | "occupied" | "maintenance";
}

export interface InventoryOverride {
  id: string;
  roomTypeId: string;
  date: string;
  delta: number;
  closed: boolean;
}

export type BookingStatus =
  | "pending"
  | "checked_in"
  | "checked_out"
  | "cancelled"
  | "no_show";

export type DepositStatus = "unpaid" | "paid" | "refunded";

export interface BookingServiceItem {
  id: string;
  bookingId: string;
  serviceId: string;
  qty: number;
  subtotal: number;
}

export interface Booking {
  id: string;
  code: string;
  guestName: string;
  guestPhone: string;
  idCard: string;
  guests: number;
  roomTypeId: string;
  roomId: string | null;
  mode: RoomMode;
  checkIn: string;
  checkOut: string;
  nights: number;
  roomTotal: number;
  serviceTotal: number;
  deposit: number;
  depositStatus: DepositStatus;
  refundAmount: number;
  refundRuleId: string | null;
  deduction: number;
  deductionNote: string;
  status: BookingStatus;
  note: string;
  createdAt: string;
}

export interface Service {
  id: string;
  name: string;
  icon: string;
  price: number;
  unit: string;
  enabled: boolean;
  description: string;
}

export interface RefundRule {
  id: string;
  name: string;
  daysBeforeMin: number;
  daysBeforeMax: number;
  refundPercent: number;
  changeAllowed: boolean;
  enabled: boolean;
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
}

export interface DraftServiceItem {
  serviceId: string;
  qty: number;
}

export interface DraftBooking {
  guestName: string;
  guestPhone: string;
  idCard: string;
  guests: number;
  roomTypeId: string;
  mode: RoomMode;
  checkIn: string;
  checkOut: string;
  services: DraftServiceItem[];
  deposit: number;
  note: string;
}

export interface NightBreakdown {
  date: string;
  tier: DateTier;
  price: number;
}

export interface OrderTotal {
  roomTotal: number;
  serviceTotal: number;
  total: number;
  nights: number;
  breakdown: NightBreakdown[];
}

export type DishCategory = "cold" | "hot" | "soup" | "staple";

export type DietaryRestriction =
  | "vegetarian"
  | "vegan"
  | "no_spicy"
  | "no_seafood"
  | "no_pork"
  | "no_beef"
  | "low_salt"
  | "gluten_free";

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export interface Dish {
  id: string;
  name: string;
  category: DishCategory;
  price: number;
  description: string;
  ingredients: Ingredient[];
  tags: string[];
  restrictions: DietaryRestriction[];
  spicyLevel?: 0 | 1 | 2 | 3;
  servingSize: number;
}

export interface GroupMealPlan {
  id: string;
  name: string;
  peopleCount: number;
  budget: number;
  adjustedBudget?: number;
  totalPrice: number;
  restrictions: DietaryRestriction[];
  coldDishes: Dish[];
  hotDishes: Dish[];
  soupDishes: Dish[];
  stapleDishes: Dish[];
  shoppingList: ShoppingItem[];
}

export interface ShoppingItem {
  name: string;
  totalAmount: number;
  unit: string;
  category: string;
  notes?: string;
}

export interface GroupMealConfig {
  peopleCount: number;
  budget: number;
  restrictions: DietaryRestriction[];
  coldDishCount?: number;
  hotDishCount?: number;
  soupCount?: number;
  stapleCount?: number;
}

export type NearbyAttractionType = "scenic_spot" | "picking" | "rafting" | "skiing";

export interface NearbyAttraction {
  id: string;
  name: string;
  type: NearbyAttractionType;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  distance: number;
  travelTime: number;
  price: number;
  rating: number;
  season: string[];
  suitablePeople: string[];
  imageUrl: string;
  contactPhone: string;
  enabled: boolean;
  notes: string;
}

export interface NearbyRecommendation {
  attraction: NearbyAttraction;
  distance: number;
  travelTime: number;
  matchScore: number;
  reasons: string[];
}
