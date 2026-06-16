import { useRef, useState } from 'react';

function pickMime(): { mimeType: string; ext: string } {
  const candidates = [
    { mimeType: 'audio/webm;codecs=opus', ext: 'webm' },
    { mimeType: 'audio/webm', ext: 'webm' },
    { mimeType: 'audio/mp4', ext: 'm4a' }, // iOS Safari
    { mimeType: 'audio/aac', ext: 'aac' },
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c.mimeType)) return c;
  }
  return { mimeType: '', ext: 'webm' };
}

export function useRecorder() {
  const [recording, setRecording] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const extRef = useRef('webm');

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const { mimeType, ext } = pickMime();
    extRef.current = ext;
    const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    chunksRef.current = [];
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.start();
    mediaRef.current = mr;
    setRecording(true);
  }

  function stop(): Promise<{ blob: Blob; filename: string }> {
    return new Promise((resolve) => {
      const mr = mediaRef.current;
      if (!mr) return;
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
        mr.stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        resolve({ blob, filename: `voice.${extRef.current}` });
      };
      mr.stop();
    });
  }

  return { recording, start, stop };
}
