import { Router } from 'express';
import { parseSchedule } from '../llm.js';
import { config } from '../config.js';

export const parseRouter = Router();

// POST /api/parse  { text, tz? }
parseRouter.post('/', async (req, res) => {
  try {
    const text = String(req.body?.text ?? '').trim();
    if (!text) return res.status(400).json({ error: '缺少 text' });
    const tz = String(req.body?.tz ?? config.defaultTz);
    const entries = await parseSchedule(text, tz);
    res.json({ entries });
  } catch (err: any) {
    console.error('[parse] 失败:', err?.message ?? err);
    res.status(502).json({ error: '解析失败', detail: err?.message });
  }
});
