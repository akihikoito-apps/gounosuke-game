// 追加パックの中身の見本と、購入・復元直後の案内。
// 数字（家具・おもちゃ・シール・うごくもの・コースの数）はすべて定義から数えて出す。
import { stickerRequires } from '../core/access';
import { CHARACTERS, type CharacterDef, type CharacterId } from '../core/characters';
import { FRONT_FROM_COURSE, MOVERS, MOVER_NAMES, type MoverDef, type MoverKind } from '../core/movers';
import { ITEMS, ROOMS, type ItemDef, type RoomDef, type RoomId } from '../core/myroom';
import type { SceneDef, SceneId } from '../core/scene';
import { SCENES } from '../core/scenes';
import { STICKERS, type StickerDef } from '../core/stickers';
import { PACKS, type PackDef, type PackId } from '../entitlements/entitlements';
import { PRODUCTS, type ProductDef } from '../purchase/store';
import { roomArtFile } from '../art/registry';
import { faceIcon } from './charArt';
import { moverIcon } from './moverView';
import { itemThumbSvg } from './myroomView';
import { sceneThumb } from './sceneView';

export interface PackMoverInfo {
  kind: MoverKind;
  name: string;
  icon: string;
}

export interface PackDetails {
  pack: PackDef;
  scene?: SceneDef;
  courses: number[];
  hasHardest: boolean;
  friend?: CharacterDef;
  room?: RoomDef;
  items: ItemDef[];
  stickers: StickerDef[];
  moverDefs: MoverDef[];
  moverKinds: PackMoverInfo[];
}

/** コードの定義から、そのパックに含まれる要素をすべて集める */
export function packDetails(packId: PackId): PackDetails {
  const pack = PACKS.find((p) => p.id === packId);
  if (!pack) throw new Error(`unknown pack: ${packId}`);
  const sceneId = pack.contents.find((c): c is `scene:${SceneId}` => c.startsWith('scene:'))?.slice(6) as SceneId | undefined;
  const scene = sceneId ? SCENES[sceneId] : undefined;
  const courses = pack.contents
    .filter((c) => c.startsWith('course:'))
    .map((c) => Number(c.slice(7)))
    .sort((a, b) => a - b);
  const hasHardest = pack.contents.includes('trial:hardest');
  const charId = pack.contents.find((c): c is `char:${CharacterId}` => c.startsWith('char:'))?.slice(5) as CharacterId | undefined;
  const friend = charId ? CHARACTERS[charId] : undefined;
  const roomId = pack.contents.find((c) => c.startsWith('room:'))?.slice(5) as RoomId | undefined;
  const room = roomId ? ROOMS.find((r) => r.id === roomId) : undefined;
  const stickers = STICKERS.filter((s) => stickerRequires(s).some((req) => pack.contents.includes(req)));
  const stickerIds = new Set(stickers.map((s) => s.id));
  const items = ITEMS.filter(
    (it) => !it.legacy && ((it.content && pack.contents.includes(it.content)) || (it.sticker !== null && stickerIds.has(it.sticker))),
  );
  const moverDefs = sceneId ? MOVERS[sceneId] : [];
  const kinds = [...new Set(moverDefs.map((m) => m.kind))];
  const moverKinds = kinds.map((kind) => ({ kind, name: MOVER_NAMES[kind], icon: moverIcon(kind) }));
  return { pack, scene, courses, hasHardest, friend, room, items, stickers, moverDefs, moverKinds };
}

/** じぶんの へや の部屋のミニ見本 */
export function roomThumbSvg(room: RoomDef): string {
  const bg = roomArtFile(room.id);
  const back = bg
    ? `<image href="${bg}" x="0" y="0" width="1000" height="1000"/>`
    : `<rect width="1000" height="${room.floorTop}" fill="#F6E4C8"/><rect y="${room.floorTop}" width="1000" height="${1000 - room.floorTop}" fill="#E8C194"/>`;
  return `<svg class="room-thumb-svg" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${room.name}">${back}</svg>`;
}

export interface PreviewRenderOpts {
  owned: readonly PackId[];
  price?: string;
  available: boolean;
  fromBundle?: string;
}

function renderBuyAction(product: ProductDef, opts: PreviewRenderOpts): string {
  const have = product.packs.every((k) => opts.owned.includes(k));
  if (have) return '<span class="have" data-preview-have>もっています</span>';
  if (opts.price) {
    return `<button type="button" class="pbtn primary" data-act="buy" data-product="${product.id}">${opts.price} で かう</button>`;
  }
  return `<span class="have">${opts.available ? 'いまは 買えません' : 'iPhone・iPad の アプリ版で 購入できます'}</span>`;
}

