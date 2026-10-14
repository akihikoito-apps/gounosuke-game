// じぶんの へや（おままごと）の画面。
// 下の「ともだち／もの」から部屋へ動かして置く。置いたものは指で動かせる。
// 友だちをソファ・ベッド・ブランコの近くで はなすと座る。下の棚へ もどすと しまえる。
// もの をタップすると 左右が入れかわり、友だちをタップすると ぴょんと はねる。
import { itemArtFile, roomArtFile } from '../art/registry';
import { CHARACTERS, type CharacterId } from '../core/characters';
import {
  ITEM_BY_ID,
  MAX_PLACED,
  type ItemDef,
  type Placed,
  type RoomDef,
  type RoomId,
  ROOMS,
  clampToFloor,
  depthScale,
  starterLayout,
} from '../core/myroom';
import { patternMarkup } from '../core/patterns';
import type { PatternSpec } from '../core/patterns';
import { charArtMarkup, faceIcon } from './charArt';
import { toScene } from './dom';

/** 部屋での友だちの服（いつもの服。柄は背景にまぎれない、やさしい色） */
const OUTFIT: Record<string, PatternSpec> = {
  koro: { kind: 'stripes', bg: '#FFF1D6', fg: '#F2B880', size: 30 },
  mimi: { kind: 'dots', bg: '#DDF0E2', fg: '#FFFFFF', size: 30 },
  moko: { kind: 'check', bg: '#EEE6FA', fg: '#CDBDEB', size: 34 },
  nyako: { kind: 'stripes', bg: '#DCEAF6', fg: '#A9C9E6', size: 28 },
  popo: { kind: 'dots', bg: '#F8E0E0', fg: '#FFFFFF', size: 30 },
  choki: { kind: 'check', bg: '#FDE6DA', fg: '#F4B9A0', size: 32 },
};

const L = 'stroke="#4A3A40" stroke-width="5" stroke-linejoin="round"';

function itemArt(it: ItemDef, part = ''): string {
  const f = itemArtFile(part ? `${it.id}-${part}` : it.id);
  if (f) return `<image href="${f}" x="-150" y="-300" width="300" height="300"/>`;
  if (part) return '';
  // 絵が無いときの かんたんな形
  const w = it.w;
  const h = it.flat ? 30 : Math.min(200, w * 0.6);
  return it.flat
    ? `<ellipse cx="0" cy="-${h / 2}" rx="${w / 2}" ry="${h / 2}" fill="#F3D9B8" ${L}/>`
    : `<rect x="${-w / 2}" y="${-h}" width="${w}" height="${h}" rx="18" fill="#F6E4C8" ${L}/>`;
}

export interface MyRoomDeps {
  /** 置ける友だち・もの・へや（進み具合とパック） */
  chars: () => CharacterId[];
  items: () => ItemDef[];
  rooms: () => RoomDef[];
  current: () => RoomId;
  load: (room: RoomId) => Placed[] | undefined;
  save: (room: RoomId, list: Placed[], current: RoomId) => void;
  sound: (name: 'pop' | 'found') => void;
  /** 部屋を切りかえたとき、画面ごと描き直す */
  rerender: () => void;
}

type Drag = {
  idx: number;
  pointerId: number;
  dx: number;
  dy: number;
  startX: number;
  startY: number;
  moved: boolean;
  fromTray?: boolean;
};

export class MyRoomView {
  private room: RoomId = 'living';
  private list: Placed[] = [];
  private tab: 'chars' | 'items' = 'chars';
  private drag: Drag | null = null;
  private el: HTMLElement | null = null;

  constructor(private deps: MyRoomDeps) {}

  /** 開くとき：前に開いていた部屋（まだ開いていなければ リビング） */
  open(): void {
    const open = this.deps.rooms();
    const cur = this.deps.current();
    this.room = open.some((r) => r.id === cur) ? cur : 'living';
    this.loadRoom();
  }

  private def(): RoomDef {
    return ROOMS.find((r) => r.id === this.room) ?? ROOMS[0];
  }

  private loadRoom(): void {
    const saved = this.deps.load(this.room);
    const chars = new Set(this.deps.chars());
    const items = new Set(this.deps.items().map((i) => i.id));
    const usable = (p: Placed) => {
      const [k, id] = p.ref.split(':');
      return k === 'char' ? chars.has(id as CharacterId) : items.has(id);
    };
    const base = saved ?? starterLayout(this.room);
    // 使えなくなったもの（パック外など）は出さない。座っている先が消えたら床に下ろす
    const keep = base.map((p, i) => ({ p, i })).filter(({ p }) => usable(p));
    const map = new Map(keep.map(({ i }, j) => [i, j]));
    this.list = keep.map(({ p }) => {
      const q: Placed = { ...p };
      if (q.on) {
        const ni = map.get(q.on.idx);
        if (ni === undefined) delete q.on;
        else q.on = { idx: ni, seat: q.on.seat };
      }
      return q;
    });
    if (!saved) this.persist();
  }

