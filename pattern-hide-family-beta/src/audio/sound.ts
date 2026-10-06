// 端末内で生成する短い音だけを使う（音声ファイル・外部取得なし）。
// ユーザー操作より前には鳴らさない。消音できる。
type Tone = 'pop' | 'found' | 'soft' | 'clear';

let ctx: AudioContext | null = null;
let unlocked = false;
let enabled = true;

export function setSoundEnabled(v: boolean): void {
  enabled = v;
  if (!v && ctx) void ctx.suspend().catch(() => undefined);
}

/** 最初のユーザー操作で呼ぶ */
export function unlockAudio(): void {
  unlocked = true;
}

function getCtx(): AudioContext | null {
  if (!unlocked || !enabled) return null;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx ??= new AC();
    if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
    return ctx;
  } catch {
    return null;
  }
}

const NOTES: Record<Tone, [number, number][]> = {
  pop: [[660, 0.06]],
  soft: [[440, 0.07]],
  found: [
    [523, 0.09],
    [659, 0.09],
    [784, 0.14],
  ],
  clear: [
    [523, 0.1],
    [659, 0.1],
    [784, 0.1],
    [1047, 0.2],
  ],
};

export function play(t: Tone): void {
  const c = getCtx();
  if (!c) return;
  let at = c.currentTime;
  for (const [f, d] of NOTES[t]) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.12, at + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, at + d);
    o.connect(g).connect(c.destination);
    o.start(at);
    o.stop(at + d + 0.02);
    at += d * 0.9;
  }
}
