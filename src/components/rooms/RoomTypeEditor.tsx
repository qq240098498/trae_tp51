import { useEffect, useState } from "react";
import type { RoomMode, RoomType } from "@/types";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Field, TextInput, Textarea, Select } from "@/components/ui/Field";
import { useStore } from "@/store/useStore";

const EMPTY: Omit<RoomType, "id"> = {
  name: "",
  mode: "single",
  weekdayPrice: 0,
  weekendPrice: 0,
  holidayPrice: 0,
  capacity: 2,
  unitCount: 1,
  amenities: [],
  description: "",
};

export default function RoomTypeEditor({
  open,
  onClose,
  roomType,
}: {
  open: boolean;
  onClose: () => void;
  roomType?: RoomType | null;
}) {
  const addRoomType = useStore((s) => s.addRoomType);
  const updateRoomType = useStore((s) => s.updateRoomType);
  const [form, setForm] = useState<Omit<RoomType, "id">>(EMPTY);
  const [amenitiesText, setAmenitiesText] = useState("");

  useEffect(() => {
    if (roomType) {
      const { id: _id, ...rest } = roomType;
      void _id;
      setForm(rest);
      setAmenitiesText(roomType.amenities.join("、"));
    } else {
      setForm(EMPTY);
      setAmenitiesText("");
    }
  }, [roomType, open]);

  const set = <K extends keyof Omit<RoomType, "id">>(k: K, v: Omit<RoomType, "id">[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    const amenities = amenitiesText
      .split(/[、,，\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const payload = { ...form, amenities, mode: form.mode as RoomMode };
    if (roomType) updateRoomType(roomType.id, payload);
    else addRoomType(payload);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={roomType ? "编辑房型" : "新建房型"}
      subtitle="设置平/旺/节假日三档价格与单元数量"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>取消</Button>
          <Button onClick={handleSave} disabled={!form.name.trim()}>
            保存
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="名称" required className="sm:col-span-2">
          <TextInput value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="如：山景双人间" />
        </Field>
        <Field label="出租模式">
          <Select value={form.mode} onChange={(e) => set("mode", e.target.value as RoomMode)}>
            <option value="single">单间（按间出售）</option>
            <option value="courtyard">整院（整院出租）</option>
          </Select>
        </Field>
        <Field label="人数上限" required>
          <TextInput type="number" min={1} value={form.capacity} onChange={(e) => set("capacity", Number(e.target.value))} />
        </Field>
        <Field label="平日价（元/晚）">
          <TextInput type="number" min={0} value={form.weekdayPrice} onChange={(e) => set("weekdayPrice", Number(e.target.value))} />
        </Field>
        <Field label="周末价（元/晚）">
          <TextInput type="number" min={0} value={form.weekendPrice} onChange={(e) => set("weekendPrice", Number(e.target.value))} />
        </Field>
        <Field label="节假日价（元/晚）">
          <TextInput type="number" min={0} value={form.holidayPrice} onChange={(e) => set("holidayPrice", Number(e.target.value))} />
        </Field>
        <Field label="单元数量" hint="单间为房间数，整院为院子数">
          <TextInput type="number" min={1} value={form.unitCount} onChange={(e) => set("unitCount", Number(e.target.value))} />
        </Field>
        <Field label="设施标签" className="sm:col-span-2" hint="用顿号或逗号分隔">
          <TextInput value={amenitiesText} onChange={(e) => setAmenitiesText(e.target.value)} placeholder="如：独立卫浴、空调、WiFi、早餐" />
        </Field>
        <Field label="描述" className="sm:col-span-2">
          <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="房型特色与卖点" />
        </Field>
      </div>
    </Modal>
  );
}
