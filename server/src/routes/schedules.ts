import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db, type ScheduleRow } from '../db.js';

export const schedulesRouter = Router();

function toApi(r: ScheduleRow) {
  return {
    id: r.id,
    title: r.title,
    person: r.person,
    location: r.location,
    startTime: r.start_time,
    endTime: r.end_time,
    note: r.note,
    rawText: r.raw_text,
    source: r.source,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// GET /api/schedules?from=&to=&status=
schedulesRouter.get('/', (req, res) => {
  const { from, to, status } = req.query as Record<string, string | undefined>;
  const where: string[] = [];
  const params: any[] = [];
  if (from) { where.push('(start_time IS NULL OR start_time >= ?)'); params.push(from); }
  if (to) { where.push('(start_time IS NULL OR start_time <= ?)'); params.push(to); }
  if (status) { where.push('status = ?'); params.push(status); }
  const sql =
    'SELECT * FROM schedule' +
    (where.length ? ' WHERE ' + where.join(' AND ') : '') +
    ' ORDER BY (start_time IS NULL), start_time ASC, created_at DESC';
  const rows = db.prepare(sql).all(...params) as ScheduleRow[];
  res.json({ items: rows.map(toApi) });
});

// POST /api/schedules  新增（支持批量 entries 或单条）
schedulesRouter.post('/', (req, res) => {
  const now = new Date().toISOString();
  const body = req.body ?? {};
  const list = Array.isArray(body.entries) ? body.entries : [body];
  const stmt = db.prepare(`
    INSERT INTO schedule (id,title,person,location,start_time,end_time,note,raw_text,source,status,created_at,updated_at)
    VALUES (@id,@title,@person,@location,@start_time,@end_time,@note,@raw_text,@source,@status,@created_at,@updated_at)
  `);
  const created: ScheduleRow[] = [];
  const insertMany = db.transaction((items: any[]) => {
    for (const it of items) {
      const row: ScheduleRow = {
        id: randomUUID(),
        title: String(it.title ?? '').trim() || '未命名日程',
        person: it.person ?? null,
        location: it.location ?? null,
        start_time: it.startTime ?? null,
        end_time: it.endTime ?? null,
        note: it.note ?? null,
        raw_text: it.rawText ?? null,
        source: it.source ?? 'voice',
        status: it.status ?? 'confirmed',
        created_at: now,
        updated_at: now,
      };
      stmt.run(row);
      created.push(row);
    }
  });
  insertMany(list);
  res.status(201).json({ items: created.map(toApi) });
});

// PATCH /api/schedules/:id  修改
schedulesRouter.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM schedule WHERE id = ?').get(req.params.id) as ScheduleRow | undefined;
  if (!existing) return res.status(404).json({ error: '日程不存在' });
  const b = req.body ?? {};
  const merged: ScheduleRow = {
    ...existing,
    title: b.title ?? existing.title,
    person: b.person !== undefined ? b.person : existing.person,
    location: b.location !== undefined ? b.location : existing.location,
    start_time: b.startTime !== undefined ? b.startTime : existing.start_time,
    end_time: b.endTime !== undefined ? b.endTime : existing.end_time,
    note: b.note !== undefined ? b.note : existing.note,
    status: b.status ?? existing.status,
    updated_at: new Date().toISOString(),
  };
  db.prepare(`
    UPDATE schedule SET title=@title,person=@person,location=@location,
      start_time=@start_time,end_time=@end_time,note=@note,status=@status,updated_at=@updated_at
    WHERE id=@id
  `).run(merged);
  res.json(toApi(merged));
});

// DELETE /api/schedules/:id
schedulesRouter.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM schedule WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: '日程不存在' });
  res.json({ ok: true });
});
