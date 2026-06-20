import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Room, RoomType } from "@/types";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { TextInput } from "@/components/ui/Field";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";

export default function RoomUnitManager({
  open,
  onClose,
  roomType,
}: {
  open: boolean;
  onClose: () => void;
  roomType: RoomType | null;
}) {
  const rooms = useStore((s) => s.rooms);
  const addRoom = useStore((s) => s.addRoom);
  const deleteRoom = useStore((s) => s.deleteRoom);
  const updateRoom = useStore((s) => s.updateRoom);
  const [newLabel, setNewLabel] = useState("");

  if (!roomType) return null;
  const units = rooms.filter((r) => r.roomTypeId === roomType.id);
  const unitWord = roomType.mode === "courtyard" ? "院" : "间";

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    addRoom(roomType.id, newLabel.trim());
    setNewLabel("");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${roomType.name} · 单元管理`}
      subtitle={`共 ${units.length} 个${unitWord}，可维护房号/院名与状态`}
      size="lg"
      footer={<Button onClick={onClose}>完成</Button>}
    >
      <div className="mb-4 flex gap-2">
        <TextInput
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder={`新增${unitWord}名称，如：${roomType.mode === "courtyard" ? "东院" : "A01"}`}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button icon={<Plus size={16} />} onClick={handleAdd} disabled={!newLabel.trim()}>
          添加
        </Button>
      </div>
      {units.length === 0 ? (
        <div className="flex h-24 items-center justify-center text-sm text-muted">
          暂无单元，{roomType.mode === "courtyard" ? "整院将按数量自动计数" : "请添加房号"}
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {units.map((r) => (
            <div key={r.id} className="flex items-center gap-2 rounded-lg border border-ink/10 bg-paper/40 px-3 py-2">
              <span className="flex-1 text-sm font-medium text-ink">{r.label}</span>
              <select
                value={r.status}
                onChange={(e) => updateRoom(r.id, { status: e.target.value as Room["status"] })}
                className={cn(
                  "rounded border border-ink/15 bg-white/70 px-2 py-1 text-xs",
                  r.status === "available" && "text-forest-600",
                  r.status === "occupied" && "text-clay-500",
                  r.status === "maintenance" && "text-muted"
                )}
              >
                <option value="available">空闲</option>
                <option value="occupied">在住</option>
                <option value="maintenance">维修</option>
              </select>
              <button
                onClick={() => deleteRoom(r.id)}
                className="rounded p-1 text-muted transition hover:bg-clay-50 hover:text-clay-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
