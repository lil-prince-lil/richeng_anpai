import type { ParsedEntry, Schedule } from './types';

const TOKEN_KEY = 'app_token';

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? '';
}
export function setToken(t: string) {
  localStorage.setItem(TOKEN_KEY, t);
}

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${getToken()}` };
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).error || `请求失败 (${res.status})`);
  }
  return res.json() as Promise<T>;
}

/** 上传音频转文字 */
export async function asr(blob: Blob, filename: string): Promise<string> {
  const fd = new FormData();
  fd.append('audio', blob, filename);
  const res = await fetch('/api/asr', { method: 'POST', headers: authHeaders(), body: fd });
  const data = await handle<{ text: string }>(res);
  return data.text;
}

/** 文字解析为日程 */
export async function parse(text: string): Promise<ParsedEntry[]> {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai';
  const res = await fetch('/api/parse', {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, tz }),
  });
  const data = await handle<{ entries: ParsedEntry[] }>(res);
  return data.entries;
}

/** 批量保存日程 */
export async function saveSchedules(entries: ParsedEntry[], rawText: string): Promise<Schedule[]> {
  const res = await fetch('/api/schedules', {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ entries: entries.map((e) => ({ ...e, rawText, source: 'voice' })) }),
  });
  const data = await handle<{ items: Schedule[] }>(res);
  return data.items;
}

export async function listSchedules(): Promise<Schedule[]> {
  const res = await fetch('/api/schedules', { headers: authHeaders() });
  const data = await handle<{ items: Schedule[] }>(res);
  return data.items;
}

export async function updateSchedule(id: string, patch: Partial<Schedule>): Promise<Schedule> {
  const res = await fetch(`/api/schedules/${id}`, {
    method: 'PATCH',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  return handle<Schedule>(res);
}

export async function deleteSchedule(id: string): Promise<void> {
  const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE', headers: authHeaders() });
  await handle(res);
}

/** 手动新增单条 */
export async function createManual(entry: ParsedEntry): Promise<Schedule[]> {
  const res = await fetch('/api/schedules', {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...entry, source: 'manual' }),
  });
  const data = await handle<{ items: Schedule[] }>(res);
  return data.items;
}
