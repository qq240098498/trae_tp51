import { useState } from "react";
import { Plus, Pencil, LayoutGrid, Users, Coins } from "lucide-react";
import type { RoomType } from "@/types";
import { useStore } from "@/store/useStore";
import { yuan } from "@/lib/format";
import { todayStr } from "@/lib/date";
import { effectiveAvailabilityForDate } from "@/services/pricing";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import { RoomModeBadge } from "@/components/ui/StatusBadge";
import RoomTypeEditor from "@/components/rooms/RoomTypeEditor";
import RoomUnitManager from "@/components/rooms/RoomUnitManager";

export default function Rooms() {
  const roomTypes = useStore((s) => s.roomTypes);
  const bookings = useStore((s) => s.bookings);
  const inventoryOverrides = useStore((s) => s.inventoryOverrides);
  const deleteRoomType = useStore((s) => s.deleteRoomType);
  const today = todayStr();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<RoomType | null>(null);
  const [unitMgr, setUnitMgr] = useState<RoomType | null>(null);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="房型与包间管理"
        description="维护单间与整院两类房型，按平/旺/节假日三档定价"
        actions={
          <Button
            icon={<Plus size={16} />}
            onClick={() => {
              setEditing(null);
              setEditorOpen(true);
            }}
          >
            新建房型
          </Button>
        }
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {roomTypes.map((rt) => {
          const avail = effectiveAvailabilityForDate(rt, today, bookings, inventoryOverrides);
          return (
            <div key={rt.id} className="card group overflow-hidden">
              <div className="relative h-2 bg-gradient-to-r from-forest-400 via-wheat-400 to-clay-400" />
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-serif text-xl font-semibold text-ink">{rt.name}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-muted">{rt.description}</p>
                  </div>
                  <RoomModeBadge mode={rt.mode} />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <PriceCell label="平日" value={rt.weekdayPrice} tone="text-forest-700" />
                  <PriceCell label="周末" value={rt.weekendPrice} tone="text-wheat-700" />
                  <PriceCell label="节假日" value={rt.holidayPrice} tone="text-clay-500" />
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {rt.amenities.slice(0, 5).map((a) => (
                    <span key={a} className="rounded bg-ink/5 px-2 py-0.5 text-[11px] text-muted">
                      {a}
                    </span>
                  ))}
                  {rt.amenities.length > 5 && (
                    <span className="rounded bg-ink/5 px-2 py-0.5 text-[11px] text-muted">
                      +{rt.amenities.length - 5}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-4 text-xs text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Users size={13} /> {rt.capacity}人
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <LayoutGrid size={13} /> {rt.unitCount}{rt.mode === "courtyard" ? "院" : "间"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-forest-600">
                    <Coins size={13} /> 今日剩{avail}
                  </span>
                </div>

                <div className="mt-4 flex gap-2 border-t border-ink/10 pt-4">
                  <Button
                    variant="subtle"
                    size="sm"
                    icon={<Pencil size={13} />}
                    onClick={() => {
                      setEditing(rt);
                      setEditorOpen(true);
                    }}
                  >
                    编辑
                  </Button>
                  <Button
                    variant="subtle"
                    size="sm"
                    icon={<LayoutGrid size={13} />}
                    onClick={() => setUnitMgr(rt)}
                  >
                    单元
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-clay-500 hover:bg-clay-50"
                    onClick={() => {
                      if (confirm(`确认删除「${rt.name}」？相关单元将一并删除。`)) deleteRoomType(rt.id);
                    }}
                  >
                    删除
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <RoomTypeEditor open={editorOpen} onClose={() => setEditorOpen(false)} roomType={editing} />
      <RoomUnitManager open={!!unitMgr} onClose={() => setUnitMgr(null)} roomType={unitMgr} />
    </div>
  );
}

function PriceCell({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-lg bg-paper/60 py-2">
      <div className="text-[10px] text-muted">{label}</div>
      <div className={`num text-sm font-semibold ${tone}`}>{yuan(value)}</div>
    </div>
  );
}
