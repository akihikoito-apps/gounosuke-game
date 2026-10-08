// 画面の流れと入力。ゲームの判定は core、保存は storage に任せる。
import { CHARACTERS, CHARACTER_IDS, FRIEND_UNLOCKS, SCENE_FRIENDS, type CharacterId } from '../core/characters';
import { hasSticker, newStickers, stickerHint } from '../core/stickers';
import { stickerSvg } from './stickerArt';
import { availableCharacters, canPlayCourse, canResume, visibleStickers } from '../core/access';
import { charArtMarkup, faceIcon, fullIcon } from './charArt';
import { allArtUrls, uiArt } from '../art/registry';
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
import { type ContentId, betaEntitlements } from '../entitlements/entitlements';
import { COURSES, FINDS_PER_COURSE, HARDEST, courseDef, courseRound, courseScene, hardestRound } from '../core/courses';
import { accessoryArt } from './accessoryArt';
import { COURSE_COUNT } from '../storage/schema';
import { play, setSoundEnabled, unlockAudio } from '../audio/sound';
import type { Store } from '../storage/storage';
import { record } from '../storage/playtest';
import { ICONS } from './icons';
import { $, btn, prefersReducedMotion, toScene } from './dom';
import { renderScene, sceneThumb } from './sceneView';
import { ParentArea } from './parent';
import { NATIVE } from './platform';


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
  | 'courseSelect'
  | 'stickers'
  | 'bye';