/** 買う前に中身を確かめる見本 */
export function renderPackPreview(product: ProductDef, opts: PreviewRenderOpts): string {
  const buyAction = renderBuyAction(product, opts);
  const backBundleBtn = opts.fromBundle
    ? `<button type="button" class="pbtn" data-act="preview" data-product="${opts.fromBundle}">ぜんぶ いり に もどる</button>`
    : '';
  const closeBtn = `<button type="button" class="pbtn" data-act="closePreview" data-autofocus>とじる</button>`;

  if (product.packs.length > 1) {
    const singles = PRODUCTS.filter((p) => p.packs.length === 1 && p.packs.every((k) => product.packs.includes(k)));
    const details = product.packs.map((pk) => packDetails(pk));
    const totalItems = details.reduce((n, d) => n + d.items.length, 0);
    const totalStickers = details.reduce((n, d) => n + d.stickers.length, 0);
    const rows = singles
      .map((sp) => {
        const have = sp.packs.every((k) => opts.owned.includes(k));
        return `<li class="preview-bundle-item" data-bundle-pack="${sp.packs[0]}">
          <div class="preview-bundle-info">
            <strong>${sp.name}</strong>${have ? ' <span class="have">（もっています）</span>' : ''}<br>
            <small>${sp.summary}</small>
          </div>
          <button type="button" class="pbtn" data-act="preview" data-product="${sp.id}" data-pack="${sp.packs[0]}" data-from-bundle="${product.id}">なかみを みる</button>
        </li>`;
      })
      .join('');
    return `<div class="pack-preview" data-pack-preview="${product.id}" role="region" aria-label="${product.name} の なかみ">
      <div class="preview-head">
        <h4>${product.name} の なかみ</h4>
        <p class="preview-sub"><span data-preview-pack-count>${singles.length}</span>つの パックが すべて はいっています（かぐ・おもちゃ 合計<span data-preview-item-count>${totalItems}</span>こ、シール 合計<span data-preview-sticker-count>${totalStickers}</span>まい）。</p>
      </div>
      <ul class="preview-bundle-list">${rows}</ul>
      <div class="preview-actions">${buyAction}${closeBtn}</div>
    </div>`;
  }

  const d = packDetails(product.packs[0]);
  const itemsHtml = d.items
    .map(
      (it) =>
        `<div class="preview-item" data-preview-item="${it.id}"><span class="preview-item-icon">${itemThumbSvg(it)}</span><span class="preview-item-name">${it.name}</span></div>`,
    )
    .join('');

  if (d.courses.length > 0) {
    const cFrom = d.courses[0];
    const cTo = d.courses[d.courses.length - 1];
    const hatSvg =
      '<svg class="preview-mini-icon" viewBox="0 0 40 40" aria-hidden="true"><path d="M7 30 C6 14 34 14 33 30Z" fill="#E59A86" stroke="#4A3A40" stroke-width="3" stroke-linejoin="round"/><rect x="6" y="27" width="28" height="7" rx="3" fill="#C97A68" stroke="#4A3A40" stroke-width="3"/><circle cx="20" cy="11" r="4.5" fill="#E59A86" stroke="#4A3A40" stroke-width="3"/></svg>';
    const umbSvg =
      '<svg class="preview-mini-icon" viewBox="0 0 40 40" aria-hidden="true"><path d="M4 20 C6 6 34 6 36 20Z" fill="#8DB7D9" stroke="#4A3A40" stroke-width="3" stroke-linejoin="round"/><path d="M20 20 V32 Q20 36 16 35" fill="none" stroke="#4A3A40" stroke-width="3" stroke-linecap="round"/></svg>';
    return `<div class="pack-preview" data-pack-preview="${product.id}" role="region" aria-label="${product.name} の なかみ">
      <div class="preview-head">
        <h4>${product.name} の なかみ</h4>
        <p class="preview-sub">コース<span data-preview-course-from>${cFrom}</span>〜<span data-preview-course-to>${cTo}</span>（<span data-preview-course-count>${d.courses.length}</span>コース）で ふえること</p>
      </div>
      <ul class="preview-features">
        <li><span class="preview-feat-icons">${hatSvg}${umbSvg}</span><div><strong>ぼうし・かさで かくれる</strong><br><small>背景と 同じ柄の ぼうしや かさで かくれます</small></div></li>
        <li><span class="preview-feat-icons">${moverIcon('puppy')}</span><div><strong>うごくものが まえを よこぎる</strong><br><small>コース${FRONT_FROM_COURSE}から、友だちの まえを 生きものや のりものが 通ります</small></div></li>
        ${d.hasHardest ? `<li><span class="preview-feat-icons">${moverIcon('owl')}</span><div><strong>最難関モード</strong><br><small>家具のかげからのぞいたり、帽子やサングラスで隠れたりする 大人向けのおためし</small></div></li>` : ''}
      </ul>
      <div class="preview-pair">
        ${
          d.friend
            ? `<div class="preview-card preview-friend" data-preview-friend="${d.friend.id}">
          <div class="preview-friend-icon">${faceIcon(d.friend)}</div>
          <div><strong>ともだち「${d.friend.name}」</strong><br><small>コース${cTo} クリアで なかまに</small></div>
        </div>`
            : ''
        }
        ${
          d.room
            ? `<div class="preview-card preview-room" data-preview-room="${d.room.id}">
          <div class="preview-room-thumb">${roomThumbSvg(d.room)}</div>
          <div><strong>へや「${d.room.name}」</strong><br><small>コース${d.room.needCleared} クリアで ひらく</small></div>
        </div>`
            : ''
        }
      </div>
      <div class="preview-sec">
        <h5>とどく おもちゃ・かぐ（<span data-preview-item-count>${d.items.length}</span>こ）</h5>
        <div class="preview-items">${itemsHtml}</div>
      </div>
      <div class="preview-sec">
        <h5>シール（<span data-preview-sticker-count>${d.stickers.length}</span>まい）</h5>
        <p class="preview-note">コース${cFrom}〜${cTo}を クリアするたびに 1まいずつ、ぜんぶで ${d.stickers.length}まい もらえます。</p>
      </div>
      <div class="preview-actions">${buyAction}${backBundleBtn}${closeBtn}</div>
    </div>`;
  }

  const moversHtml = d.moverKinds
    .map(
      (m) =>
        `<div class="preview-mover" data-preview-mover="${m.kind}"><span class="preview-mover-icon">${m.icon}</span><span class="preview-mover-name">${m.name}</span></div>`,
    )
    .join('');

  return `<div class="pack-preview" data-pack-preview="${product.id}" role="region" aria-label="${product.name} の なかみ">
    <div class="preview-head">
      <h4>${product.name} の なかみ</h4>
    </div>
    <div class="preview-top">
      ${
        d.scene
          ? `<div class="preview-scene-card" data-preview-scene="${d.scene.id}">
        ${sceneThumb(d.scene)}
        <span class="lbl">背景「${d.scene.name}」</span>
      </div>`
          : ''
      }
      <div class="preview-side">
        ${
          d.friend
            ? `<div class="preview-card preview-friend" data-preview-friend="${d.friend.id}">
          <div class="preview-friend-icon">${faceIcon(d.friend)}</div>
          <div><strong>ともだち「${d.friend.name}」</strong><br><small>${d.scene ? `「${d.scene.name}」で はじめて見つけたときに なかまに` : ''}</small></div>
        </div>`
            : ''
        }
        ${
          d.room
            ? `<div class="preview-card preview-room" data-preview-room="${d.room.id}">
          <div class="preview-room-thumb">${roomThumbSvg(d.room)}</div>
          <div><strong>へや「${d.room.name}」</strong><br><small>じぶんの へや に ふえます</small></div>
        </div>`
            : ''
        }
      </div>
    </div>
    <div class="preview-sec">
      <h5>とどく かぐ・おもちゃ（<span data-preview-item-count>${d.items.length}</span>こ）</h5>
      <div class="preview-items">${itemsHtml}</div>
    </div>
    ${
      d.moverKinds.length
        ? `<div class="preview-sec">
      <h5>うごくもの（<span data-preview-mover-count>${d.moverKinds.length}</span>しゅるい）</h5>
      <div class="preview-movers">${moversHtml}</div>
    </div>`
        : ''
    }
    <div class="preview-sec">
      <h5>シール（<span data-preview-sticker-count>${d.stickers.length}</span>まい）</h5>
      <p class="preview-note">${d.scene ? `「${d.scene.name}」で 見つけた 回数で` : ''} ぜんぶで ${d.stickers.length}まい もらえます。</p>
    </div>
    <div class="preview-actions">${buyAction}${backBundleBtn}${closeBtn}</div>
  </div>`;
}

