// 試遊用の最小集計。既定OFF。端末外へは送らない（送信処理そのものが無い）。
import type { Store } from './storage';
import { COUNTER_MAX, type PlaytestCounters, emptyCounters } from './schema';

export type PlaytestEvent =
  | { type: 'searchStarted' }
  | { type: 'searchCompleted'; durationMs: number }
  | { type: 'hint' }
  | { type: 'hideRound' };

export function record(store: Store, ev: PlaytestEvent): void {
  if (!store.data.playtest.enabled) return;
  store.update((d) => {
    const c = d.playtest.counters;
    const inc = (k: keyof PlaytestCounters) => {
      c[k] = Math.min(COUNTER_MAX, c[k] + 1);
    };
    switch (ev.type) {
      case 'searchStarted':
        inc('searchStarted');
        break;
      case 'searchCompleted':
        inc('searchCompleted');
        if (ev.durationMs < 60_000) inc('durationUnder1m');
        else if (ev.durationMs < 180_000) inc('duration1to3m');
        else inc('durationOver3m');
        break;
      case 'hint':
        inc('hintsUsed');
        break;
      case 'hideRound':
        inc('hideRounds');
        break;
    }
  });
}

export function setEnabled(store: Store, enabled: boolean): void {
  store.update((d) => {
    d.playtest.enabled = enabled;
    // OFF に戻したら集計も消す
    if (!enabled) d.playtest.counters = emptyCounters();
  });
}

export function resetCounters(store: Store): void {
  store.update((d) => {
    d.playtest.counters = emptyCounters();
  });
}
