// 画面の流れと入力。ゲームの判定は core、保存は storage に任せる。
import { CHARACTERS, CHARACTER_IDS, type CharacterId } from '../core/characters';
import { charArtMarkup, faceIcon, fullIcon } from './charArt';
import { uiArt } from '../art/registry';
import { patternMarkup } from '../core/patterns';
import { type Difficulty, type Placement, autoLayout, freeSpots, getSpot, validateLayout } from '../core/placement';
import type { SceneDef, SceneId } from '../core/scene';
import { SCENES, SCENE_IDS } from '../core/scenes';
import {
  type PlaySession,
  TAP_DEBOUNCE_MS,
  currentHint,
  isComplete,
  newSession,
  nextHint,
  tap,
} from '../core/session';
import {
  type HideDraft,
  allPlaced,
  chooseScene,
  emptyDraft,
  placeAt,
  placeOnSpot,
  select,
  setChars,
  setCostume,
  toPlacements,
  undo,
} from '../core/hideEditor';
import { betaEntitlements } from '../entitlements/entitlements';
import { play, setSoundEnabled, unlockAudio } from '../audio/sound';
import type { Store } from '../storage/storage';
import { record } from '../storage/playtest';
import { ICONS } from './icons';
import { $, btn, prefersReducedMotion, toScene } from './dom';
import { renderScene, sceneThumb } from './sceneView';
import { ParentArea } from './parent';

type Screen =
  | 'title'
  | 'searchSetup'
  | 'tutorial'
  | 'play'
  | 'handoff'
  | 'hideScene'
  | 'hideChars'
  | 'hideCostume'
  | 'hidePlace'
  | 'bye';

const OUTLINE: Record<Difficulty, number> = { easy: 0.62, normal: 0.34 };

export class App {
  private root: HTMLElement;
  private store: Store;
  private screen: Screen = 'title';
  private session: PlaySession | null = null;
  private justFound = -1;
  private draft: HideDraft = emptyDraft();
  private multi = false;
  private searchScene: SceneId = 'room';
  private lastTap = 0;
  private navLockUntil = 0;
  private parent: ParentArea;
  private drag: {
    char: CharacterId;
    x0: number;
    y0: number;
    moved: boolean;
    pointerId: number;
    ghost: HTMLElement | null;
    fromScene: boolean;
  } | null = null;
  private resizeObs: ResizeObserver | null = null;
  private seedCounter = 0;