/** 購入・復元した直後の案内 */
export function renderBoughtGuide(packs: readonly PackId[], titleName?: string): string {
  const details = packs.map((p) => packDetails(p));
  if (details.length === 1) {
    const d = details[0];
    const title = titleName ?? d.pack.name;
    if (d.courses.length > 0) {
      const cFrom = d.courses[0];
      const cTo = d.courses[d.courses.length - 1];
      return `<div class="bought-guide" data-bought-guide role="status" aria-live="polite">
        <h4>${title} が あそべるように なりました</h4>
        <p class="bought-lead"><strong>コース${cFrom}から あそべます</strong>（コース${cFrom}〜${cTo}）</p>
        <p class="bought-note">コースは じゅんばんに すすみます。コース${cFrom - 1}を クリアすると コース${cFrom}が ひらきます。「最難関を ためす」は いまから ためせます。</p>
        <ul class="bought-list">
          ${d.friend ? `<li>あたらしい ともだち：<strong>${d.friend.name}</strong>（コース${cTo} クリアで なかまに）</li>` : ''}
          ${d.room ? `<li>あたらしい へや：<strong>${d.room.name}</strong>（コース${d.room.needCleared} クリアで ひらく）</li>` : ''}
          <li>とどく かぐ・おもちゃ ${d.items.length}こ ／ シール ${d.stickers.length}まい</li>
        </ul>
        <div class="row bought-actions">
          <button type="button" class="pbtn primary" data-act="goBoughtCourses" data-autofocus>コースを えらぶ</button>
          <button type="button" class="pbtn" data-act="closeBought">とじる</button>
        </div>
      </div>`;
    }
    if (d.scene) {
      return `<div class="bought-guide" data-bought-guide role="status" aria-live="polite">
        <h4>${title} が あそべるように なりました</h4>
        <div class="bought-summary">
          <div class="bought-scene-mini">${sceneThumb(d.scene)}</div>
          <ul class="bought-list">
            <li>あたらしい 背景：<strong>${d.scene.name}</strong>（コース・じゆうに さがす・かくして わたす）</li>
            ${d.friend ? `<li>あたらしい ともだち：<strong>${d.friend.name}</strong>（「${d.scene.name}」で はじめて見つけたときに なかまに）</li>` : ''}
            ${d.room ? `<li>あたらしい へや：<strong>${d.room.name}</strong>（かぐ・おもちゃ ${d.items.length}こ、シール ${d.stickers.length}まい）</li>` : ''}
          </ul>
        </div>
        <div class="row bought-actions">
          <button type="button" class="pbtn primary" data-act="playBoughtScene" data-scene="${d.scene.id}" data-autofocus>この背景で あそぶ</button>
          <button type="button" class="pbtn" data-act="closeBought">とじる</button>
        </div>
      </div>`;
    }
  }

  const sceneDetails = details.filter((d) => d.scene);
  const moreCourses = details.find((d) => d.courses.length > 0);
  const title = titleName ?? 'ぜんぶ いり';
  const sceneNames = sceneDetails.map((d) => `「${d.scene!.name}」`).join('・');
  const friendNames = details
    .filter((d) => d.friend)
    .map((d) => `「${d.friend!.name}」`)
    .join('・');
  const roomNames = details
    .filter((d) => d.room)
    .map((d) => `「${d.room!.name}」`)
    .join('・');
  const sceneBtns = sceneDetails
    .map(
      (d) =>
        `<button type="button" class="pbtn primary" data-act="playBoughtScene" data-scene="${d.scene!.id}">${d.scene!.name}で あそぶ</button>`,
    )
    .join('');
  const courseBtn = moreCourses ? `<button type="button" class="pbtn primary" data-act="goBoughtCourses">コースを えらぶ</button>` : '';

  return `<div class="bought-guide" data-bought-guide role="status" aria-live="polite">
    <h4>${title} が あそべるように なりました</h4>
    <ul class="bought-list">
      ${sceneNames ? `<li>ふえた 背景：<strong>${sceneNames}</strong></li>` : ''}
      ${moreCourses ? `<li><strong>コース${moreCourses.courses[0]}から あそべます</strong>（コース${moreCourses.courses[0]}〜${moreCourses.courses[moreCourses.courses.length - 1]}。コース${moreCourses.courses[0] - 1}の クリアで ひらきます）</li>` : ''}
      ${friendNames ? `<li>あたらしい ともだち：${friendNames}</li>` : ''}
      ${roomNames ? `<li>あたらしい へや：${roomNames}</li>` : ''}
    </ul>
    <div class="row bought-actions">
      ${sceneBtns}
      ${courseBtn}
      <button type="button" class="pbtn" data-act="closeBought" data-autofocus>とじる</button>
    </div>
  </div>`;
}
