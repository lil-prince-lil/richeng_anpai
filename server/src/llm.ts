import OpenAI, { toFile } from 'openai';
import { config } from './config.js';

const client = new OpenAI({
  apiKey: config.apimartApiKey,
  baseURL: config.apimartBaseUrl,
});

export interface ParsedEntry {
  title: string;
  person: string | null;
  location: string | null;
  startTime: string | null; // ISO 8601 带时区偏移
  endTime: string | null;
  note: string | null;
  needsConfirm: boolean;
}

const SYSTEM_PROMPT = `你是一个中文日程解析助手。用户用口语描述一件或多件待办/约会，你要把它解析成结构化日程。

规则：
1. 依据用户消息里给出的"当前时间"，把相对时间（今天、明天、后天、下周三、下午三点、月底等）换算成绝对时间，输出 ISO 8601 格式并带时区偏移（如 2026-06-24T15:00:00+08:00）。
2. 只说了日期没说具体时刻时，startTime 用当天，并把 needsConfirm 设为 true。
3. 完全无法确定时间时，startTime 设为 null，needsConfirm 设为 true。
4. 一段话里包含多件事时，拆成多条 entry。
5. title 要简洁达意（如"见张总聊合同"）。person/location/note 没有就用 null，不要编造。
6. 严格只输出 JSON，格式为：
{"entries":[{"title":"","person":null,"location":null,"startTime":null,"endTime":null,"note":null,"needsConfirm":false}]}`;

/** 当前时间的本地可读字符串，供模型换算相对时间 */
function nowString(tz: string): string {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('zh-CN', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
    weekday: 'long', hour: '2-digit', minute: '2-digit', hour12: false,
  });
  return `${fmt.format(now)}（时区 ${tz}，ISO: ${now.toISOString()}）`;
}

/** 文字 → 结构化日程 */
export async function parseSchedule(text: string, tz: string): Promise<ParsedEntry[]> {
  const resp = await client.chat.completions.create({
    model: config.chatModel,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `当前时间：${nowString(tz)}。\n用户说：${text}` },
    ],
  });

  const content = resp.choices[0]?.message?.content ?? '{}';
  let data: any;
  try {
    data = JSON.parse(content);
  } catch {
    // 兜底：从文本中抠出第一个 JSON 对象
    const m = content.match(/\{[\s\S]*\}/);
    data = m ? JSON.parse(m[0]) : { entries: [] };
  }

  const entries: ParsedEntry[] = Array.isArray(data.entries) ? data.entries : [];
  return entries.map((e: any) => ({
    title: String(e.title ?? '').trim() || '未命名日程',
    person: e.person ?? null,
    location: e.location ?? null,
    startTime: e.startTime ?? null,
    endTime: e.endTime ?? null,
    note: e.note ?? null,
    needsConfirm: Boolean(e.needsConfirm) || !e.startTime,
  }));
}

/** 音频 → 文字（whisper-1，OpenAI 兼容） */
export async function transcribe(buffer: Buffer, filename: string): Promise<string> {
  const file = await toFile(buffer, filename);
  const resp = await client.audio.transcriptions.create({
    file,
    model: config.asrModel,
    language: 'zh',
  });
  return (resp.text ?? '').trim();
}