  constructor(root: HTMLElement, store: Store) {
    this.root = root;
    this.store = store;
    setSoundEnabled(store.data.settings.sound);
    this.parent = new ParentArea(
      store,
      () => this.render(),
      () => {
        this.session = null;
        this.draft = emptyDraft();
      },
    );
    root.addEventListener('click', (e) => this.onClick(e));
    // 最初の操作のあとだけ音を出せるようにする
    const unlock = () => unlockAudio();
    window.addEventListener('pointerdown', unlock, { once: true, capture: true });
    window.addEventListener('keydown', unlock, { once: true, capture: true });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.parent.close();
        this.cancelDrag();
        this.saveResume();
      }
    });
    window.addEventListener('pointercancel', () => this.cancelDrag());
    window.addEventListener('blur', () => this.cancelDrag());
  }

  start(): void {
    this.render();
  }

  // ---------- 画面切り替え ----------

  private go(s: Screen, lockMs = 350): void {
    this.cancelDrag();
    this.screen = s;
    this.justFound = -1;
    this.navLockUntil = performance.now() + lockMs;
    this.render();
  }

  render(): void {
    this.resizeObs?.disconnect();
    this.resizeObs = null;
    const html = this.screenHtml();
    this.root.innerHTML = html;
    this.root.dataset.current = this.screen;
    this.bindScreen();
    if (!this.parent.isOpen()) {
      const focusEl = this.root.querySelector<HTMLElement>('[data-autofocus]');
      focusEl?.focus({ preventScroll: true });
    }
  }

  private screenHtml(): string {
    switch (this.screen) {
      case 'title':
        return this.titleHtml();
      case 'searchSetup':
        return this.searchSetupHtml();
      case 'tutorial':
        return this.tutorialHtml();
      case 'play':
        return this.playHtml();
      case 'handoff':
        return this.handoffHtml();
      case 'hideScene':
        return this.hideSceneHtml();
      case 'hideChars':
        if (!this.draft.sceneId) {
          this.screen = 'title';
          return this.titleHtml();
        }
        return this.hideCharsHtml();
      case 'hideCostume':
        if (!this.draft.sceneId || this.draft.chars.length === 0) {
          this.screen = 'title';
          return this.titleHtml();
        }
        return this.hideCostumeHtml();
      case 'hidePlace':
        if (!this.draft.sceneId || this.draft.chars.length === 0) {
          this.screen = 'title';
          return this.titleHtml();
        }
        return this.hidePlaceHtml();
      case 'bye':
        return this.byeHtml();
    }
  }

  // ---------- 各画面 ----------

  private titleHtml(): string {
    const resume = this.store.data.resume;
    const peek = CHARACTER_IDS.map((c) => `<div class="peek peek-${c}">${faceIcon(CHARACTERS[c])}</div>`).join('');
    return `<main class="screen title" data-screen="title">
      <div class="logo" aria-label="もようの かくれんぼ">
        ${artImg('title') ?? `<div class="peeks">${peek}</div>`}
        <h1>もようの<br>かくれんぼ</h1>
        <p class="beta-tag">かぞく テスト ばん（かりの なまえ）</p>
      </div>
      <div class="title-actions">
        ${btn('toSearch', ICONS.search, 'さがす', 'big primary', 'data-autofocus')}
        ${btn('toHide', ICONS.hide, 'かくして わたす', 'big secondary')}
        ${resume ? btn('resume', ICONS.play, 'つづきから', 'mid') : ''}
      </div>
      ${btn('parent', ICONS.parent, 'おとなの かたへ', 'small parent-btn')}
    </main>`;
  }

  private sceneCards(action: string): string {
    return SCENE_IDS.filter((id) => betaEntitlements.canPlay(`scene:${id}`))
      .map(
        (id) =>
          `<button type="button" class="scene-card" data-action="${action}" data-scene="${id}" aria-label="${SCENES[id].name}">${sceneThumb(SCENES[id])}<span class="lbl">${SCENES[id].name}</span></button>`,
      )
      .join('');
  }

  private searchSetupHtml(): string {
    const d = this.store.data.settings.difficulty;
    return `<main class="screen setup" data-screen="searchSetup">
      <header class="topbar">${btn('home', ICONS.back, 'もどる', 'round')}<h2>どこで さがす？</h2>${btn('tutorial', ICONS.question, 'あそびかた', 'round')}</header>
      <div class="diff" role="group" aria-label="むずかしさ">
        ${btn('diff', ICONS.easy, 'やさしい', `seg${d === 'easy' ? ' on' : ''}`, `data-diff="easy" aria-pressed="${d === 'easy'}"`)}
        ${btn('diff', ICONS.normal, 'ふつう', `seg${d === 'normal' ? ' on' : ''}`, `data-diff="normal" aria-pressed="${d === 'normal'}"`)}
      </div>
      <div class="cards">${this.sceneCards('startSearch')}</div>
    </main>`;
  }

  private tutorialHtml(): string {
    const c = CHARACTERS.koro;
    const stripe = patternMarkup('tut-stripe', SCENES.room.costumes[1].spec);
    const stripeChar = patternMarkup('tut-char', SCENES.room.costumes[1].spec, 'translate(-500 -560)');
    return `<main class="screen tutorial" data-screen="tutorial">
      <header class="topbar">${btn('backFromTutorial', ICONS.back, 'もどる', 'round')}<h2>みつけて タッチ！</h2><span></span></header>
      <div class="tut-stage">
        <svg viewBox="250 300 500 360" class="tut-svg" aria-label="しまもようの カーテンに かくれた ころを タッチすると、かおを だして てを ふる">
          <defs>${stripe}${stripeChar}</defs>
          <rect x="250" y="300" width="500" height="360" fill="url(#tut-stripe)"/>
          <g class="tut-char" transform="translate(500 560)">${fullCharInner(c.id, 'tut-char')}</g>
          <g transform="translate(0 0)">${tutBox()}</g>
          <g class="tut-stars">${[[-110, -120], [110, -110], [-80, -200], [90, -190]].map(([x, y]) => `<path transform="translate(${500 + x} ${560 + y})" d="M0 -14 L4 -4 L14 0 L4 4 L0 14 L-4 4 L-14 0 L-4 -4Z" fill="#FFD45C" stroke="#fff" stroke-width="2"/>`).join('')}</g>
          <g class="tut-hand"><path d="M0 0 C-4 -10 6 -14 10 -6 L16 8 L18 -24 C18 -32 30 -32 30 -24 L30 4 L34 -4 C38 -10 48 -6 44 2 L40 26 C36 40 24 46 12 44 C2 42 -4 34 -6 26 Z" fill="#F5C58E" stroke="#4A3A40" stroke-width="3.5" stroke-linejoin="round"/></g>
        </svg>
      </div>
      <div class="actions">${btn('tutorialDone', ICONS.play, 'やってみる', 'big primary', 'data-autofocus')}</div>
    </main>`;
  }

  private playHtml(): string {
    const s = this.session;
    if (!s) return this.titleHtml();
    const targets = s.placements
      .map(
        (pl, i) =>
          `<div class="target${s.found[i] ? ' found' : ''}" data-target="${i}" aria-label="${CHARACTERS[pl.char].name}${s.found[i] ? ' みつけた' : ''}">${faceIcon(CHARACTERS[pl.char])}${s.found[i] ? `<span class="check">${ICONS.done}</span>` : ''}</div>`,
      )
      .join('');
    const done = isComplete(s);
    return `<main class="screen play" data-screen="play" data-origin="${s.origin}">
      <div class="bar">
        ${btn('home', ICONS.home, 'おしまい', 'round')}
        <div class="targets" role="status" aria-label="さがす こ">${targets}</div>
        ${btn('hint', ICONS.hint, 'ヒント', 'round hint-btn', done ? 'disabled' : '')}
      </div>
      <div class="stage" id="stage">${this.playSvg()}</div>
      ${done ? this.clearHtml() : ''}
    </main>`;
  }

  private playSvg(): string {
    const s = this.session as PlaySession;
    const scene = SCENES[s.sceneId];
    return renderScene(scene, {
      prefix: 'g-',
      placements: s.placements,
      found: s.found,
      outline: OUTLINE[s.difficulty],
      hint: currentHint(scene, s),
      title: `${scene.name}。かくれている こを さがして タッチ`,
    });
  }

  private clearHtml(): string {
    const s = this.session as PlaySession;
    const faces = s.placements.map((pl) => `<div class="clear-face">${faceIcon(CHARACTERS[pl.char])}</div>`).join('');
    return `<div class="overlay clear" role="dialog" aria-modal="true" aria-label="ぜんぶ みつけた">
      <div class="clear-card">
        <div class="clear-faces">${faces}</div>
        <p class="clear-title">みーつけた！</p>
        <div class="clear-actions">
          ${btn('again', ICONS.again, 'もういちど', 'equal', 'data-autofocus')}
          ${btn('swap', ICONS.swap, 'こうたい', 'equal')}
          ${btn('bye', ICONS.bye, 'おしまい', 'equal')}
        </div>
      </div>
    </div>`;
  }

  private handoffHtml(): string {
    return `<main class="screen handoff" data-screen="handoff">
      <header class="topbar">${btn('handoffBack', ICONS.back, 'かくしなおす', 'round small-lbl')}<span></span><span></span></header>
      <div class="handoff-art" aria-hidden="true">${artImg('handoff') ?? handoffArt()}</div>
      <p class="handoff-text">つぎの ひとに わたしてね</p>
      <div class="actions">${btn('ready', ICONS.ready, 'じゅんび できた', 'big primary')}</div>
    </main>`;
  }

  private hideSceneHtml(): string {
    return `<main class="screen setup" data-screen="hideScene">
      <header class="topbar">${btn('home', ICONS.back, 'もどる', 'round')}<h2>どこに かくす？</h2><span></span></header>
      <div class="cards">${this.sceneCards('hidePickScene')}</div>
    </main>`;
  }

  private hideCharsHtml(): string {
    const scene = SCENES[this.draft.sceneId as SceneId];
    const sel = this.draft.chars;
    const cards = CHARACTER_IDS.map((c) => {
      const on = sel.includes(c);
      const defs = patternMarkup(`hc-${c}`, scene.costumes[0].spec);
      return `<button type="button" class="char-card${on ? ' on' : ''}" data-action="pickChar" data-char="${c}" aria-pressed="${on}" aria-label="${CHARACTERS[c].name}">${fullIcon(CHARACTERS[c], defs, `hc-${c}`)}<span class="lbl">${CHARACTERS[c].name}</span>${on ? `<span class="check">${ICONS.done}</span>` : ''}</button>`;
    }).join('');
    return `<main class="screen setup" data-screen="hideChars">
      <header class="topbar">${btn('toHide', ICONS.back, 'もどる', 'round')}<h2>だれを かくす？</h2><span></span></header>
      <div class="cards chars">${cards}</div>
      <div class="actions">
        ${btn('toggleMulti', ICONS.multi, this.multi ? 'ひとりだけ にする' : 'ふたり いじょう', `mid${this.multi ? ' on' : ''}`, `aria-pressed="${this.multi}"`)}
        ${btn('charsNext', ICONS.next, 'つぎへ', 'mid primary', sel.length ? '' : 'disabled')}
      </div>
    </main>`;
  }

  private hideCostumeHtml(): string {
    const d = this.draft;
    const scene = SCENES[d.sceneId as SceneId];
    const cur = d.selected ?? d.chars[0];
    const tabs =
      d.chars.length > 1
        ? `<div class="tabs" role="group" aria-label="だれの ふく？">${d.chars
            .map(
              (c) =>
                `<button type="button" class="tab${c === cur ? ' on' : ''}" data-action="costumeTab" data-char="${c}" aria-pressed="${c === cur}" aria-label="${CHARACTERS[c].name}">${faceIcon(CHARACTERS[c])}</button>`,
            )
            .join('')}</div>`
        : '';
    const big = (() => {
      const cid = d.costumes[cur] as string;
      const spec = scene.costumes.find((x) => x.id === cid)!.spec;
      return fullIcon(CHARACTERS[cur], patternMarkup('cos-big', spec), 'cos-big');
    })();
    const swatches = scene.costumes
      .map((c) => {
        const on = d.costumes[cur] === c.id;
        const pid = `sw-${c.id}`;
        return `<button type="button" class="swatch${on ? ' on' : ''}" data-action="pickCostume" data-costume="${c.id}" aria-pressed="${on}" aria-label="${costumeName(c.kind)}"><svg viewBox="0 0 100 100" aria-hidden="true"><defs>${patternMarkup(pid, c.spec)}</defs><circle cx="50" cy="50" r="44" fill="url(#${pid})" stroke="#4A3A40" stroke-width="4"/></svg>${on ? `<span class="check">${ICONS.done}</span>` : ''}</button>`;
      })
      .join('');
    return `<main class="screen costume" data-screen="hideCostume">
      <header class="topbar">${btn('backToChars', ICONS.back, 'もどる', 'round')}<h2>どの ふく？</h2><span></span></header>
      ${tabs}
      <div class="costume-body">
        <div class="costume-preview" aria-hidden="true">${big}</div>
        <div class="swatches" role="group" aria-label="ふくの もよう">${swatches}</div>
      </div>
      <div class="actions">${btn('costumeNext', ICONS.next, 'おきに いく', 'mid primary', 'data-autofocus')}</div>
    </main>`;
  }

  private hidePlaceHtml(): string {
    const d = this.draft;
    const tray = d.chars
      .map((c) => {
        const scene = SCENES[d.sceneId as SceneId];
        const spec = scene.costumes.find((x) => x.id === d.costumes[c])!.spec;
        const on = d.selected === c;
        const placed = !!d.placed[c];
        return `<button type="button" class="tray-char${on ? ' on' : ''}${placed ? ' placed' : ''}" data-tray="${c}" aria-pressed="${on}" aria-label="${CHARACTERS[c].name}${placed ? ' おいた' : ''}">${fullIcon(CHARACTERS[c], patternMarkup(`tr-${c}`, spec), `tr-${c}`)}</button>`;
      })
      .join('');
    return `<main class="screen place" data-screen="hidePlace">
      <div class="bar">
        ${btn('backToCostume', ICONS.costume, 'ふくを かえる', 'round')}
        <div class="tray" role="group" aria-label="かくす こ">${tray}</div>
        ${btn('undo', ICONS.undo, 'とりけし', 'round', d.history.length ? '' : 'disabled')}
        ${btn('hideDone', ICONS.done, 'できた', 'round done-btn', allPlaced(d) ? '' : 'disabled')}
      </div>
      <div class="stage" id="stage">${this.editSvg()}</div>
    </main>`;
  }

  private editSvg(): string {
    const d = this.draft;
    const scene = SCENES[d.sceneId as SceneId];
    const placements = d.chars
      .filter((c) => d.placed[c])
      .map((c) => ({ char: c, spot: d.placed[c] as string, costume: d.costumes[c] as string, variant: 'exact' as const }));
    const occupiedByOthers = Object.entries(d.placed)
      .filter(([c, v]) => v && c !== d.selected)
      .map(([, v]) => v as string);
    return renderScene(scene, {
      prefix: 'e-',
      placements,
      outline: 0.7,
      candidates: d.selected ? freeSpots(scene, occupiedByOthers) : [],
      selectedChar: d.selected,
      title: `${scene.name}。かくす ばしょを えらんでね`,
    });
  }

  private byeHtml(): string {
    const faces = CHARACTER_IDS.map((c) => `<div class="bye-face">${faceIcon(CHARACTERS[c])}</div>`).join('');
    return `<main class="screen bye" data-screen="bye">
      ${artImg('bye') ?? `<div class="bye-faces">${faces}</div>`}
      <p class="bye-text">またね！</p>
      <div class="actions">${btn('home', ICONS.home, 'はじめに もどる', 'mid', 'data-autofocus')}</div>
    </main>`;
  }

  // ---------- 入力 ----------

  private onClick(e: MouseEvent): void {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!el || !this.root.contains(el) || (el as HTMLButtonElement).disabled) return;
    if (performance.now() < this.navLockUntil) return;
    const a = el.dataset.action as string;
    play('pop');
    switch (a) {
      case 'toSearch':
        this.go('searchSetup');
        break;
      case 'toHide':
        this.draft = emptyDraft();
        this.multi = false;
        this.go('hideScene');
        break;
      case 'resume':
        this.resume();
        break;
      case 'parent':
        this.parent.openGate(el);
        break;
      case 'home':
        this.saveResume();
        this.session = null; // 続きは保存側だけに持つ（削除後に書き戻さない）
        this.go('title');
        break;
      case 'diff': {
        const d = el.dataset.diff as Difficulty;
        this.store.update((x) => {
          x.settings.difficulty = d;
        });
        this.render();
        break;
      }
      case 'tutorial':
        this.go('tutorial');
        break;
      case 'backFromTutorial':
        this.go('searchSetup');
        break;
      case 'startSearch':
        this.searchScene = el.dataset.scene as SceneId;
        if (!this.store.data.settings.tutorialSeen) this.go('tutorial');
        else this.startSearch();
        break;
      case 'tutorialDone':
        this.store.update((x) => {
          x.settings.tutorialSeen = true;
        });
        this.startSearch();
        break;
      case 'hint':
        this.onHint();
        break;
      case 'again':
        this.onAgain();
        break;
      case 'swap':
        this.onSwap();
        break;
      case 'bye':
        this.session = null;
        this.clearResume();
        this.go('bye');
        break;
      case 'hidePickScene':
        this.draft = chooseScene(this.draft, el.dataset.scene as SceneId);
        this.draft = setChars(this.draft, ['koro'], SCENES[this.draft.sceneId as SceneId]);
        this.go('hideChars');
        break;
      case 'pickChar':
        this.onPickChar(el.dataset.char as CharacterId);
        break;
      case 'toggleMulti':
        this.multi = !this.multi;
        if (!this.multi && this.draft.chars.length > 1) {
          this.draft = setChars(this.draft, [this.draft.chars[0]], this.hideScene());
        }
        this.render();
        break;
      case 'charsNext':
        this.draft = select(this.draft, this.draft.chars[0]);
        this.go('hideCostume');
        break;
      case 'costumeTab':
        this.draft = select(this.draft, el.dataset.char as CharacterId);
        this.render();
        break;
      case 'pickCostume': {
        const c = this.draft.selected ?? this.draft.chars[0];
        this.draft = setCostume(this.draft, c, el.dataset.costume as string, this.hideScene());
        this.render();
        break;
      }
      case 'backToChars':
        this.go('hideChars');
        break;
      case 'costumeNext': {
        const firstUnplaced = this.draft.chars.find((c) => !this.draft.placed[c]) ?? this.draft.selected;
        this.draft = select(this.draft, firstUnplaced ?? null);
        this.go('hidePlace');
        break;
      }
      case 'backToCostume':
        this.go('hideCostume');
        break;
      case 'undo':
        this.draft = undo(this.draft);
        this.render();
        break;
      case 'hideDone':
        this.onHideDone();
        break;
      case 'handoffBack':
        this.session = null;
        this.clearResume();
        this.go('hidePlace');
        break;
      case 'ready':
        this.onReady();
        break;
    }
  }

  private hideScene(): SceneDef {
    return SCENES[this.draft.sceneId as SceneId];
  }

  private onPickChar(c: CharacterId): void {
    const cur = this.draft.chars;
    let next: CharacterId[];
    if (!this.multi) next = [c];
    else if (cur.includes(c)) next = cur.length > 1 ? cur.filter((x) => x !== c) : cur;
    else next = [...cur, c].slice(0, 3);
    this.draft = setChars(this.draft, next, this.hideScene());
    this.render();
  }

  private startSearch(): void {
    const difficulty = this.store.data.settings.difficulty;
    const scene = SCENES[this.searchScene];
    const seed = (Date.now() ^ (++this.seedCounter * 2654435761)) >>> 0;
    const placements = autoLayout(scene, difficulty, seed);
    this.session = newSession(scene.id, difficulty, placements, 'search', Date.now());
    record(this.store, { type: 'searchStarted' });
    this.saveResume();
    this.go('play');
  }

  private onHint(): void {
    if (!this.session) return;
    this.session = nextHint(this.session);
    record(this.store, { type: 'hint' });
    play('soft');
    this.refreshStage();
  }

  private onAgain(): void {
    const s = this.session;
    if (!s) return this.go('title');
    if (s.origin === 'search') {
      this.searchScene = s.sceneId;
      this.startSearch();
    } else {
      // 同じ人が もういちど かくす（同じキャラクター・服のまま、置き場所から）
      this.draft = { ...this.draft, placed: {}, history: [], selected: this.draft.chars[0] ?? null };
      this.session = null;
      this.clearResume();
      this.go('hidePlace');
    }
  }

  private onSwap(): void {
    const s = this.session;
    const sceneId = s?.sceneId ?? 'room';
    this.session = null;
    this.clearResume();
    this.multi = false;
    this.draft = setChars(chooseScene(emptyDraft(), sceneId), ['koro'], SCENES[sceneId]);
    this.go('hideChars');
  }

  private onHideDone(): void {
    const scene = this.hideScene();
    if (!allPlaced(this.draft)) return;
    const placements = toPlacements(this.draft);
    const check = validateLayout(scene, placements);
    if (!check.ok) {
      // 起こらない想定。安全側として置き直しに戻す。
      console.warn('layout rejected', check.problems);
      this.draft = { ...this.draft, placed: {}, history: [], selected: this.draft.chars[0] ?? null };
      this.render();
      return;
    }
    this.session = newSession(scene.id, 'normal', placements, 'hide', Date.now());
    this.saveResume();
    this.go('handoff', 700);
  }

  private onReady(): void {
    if (!this.session) return this.go('title');
    record(this.store, { type: 'hideRound' });
    record(this.store, { type: 'searchStarted' });
    this.session = { ...this.session, startedAt: Date.now() };
    this.go('play');
  }

  private resume(): void {
    const r = this.store.data.resume;
    if (!r) return;
    this.session = { ...newSession(r.sceneId, r.difficulty, r.placements, r.origin, Date.now()), found: r.found.slice() };
    if (r.origin === 'hide') this.draft = draftFromPlacements(r.sceneId, r.placements);
    if (isComplete(this.session)) {
      this.session = null;
      this.clearResume();
      this.render();
      return;
    }
    // 隠したあとの再開は、受け渡しの目隠し画面から
    this.go(r.origin === 'hide' ? 'handoff' : 'play', r.origin === 'hide' ? 700 : 350);
  }

  private saveResume(): void {
    const s = this.session;
    if (!s || isComplete(s)) return;
    this.store.update((d) => {
      d.resume = { sceneId: s.sceneId, difficulty: s.difficulty, placements: s.placements, found: s.found, origin: s.origin };
    });
  }

  private clearResume(): void {
    if (this.store.data.resume) {
      this.store.update((d) => {
        d.resume = null;
      });
    }
  }

  // ---------- 画面ごとのイベント ----------

  private bindScreen(): void {
    const stage = this.root.querySelector<HTMLElement>('#stage');
    if (stage && typeof ResizeObserver !== 'undefined') {
      this.resizeObs = new ResizeObserver(() => {
        const r = stage.getBoundingClientRect();
        stage.classList.toggle('compact', Math.min(r.width, r.height) < 360);
      });
      this.resizeObs.observe(stage);
    }
    if (this.screen === 'play') this.bindPlay();
    if (this.screen === 'hidePlace') this.bindPlace();
  }

  private stageSvg(): SVGSVGElement | null {
    return this.root.querySelector<SVGSVGElement>('#stage svg');
  }

  private bindPlay(): void {
    const stage = $(this.root, '#stage');
    stage.addEventListener('pointerdown', (e) => this.onPlayPointer(e));
    this.decorateStage();
  }

  private decorateStage(): void {
    const s = this.session;
    if (!s) return;
    const svg = this.stageSvg();
    if (!svg) return;
    if (this.justFound >= 0) svg.querySelector(`.char[data-index="${this.justFound}"]`)?.classList.add('just-found');
    const h = currentHint(SCENES[s.sceneId], s);
    if (h && h.level >= 2) svg.querySelector(`.char[data-index="${h.index}"]`)?.classList.add('wiggle');
  }

  private refreshStage(): void {
    if (this.screen !== 'play' || !this.session) return;
    const stage = this.root.querySelector<HTMLElement>('#stage');
    if (!stage) return;
    stage.innerHTML = this.playSvg();
    this.decorateStage();
  }

  private onPlayPointer(e: PointerEvent): void {
    if (!e.isPrimary || !this.session || isComplete(this.session)) return;
    const now = performance.now();
    if (now - this.lastTap < TAP_DEBOUNCE_MS) return;
    this.lastTap = now;
    const svg = this.stageSvg();
    if (!svg) return;
    const p = toScene(svg, e.clientX, e.clientY);
    if (!p) return;
    const scene = SCENES[this.session.sceneId];
    const r = tap(scene, this.session, p);
    if (r.foundIndex < 0) {
      this.ripple(e.clientX, e.clientY);
      return;
    }
    this.session = r.session;
    this.justFound = r.foundIndex;
    play('found');
    if (isComplete(this.session)) {
      record(this.store, { type: 'searchCompleted', durationMs: Date.now() - this.session.startedAt });
      this.clearResume();
      const delay = prefersReducedMotion() ? 300 : 1300;
      this.refreshStage();
      this.updateTargets();
      const s = this.session;
      window.setTimeout(() => {
        if (this.session === s && this.screen === 'play') {
          play('clear');
          this.navLockUntil = performance.now() + 400;
          this.render();
        }
      }, delay);
    } else {
      this.saveResume();
      this.refreshStage();
      this.updateTargets();
    }
  }

  private updateTargets(): void {
    const s = this.session;
    if (!s) return;
    s.found.forEach((f, i) => {
      const t = this.root.querySelector<HTMLElement>(`[data-target="${i}"]`);
      if (t && f && !t.classList.contains('found')) {
        t.classList.add('found');
        t.insertAdjacentHTML('beforeend', `<span class="check">${ICONS.done}</span>`);
        t.setAttribute('aria-label', `${CHARACTERS[s.placements[i].char].name} みつけた`);
      }
    });
    const hb = this.root.querySelector<HTMLButtonElement>('[data-action="hint"]');
    if (hb) hb.disabled = isComplete(s);
  }

  /** 外れたときの、色の付かないやさしい波紋（罰ではない） */
  private ripple(x: number, y: number): void {
    if (prefersReducedMotion()) return;
    const r = document.createElement('div');
    r.className = 'ripple';
    r.style.left = `${x}px`;
    r.style.top = `${y}px`;
    document.body.appendChild(r);
    window.setTimeout(() => r.remove(), 500);
  }

  // ----- 置く（ドラッグ／タップ→タップ） -----

  private bindPlace(): void {
    this.root.querySelectorAll<HTMLElement>('[data-tray]').forEach((el) => {
      el.addEventListener('pointerdown', (e) => this.beginDrag(e, el.dataset.tray as CharacterId, false));
      // キーボード：Enter/Space で選ぶ
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const c = el.dataset.tray as CharacterId;
          this.draft = select(this.draft, c);
          this.render();
          this.root.querySelector<HTMLElement>(`[data-tray="${c}"]`)?.focus({ preventScroll: true });
        }
      });
    });
    const stage = $(this.root, '#stage');
    stage.querySelectorAll<SVGGElement>('.candidate').forEach((g) => {
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const c = this.draft.selected;
          if (!c) return;
          this.draft = placeOnSpot(this.draft, c, g.dataset.spot as string, this.hideScene());
          this.render();
          this.root.querySelector<HTMLElement>(`[data-tray="${c}"]`)?.focus({ preventScroll: true });
        }
      });
    });
    stage.addEventListener('pointerdown', (e) => {
      if (!e.isPrimary) return;
      const charEl = (e.target as Element).closest<SVGGElement>('.char');
      if (charEl) {
        this.beginDrag(e, charEl.dataset.char as CharacterId, true);
        return;
      }
      this.beginDrag(e, null, true);
    });
  }

  private beginDrag(e: PointerEvent, char: CharacterId | null, fromScene: boolean): void {
    if (!e.isPrimary || this.drag) return;
    e.preventDefault();
    if (char === null) {
      // シーンの空き場所のタップ：選択中の子をそこへ
      this.tapCleanup?.();
      const screenAtStart = this.screen;
      const done = () => {
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onCancel);
        this.tapCleanup = null;
      };
      const onUp = (ev: PointerEvent) => {
        if (ev.pointerId !== e.pointerId) return;
        done();
        if (this.screen !== screenAtStart) return;
        if (Math.hypot(ev.clientX - e.clientX, ev.clientY - e.clientY) > 24) return;
        this.placeSelectedAt(ev.clientX, ev.clientY, (e.target as Element).closest<SVGGElement>('.candidate')?.dataset.spot);
      };
      const onCancel = (ev: PointerEvent) => {
        if (ev.pointerId === e.pointerId) done();
      };
      this.tapCleanup = done;
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onCancel);
      return;
    }
    this.drag = { char, x0: e.clientX, y0: e.clientY, moved: false, pointerId: e.pointerId, ghost: null, fromScene };
    const move = (ev: PointerEvent) => {
      const d = this.drag;
      if (!d || ev.pointerId !== d.pointerId) return;
      if (!d.moved && Math.hypot(ev.clientX - d.x0, ev.clientY - d.y0) > 12) {
        d.moved = true;
        d.ghost = this.makeGhost(d.char);
      }
      if (d.ghost) {
        d.ghost.style.transform = `translate(${ev.clientX}px, ${ev.clientY}px)`;
      }
    };
    const up = (ev: PointerEvent) => {
      const d = this.drag;
      if (!d || ev.pointerId !== d.pointerId) return;
      cleanup();
      this.drag = null;
      d.ghost?.remove();
      if (d.moved) {
        const svg = this.stageSvg();
        const rect = svg?.getBoundingClientRect();
        const inside = rect && ev.clientX >= rect.left && ev.clientX <= rect.right && ev.clientY >= rect.top && ev.clientY <= rect.bottom;
        if (svg && inside) {
          const p = toScene(svg, ev.clientX, ev.clientY);
          if (p) {
            this.draft = placeAt(select(this.draft, d.char), d.char, p, this.hideScene());
            play('pop');
          }
        }
        this.render();
      } else {
        // タップ：選ぶ（タップ→タップで置く）
        this.draft = select(this.draft, d.char);
        this.render();
      }
    };
    const cancel = (ev: PointerEvent) => {
      if (this.drag && ev.pointerId === this.drag.pointerId) this.cancelDrag();
    };
    const cleanup = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      this.dragCleanup = null;
    };
    this.dragCleanup = cleanup;
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
  }

  private dragCleanup: (() => void) | null = null;
  private tapCleanup: (() => void) | null = null;

  private cancelDrag(): void {
    this.tapCleanup?.();
    if (!this.drag) return;
    this.drag.ghost?.remove();
    this.dragCleanup?.();
    this.drag = null;
  }

  private makeGhost(c: CharacterId): HTMLElement {
    const scene = this.hideScene();
    const spec = scene.costumes.find((x) => x.id === this.draft.costumes[c])!.spec;
    const g = document.createElement('div');
    g.className = 'ghost';
    g.innerHTML = fullIcon(CHARACTERS[c], patternMarkup('ghost-p', spec), 'ghost-p');
    document.body.appendChild(g);
    return g;
  }

  private placeSelectedAt(x: number, y: number, spotId?: string): void {
    const c = this.draft.selected;
    if (!c) return;
    const scene = this.hideScene();
    if (spotId) {
      this.draft = placeOnSpot(this.draft, c, spotId, scene);
    } else {
      const svg = this.stageSvg();
      if (!svg) return;
      const p = toScene(svg, x, y);
      if (!p) return;
      this.draft = placeAt(this.draft, c, p, scene);
    }
    play('pop');
    this.render();
  }

  /** テスト用：現在の配置（座標はシーン座標） */
  debugState(): unknown {
    return {
      screen: this.screen,
      session: this.session,
      draft: this.draft,
      spots: this.session ? this.session.placements.map((p) => getSpot(SCENES[this.session!.sceneId], p.spot)).map((s) => ({ id: s.id, x: s.x, y: s.y })) : [],
    };
  }
}

