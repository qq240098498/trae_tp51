import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { RefundRule } from "@/types";
import { useStore } from "@/store/useStore";
import { percent } from "@/lib/format";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { Field, TextInput, Toggle } from "@/components/ui/Field";

const EMPTY: Omit<RefundRule, "id"> = {
  name: "",
  daysBeforeMin: 0,
  daysBeforeMax: 1,
  refundPercent: 0,
  changeAllowed: false,
  enabled: true,
};

export default function Rules() {
  const rules = useStore((s) => s.refundRules);
  const addRefundRule = useStore((s) => s.addRefundRule);
  const updateRefundRule = useStore((s) => s.updateRefundRule);
  const deleteRefundRule = useStore((s) => s.deleteRefundRule);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RefundRule | null>(null);
  const [form, setForm] = useState<Omit<RefundRule, "id">>(EMPTY);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  };
  const openEdit = (r: RefundRule) => {
    setEditing(r);
    const { id: _id, ...rest } = r;
    void _id;
    setForm(rest);
    setOpen(true);
  };
  const save = () => {
    if (!form.name.trim()) return;
    if (editing) updateRefundRule(editing.id, form);
    else addRefundRule(form);
    setOpen(false);
  };

  const sorted = [...rules].sort((a, b) => b.daysBeforeMin - a.daysBeforeMin);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="退改规则"
        description="按入住前天数分档设置退款比例，下单与退订时自动匹配"
        actions={<Button icon={<Plus size={16} />} onClick={openNew}>新增规则</Button>}
      />

      <div className="space-y-3">
        {sorted.map((r) => (
          <div key={r.id} className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h3 className="font-serif text-lg font-semibold text-ink">{r.name}</h3>
                {r.enabled ? <Badge tone="forest" dot>启用</Badge> : <Badge tone="muted">停用</Badge>}
                {r.changeAllowed ? <Badge tone="wheat">允许改期</Badge> : <Badge tone="clay">不可改期</Badge>}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" icon={<Pencil size={13} />} onClick={() => openEdit(r)}>编辑</Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-clay-500 hover:bg-clay-50"
                  icon={<Trash2 size={13} />}
                  onClick={() => confirm(`删除规则「${r.name}」？`) && deleteRefundRule(r.id)}
                >
                  删除
                </Button>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <div className="w-28 text-xs text-muted">
                {rangeLabel(r)}
              </div>
              <div className="relative h-7 flex-1 overflow-hidden rounded-lg bg-ink/5">
                <div
                  className="flex h-full items-center justify-end rounded-lg bg-gradient-to-r from-clay-300 to-clay-400 pr-2"
                  style={{ width: `${Math.max(r.refundPercent, 6)}%` }}
                >
                  <span className="num text-[11px] font-semibold text-paper">{percent(r.refundPercent)}</span>
                </div>
              </div>
              <Toggle checked={r.enabled} onChange={(v) => updateRefundRule(r.id, { enabled: v })} />
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "编辑退改规则" : "新增退改规则"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>取消</Button>
            <Button onClick={save} disabled={!form.name.trim()}>保存</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="规则名称" required>
            <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="如：提前7天以上" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="入住前最小天数" hint="≥ 此值">
              <TextInput type="number" min={0} value={form.daysBeforeMin} onChange={(e) => setForm({ ...form, daysBeforeMin: Number(e.target.value) })} />
            </Field>
            <Field label="入住前最大天数" hint="0 表示无上限">
              <TextInput type="number" min={0} value={form.daysBeforeMax} onChange={(e) => setForm({ ...form, daysBeforeMax: Number(e.target.value) })} />
            </Field>
          </div>
          <Field label={`退款比例：${percent(form.refundPercent)}`}>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={form.refundPercent}
              onChange={(e) => setForm({ ...form, refundPercent: Number(e.target.value) })}
              className="w-full accent-clay-500"
            />
          </Field>
          <div className="flex items-center justify-between rounded-lg bg-paper/60 px-3 py-2">
            <span className="text-sm text-ink">允许改期</span>
            <Toggle checked={form.changeAllowed} onChange={(v) => setForm({ ...form, changeAllowed: v })} />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-paper/60 px-3 py-2">
            <span className="text-sm text-ink">启用规则</span>
            <Toggle checked={form.enabled} onChange={(v) => setForm({ ...form, enabled: v })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}

function rangeLabel(r: RefundRule): string {
  if (r.daysBeforeMax === 0) return `入住前 ≥ ${r.daysBeforeMin} 天`;
  return `入住前 ${r.daysBeforeMin}-${r.daysBeforeMax} 天`;
}
