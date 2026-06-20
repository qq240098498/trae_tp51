export function yuan(n: number): string {
  const v = Math.round(n * 100) / 100;
  return `¥${v.toLocaleString("zh-CN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function yuanPlain(n: number): string {
  const v = Math.round(n * 100) / 100;
  return v.toLocaleString("zh-CN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function percent(n: number): string {
  return `${Math.round(n)}%`;
}

export function maskIdCard(id: string): string {
  if (!id || id.length < 8) return id;
  return `${id.slice(0, 4)}********${id.slice(-4)}`;
}

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

export function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function genCode(prefix: string): string {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}${stamp}${rand}`;
}
