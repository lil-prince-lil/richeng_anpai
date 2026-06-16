import type { Request, Response, NextFunction } from 'express';
import { config } from './config.js';

/** 单用户简化鉴权：校验 Authorization: Bearer <APP_TOKEN> */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (token !== config.appToken) {
    return res.status(401).json({ error: '未授权' });
  }
  next();
}