  private persist(): void {
    this.deps.save(this.room, this.list, this.room);
  }

  // ---------- 描画 ----------

  html(backBtn: string): string {
    const rooms = this.deps.rooms();
    const tabs =
      rooms.length > 1
        ? `<div class="mr-rooms" role="tablist" aria-label="へや">${rooms
            .map((r) => `<button type="button" class="mr-room-tab${r.id === this.room ? ' on' : ''}" data-mr-room="${r.id}" role="tab" aria-selected="${r.id === this.room}">${r.name}</button>`)
            .join('')}</div>`
        : `<h2>${this.def().name}</h2>`;
    return `<main class="screen myroom" data-screen="myroom">
      <header class="topbar">${backBtn}${tabs}<span></span></header>
      <div class="stage mr-stage" id="stage">${this.svg()}</div>
      ${this.trayHtml()}
    </main>`;
  }

  private placedScale(i: number): number {
    const p = this.list[i];
    if (p.on) return this.placedScale(p.on.idx);
    return depthScale(this.def(), p.y);
  }

  /** 座っている友だちの位置（座る もの と座席から） */
  private seatPos(p: Placed): { x: number; y: number } | null {
    if (!p.on) return null;
    const base = this.list[p.on.idx];
    const it = base && ITEM_BY_ID[base.ref.split(':')[1]];
    const seat = it?.seats?.[p.on.seat];
    if (!seat) return null;
    const s = depthScale(this.def(), base.y);
    const f = base.flip ? -1 : 1;
    return { x: base.x + seat.x * s * f, y: base.y + seat.y * s };
  }

  private objMarkup(i: number): string {
    const p = this.list[i];
    const [kind, id] = p.ref.split(':');
    const pos = this.seatPos(p) ?? { x: p.x, y: p.y };
    const s = this.placedScale(i);
    const f = p.flip ? -1 : 1;
    const tf = `translate(${r1(pos.x)} ${r1(pos.y)}) scale(${r1s(s * f)} ${r1s(s)})`;
    if (kind === 'char') {
      const c = CHARACTERS[id as CharacterId];
      const fill = `mr-fill-${id}`;
      return `<g class="mr-obj mr-char${p.on ? ' seated' : ''}" data-idx="${i}" transform="${tf}"><g class="mr-hop"><ellipse cx="0" cy="2" rx="60" ry="9" fill="#4A3A40" opacity="${p.on ? 0 : 0.12}"/>${charArtMarkup(c, { fillId: fill, outline: 1, found: true })}</g></g>`;
    }
    const it = ITEM_BY_ID[id];
    const motion = it.motion ? ` mr-m-${it.motion}` : '';
    if (it.id === 'swing') {
      // ブランコ：座っている友だちも板といっしょに ゆれる
      const riders = this.list
        .map((q, j) => ({ q, j }))
        .filter(({ q }) => q.on?.idx === i)
        .map(({ q, j }) => {
          const seat = it.seats![q.on!.seat];
          const c = CHARACTERS[q.ref.split(':')[1] as CharacterId];
          return `<g class="mr-obj mr-char seated rider" data-idx="${j}" transform="translate(${seat.x} ${seat.y})">${charArtMarkup(c, { fillId: `mr-fill-${c.id}`, outline: 1, found: true })}</g>`;
        })
        .join('');
      return `<g class="mr-obj mr-item" data-idx="${i}" transform="${tf}">${itemArt(it)}<g class="mr-swing-seat">${itemArt(it, 'seat')}${riders}</g></g>`;
    }
    const extra = it.id === 'fishtank' ? `<g class="mr-fish">${itemArt(it, 'fish')}</g>` : '';
    return `<g class="mr-obj mr-item${motion}" data-idx="${i}" transform="${tf}"><g class="mr-move">${itemArt(it)}${extra}</g></g>`;
  }

  /** 奥から順に描く。敷物がいちばん奥。座っている子は、座っている もの のすぐ後 */
  private order(): number[] {
    const idx = this.list.map((_, i) => i);
    const isFlat = (i: number) => {
      const [k, id] = this.list[i].ref.split(':');
      return k === 'item' && !!ITEM_BY_ID[id]?.flat;
    };
    const roots = idx.filter((i) => !this.list[i].on).sort((a, b) => Number(isFlat(b)) - Number(isFlat(a)) || this.list[a].y - this.list[b].y);
    const out: number[] = [];
    for (const r of roots) {
      out.push(r);
      const base = this.list[r];
      if (base.ref === 'item:swing') continue; // ブランコの子は板の中で描く
      out.push(...idx.filter((i) => this.list[i].on?.idx === r));
    }
    return out;
  }

