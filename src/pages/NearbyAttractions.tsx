import { useState } from "react";
import { Plus, Trash2, MapPin, Clock, Star } from "lucide-react";
import type { NearbyAttraction, NearbyAttractionType } from "@/types";
import { useStore } from "@/store/useStore";
import { yuan } from "@/lib/format";
import {
  ATTRACTION_TYPE_LABEL,
  ATTRACTION_TYPE_ICON,
  ATTRACTION_TYPE_COLOR,
  formatDistance,
  formatTravelTime,
} from "@/services/nearbyRecommendation";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Field, TextInput, Textarea, Toggle, Select } from "@/components/ui/Field";
import Badge from "@/components/ui/Badge";

const ATTRACTION_TYPES: NearbyAttractionType[] = ["scenic_spot", "picking", "rafting", "skiing"];
const SEASONS = ["春", "夏", "秋", "冬"];
const PEOPLE_TYPES = ["家庭", "情侣", "朋友", "亲子", "团建", "老人"];

const EMPTY: Omit<NearbyAttraction, "id"> = {
  name: "",
  type: "scenic_spot",
  description: "",
  address: "",
  latitude: 30.32,
  longitude: 119.42,
  distance: 0,
  travelTime: 0,
  price: 0,
  rating: 4.5,
  season: ["春", "夏", "秋"],
  suitablePeople: ["家庭", "朋友"],
  imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
  contactPhone: "",
  enabled: true,
  notes: "",
};

