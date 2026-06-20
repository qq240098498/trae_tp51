import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Service } from "@/types";
import { useStore } from "@/store/useStore";
import { yuan } from "@/lib/format";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Field, TextInput, Textarea, Toggle } from "@/components/ui/Field";
import Badge from "@/components/ui/Badge";

const ICONS = ["🌾", "🎣", "🔥", "♟", "🍲", "🚲", "🍵", "🎋", "🛶", "🎪"];

const EMPTY: Omit<Service, "id"> = {
  name: "",
  icon: "🌾",
  price: 0,
  unit: "次",
  enabled: true,
  description: "",
};

export default function Services() {
  const services = useStore((s) => s.services);
  const updateService = useStore((s) => s.updateService);
  const deleteService = useStore((s) => s.deleteService);
  const addService = useStore((s) => s.addService);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Omit<Service, "id">>(EMPTY);

  const save = () => {
    if (!form.name.trim()) return;
    addService(form);
    setForm(EMPTY);
    setOpen(false);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="特色服务"
        description="勾选销售的增值服务：采摘、钓鱼、烧烤、棋牌、团餐等"
        actions={<Button icon={<Plus size={16} />} onClick={() => { setForm(EMPTY); setOpen(true); }}>新增服务</Button>}
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {services.map((s) => (
          <div key={s.id} className="card overflow-hidden">
            <div className="flex items-start gap-3 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-paper text-2xl">
                {s.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-lg font-semibold text-ink">{s.name}</h3>
                  {s.enabled ? <Badge tone="forest" dot>在售</Badge> : <Badge tone="muted">停售</Badge>}
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted">{s.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 px-5">
              <Field label="单价（元）">
                <TextInput type="number" min={0} value={s.price} onChange={(e) => updateService(s.id, { price: Number(e.target.value) })} />
              </Field>
              <Field label="计价单位">
                <TextInput value={s.unit} onChange={(e) => updateService(s.id, { unit: e.target.value })} />
              </Field>
            </div>

            <div className="mt-2 px-5">
              <Field label="服务说明">
                <TextInput value={s.description} onChange={(e) => updateService(s.id, { description: e.target.value })} />
              </Field>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-ink/10 px-5 py-3">
              <Toggle checked={s.enabled} onChange={(v) => updateService(s.id, { enabled: v })} label={s.enabled ? "在售" : "停售"} />
              <button
                onClick={() => confirm(`删除服务「${s.name}」？`) && deleteService(s.id)}
                className="inline-flex items-center gap-1 text-xs text-clay-500 hover:underline"
              >
                <Trash2 size={13} /> 删除
              </button>
            </div>

            <div className="bg-paper/50 px-5 py-2 text-right text-xs text-muted">
              示例：1{s.unit} = <span className="num font-semibold text-ink">{yuan(s.price)}</span>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="新增特色服务"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>取消</Button>
            <Button onClick={save} disabled={!form.name.trim()}>保存</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="图标">
            <div className="flex flex-wrap gap-2">
              {ICONS.map((ic) => (
                <button
                  key={ic}
                  onClick={() => setForm({ ...form, icon: ic })}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border text-xl transition ${
                    form.icon === ic ? "border-forest-400 bg-forest-50" : "border-ink/10 hover:bg-ink/5"
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </Field>
          <Field label="服务名称" required>
            <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="如：湖畔垂钓" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="单价（元）">
              <TextInput type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            </Field>
            <Field label="计价单位">
              <TextInput value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="人/次/场" />
            </Field>
          </div>
          <Field label="服务说明">
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="含鱼竿鱼饵，渔获可代烹" />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