const OUTLINE: Record<Difficulty, number> = { easy: 0.62, normal: 0.34 };
/** 「みーつけた」から自動で次へ進むまで */
const AUTO_NEXT_MS = 2800;

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
  /** コース：遊んでいるコース番号と、その中で何回目の出題か（背景を順に回す） */
  private courseNo = 1;
  private courseRoundIdx = 0;
  /** このラウンドでコースをクリアした（クリア画面を出す） */
  private courseJustCleared = false;
  private afterTutorial: 'search' | 'course' = 'search';
  /** このクリアが初めてか（ごほうびの表示に使う） */
  private courseFirstClear = false;
  /** パックの利用権限（ベータは全開放。本番では正規の購入確認に差し替える） */
  private can = (id: ContentId) => betaEntitlements.canPlay(id);
  /** 最難関のおためし（保存しない。メモリ内だけ） */
  private trial: { finds: number; round: number; used: Partial<Record<SceneId, string[]>> } | null = null;
  /** 「みーつけた」のあと、少し待って自動で次へ */
  private autoTimer = 0;

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
        // データを消したら、待っている知らせも消す（消す前の「もらったよ」を出さない）
        this.toastQueue = [];
        document.querySelectorAll('.toast').forEach((t) => t.remove());
      },
      () => this.startTrial(),
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
    // 絵を先に読み込んでおく（出題の画面で、背景より先にキャラクターだけが見えないように）
    for (const u of allArtUrls()) void decodeImage(u);
    this.render();
  }

  // ---------- 画面切り替え ----------

  private go(s: Screen, lockMs = 350): void {
    this.cancelDrag();
    window.clearTimeout(this.autoTimer);
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
    this.gateStage();
    this.bindScreen();
    // iPhone アプリ版は指でさわる前提。起動直後に青い枠が出ないよう、自動の focus はしない
    if (!NATIVE && !this.parent.isOpen()) {
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
      case 'courseSelect':
        return this.courseSelectHtml();
      case 'stickers':
        return this.stickersHtml();
      case 'bye':
        return this.byeHtml();
    }
  }

  // ---------- 各画面 ----------

  private titleHtml(): string {
    const r0 = this.store.data.resume;
    // 遊べない（パックが無い）背景・友だちの途中は「つづきから」に出さない
    const resume = r0 && canResume(r0, this.can) ? r0 : null;
    const peek = CHARACTER_IDS.map((c) => `<div class="peek peek-${c}">${faceIcon(CHARACTERS[c])}</div>`).join('');
    return `<main class="screen title" data-screen="title">
      <div class="logo" aria-label="もようの かくれんぼ">
        ${artImg('title') ?? `<div class="peeks">${peek}</div>`}
        <h1>もようの<br>かくれんぼ</h1>
        ${NATIVE ? '' : '<p class="beta-tag">かぞく テスト ばん（かりの なまえ）</p>'}
      </div>
      <div class="title-actions">
        ${btn('toCourse', ICONS.course, 'コースで あそぶ', 'big primary', 'data-autofocus')}
        <div class="title-row">
          ${btn('toSearch', ICONS.search, 'さがす', 'mid')}
          ${btn('toHide', ICONS.hide, 'かくして わたす', 'mid secondary')}
        </div>
        ${resume ? btn('resume', ICONS.play, 'つづきから', 'mid') : ''}
      </div>
      <div class="title-foot">
        ${btn('toStickers', ICONS.sticker, `シールちょう ${this.stickerCount()}/${visibleStickers(this.can).length}`, 'small sticker-btn')}
        ${btn('parent', ICONS.parent, 'おとなの かたへ', 'small parent-btn')}
      </div>
    </main>`;
  }

  private sceneCards(action: string): string {
    return SCENE_IDS.filter((id) => this.can(`scene:${id}`))
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

  private courseSelectHtml(): string {
    const p = this.store.data.course;
    const next = Math.min(COURSE_COUNT, p.cleared + 1);
    const tiles = COURSES.map((c) => {
      const cleared = c.no <= p.cleared;
      // 進み具合で開いていて、しかもパックで遊べるコース
      const open = c.no <= next && canPlayCourse(c.no, this.can);
      const now = c.no === p.current && p.finds > 0 && !cleared;
      const label = `コース${c.no}${cleared ? ' クリア' : open ? '' : ' まだ'}`;
      const pips = now
        ? `<span class="tile-pips" aria-hidden="true">${'<i class="on"></i>'.repeat(p.finds)}${'<i></i>'.repeat(FINDS_PER_COURSE - p.finds)}</span>`
        : '';
      const badge = cleared ? `<span class="badge">${ICONS.star}</span>` : open ? '' : `<span class="badge">${ICONS.lock}</span>`;
      return `<button type="button" class="course-tile${cleared ? ' cleared' : ''}${open ? '' : ' locked'}${c.no === next && !cleared ? ' next' : ''}" data-action="pickCourse" data-course="${c.no}" aria-label="${label}" ${open ? '' : 'disabled'}${c.no === next ? ' data-autofocus' : ''}><span class="num">${c.no}</span>${badge}${courseMark(c.no)}${pips}</button>`;
    }).join('');
    return `<main class="screen setup course-select" data-screen="courseSelect">
      <header class="topbar">${btn('home', ICONS.back, 'もどる', 'round')}<h2>コースを えらぶ</h2><span></span></header>
      <div class="course-grid">${tiles}</div>
    </main>`;
  }

  /** コース中の進み具合（10この まる） */
  private courseProgressHtml(): string {
    const n = this.courseFindsShown();
    return `<div class="course-progress" role="status" aria-label="コース${this.courseNo} ${n}/${FINDS_PER_COURSE}"><span class="course-no">${this.courseNo}</span>${Array.from({ length: FINDS_PER_COURSE }, (_, k) => `<i class="pip${k < n ? ' on' : ''}"></i>`).join('')}</div>`;
  }

  private courseFindsShown(): number {
    return this.courseJustCleared ? FINDS_PER_COURSE : this.store.data.course.finds;
  }

  private stickerCount(): number {
    const d = this.store.data;
    return visibleStickers(this.can).filter((x) => hasSticker(x, d.course.cleared, d.collection.totalFinds, d.collection.sceneFinds)).length;
  }

  /** シールちょう：もらったシールと、まだのシール（何をするともらえるか） */
  private stickersHtml(): string {
    const d = this.store.data;
    const cells = visibleStickers(this.can).map((x) => {
      const got = hasSticker(x, d.course.cleared, d.collection.totalFinds, d.collection.sceneFinds);
      return got
        ? `<figure class="sticker got" aria-label="${x.name}">${stickerSvg(x)}<figcaption>${x.name}</figcaption></figure>`
        : `<figure class="sticker locked" aria-label="まだ。${stickerHint(x)}"><div class="sticker-q" aria-hidden="true">？</div><figcaption>${stickerHint(x)}</figcaption></figure>`;
    }).join('');
    return `<main class="screen setup stickers" data-screen="stickers">
      <header class="topbar">${btn('home', ICONS.back, 'もどる', 'round')}<h2>シールちょう <span class="count">${this.stickerCount()}/${visibleStickers(this.can).length}</span></h2><span></span></header>
      <p class="sticker-note">みつけた かず：${d.collection.totalFinds}かい</p>
      <div class="sticker-grid">${cells}</div>
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
          `<div class="target${s.found[i] ? ' found' : ''}" data-target="${i}" aria-label="${CHARACTERS[pl.char].name}${pl.acc?.hat ? '（ぼうし）' : ''}${s.found[i] ? ' みつけた' : ''}">${this.targetIcon(pl, i)}${s.found[i] ? `<span class="check">${ICONS.done}</span>` : ''}</div>`,
      )
      .join('');
    const done = isComplete(s);
    return `<main class="screen play" data-screen="play" data-origin="${s.origin}">
      <div class="bar">
        ${btn('home', ICONS.home, 'おしまい', 'round')}
        <div class="targets" role="status" aria-label="さがす こ">${targets}</div>
        ${btn('hint', ICONS.hint, 'ヒント', 'round hint-btn', done ? 'disabled' : '')}
      </div>
      ${s.origin === 'course' ? this.courseProgressHtml() : s.origin === 'trial' ? this.trialProgressHtml() : ''}
      <div class="stage" id="stage">${this.playSvg()}</div>
      ${done ? (s.origin === 'course' ? this.courseClearHtml() : s.origin === 'trial' ? this.trialClearHtml() : this.clearHtml()) : ''}
    </main>`;
  }

  private playSvg(): string {
    const s = this.session as PlaySession;
    const scene = SCENES[s.sceneId];
    return renderScene(scene, {
      prefix: 'g-',
      placements: s.placements,
      found: s.found,
      outline: s.origin === 'course' ? courseDef(this.courseNo).outline : s.origin === 'trial' ? HARDEST.outline : OUTLINE[s.difficulty],
      shade: s.origin === 'trial' ? HARDEST.shade : 1,
      hint: currentHint(scene, s),
      title: `${scene.name}。かくれている こを さがして タッチ`,
    });
  }

  private clearHtml(): string {
    const s = this.session as PlaySession;
    const faces = s.placements.map((pl, i) => `<div class="clear-face">${this.targetIcon(pl, i, 'cf')}</div>`).join('');
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

  private courseClearHtml(): string {
    const s = this.session as PlaySession;
    const faces = s.placements.map((pl, i) => `<div class="clear-face">${this.targetIcon(pl, i, 'cf')}</div>`).join('');
    if (this.courseJustCleared) {
      const last = this.courseNo >= COURSE_COUNT;
      return `<div class="overlay clear course-clear" role="dialog" aria-modal="true" aria-label="コース${this.courseNo} クリア">
        <div class="clear-card">
          <div class="medal" aria-hidden="true">${ICONS.star}<span>${this.courseNo}</span></div>
          <p class="clear-title">コース${this.courseNo} クリア！</p>
          ${this.courseRewardHtml()}
          ${last ? '<p class="clear-sub">ぜんぶの コースを クリアしたよ</p>' : ''}
          <div class="clear-actions two">
            ${last ? btn('toCourse', ICONS.course, 'コースを えらぶ', 'equal', 'data-autofocus') : btn('nextCourse', ICONS.next, 'つぎの コース', 'equal primary', 'data-autofocus')}
            ${btn('bye', ICONS.bye, 'おしまい', 'equal')}
          </div>
        </div>
      </div>`;
    }
    return `<div class="overlay clear" role="dialog" aria-modal="true" aria-label="みつけた">
      <div class="clear-card">
        <div class="clear-faces">${faces}</div>
        <p class="clear-title">みーつけた！</p>
        <div class="clear-actions two">
          ${btn('nextRound', ICONS.next, 'つぎ', 'equal primary auto-next', 'data-autofocus')}
          ${btn('bye', ICONS.bye, 'おしまい', 'equal')}
        </div>
      </div>
    </div>`;
  }

  /** 探す子のアイコン。帽子をかぶっていれば、アイコンにも帽子（何を探すか分かるように） */
  private targetIcon(pl: Placement, i: number, prefix = 'ti'): string {
    const base = faceIcon(CHARACTERS[pl.char]);
    if (!pl.acc?.hat || !this.session) return base;
    const hat = accessoryArt(SCENES[this.session.sceneId], { ...pl, acc: { hat: pl.acc.hat, tone: pl.acc.tone } }, `${prefix}${i}`, 1).front;
    return base.replace('viewBox="-70 -215 140 120"', 'viewBox="-78 -250 156 155"').replace(/<\/svg>$/, `${hat}</svg>`);
  }

  /** コースクリアのごほうび：そのコースのシール、コース1・5では新しい友だち */
  private courseRewardHtml(): string {
    // 初めてクリアしたときだけ（もう一度クリアしても「あたらしい」とは言わない）
    if (!this.courseFirstClear) return '';
    const st = visibleStickers(this.can).find((x) => x.kind === 'course' && x.need === this.courseNo);
    const sticker = st ? `<div class="reward-sticker">${stickerSvg(st)}<p>シールを もらったよ！</p></div>` : '';
    const nf = FRIEND_UNLOCKS.find((f) => f.course === this.courseNo && this.can(`char:${f.char}`));
    const friend = nf
      ? `<div class="new-friend">${faceIcon(CHARACTERS[nf.char])}<p>あたらしい ともだち<br><strong>${CHARACTERS[nf.char].name}</strong>が なかまに なったよ！</p></div>`
      : '';
    return `<div class="rewards">${sticker}${friend}</div>`;
  }

  private trialProgressHtml(): string {
    const n = Math.min(HARDEST.finds, this.trial?.finds ?? 0);
    return `<div class="course-progress trial" role="status" aria-label="おためし ${n}/${HARDEST.finds}"><span class="course-no">おためし</span>${Array.from({ length: HARDEST.finds }, (_, k) => `<i class="pip${k < n ? ' on' : ''}"></i>`).join('')}</div>`;
  }

  private trialClearHtml(): string {
    const s = this.session as PlaySession;
    if ((this.trial?.finds ?? 0) >= HARDEST.finds) {
      return `<div class="overlay clear course-clear" role="dialog" aria-modal="true" aria-label="10にん みつけた">
        <div class="clear-card">
          <div class="medal" aria-hidden="true">${ICONS.star}<span>10</span></div>
          <p class="clear-title">10にん みつけた！</p>
          <p class="clear-sub">おためし おしまい</p>
          <div class="clear-actions two">
            ${btn('trialAgain', ICONS.again, 'もういちど', 'equal', 'data-autofocus')}
            ${btn('parent', ICONS.parent, 'おとなの かたへ', 'equal')}
          </div>
        </div>
      </div>`;
    }
    const faces = s.placements.map((pl, i) => `<div class="clear-face">${this.targetIcon(pl, i, 'cf')}</div>`).join('');
    return `<div class="overlay clear" role="dialog" aria-modal="true" aria-label="みつけた">
      <div class="clear-card">
        <div class="clear-faces">${faces}</div>
        <p class="clear-title">みーつけた！</p>
        <div class="clear-actions two">
          ${btn('nextTrialRound', ICONS.next, 'つぎ', 'equal primary auto-next', 'data-autofocus')}
          ${btn('home', ICONS.home, 'おしまい', 'equal')}
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
    const cards = this.allowedChars().map((c) => {
      const on = sel.includes(c);
      const defs = patternMarkup(`hc-${c}`, scene.costumes[0].spec);
      return `<button type="button" class="char-card${on ? ' on' : ''}" data-action="pickChar" data-char="${c}" aria-pressed="${on}" aria-label="${CHARACTERS[c].name}">${fullIcon(CHARACTERS[c], defs, `hc-${c}`)}<span class="lbl">${CHARACTERS[c].name}</span>${on ? `<span class="check">${ICONS.done}</span>` : ''}</button>`;
    }).join('');
    return `<main class="screen setup" data-screen="hideChars">
      <header class="topbar">${btn('toHide', ICONS.back, 'もどる', 'round')}<h2>だれを かくす？</h2><span></span></header>
      <div class="cards chars${this.allowedChars().length > 3 ? ' many' : ''}">${cards}</div>
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
      case 'toStickers':
        this.go('stickers');
        break;
      case 'toCourse':
        this.session = null;
        this.courseJustCleared = false;
        this.go('courseSelect');
        break;
      case 'pickCourse':
        this.startCourse(Number(el.dataset.course));
        break;
      case 'nextRound':
        this.startCourseRound();
        break;
      case 'retryLoad':
        this.render();
        break;
      case 'nextTrialRound':
        this.startTrialRound();
        break;
      case 'trialAgain':
        this.startTrial();
        break;
      case 'nextCourse':
        this.startCourse(Math.min(COURSE_COUNT, this.courseNo + 1));
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
        this.trial = null;
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
        this.afterTutorial = 'search';
        this.go('tutorial');
        break;
      case 'backFromTutorial':
        this.go(this.afterTutorial === 'course' ? 'courseSelect' : 'searchSetup');
        break;
      case 'startSearch':
        this.searchScene = el.dataset.scene as SceneId;
        this.afterTutorial = 'search';
        if (!this.store.data.settings.tutorialSeen) this.go('tutorial');
        else this.startSearch();
        break;
      case 'tutorialDone':
        this.store.update((x) => {
          x.settings.tutorialSeen = true;
        });
        if (this.afterTutorial === 'course') this.startCourseRound();
        else this.startSearch();
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
    const placements = autoLayout(scene, difficulty, seed, this.allowedChars());
    this.session = newSession(scene.id, difficulty, placements, 'search', Date.now());
    record(this.store, { type: 'searchStarted' });
    this.saveResume();
    this.go('play');
  }

  private startCourse(no: number): void {
    const p = this.store.data.course;
    const open = Math.min(COURSE_COUNT, p.cleared + 1);
    if (!Number.isInteger(no) || no < 1 || no > open) return;
    // パックで遊べないコースは始めない（「つぎの コース」からも同じ）
    if (!canPlayCourse(no, this.can)) return this.go('courseSelect');
    this.courseNo = no;
    this.courseRoundIdx = 0;
    this.courseJustCleared = false;
    // つづきのコースなら見つけた回数を引き継ぐ。ほかのコースは 0 から
    if (p.current !== no) {
      this.store.update((d) => {
        d.course.current = no;
        d.course.finds = 0;
      });
    }
    this.afterTutorial = 'course';
    if (!this.store.data.settings.tutorialSeen) this.go('tutorial');
    else this.startCourseRound();
  }

  private startCourseRound(): void {
    if (this.courseJustCleared) return this.startCourse(Math.min(COURSE_COUNT, this.courseNo + 1));
    const ids = SCENE_IDS.filter((id) => this.can(`scene:${id}`));
    const scene = SCENES[courseScene(this.courseNo, this.courseRoundIdx++, ids)];
    const remaining = FINDS_PER_COURSE - this.store.data.course.finds;
    const seed = (Date.now() ^ (++this.seedCounter * 2654435761)) >>> 0;
    const placements = courseRound(scene, this.courseNo, remaining, seed, this.allowedChars());
    const c = courseDef(this.courseNo);
    this.session = newSession(scene.id, c.variant === 'exact' ? 'normal' : 'easy', placements, 'course', Date.now());
    record(this.store, { type: 'searchStarted' });
    this.go('play');
  }

  /** いま遊べるキャラクター（コース1でにゃこ、コース5でぽぽが仲間に） */
  private allowedChars(): CharacterId[] {
    return availableCharacters(this.store.data.course.cleared, this.store.data.collection.sceneFinds, this.can);
  }

  /** 見つけた合計回数を数え、回数のシールをもらえたら知らせる（コースクリアのシールはクリア画面で） */
  private countFind(): void {
    const sceneId = this.session?.sceneId;
    const before = { cleared: this.store.data.course.cleared, totalFinds: this.store.data.collection.totalFinds, sceneFinds: { ...this.store.data.collection.sceneFinds } };
    this.store.update((d) => {
      d.collection.totalFinds = Math.min(9999, d.collection.totalFinds + 1);
      if (sceneId) d.collection.sceneFinds[sceneId] = Math.min(9999, (d.collection.sceneFinds[sceneId] ?? 0) + 1);
    });
    const after = { cleared: before.cleared, totalFinds: this.store.data.collection.totalFinds, sceneFinds: this.store.data.collection.sceneFinds };
    // 背景パックの友だち：その背景で初めて見つけたら仲間に
    for (const f of SCENE_FRIENDS) {
      if ((before.sceneFinds[f.scene] ?? 0) === 0 && (after.sceneFinds[f.scene] ?? 0) >= 1 && this.can(`char:${f.char}`)) {
        this.toast(`<div class="toast-sticker">${faceIcon(CHARACTERS[f.char])}</div><p>あたらしい ともだち<br>${CHARACTERS[f.char].name}が なかまに なったよ！</p>`);
      }
    }
    for (const st of newStickers(before, after).filter((x) => visibleStickers(this.can).includes(x))) this.toast(`<div class="toast-sticker">${stickerSvg(st)}</div><p>シール ゲット！<br>${st.name}</p>`);
  }

  /** 画面のじゃまをしない小さな知らせ（2.6秒で消える）。重ならないよう1つずつ順番に出す */
  private toastQueue: string[] = [];
  private toastBusy = false;

  private toast(html: string): void {
    this.toastQueue.push(html);
    if (!this.toastBusy) this.nextToast();
  }

  private nextToast(): void {
    const html = this.toastQueue.shift();
    if (html === undefined) {
      this.toastBusy = false;
      return;
    }
    this.toastBusy = true;
    const t = document.createElement('div');
    t.className = 'toast';
    t.setAttribute('role', 'status');
    t.innerHTML = html;
    document.body.appendChild(t);
    window.setTimeout(() => {
      t.remove();
      this.nextToast();
    }, 2600);
  }

  /** コース：1回見つけるごとに進める。10回でクリア */
  private onCourseFind(): void {
    const no = this.courseNo;
    let cleared = false;
    this.store.update((d) => {
      if (d.course.current !== no) {
        d.course.current = no;
        d.course.finds = 0;
      }
      d.course.finds += 1;
      if (d.course.finds >= FINDS_PER_COURSE) {
        this.courseFirstClear = d.course.cleared < no;
        d.course.cleared = Math.max(d.course.cleared, no);
        d.course.current = Math.min(COURSE_COUNT, no + 1);
        d.course.finds = 0;
        cleared = true;
      }
    });
    if (cleared) this.courseJustCleared = true;
  }

  /** 最難関のおためし：保護者の画面から。進み具合は保存しない */
  startTrial(): void {
    this.parent.close();
    if (!this.can('trial:hardest')) return this.go('title');
    this.trial = { finds: 0, round: 0, used: {} };
    this.startTrialRound();
  }

  private startTrialRound(): void {
    const t = this.trial;
    if (!t || t.finds >= HARDEST.finds) return this.go('title');
    const ids = SCENE_IDS.filter((id) => this.can(`scene:${id}`));
    const sceneId = ids[t.round % ids.length];
    t.round++;
    const seed = (Date.now() ^ (++this.seedCounter * 2654435761)) >>> 0;
    const placements = hardestRound(SCENES[sceneId], HARDEST.finds - t.finds, seed, t.used[sceneId] ?? [], this.allowedChars());
    if (placements.length === 0) {
      // 安全に置ける場所がない（起こらない想定）。空の画面は出さない
      this.trial = null;
      return this.go('title');
    }
    t.used[sceneId] = [...(t.used[sceneId] ?? []), ...placements.map((p) => p.spot)];
    this.session = newSession(sceneId, 'normal', placements, 'trial', Date.now());
    this.go('play');
  }

  /** コース・おためしの「みーつけた」：少し待って自動で次へ（ボタンでもすぐ進める） */
  private scheduleAutoNext(): void {
    window.clearTimeout(this.autoTimer);
    const s = this.session;
    if (!s || (s.origin !== 'course' && s.origin !== 'trial')) return;
    const btnEl = this.root.querySelector<HTMLElement>('[data-action="nextRound"], [data-action="nextTrialRound"]');
    if (!btnEl) return; // コースクリア・おためし終了の画面では待つ
    this.autoTimer = window.setTimeout(() => {
      if (this.session !== s || this.screen !== 'play' || this.parent.isOpen()) return;
      if (s.origin === 'course') this.startCourseRound();
      else this.startTrialRound();
    }, AUTO_NEXT_MS);
  }

  private onHint(): void {
    if (!this.session) return;
    this.session = nextHint(this.session);
    if (this.session.origin !== 'trial') record(this.store, { type: 'hint' });
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
    // 遊べない背景・友だちの途中からは再開しない（保存データは購入の証明ではない）
    if (!canResume(r, this.can)) return this.render();
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
    // コースは見つけた回数を別に保存している（出題そのものは続きにしない）。おためしは何も保存しない
    if (!s || isComplete(s) || s.origin === 'course' || s.origin === 'trial') return;
    const origin = s.origin;
    this.store.update((d) => {
      d.resume = { sceneId: s.sceneId, difficulty: s.difficulty, placements: s.placements, found: s.found, origin };
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

  private renderToken = 0;

  /**
   * 画面に使う絵（背景・柄・小物・キャラクター）がすべて読み込まれ、展開されるまで、
   * ステージ全体を隠して入力も止める。別の画面に移ったら、古い読み込みでは表示しない。
   */
  private gateStage(): void {
    const stage = this.root.querySelector<HTMLElement>('#stage');
    if (!stage) return;
    const hrefs = [...new Set([...stage.querySelectorAll('image')].map((im) => im.getAttribute('href') ?? '').filter(Boolean))];
    const token = ++this.renderToken;
    // すでに読み込み済みの絵だけなら、隠さずそのまま（選び直しや描き直しで入力を止めない）
    if (hrefs.every((h) => readyImages.has(h))) return;
    stage.classList.add('loading');
    const reveal = () => {
      if (token !== this.renderToken) return;
      // 展開のあと、描画が1回終わってから見せる
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (token === this.renderToken) stage.classList.remove('loading');
      }));
    };
    Promise.all(hrefs.map(decodeImage)).then((oks) => {
      if (token !== this.renderToken) return;
      // 1枚でも読めなければ出題しない（小物や顔が欠けたまま遊ばせない）
      if (oks.every(Boolean)) reveal();
      else this.showLoadError();
    });
  }

  /** 絵を読めなかったとき：ステージは隠したまま、もういちど／もどる を出す */
  private showLoadError(): void {
    const main = this.root.querySelector('main');
    if (!main || main.querySelector('.load-error')) return;
    main.insertAdjacentHTML(
      'beforeend',
      `<div class="overlay load-error" role="alertdialog" aria-label="えを よみこめませんでした"><div class="clear-card"><p class="clear-sub">えを よみこめませんでした</p><div class="clear-actions two">${btn('retryLoad', ICONS.again, 'もういちど', 'equal primary', 'data-autofocus')}${btn('home', ICONS.home, 'もどる', 'equal')}</div></div></div>`,
    );
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
    if (this.session.origin === 'course') this.onCourseFind();
    if (this.session.origin === 'trial' && this.trial) this.trial.finds++;
    else this.countFind();
    if (isComplete(this.session)) {
      // おためしは保存も集計もしない
      if (this.session.origin !== 'trial') {
        record(this.store, { type: 'searchCompleted', durationMs: Date.now() - this.session.startedAt });
        this.clearResume();
      }
      const delay = prefersReducedMotion() ? 300 : 1300;
      this.refreshStage();
      this.updateTargets();
      const s = this.session;
      window.setTimeout(() => {
        if (this.session === s && this.screen === 'play') {
          play('clear');
          this.navLockUntil = performance.now() + 400;
          this.render();
          this.scheduleAutoNext();
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
    const cp = this.root.querySelector<HTMLElement>('.course-progress');
    if (cp && s.origin === 'course') cp.outerHTML = this.courseProgressHtml();
    if (cp && s.origin === 'trial') cp.outerHTML = this.trialProgressHtml();
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
      spots: this.session ? this.session.placements.map((p) => getSpot(SCENES[this.session!.sceneId], p.spot)).map((s) => ({ id: s.id, x: s.x, y: s.y, s: s.s })) : [],
    };
  }
}

const decoded = new Map<string, Promise<boolean>>();
const readyImages = new Set<string>();

/** 絵を読み込んで展開する（同じ絵は1回だけ）。失敗しても止めない */
/** 読めたら true。失敗したものは覚えておかない（もういちどで読み直せる） */
function decodeImage(url: string): Promise<boolean> {
  let p = decoded.get(url);
  if (!p) {
    const im = new Image();
    im.src = url;
    p = (im.decode ? im.decode() : new Promise<void>((res, rej) => ((im.onload = () => res()), (im.onerror = () => rej()))))
      .then(() => {
        readyImages.add(url);
        return true;
      })
      .catch(() => {
        decoded.delete(url);
        return false;
      });
    decoded.set(url, p);
  }
  return p;
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

/** コースの札の小さな目印：帽子・傘が出てくるコースが分かるように */
function courseMark(no: number): string {
  const c = courseDef(no);
  const hat = c.hat
    ? '<svg class="mark" viewBox="0 0 40 40" aria-hidden="true"><path d="M7 30 C6 14 34 14 33 30Z" fill="#E59A86" stroke="#4A3A40" stroke-width="3" stroke-linejoin="round"/><rect x="6" y="27" width="28" height="7" rx="3" fill="#C97A68" stroke="#4A3A40" stroke-width="3"/><circle cx="20" cy="11" r="4.5" fill="#E59A86" stroke="#4A3A40" stroke-width="3"/></svg>'
    : '';
  const umb = c.umbrella
    ? '<svg class="mark" viewBox="0 0 40 40" aria-hidden="true"><path d="M4 20 C6 6 34 6 36 20Z" fill="#8DB7D9" stroke="#4A3A40" stroke-width="3" stroke-linejoin="round"/><path d="M20 20 V32 Q20 36 16 35" fill="none" stroke="#4A3A40" stroke-width="3" stroke-linecap="round"/></svg>'
    : '';
  return hat || umb ? `<span class="marks">${hat}${umb}</span>` : '';
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