export default function NearbyAttractions() {
  const attractions = useStore((s) => s.nearbyAttractions);
  const updateNearbyAttraction = useStore((s) => s.updateNearbyAttraction);
  const deleteNearbyAttraction = useStore((s) => s.deleteNearbyAttraction);
  const addNearbyAttraction = useStore((s) => s.addNearbyAttraction);

  const [filterType, setFilterType] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Omit<NearbyAttraction, "id">>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = filterType === "all"
    ? attractions
    : attractions.filter((a) => a.type === filterType);

  const openEdit = (attr: NearbyAttraction) => {
    setForm(attr);
    setEditingId(attr.id);
    setOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) return;
    if (editingId) {
      updateNearbyAttraction(editingId, form);
    } else {
      addNearbyAttraction(form);
    }
    setForm(EMPTY);
    setEditingId(null);
    setOpen(false);
  };

  const toggleSeason = (season: string) => {
    setForm((prev) => ({
      ...prev,
      season: prev.season.includes(season)
        ? prev.season.filter((s) => s !== season)
        : [...prev.season, season],
    }));
  };

  const togglePeople = (people: string) => {
    setForm((prev) => ({
      ...prev,
      suitablePeople: prev.suitablePeople.includes(people)
        ? prev.suitablePeople.filter((p) => p !== people)
        : [...prev.suitablePeople, people],
    }));
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="周边景点管理"
        description="管理周边景点和游玩项目，客人预订时自动推荐"
        actions={
          <Button
            icon={<Plus size={16} />}
            onClick={() => {
              setForm(EMPTY);
              setEditingId(null);
              setOpen(true);
            }}
          >
            新增景点
          </Button>
        }
      />

      <div className="mb-4 flex gap-2">
        <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="all">全部类型</option>
          {ATTRACTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {ATTRACTION_TYPE_ICON[t]} {ATTRACTION_TYPE_LABEL[t]}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((attr) => (
          <div key={attr.id} className="card overflow-hidden">
            <div className="relative h-36 w-full overflow-hidden">
              <img
                src={attr.imageUrl}
                alt={attr.name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800";
                }}
              />
              <div className="absolute left-2 top-2 flex gap-1">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${ATTRACTION_TYPE_COLOR[attr.type]}`}
                >
                  {ATTRACTION_TYPE_ICON[attr.type]} {ATTRACTION_TYPE_LABEL[attr.type]}
                </span>
              </div>
              <div className="absolute right-2 top-2 flex items-center gap-0.5 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
                <Star size={10} className="text-yellow-400 fill-yellow-400" />
                {attr.rating}
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-serif text-lg font-semibold text-ink">{attr.name}</h3>
                {attr.enabled ? (
                  <Badge tone="forest" dot>启用</Badge>
                ) : (
                  <Badge tone="muted">停用</Badge>
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-muted">{attr.description}</p>

              <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
                <span className="flex items-center gap-0.5">
                  <MapPin size={12} />
                  {formatDistance(attr.distance)}
                </span>
                <span className="flex items-center gap-0.5">
                  <Clock size={12} />
                  {formatTravelTime(attr.travelTime)}
                </span>
                <span className="num font-semibold text-forest-600">{yuan(attr.price)}</span>
              </div>

              <div className="mt-2 flex flex-wrap gap-1">
                {attr.season.map((s) => (
                  <span key={s} className="rounded bg-ink/5 px-1.5 py-0.5 text-[10px] text-ink/60">
                    {s}季开放
                  </span>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-3">
                <Toggle
                  checked={attr.enabled}
                  onChange={(v) => updateNearbyAttraction(attr.id, { enabled: v })}
                  label={attr.enabled ? "启用" : "停用"}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(attr)}
                    className="inline-flex items-center gap-1 text-xs text-forest-600 hover:underline"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() =>
                      confirm(`删除景点「${attr.name}」？`) &&
                      deleteNearbyAttraction(attr.id)
                    }
                    className="inline-flex items-center gap-1 text-xs text-clay-500 hover:underline"
                  >
                    <Trash2 size={13} /> 删除
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card p-10 text-center text-muted">
          <p>暂无周边景点数据</p>
          <p className="mt-1 text-xs">点击右上角「新增景点」添加</p>
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editingId ? "编辑景点" : "新增景点"}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button onClick={save} disabled={!form.name.trim()}>
              保存
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="景点名称" required>
              <TextInput
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="如：翠竹谷风景区"
              />
            </Field>
            <Field label="景点类型" required>
              <Select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as NearbyAttractionType })
                }
              >
                {ATTRACTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {ATTRACTION_TYPE_ICON[t]} {ATTRACTION_TYPE_LABEL[t]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="景点描述">
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="简要介绍景点特色和游玩内容"
              rows={2}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="门票价格（元）">
              <TextInput
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </Field>
            <Field label="评分（0-5）">
              <TextInput
                type="number"
                min={0}
                max={5}
                step={0.1}
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="距离（公里）">
              <TextInput
                type="number"
                min={0}
                step={0.1}
                value={form.distance}
                onChange={(e) => setForm({ ...form, distance: Number(e.target.value) })}
              />
            </Field>
            <Field label="车程（分钟）">
              <TextInput
                type="number"
                min={0}
                value={form.travelTime}
                onChange={(e) => setForm({ ...form, travelTime: Number(e.target.value) })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="纬度">
              <TextInput
                type="number"
                step={0.0001}
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: Number(e.target.value) })}
              />
            </Field>
            <Field label="经度">
              <TextInput
                type="number"
                step={0.0001}
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: Number(e.target.value) })}
              />
            </Field>
          </div>

          <Field label="详细地址">
            <TextInput
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="完整的地址信息"
            />
          </Field>

          <Field label="联系电话">
            <TextInput
              value={form.contactPhone}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
              placeholder="景点联系电话"
            />
          </Field>

          <Field label="封面图片URL">
            <TextInput
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://..."
            />
          </Field>

          <Field label="开放季节">
            <div className="flex flex-wrap gap-2">
              {SEASONS.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSeason(s)}
                  className={`rounded px-3 py-1 text-sm transition ${
                    form.season.includes(s)
                      ? "bg-forest-500 text-white"
                      : "border border-ink/10 bg-paper text-ink/60 hover:bg-ink/5"
                  }`}
                >
                  {s}季
                </button>
              ))}
            </div>
          </Field>

          <Field label="适合人群">
            <div className="flex flex-wrap gap-2">
              {PEOPLE_TYPES.map((p) => (
                <button
                  key={p}
                  onClick={() => togglePeople(p)}
                  className={`rounded px-3 py-1 text-sm transition ${
                    form.suitablePeople.includes(p)
                      ? "bg-forest-500 text-white"
                      : "border border-ink/10 bg-paper text-ink/60 hover:bg-ink/5"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </Field>

          <Field label="温馨提示">
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="游玩注意事项、携带物品建议等"
              rows={2}
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