  private svg(): string {
    const room = this.def();
    const bg = roomArtFile(room.id);
    const back = bg
      ? `<image href="${bg}" x="0" y="0" width="1000" height="1000"/>`
      : `<rect width="1000" height="${room.floorTop}" fill="#F6E4C8"/><rect y="${room.floorTop}" width="1000" height="${1000 - room.floorTop}" fill="#E8C194"/>`;
    const defs = Object.entries(OUTFIT)
      .map(([c, spec]) => patternMarkup(`mr-fill-${c}`, spec))
      .join('');
    const objs = this.order().map((i) => this.objMarkup(i)).join('');
    const empty = this.list.length === 0 ? '' : '';
    return `<svg class="scene-svg mr-svg" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${room.name}。したの ともだちや ものを うごかして おいてね"><defs>${defs}</defs><g class="bg">${back}</g><g class="mr-objs">${objs}</g>${empty}</svg>`;
  }

  private placedRefs(): Set<string> {
    return new Set(this.list.map((p) => p.ref));
  }

  private trayHtml(): string {
    const placed = this.placedRefs();
    const cells =
      this.tab === 'chars'
        ? this.deps
            .chars()
            .map((c) => {
              const on = placed.has(`char:${c}`);
              return `<button type="button" class="mr-cell${on ? ' placed' : ''}" data-mr-ref="char:${c}" aria-label="${CHARACTERS[c].name}${on ? '（へやに いる）' : ''}">${faceIcon(CHARACTERS[c])}</button>`;
            })
            .join('')
        : this.deps
            .items()
            .map((it) => {
              const on = placed.has(`item:${it.id}`);
              const f = itemArtFile(it.id);
              // 小さい物も大きく見えるよう、物の大きさに合わせて切り取る
              const side = TALL[it.id] ?? Math.max(it.w * 1.15, 100);
              const icon = f ? `<svg viewBox="${-side / 2} ${-side + 8} ${side} ${side}" aria-hidden="true"><image href="${f}" x="-150" y="-300" width="300" height="300"/>${it.id === 'swing' && itemArtFile('swing-seat') ? `<image href="${itemArtFile('swing-seat')}" x="-150" y="-300" width="300" height="300"/>` : ''}</svg>` : `<span>${it.name}</span>`;
              return `<button type="button" class="mr-cell item${on ? ' placed' : ''}" data-mr-ref="item:${it.id}" aria-label="${it.name}${on ? '（へやに ある）' : ''}">${icon}</button>`;
            })
            .join('');
    return `<div class="mr-tray" aria-label="おくもの">
      <div class="mr-tabs" role="tablist">
        <button type="button" class="mr-tab${this.tab === 'chars' ? ' on' : ''}" data-mr-tab="chars" role="tab" aria-selected="${this.tab === 'chars'}">ともだち</button>
        <button type="button" class="mr-tab${this.tab === 'items' ? ' on' : ''}" data-mr-tab="items" role="tab" aria-selected="${this.tab === 'items'}">もの</button>
      </div>
      <div class="mr-cells">${cells}</div>
    </div>`;
  }

  // ---------- 操作 ----------

  bind(main: HTMLElement): void {
    this.el = main;
    const stage = main.querySelector<HTMLElement>('#stage');
    stage?.addEventListener('pointerdown', (e) => this.onStageDown(e));
    main.addEventListener('pointermove', (e) => this.onMove(e));
    main.addEventListener('pointerup', (e) => this.onUp(e));
    main.addEventListener('pointercancel', () => this.cancelDrag());
    main.addEventListener('click', (e) => this.onClick(e));
    main.querySelector('.mr-cells')?.addEventListener('pointerdown', (e) => this.onTrayDown(e as PointerEvent));
  }

  private svgEl(): SVGSVGElement | null {
    return this.el?.querySelector<SVGSVGElement>('#stage svg') ?? null;
  }

  private redraw(): void {
    const stage = this.el?.querySelector<HTMLElement>('#stage');
    if (stage) stage.innerHTML = this.svg();
    const tray = this.el?.querySelector<HTMLElement>('.mr-tray');
    if (tray) {
      tray.outerHTML = this.trayHtml();
      this.el?.querySelector('.mr-cells')?.addEventListener('pointerdown', (e) => this.onTrayDown(e as PointerEvent));
    }
  }

