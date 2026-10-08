// 保護者用の領域と、偶然の操作を防ぐゲート（試作品。年齢確認や法的同意の取得ではない）。
import type { Store } from '../storage/storage';
import { resetCounters, setEnabled } from '../storage/playtest';
import { setSoundEnabled } from '../audio/sound';
import { NATIVE } from './platform';

const KANJI = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
const HOLD_MS = 2200;

export function makeChallenge(rand: () => number = Math.random): number[] {
  const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const out: number[] = [];
  while (out.length < 3) {
    const i = Math.floor(rand() * pool.length);
    out.push(pool.splice(i, 1)[0]);
  }
  // 表示順は小さい順にしない（そのまま押すと失敗する）
  if (out[0] < out[1] && out[1] < out[2]) out.reverse();
  return out;
}

export class ParentArea {
  private store: Store;
  private onChange: () => void;
  private el: HTMLElement | null = null;
  private challenge: number[] = [];
  private progress: number[] = [];
  private holdTimer = 0;
  private returnFocus: HTMLElement | null = null;
  private confirmDelete = false;
  private keyHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') this.close();
    if (e.key === 'Tab' && this.el) this.trapFocus(e);
  };

  private onCleared: () => void;
  private failures = 0;
  private cooldownUntil = 0;

  private onTrial: () => void;

  constructor(store: Store, onChange: () => void, onCleared: () => void = () => undefined, onTrial: () => void = () => undefined) {
    this.store = store;
    this.onChange = onChange;
    this.onCleared = onCleared;
    this.onTrial = onTrial;
  }

  isOpen(): boolean {
    return this.el !== null;
  }

  openGate(from?: HTMLElement): void {
    this.close();
    this.returnFocus = from ?? null;
    this.challenge = makeChallenge();
    this.progress = [];
    this.mount(this.gateHtml());
    this.bindGate();
  }

  close(): void {
    window.clearTimeout(this.holdTimer);
    if (!this.el) return;
    this.el.remove();
    this.el = null;
    this.confirmDelete = false;
    document.removeEventListener('keydown', this.keyHandler);
    const back = this.returnFocus?.isConnected ? this.returnFocus : document.querySelector<HTMLElement>('[data-action="parent"]');
    back?.focus?.({ preventScroll: true });
  }

  private mount(html: string): void {
    this.el?.remove();
    const el = document.createElement('div');
    el.className = 'parent-layer';
    el.innerHTML = html;
    document.body.appendChild(el);
    this.el = el;
    document.removeEventListener('keydown', this.keyHandler);
    document.addEventListener('keydown', this.keyHandler);
    el.querySelector<HTMLElement>('[data-autofocus]')?.focus({ preventScroll: true });
  }

  private trapFocus(e: KeyboardEvent): void {
    const f = Array.from(this.el!.querySelectorAll<HTMLElement>('button:not([disabled]), input, [tabindex="0"]'));
    if (f.length === 0) return;
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  // ---- ゲート ----

  private gateHtml(msg = ''): string {
    const nums = this.challenge.map((n) => KANJI[n]).join('・');
    const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9]
      .map((n) => `<button type="button" class="key${this.progress.includes(n) ? ' on' : ''}" data-key="${n}">${n}</button>`)
      .join('');
    return `<div class="parent-dialog gate" role="dialog" aria-modal="true" aria-labelledby="gate-title">
      <h2 id="gate-title">保護者の方へ</h2>
      <p>設定を開くには、次の漢数字を <strong>小さい順に</strong> 数字のボタンで押してください。</p>
      <p class="gate-nums" aria-live="polite">${nums}</p>
      <div class="keys" role="group" aria-label="数字">${keys}</div>
      <p class="gate-msg" role="status">${msg}</p>
      <div class="gate-hold" hidden>
        <p>最後に、下のボタンを約2秒 押し続けてください。</p>
        <button type="button" class="hold-btn" data-hold><span class="hold-fill"></span><span class="hold-lbl">押し続ける</span></button>
      </div>
      <div class="row"><button type="button" class="pbtn" data-close data-autofocus>閉じる</button></div>
    </div>`;
  }

  private bindGate(): void {
    const el = this.el!;
    el.querySelector('[data-close]')?.addEventListener('click', () => this.close());
    el.querySelectorAll<HTMLButtonElement>('[data-key]').forEach((b) =>
      b.addEventListener('click', () => this.onKey(Number(b.dataset.key))),
    );
  }

  private onKey(n: number): void {
    if (performance.now() < this.cooldownUntil) return; // 連打対策（保護者向け画面のみ）
    const want = this.challenge.slice().sort((a, b) => a - b);
    const next = want[this.progress.length];
    if (n !== next) {
      // 失敗：問題を作り直す（待ち時間・罰はない）
      this.failures++;
      if (this.failures % 3 === 0) this.cooldownUntil = performance.now() + 3000;
      this.challenge = makeChallenge();
      this.progress = [];
      this.mount(this.gateHtml(this.failures % 3 === 0 ? 'ちがいました。少し待ってから、新しい問題でもう一度どうぞ。' : 'ちがいました。新しい問題です。'));
      this.bindGate();
      return;
    }
    this.progress.push(n);
    this.el!.querySelector(`[data-key="${n}"]`)?.classList.add('on');
    if (this.progress.length === 3) this.showHold();
  }

  private showHold(): void {
    const el = this.el!;
    el.querySelectorAll<HTMLButtonElement>('[data-key]').forEach((b) => (b.disabled = true));
    const box = el.querySelector<HTMLElement>('.gate-hold')!;
    box.hidden = false;
    const hold = el.querySelector<HTMLButtonElement>('[data-hold]')!;
    hold.focus();
    const startHold = (e: Event) => {
      e.preventDefault();
      hold.classList.add('holding');
      window.clearTimeout(this.holdTimer);
      this.holdTimer = window.setTimeout(() => this.openPanel(), HOLD_MS);
    };
    const stopHold = () => {
      hold.classList.remove('holding');
      window.clearTimeout(this.holdTimer);
    };
    hold.addEventListener('pointerdown', startHold);
    hold.addEventListener('pointerup', stopHold);
    hold.addEventListener('pointerleave', stopHold);
    hold.addEventListener('pointercancel', stopHold);
    hold.addEventListener('contextmenu', (e) => e.preventDefault());
    hold.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) startHold(e);
    });
    hold.addEventListener('keyup', (e) => {
      if (e.key === 'Enter' || e.key === ' ') stopHold();
    });
    // キーを押したまま Tab で離れる・ウィンドウを離れると keyup が届かないため、ここでも取り消す
    hold.addEventListener('blur', stopHold);
    const onWindowBlur = () => {
      if (!hold.isConnected) window.removeEventListener('blur', onWindowBlur);
      stopHold();
    };
    window.addEventListener('blur', onWindowBlur);
  }

  // ---- 設定パネル ----

  private openPanel(): void {
    this.mount(this.panelHtml());
    this.bindPanel();
  }

  private panelHtml(): string {
    const d = this.store.data;
    const c = d.playtest.counters;
    const status = {
      ok: NATIVE ? 'この端末のこのアプリに保存されています。' : 'この端末のブラウザに保存されています。',
      empty: 'まだ保存されたデータはありません。',
      recovered: '保存データの一部が読めなかったため、安全な初期値に戻しました。',
      unavailable: 'このブラウザでは保存できません（プライベートモード等）。閉じると設定は元に戻ります。',
    }[this.store.status];
    const saveWarn = this.store.lastSaveOk ? '' : '<p class="warn">直前の保存ができませんでした（容量不足など）。遊ぶことはできます。</p>';
    const where = NATIVE ? 'この端末のこのアプリの中' : 'この端末のこのブラウザの中';
    return `<div class="parent-dialog panel" role="dialog" aria-modal="true" aria-labelledby="panel-title">
      <h2 id="panel-title">保護者の方へ</h2>
      <section>
        ${
          NATIVE
            ? `<h3>このアプリについて</h3>
        <p>広告・外部リンク・アカウント登録はありません。通信なしで遊べます。名前・写真・位置などの個人の情報は集めません。</p>`
            : `<h3>このベータについて</h3>
        <p>家族内で遊びを確かめるためのテスト版です。<strong>このベータでは課金はありません。</strong>広告・購入・外部リンク・アカウント登録もありません。通信なしで遊べるように作っています。</p>`
        }
        <p>学習や発達への効果をうたうものではありません。</p>
      </section>
      <section>
        <h3>最難関を ためす（大人向けのおためし）</h3>
        <p>いちばん難しい設定を、コースを進めなくても試せます。見つけにくい場所に最大3人、服は背景と同じ柄、ふち線と服の陰影が薄く、家具のかげからのぞいていたり、帽子やサングラスで顔の片方がかくれていたりします。<strong>10人みつけたらおしまい。進み具合やコースの記録は保存しません。</strong>目はいつも少なくとも片方見えていて、ヒントは何回でも使えます。</p>
        <button type="button" class="pbtn" data-act="trial">最難関を ためす</button>
      </section>
      <section>
        <h3>音</h3>
        <label class="switch"><input type="checkbox" data-set="sound" ${d.settings.sound ? 'checked' : ''}> 音を出す</label>
      </section>
      <section>
        <h3>むずかしさ（「さがす」の初期値）</h3>
        <div class="row" role="radiogroup" aria-label="むずかしさ">
          <label class="radio"><input type="radio" name="diff" value="easy" data-set="difficulty" ${d.settings.difficulty === 'easy' ? 'checked' : ''}> やさしい（1体）</label>
          <label class="radio"><input type="radio" name="diff" value="normal" data-set="difficulty" ${d.settings.difficulty === 'normal' ? 'checked' : ''}> ふつう（2〜3体）</label>
        </div>
        <button type="button" class="pbtn" data-act="tutorial">あそびかた（チュートリアル）を次回もう一度表示</button>
      </section>
      <section>
        <h3>保存について</h3>
        <p>${status}</p>
        ${saveWarn}
        <p>保存するのは、音・むずかしさの設定、途中のゲーム（どこに誰が隠れているか）、コースの進み具合・見つけた数・シールだけです。名前・誕生日・写真・音声などは保存しません。</p>
        <p>データは${where}だけにあります。<strong>${NATIVE ? 'アプリの削除や、別の端末では引き継げません。' : 'アプリ（ホーム画面のアイコン）の削除、ブラウザのデータ削除、別の端末では引き継げません。'}</strong></p>
        ${
          this.confirmDelete
            ? `<p class="warn">このアプリのデータだけを消します。よろしいですか？</p><div class="row"><button type="button" class="pbtn danger" data-act="deleteYes">消す</button><button type="button" class="pbtn" data-act="deleteNo">やめる</button></div>`
            : `<button type="button" class="pbtn" data-act="delete">このアプリのデータを消す</button>`
        }
      </section>
      <section>
        <h3>試遊用の記録（初期値：OFF）</h3>
        <p>ONにすると、この端末の中だけに、回数などの簡単な集計を記録します（さがした回数・ぜんぶ見つけた回数・ヒントの回数・かくした回数・1回の時間のおおまかな区分）。<strong>端末の外へは送信しません。</strong>操作の記録や個人を特定する情報は残しません。OFFに戻すと集計も消えます。</p>
        <label class="switch"><input type="checkbox" data-set="playtest" ${d.playtest.enabled ? 'checked' : ''}> 試遊用の記録をする</label>
        ${
          d.playtest.enabled
            ? `<table class="counts"><tbody>
          <tr><th>さがすを始めた</th><td data-count="searchStarted">${c.searchStarted}</td></tr>
          <tr><th>ぜんぶ見つけた</th><td data-count="searchCompleted">${c.searchCompleted}</td></tr>
          <tr><th>ヒントを使った</th><td data-count="hintsUsed">${c.hintsUsed}</td></tr>
          <tr><th>かくして渡した</th><td data-count="hideRounds">${c.hideRounds}</td></tr>
          <tr><th>1回の時間（1分未満／1〜3分／3分以上）</th><td>${c.durationUnder1m}／${c.duration1to3m}／${c.durationOver3m}</td></tr>
        </tbody></table>
        <button type="button" class="pbtn" data-act="resetCounts">集計を0にする</button>`
            : ''
        }
      </section>
      <section>
        <h3>おわるとき</h3>
        <p>いつでも「おしまい」で終われます。終わるときに購入や評価を求めることはありません。${NATIVE ? '' : 'ブラウザのタブを閉じてもかまいません。'}</p>
      </section>
      <div class="row"><button type="button" class="pbtn primary" data-close data-autofocus>閉じる</button></div>
    </div>`;
  }

  private bindPanel(): void {
    const el = this.el!;
    el.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => this.close()));
    el.querySelectorAll<HTMLInputElement>('[data-set]').forEach((inp) =>
      inp.addEventListener('change', () => {
        const k = inp.dataset.set;
        if (k === 'sound') {
          this.store.update((d) => {
            d.settings.sound = inp.checked;
          });
          setSoundEnabled(inp.checked);
        } else if (k === 'difficulty' && inp.checked) {
          this.store.update((d) => {
            d.settings.difficulty = inp.value === 'normal' ? 'normal' : 'easy';
          });
        } else if (k === 'playtest') {
          setEnabled(this.store, inp.checked);
          this.rerenderPanel('[data-set="playtest"]');
        }
        this.onChange();
      }),
    );
    el.querySelectorAll<HTMLButtonElement>('[data-act]').forEach((b) =>
      b.addEventListener('click', () => {
        switch (b.dataset.act) {
          case 'tutorial':
            this.store.update((d) => {
              d.settings.tutorialSeen = false;
            });
            b.textContent = '次回「さがす」でチュートリアルを表示します';
            b.disabled = true;
            break;
          case 'delete':
            this.confirmDelete = true;
            this.rerenderPanel('[data-act="deleteNo"]');
            break;
          case 'deleteNo':
            this.confirmDelete = false;
            this.rerenderPanel('[data-act="delete"]');
            break;
          case 'deleteYes': {
            const ok = this.store.clearAll();
            setSoundEnabled(this.store.data.settings.sound);
            this.confirmDelete = false;
            this.onCleared();
            this.onChange();
            this.rerenderPanel(
              '[data-act="delete"]',
              ok ? 'このアプリのデータを消しました。' : '保存領域にアクセスできず、消せませんでした（この画面を閉じるとメモリ上の設定は初期値です）。',
            );
            break;
          }
            break;
          case 'trial':
            this.onTrial();
            break;
          case 'resetCounts':
            resetCounters(this.store);
            this.rerenderPanel('[data-act="resetCounts"]');
            break;
        }
      }),
    );
  }

  private rerenderPanel(focusSel: string, note = ''): void {
    const scroll = this.el?.querySelector('.panel')?.scrollTop ?? 0;
    this.mount(this.panelHtml());
    this.bindPanel();
    const panel = this.el!.querySelector('.panel');
    if (panel) panel.scrollTop = scroll;
    if (note) {
      const p = document.createElement('p');
      p.className = 'note';
      p.setAttribute('role', 'status');
      p.textContent = note;
      this.el!.querySelector('[data-act="delete"]')?.before(p);
    }
    this.el!.querySelector<HTMLElement>(focusSel)?.focus({ preventScroll: true });
  }
}
