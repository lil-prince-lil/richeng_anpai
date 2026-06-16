import { useEffect, useState } from 'react';
import { useRecorder } from './useRecorder';
import * as api from './api';
import { getToken, setToken } from './api';
import type { ParsedEntry, Schedule } from './types';
import { ConfirmSheet } from './components/ConfirmSheet';
import { ScheduleList } from './components/ScheduleList';

type Status = 'idle' | 'recording' | 'transcribing' | 'parsing' | 'saving';

export default function App() {
  const { recording, start, stop } = useRecorder();
  const [status, setStatus] = useState<Status>('idle');
  const [items, setItems] = useState<Schedule[]>([]);
  const [pending, setPending] = useState<{ entries: ParsedEntry[]; rawText: string } | null>(null);
  const [error, setError] = useState('');
  const [tokenInput, setTokenInput] = useState(getToken());
  const [hasToken, setHasToken] = useState(!!getToken());

  async function refresh() {
    try { setItems(await api.listSchedules()); }
    catch (e: any) { setError(e.message); }
  }
  useEffect(() => { if (hasToken) refresh(); }, [hasToken]);

  async function handleMicDown() {
    setError('');
    if (status !== 'idle') return;
    try { await start(); setStatus('recording'); }
    catch { setError('无法访问麦克风，请检查权限'); }
  }

  async function handleMicUp() {
    if (status !== 'recording') return;
    try {
      const { blob, filename } = await stop();
      setStatus('transcribing');
      const text = await api.asr(blob, filename);
      if (!text) { setError('没听清，请再说一次'); setStatus('idle'); return; }
      setStatus('parsing');
      const entries = await api.parse(text);
      if (entries.length === 0) { setError('没有识别到日程，请再说一次'); setStatus('idle'); return; }
      setPending({ entries, rawText: text });
      setStatus('idle');
    } catch (e: any) {
      setError(e.message); setStatus('idle');
    }
  }

  async function handleSave(entries: ParsedEntry[]) {
    if (!pending) return;
    setStatus('saving');
    try {
      await api.saveSchedules(entries, pending.rawText);
      setPending(null);
      await refresh();
    } catch (e: any) { setError(e.message); }
    finally { setStatus('idle'); }
  }

  async function toggleDone(s: Schedule) {
    await api.updateSchedule(s.id, { status: s.status === 'done' ? 'confirmed' : 'done' });
    refresh();
  }
  async function del(s: Schedule) {
    if (!confirm(`删除「${s.title}」？`)) return;
    await api.deleteSchedule(s.id);
    refresh();
  }

  if (!hasToken) {
    return (
      <div className="gate">
        <h1>语音速记日程</h1>
        <p>首次使用，请输入访问口令（服务器 .env 里的 APP_TOKEN）</p>
        <input value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} placeholder="访问口令" />
        <button className="primary" onClick={() => { setToken(tokenInput.trim()); setHasToken(true); }}>
          进入
        </button>
      </div>
    );
  }

  const statusText: Record<Status, string> = {
    idle: '按住说话', recording: '松开结束', transcribing: '识别中…', parsing: 'AI 解析中…', saving: '保存中…',
  };

  return (
    <div className="app">
      <header className="topbar">
        <span>速记日程</span>
        <button className="link" onClick={() => { setToken(''); setHasToken(false); }}>退出</button>
      </header>

      {error && <div className="error" onClick={() => setError('')}>{error}（点击关闭）</div>}

      <main>
        <ScheduleList items={items} onToggleDone={toggleDone} onDelete={del} />
      </main>

      <div className="mic-area">
        <button
          className={`mic ${recording ? 'on' : ''} ${status !== 'idle' && status !== 'recording' ? 'busy' : ''}`}
          onPointerDown={handleMicDown}
          onPointerUp={handleMicUp}
          onPointerLeave={() => recording && handleMicUp()}
          disabled={status === 'transcribing' || status === 'parsing' || status === 'saving'}
        >
          🎙
        </button>
        <div className="mic-label">{statusText[status]}</div>
      </div>

      {pending && (
        <ConfirmSheet
          entries={pending.entries}
          rawText={pending.rawText}
          onSave={handleSave}
          onCancel={() => setPending(null)}
          saving={status === 'saving'}
        />
      )}
    </div>
  );
}
