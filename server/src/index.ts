import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';
import { config } from './config.js';
import { requireAuth } from './auth.js';
import { asrRouter } from './routes/asr.js';
import { parseRouter } from './routes/parse.js';
import { schedulesRouter } from './routes/schedules.js';
import './db.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// 健康检查（无需鉴权）
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// 业务接口（需鉴权）
app.use('/api/asr', requireAuth, asrRouter);
app.use('/api/parse', requireAuth, parseRouter);
app.use('/api/schedules', requireAuth, schedulesRouter);

// 托管前端 PWA 静态文件（生产环境）
const __dirname = dirname(fileURLToPath(import.meta.url));
const webDir = join(__dirname, '..', 'public');
if (existsSync(webDir)) {
  app.use(express.static(webDir));
  // SPA 兜底：非 /api 路由都返回 index.html
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile(join(webDir, 'index.html'));
  });
}

app.listen(config.port, () => {
  console.log(`[server] 监听 http://0.0.0.0:${config.port}`);
});
