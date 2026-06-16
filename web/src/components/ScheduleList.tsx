import type { Schedule } from '../types';
import { fmtTime, groupSchedules } from '../util';

interface Props {
  items: Schedule[];
  onToggleDone: (s: Schedule) => void;
  onDelete: (s: Schedule) => void;
}

export function ScheduleList({ items, onToggleDone, onDelete }: Props) {
  if (items.length === 0) {
    return <div className="empty">还没有日程。<br />点下方按钮，说一句话试试。</div>;
  }
  const groups = groupSchedules(items);
  return (
    <div className="list">
      {groups.map((g) => (
        <section key={g.label}>
          <h3 className="group-label">{g.label}</h3>
          {g.items.map((s) => (
            <div className={`card ${s.status === 'done' ? 'done' : ''}`} key={s.id}>
              <button className="check" onClick={() => onToggleDone(s)} aria-label="完成">
                {s.status === 'done' ? '✓' : '○'}
              </button>
              <div className="card-body">
                <div className="card-title">{s.title}</div>
                <div className="card-time">{fmtTime(s.startTime)}</div>
                <div className="card-meta">
                  {s.person && <span>👤 {s.person}</span>}
                  {s.location && <span>📍 {s.location}</span>}
                  {s.note && <span>📝 {s.note}</span>}
                </div>
              </div>
              <button className="del" onClick={() => onDelete(s)} aria-label="删除">✕</button>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
