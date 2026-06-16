import { useState } from 'react';
import type { ParsedEntry } from '../types';
import { toLocalInput, fromLocalInput } from '../util';

interface Props {
  entries: ParsedEntry[];
  rawText: string;
  onSave: (entries: ParsedEntry[]) => void;
  onCancel: () => void;
  saving: boolean;
}

export function ConfirmSheet({ entries, rawText, onSave, onCancel, saving }: Props) {
  const [items, setItems] = useState<ParsedEntry[]>(entries);

  function update(i: number, patch: Partial<ParsedEntry>) {
    setItems((prev) => prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  }

  return (
    <div className="sheet-mask">
      <div className="sheet">
        <h2>确认日程</h2>
        {rawText && <p className="raw">「{rawText}」</p>}
        {items.map((e, i) => (
          <div className={`entry ${e.needsConfirm ? 'need' : ''}`} key={i}>
            <label>事项</label>
            <input value={e.title} onChange={(ev) => update(i, { title: ev.target.value })} />
            <label>时间 {e.needsConfirm && <span className="warn">（请确认）</span>}</label>
            <input
              type="datetime-local"
              value={toLocalInput(e.startTime)}
              onChange={(ev) => update(i, { startTime: fromLocalInput(ev.target.value), needsConfirm: false })}
            />
            <div className="meta">
              {e.person && <span>👤 {e.person}</span>}
              {e.location && <span>📍 {e.location}</span>}
            </div>
          </div>
        ))}
        <div className="sheet-actions">
          <button className="ghost" onClick={onCancel} disabled={saving}>取消</button>
          <button className="primary" onClick={() => onSave(items)} disabled={saving}>
            {saving ? '保存中…' : `确认保存 ${items.length} 条`}
          </button>
        </div>
      </div>
    </div>
  );
}
