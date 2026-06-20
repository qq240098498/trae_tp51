import type { DraftBooking, NearbyAttraction, NearbyRecommendation } from "@/types";
import { HOTEL_LOCATION } from "@/data/seed";

export const ATTRACTION_TYPE_LABEL: Record<NearbyAttraction["type"], string> = {
  scenic_spot: "风景区",
  picking: "采摘园",
  rafting: "漂流",
  skiing: "滑雪场",
};

export const ATTRACTION_TYPE_ICON: Record<NearbyAttraction["type"], string> = {
  scenic_spot: "🏔",
  picking: "🍓",
  rafting: "🚣",
  skiing: "⛷",
};

export const ATTRACTION_TYPE_COLOR: Record<NearbyAttraction["type"], string> = {
  scenic_spot: "bg-forest-100 text-forest-700",
  picking: "bg-orange-100 text-orange-700",
  rafting: "bg-sky-100 text-sky-700",
  skiing: "bg-snow-100 text-snow-700",
};

function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return "春";
  if (month >= 6 && month <= 8) return "夏";
  if (month >= 9 && month <= 11) return "秋";
  return "冬";
}

function getGuestTypeLabel(guests: number, hasChildren: boolean): string[] {
  const labels: string[] = [];
  if (guests >= 6) labels.push("团建");
  if (guests >= 3) labels.push("家庭");
  if (guests <= 2) labels.push("情侣");
  if (guests <= 4) labels.push("朋友");
  if (hasChildren) labels.push("亲子");
  return labels;
}

function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function estimateTravelTime(distanceKm: number): number {
  if (distanceKm <= 5) return Math.round(distanceKm * 4);
  if (distanceKm <= 15) return Math.round(distanceKm * 2.5);
  if (distanceKm <= 30) return Math.round(distanceKm * 2);
  return Math.round(distanceKm * 1.8);
}

export function getRecommendations(
  attractions: NearbyAttraction[],
  draftOrGuests: DraftBooking | number,
  checkInDate?: string,
  limit: number = 6
): NearbyRecommendation[] {
  const enabledAttractions = attractions.filter((a) => a.enabled);
  if (enabledAttractions.length === 0) return [];

  let guests = 2;
  let hasChildren = false;

  if (typeof draftOrGuests === "number") {
    guests = draftOrGuests;
  } else {
    guests = draftOrGuests.guests;
    hasChildren = draftOrGuests.note?.includes("儿童") || draftOrGuests.note?.includes("小孩") || false;
  }

  const targetSeason = checkInDate
    ? getSeasonFromDate(checkInDate)
    : getCurrentSeason();

  const guestTypes = getGuestTypeLabel(guests, hasChildren);

  const recommendations: NearbyRecommendation[] = enabledAttractions.map((attr) => {
    const distance = calcDistance(
      HOTEL_LOCATION.latitude,
      HOTEL_LOCATION.longitude,
      attr.latitude,
      attr.longitude
    );
    const travelTime = estimateTravelTime(distance);

    const reasons: string[] = [];
    let score = 0;

    if (attr.season.includes(targetSeason)) {
      score += 30;
      reasons.push(`当季适宜（${targetSeason}季开放）`);
    }

    const guestMatch = attr.suitablePeople.some((p) => guestTypes.includes(p));
    if (guestMatch) {
      score += 25;
      reasons.push(`适合${guests}人${hasChildren ? "亲子" : ""}出行`);
    }

    if (distance <= 10) {
      score += 25;
      reasons.push("距离较近，交通便利");
    } else if (distance <= 20) {
      score += 15;
      reasons.push("距离适中，车程半小时内");
    }

    if (attr.rating >= 4.7) {
      score += 20;
      reasons.push(`评分${attr.rating}分，游客好评如潮`);
    } else if (attr.rating >= 4.5) {
      score += 10;
      reasons.push(`评分${attr.rating}分，口碑不错`);
    }

    if (attr.type === "picking" && targetSeason !== "冬") {
      score += 5;
    }
    if (attr.type === "rafting" && targetSeason === "夏") {
      score += 10;
      reasons.push("夏季漂流最佳体验期");
    }
    if (attr.type === "skiing" && targetSeason === "冬") {
      score += 10;
      reasons.push("冬季滑雪正当时");
    }

    return {
      attraction: attr,
      distance: Math.round(distance * 10) / 10,
      travelTime,
      matchScore: score,
      reasons,
    };
  });

  return recommendations
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}

function getSeasonFromDate(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return "春";
  if (month >= 6 && month <= 8) return "夏";
  if (month >= 9 && month <= 11) return "秋";
  return "冬";
}

export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}米`;
  }
  return `${km.toFixed(1)}公里`;
}

export function formatTravelTime(minutes: number): string {
  if (minutes < 60) {
    return `约${minutes}分钟`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `约${hours}小时${mins}分钟` : `约${hours}小时`;
}

export function getAttractionTypeFilter() {
  return [
    { value: "all", label: "全部" },
    { value: "scenic_spot", label: "风景区" },
    { value: "picking", label: "采摘园" },
    { value: "rafting", label: "漂流" },
    { value: "skiing", label: "滑雪场" },
  ];
}
