import type { Schedule } from './types';

const WD = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export function fmtTime(iso: string | null): string {
  if (!iso) return '时间待定';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '时间待定';
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  const datePart = `${sameYear ? '' : d.getFullYear() + '年'}${d.getMonth() + 1}月${d.getDate()}日 ${WD[d.getDay()]}`;
  const timePart = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${datePart} ${timePart}`;
}

/** 把日程分组：今天 / 明天 / 本周 / 更晚 / 待定 */
export function groupSchedules(items: Schedule[]): { label: string; items: Schedule[] }[] {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const dayAfter = new Date(today); dayAfter.setDate(today.getDate() + 2);
  const weekEnd = new Date(today); weekEnd.setDate(today.getDate() + 7);

  const groups: Record<string, Schedule[]> = { 今天: [], 明天: [], 本周内: [], 更晚: [], 时间待定: [] };
  for (const s of items) {
    if (!s.startTime) { groups['时间待定'].push(s); continue; }
    const d = new Date(s.startTime);
    if (d < tomorrow) groups['今天'].push(s);
    else if (d < dayAfter) groups['明天'].push(s);
    else if (d < weekEnd) groups['本周内'].push(s);
    else groups['更晚'].push(s);
  }
  return Object.entries(groups)
    .filter(([, arr]) => arr.length > 0)
    .map(([label, arr]) => ({ label, items: arr }));
}

/** 把 ISO 字符串转成 <input type="datetime-local"> 需要的本地格式 */
export function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalInput(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
}