  private onClick(e: MouseEvent): void {
    const t = e.target as HTMLElement;
    const tab = t.closest<HTMLElement>('[data-mr-tab]');
    if (tab) {
      this.tab = tab.dataset.mrTab === 'items' ? 'items' : 'chars';
      this.deps.sound('pop');
      this.redraw();
      return;
    }
    const rt = t.closest<HTMLElement>('[data-mr-room]');
    if (rt && rt.dataset.mrRoom !== this.room) {
      this.room = rt.dataset.mrRoom as RoomId;
      this.loadRoom();
      this.deps.save(this.room, this.list, this.room);
      this.deps.sound('pop');
      this.deps.rerender();
      return;
    }
  }

  /** 棚から：押したまま部屋へ動かすと置ける。タップだけなら、空いている所に置く／もう置いてあれば しまう */
  private onTrayDown(e: PointerEvent): void {
    const cell = (e.target as HTMLElement).closest<HTMLElement>('[data-mr-ref]');
    if (!cell || this.drag) return;
    const ref = cell.dataset.mrRef as string;
    this.drag = { idx: -1, pointerId: e.pointerId, dx: 0, dy: 0, startX: e.clientX, startY: e.clientY, moved: false, fromTray: true };
    (this.drag as Drag & { ref: string }).ref = ref;
  }

  private onStageDown(e: PointerEvent): void {
    if (!e.isPrimary || this.drag) return;
    const g = (e.target as Element).closest<SVGGElement>('.mr-obj');
    const svg = this.svgEl();
    if (!g || !svg) return;
    const idx = Number(g.dataset.idx);
    const p = this.list[idx];
    if (!p) return;
    const pt = toScene(svg, e.clientX, e.clientY);
    if (!pt) return;
    const pos = this.seatPos(p) ?? p;
    this.drag = { idx, pointerId: e.pointerId, dx: pos.x - pt.x, dy: pos.y - pt.y, startX: e.clientX, startY: e.clientY, moved: false };
    (e.target as Element).setPointerCapture?.(e.pointerId);
    e.preventDefault();
  }

  private onMove(e: PointerEvent): void {
    const d = this.drag;
    if (!d || e.pointerId !== d.pointerId) return;
    if (!d.moved && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < 10) return;
    const svg = this.svgEl();
    if (!svg) return;
    d.moved = true;
    const pt = toScene(svg, e.clientX, e.clientY);
    if (!pt) return;
    if (d.fromTray && d.idx < 0) {
      // 棚から部屋の上に来たら、そこに出す
      const r = svg.getBoundingClientRect();
      if (e.clientY > r.bottom - 4 || this.list.length >= MAX_PLACED) return;
      const ref = (d as Drag & { ref: string }).ref;
      const old = this.list.findIndex((p) => p.ref === ref);
      if (old >= 0) this.removeAt(old);
      this.list.push({ ref, x: pt.x, y: Math.max(this.def().floorTop, pt.y) });
      d.idx = this.list.length - 1;
      d.dx = 0;
      d.dy = 0;
      this.redraw();
    }
    const p = this.list[d.idx];
    if (!p) return;
    if (p.on) delete p.on;
    p.x = pt.x + d.dx;
    p.y = pt.y + d.dy;
    // 動かしている物だけ描き直す（座っている子もいっしょに）
    const g = svg.querySelector<SVGGElement>(`.mr-obj[data-idx="${d.idx}"]`);
    if (g) {
      const s = depthScale(this.def(), Math.max(this.def().floorTop, p.y));
      const f = p.flip ? -1 : 1;
      g.setAttribute('transform', `translate(${r1(p.x)} ${r1(p.y)}) scale(${r1s(s * f)} ${r1s(s)})`);
      g.classList.add('dragging');
      // ずっと前に出す
      g.parentNode?.appendChild(g);
      this.list.forEach((q, j) => {
        if (q.on?.idx === d.idx && q.ref !== 'item:swing') {
          const sp = this.seatPos(q);
          const cg = svg.querySelector<SVGGElement>(`.mr-obj[data-idx="${j}"]:not(.rider)`);
          if (sp && cg) {
            cg.setAttribute('transform', `translate(${r1(sp.x)} ${r1(sp.y)}) scale(${r1s(s)} ${r1s(s)})`);
            g.parentNode?.appendChild(cg);
          }
        }
      });
    }
    this.el?.querySelector('.mr-tray')?.classList.toggle('drop-here', this.overTray(e.clientX, e.clientY));
  }

