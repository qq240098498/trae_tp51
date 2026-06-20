import { MapPin, Clock, Star, Sparkles } from "lucide-react";
import type { NearbyRecommendation } from "@/types";
import {
  ATTRACTION_TYPE_LABEL,
  ATTRACTION_TYPE_ICON,
  ATTRACTION_TYPE_COLOR,
  formatDistance,
  formatTravelTime,
} from "@/services/nearbyRecommendation";
import { yuan } from "@/lib/format";

interface NearbyRecommendationCardProps {
  recommendation: NearbyRecommendation;
  onViewDetails?: () => void;
}

export default function NearbyRecommendationCard({
  recommendation,
  onViewDetails,
}: NearbyRecommendationCardProps) {
  const { attraction, distance, travelTime, matchScore, reasons } = recommendation;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-ink/10 bg-paper transition-all hover:border-forest-300 hover:shadow-lg">
      <div className="relative h-32 w-full overflow-hidden">
        <img
          src={attraction.imageUrl}
          alt={attraction.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute left-2 top-2 flex gap-1">
          <span
            className={`rounded px-2 py-0.5 text-xs font-medium ${ATTRACTION_TYPE_COLOR[attraction.type]}`}
          >
            {ATTRACTION_TYPE_ICON[attraction.type]} {ATTRACTION_TYPE_LABEL[attraction.type]}
          </span>
        </div>
        <div className="absolute right-2 top-2 flex items-center gap-0.5 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
          <Star size={10} className="text-yellow-400 fill-yellow-400" />
          {attraction.rating}
        </div>
      </div>

      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-ink line-clamp-1">{attraction.name}</h4>
          <span className="num whitespace-nowrap text-sm font-semibold text-forest-600">
            {yuan(attraction.price)}
          </span>
        </div>

        <p className="mt-1 text-xs text-muted line-clamp-2">{attraction.description}</p>

        <div className="mt-2 flex items-center gap-3 text-xs text-muted">
          <span className="flex items-center gap-0.5">
            <MapPin size={12} />
            {formatDistance(distance)}
          </span>
          <span className="flex items-center gap-0.5">
            <Clock size={12} />
            {formatTravelTime(travelTime)}
          </span>
        </div>

        {reasons.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {reasons.slice(0, 2).map((reason, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-0.5 rounded bg-forest-50 px-1.5 py-0.5 text-[10px] text-forest-600"
              >
                <Sparkles size={9} />
                {reason}
              </span>
            ))}
          </div>
        )}

        {matchScore > 50 && (
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-ink/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-forest-400 to-forest-600 transition-all"
                  style={{ width: `${Math.min(matchScore, 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-muted">匹配度 {matchScore}%</span>
            </div>
            {onViewDetails && (
              <button
                onClick={onViewDetails}
                className="text-[11px] font-medium text-forest-600 hover:underline"
              >
                了解详情
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
