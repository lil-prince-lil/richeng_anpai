import { Router } from 'express';
import multer from 'multer';
import { transcribe } from '../llm.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

export const asrRouter = Router();

// POST /api/asr  —— multipart 音频字段名 audio
asrRouter.post('/', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '缺少音频文件 audio' });
    const filename = req.file.originalname || 'audio.webm';
    const text = await transcribe(req.file.buffer, filename);
    res.json({ text });
  } catch (err: any) {
    console.error('[asr] 失败:', err?.message ?? err);
    res.status(502).json({ error: '语音识别失败', detail: err?.message });
  }
});