function draftFromPlacements(sceneId: SceneId, placements: Placement[]): HideDraft {
  const d = emptyDraft();
  d.sceneId = sceneId;
  d.chars = placements.map((p) => p.char);
  for (const p of placements) {
    d.costumes[p.char] = p.costume;
    d.placed[p.char] = p.spot;
  }
  d.selected = d.chars[0] ?? null;
  return d;
}

function artImg(name: 'title' | 'handoff' | 'bye'): string | null {
  const u = uiArt(name);
  return u ? `<img class="ui-art ui-art-${name}" src="${u}" alt="" draggable="false">` : null;
}

function costumeName(kind: string): string {
  return ({ plain: 'むじ', stripes: 'しましま', dots: 'みずたま', check: 'チェック', leaf: 'はっぱ', wood: 'もくめ' } as Record<string, string>)[kind] ?? kind;
}

function fullCharInner(c: CharacterId, fillId: string): string {
  // チュートリアル用：見つかる前/後の2つを重ね、CSSで切り替える
  const ch = CHARACTERS[c];
  return `<g class="tut-hidden">${charInner(ch.id, fillId, false)}</g><g class="tut-found">${charInner(ch.id, fillId, true)}</g>`;
}

function charInner(c: CharacterId, fillId: string, found: boolean): string {
  return charArtMarkup(CHARACTERS[c], { fillId, outline: 0.6, found });
}

