import 'dotenv/config';

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined || v === '') {
    throw new Error(`缺少必需的环境变量：${name}`);
  }
  return v;
}

export const config = {
  port: parseInt(process.env.PORT ?? '3000', 10),

  // apimart（OpenAI 兼容网关）
  apimartBaseUrl: process.env.APIMART_BASE_URL ?? 'https://api.apimart.ai/v1',
  apimartApiKey: required('APIMART_API_KEY'),

  // 模型名
  chatModel: process.env.CHAT_MODEL ?? 'deepseek-v4-pro',
  asrModel: process.env.ASR_MODEL ?? 'whisper-1',

  // 单用户简化鉴权：前端请求需带 Authorization: Bearer <APP_TOKEN>
  appToken: required('APP_TOKEN'),

  // 数据库文件路径
  dbPath: process.env.DB_PATH ?? './data/schedule.db',

  // 默认时区（用于把"明天/下周三"换算成绝对时间）
  defaultTz: process.env.DEFAULT_TZ ?? 'Asia/Shanghai',
};
