export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayStr(): string {
  return toISODate(new Date());
}

export function addDays(s: string, n: number): string {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function daysBetween(from: string, to: string): number {
  const a = parseDate(from).getTime();
  const b = parseDate(to).getTime();
  return Math.round((b - a) / 86400000);
}

export function isWeekend(s: string): boolean {
  const day = parseDate(s).getDay();
  return day === 0 || day === 6;
}

export function eachNight(checkIn: string, checkOut: string): string[] {
  const nights: string[] = [];
  let cur = checkIn;
  while (cur < checkOut) {
    nights.push(cur);
    cur = addDays(cur, 1);
  }
  return nights;
}

export function isSameDay(a: string, b: string): boolean {
  return a === b;
}

export function dateInRange(date: string, start: string, end: string): boolean {
  return date >= start && date < end;
}

const CN_WEEK = ["日", "一", "二", "三", "四", "五", "六"];

export function formatDate(s: string): string {
  if (!s) return "";
  const d = parseDate(s);
  return `${d.getMonth() + 1}月${d.getDate()}日 周${CN_WEEK[d.getDay()]}`;
}

export function formatDateShort(s: string): string {
  if (!s) return "";
  const d = parseDate(s);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function formatDateCompact(s: string): string {
  if (!s) return "";
  return s.slice(5).replace("-", "/");
}

export interface CalendarCell {
  date: string;
  day: number;
  inMonth: boolean;
}

export function monthMatrix(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month, 1);
  const startWeekday = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - startWeekday);
  const cells: CalendarCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push({
      date: toISODate(d),
      day: d.getDate(),
      inMonth: d.getMonth() === month,
    });
  }
  return cells;
}

export function monthLabel(year: number, month: number): string {
  return `${year}年${month + 1}月`;
}