function tutBox(): string {
  return `<rect x="420" y="505" width="160" height="80" rx="8" fill="#E9785F" stroke="#4A3A40" stroke-width="3.5"/><rect x="414" y="500" width="172" height="20" rx="7" fill="#F29A7E" stroke="#4A3A40" stroke-width="3.5"/>`;
}

function handoffArt(): string {
  const hand = (flip: boolean) =>
    `<g transform="${flip ? 'translate(300 0) scale(-1 1)' : ''}"><path d="M20 120 C40 110 70 108 92 112 L110 100 C118 96 124 106 118 112 L104 124 L104 150 C80 160 50 160 20 150 Z" fill="#F5C58E" stroke="#4A3A40" stroke-width="4" stroke-linejoin="round"/></g>`;
  return `<svg viewBox="0 0 300 200"><rect x="95" y="60" width="110" height="80" rx="12" fill="#7EA6DA" stroke="#4A3A40" stroke-width="4"/><rect x="105" y="70" width="90" height="60" rx="6" fill="#FFF6DC"/><path d="M135 98 q15 -18 30 0" stroke="#4A3A40" stroke-width="4" fill="none" stroke-linecap="round"/>${hand(false)}${hand(true)}<path d="M120 40 Q150 10 180 40" fill="none" stroke="#F2A9B8" stroke-width="6" stroke-linecap="round"/><path d="M172 26 L182 42 L164 44" fill="none" stroke="#F2A9B8" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