  private overTray(x: number, y: number): boolean {
    const t = this.el?.querySelector('.mr-tray')?.getBoundingClientRect();
    return !!t && y >= t.top && x >= t.left && x <= t.right;
  }

  private onUp(e: PointerEvent): void {
    const d = this.drag;
    if (!d || e.pointerId !== d.pointerId) return;
    this.drag = null;
    this.el?.querySelector('.mr-tray')?.classList.remove('drop-here');
    if (d.fromTray && d.idx < 0) {
      if (!d.moved) this.tapTray((d as Drag & { ref: string }).ref);
      return;
    }
    const p = this.list[d.idx];
    if (!p) return;
    if (!d.moved) {
      this.tapObject(d.idx);
      return;
    }
    if (this.overTray(e.clientX, e.clientY)) {
      this.removeAt(d.idx);
      this.deps.sound('pop');
    } else {
      const c = clampToFloor(this.def(), p.x, p.y);
      p.x = c.x;
      p.y = c.y;
      if (p.ref.startsWith('char:')) this.trySeat(d.idx);
      this.deps.sound('pop');
    }
    this.persist();
    this.redraw();
  }

  private cancelDrag(): void {
    if (!this.drag) return;
    this.drag = null;
    this.persist();
    this.redraw();
  }

  /** 友だちを 座れる物の近くで はなしたら、空いている座席に座る */
  private trySeat(i: number): void {
    const p = this.list[i];
    let best: { idx: number; seat: number; d: number } | null = null;
    this.list.forEach((q, j) => {
      const it = ITEM_BY_ID[q.ref.split(':')[1]];
      if (j === i || !q.ref.startsWith('item:') || !it?.seats) return;
      const s = depthScale(this.def(), q.y);
      it.seats.forEach((seat, k) => {
        if (this.list.some((o) => o.on?.idx === j && o.on.seat === k)) return;
        const sx = q.x + seat.x * s * (q.flip ? -1 : 1);
        const sy = q.y + seat.y * s;
        const dist = Math.hypot(p.x - sx, (p.y - sy) * 0.8);
        if (dist < 95 * s && (!best || dist < best.d)) best = { idx: j, seat: k, d: dist };
      });
    });
    if (best) {
      const b = best as { idx: number; seat: number };
      p.on = { idx: b.idx, seat: b.seat };
      this.deps.sound('found');
    }
  }

  private tapObject(i: number): void {
    const p = this.list[i];
    if (p.ref.startsWith('item:')) {
      p.flip = !p.flip;
      this.deps.sound('pop');
      this.persist();
      this.redraw();
      return;
    }
    // 友だち：ぴょんと はねる
    const g = this.svgEl()?.querySelector(`.mr-obj[data-idx="${i}"] .mr-hop, .mr-obj.rider[data-idx="${i}"]`);
    g?.classList.remove('hop');
    void (g as SVGGElement | undefined)?.getBBox?.();
    g?.classList.add('hop');
    this.deps.sound('found');
  }

  private tapTray(ref: string): void {
    const old = this.list.findIndex((p) => p.ref === ref);
    if (old >= 0) {
      this.removeAt(old);
    } else {
      if (this.list.length >= MAX_PLACED) return;
      const room = this.def();
      // 空いていそうな所（手前の真ん中から 少しずつ ずらす）
      const n = this.list.length;
      const x = 500 + ((n * 137) % 600) - 300;
      const y = room.floorTop + (1000 - room.floorTop) * (0.45 + ((n * 0.23) % 0.4));
      this.list.push({ ref, x, y });
    }
    this.deps.sound('pop');
    this.persist();
    this.redraw();
  }

  /** i 番目を しまう。座っていた子は床に下ろし、番号を つめる */
  private removeAt(i: number): void {
    const base = this.list[i];
    this.list.forEach((q) => {
      if (q.on?.idx === i) {
        const sp = this.seatPos(q);
        if (sp) {
          q.x = sp.x;
          q.y = Math.max(this.def().floorTop, base.y + 30);
        }
        delete q.on;
      }
    });
    this.list.splice(i, 1);
    this.list.forEach((q) => {
      if (q.on && q.on.idx > i) q.on = { idx: q.on.idx - 1, seat: q.on.seat };
    });
  }
}

/** 横幅より背が高い物（棚の絵の切り取り） */
const TALL: Record<string, number> = { swing: 300, plant: 170, flowerpot: 140, balloon: 170, starmobile: 190, moonlamp: 140, puppy: 140, fishtank: 170 };
const r1 = (n: number) => Math.round(n * 10) / 10;
const r1s = (n: number) => Math.round(n * 1000) / 1000;
