import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { config } from './config.js';

mkdirSync(dirname(config.dbPath), { recursive: true });

export const db = new Database(config.dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS schedule (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    person      TEXT,
    location    TEXT,
    start_time  TEXT,
    end_time    TEXT,
    note        TEXT,
    raw_text    TEXT,
    source      TEXT NOT NULL DEFAULT 'voice',
    status      TEXT NOT NULL DEFAULT 'confirmed',
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_schedule_start ON schedule(start_time);
  CREATE INDEX IF NOT EXISTS idx_schedule_status ON schedule(status);
`);

export interface ScheduleRow {
  id: string;
  title: string;
  person: string | null;
  location: string | null;
  start_time: string | null;
  end_time: string | null;
  note: string | null;
  raw_text: string | null;
  source: string;
  status: string;
  created_at: string;
  updated_at: string;
}
