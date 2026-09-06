/* ==========================================================================
   ごうのすけのゲーム  —  えを かく ぶぶん

   ★ キャラの みためを かえたい ときは この ファイル ★
   あとで がぞうファイルに さしかえる ときも、ここの かんすうを
   1つずつ さしかえれば OK です。

   やくそくごと
     ・げんてん (0,0) は キャラの あしもと の まんなか
     ・うえが マイナス、したが プラス
     ・みんな「みぎむき」で かく（ひだりむきは じどうで はんてんします）
   ========================================================================== */

/* ------------------------------------------------------------------
   べんりな どうぐ
   ------------------------------------------------------------------ */

/* きまった すうじから いつも おなじ ランダムを つくる（へたな えの ガタガタ用） */
function srand(i) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/* ガタガタの せん（下手なきりん 用） */
function roughLine(ctx, x1, y1, x2, y2, seed, amp) {
  amp = amp || 3;
  const steps = 3;
  ctx.moveTo(x1, y1);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const jx = (srand(seed + i * 7) - 0.5) * amp * (i === steps ? 0.3 : 1);
    const jy = (srand(seed + i * 13) - 0.5) * amp * (i === steps ? 0.3 : 1);
    ctx.lineTo(x1 + (x2 - x1) * t + jx, y1 + (y2 - y1) * t + jy);
  }
}

/* ガタガタの まる */
function roughCircle(ctx, cx, cy, r, seed, amp) {
  amp = amp || 3;
  const n = 11;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r + (srand(seed + i * 5) - 0.5) * amp;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr * 0.95;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
}

function ellipse(ctx, cx, cy, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
}


/* ==================================================================
   みかたキャラ
   ================================================================== */

/* ---- ぷりおぷりねこ：オレンジの ぷるぷる ゼリーねこ ---- */
function drawPurio(ctx, s) {
  const wob = Math.sin(s.t * 7) * 0.09;          // ぷるぷる
  const rx = 26 * (1 + wob), ry = 22 * (1 - wob);
  const cy = -ry;

  ctx.save();
  ctx.globalAlpha = 0.9;

  // しっぽ
  ctx.strokeStyle = 'rgba(255,140,30,0.75)';
  ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-rx + 4, cy + 6);
  ctx.quadraticCurveTo(-rx - 16, cy - 4 + Math.sin(s.t * 5) * 5, -rx - 14, cy - 18);
  ctx.stroke();

  // みみ
  ctx.fillStyle = 'rgba(255,150,40,0.8)';
  ctx.beginPath();
  ctx.moveTo(6, cy - ry + 4); ctx.lineTo(13, cy - ry - 12); ctx.lineTo(20, cy - ry + 1); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-14, cy - ry + 3); ctx.lineTo(-8, cy - ry - 12); ctx.lineTo(-1, cy - ry - 1); ctx.closePath(); ctx.fill();

  // からだ（はんとうめいの ゼリー）
  const g = ctx.createLinearGradient(0, cy - ry, 0, cy + ry);
  g.addColorStop(0, 'rgba(255,205,120,0.85)');
  g.addColorStop(0.55, 'rgba(255,150,40,0.78)');
  g.addColorStop(1, 'rgba(230,105,10,0.85)');
  ctx.fillStyle = g;
  ellipse(ctx, 0, cy, rx, ry); ctx.fill();

  // ふちどり
  ctx.strokeStyle = 'rgba(255,235,190,0.9)'; ctx.lineWidth = 2;
  ellipse(ctx, 0, cy, rx, ry); ctx.stroke();

  // ひかりの はんしゃ
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ellipse(ctx, -8, cy - 8, 7, 5); ctx.fill();
  ellipse(ctx, 9, cy - 12, 3, 2); ctx.fill();

  // め
  ctx.fillStyle = '#4a2000';
  ellipse(ctx, 8, cy - 2, 2.6, 3.4); ctx.fill();
  ellipse(ctx, 17, cy - 2, 2.6, 3.4); ctx.fill();
  // くち
  ctx.strokeStyle = '#4a2000'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(11, cy + 5); ctx.quadraticCurveTo(13, cy + 8, 15, cy + 5); ctx.stroke();

  ctx.restore();
}

/* ---- タンクン：よこながの みずいろ せんしゃねこ ---- */
function drawTankun(ctx, s) {
  const bob = Math.sin(s.t * 9) * (s.moving ? 1.2 : 0);
  ctx.save();
  ctx.translate(0, bob);

  // キャタピラ
  ctx.fillStyle = '#37474f';
  roundRect(ctx, -36, -13, 72, 13, 6); ctx.fill();
  ctx.fillStyle = '#78909c';
  for (let i = -30; i <= 30; i += 10) {
    ctx.beginPath();
    ctx.arc(i, -6.5, 3.4, 0, Math.PI * 2); ctx.fill();
  }

  // みみ
  ctx.fillStyle = '#4fc3f7';
  ctx.beginPath(); ctx.moveTo(14, -40); ctx.lineTo(20, -54); ctx.lineTo(27, -40); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-24, -40); ctx.lineTo(-18, -53); ctx.lineTo(-11, -40); ctx.closePath(); ctx.fill();

  // からだ（よこなが）
  const g = ctx.createLinearGradient(0, -44, 0, -10);
  g.addColorStop(0, '#b3e5fc'); g.addColorStop(1, '#4fc3f7');
  ctx.fillStyle = g;
  roundRect(ctx, -37, -44, 74, 34, 13); ctx.fill();
  ctx.strokeStyle = '#0277bd'; ctx.lineWidth = 2.4;
  roundRect(ctx, -37, -44, 74, 34, 13); ctx.stroke();

  // せんしゃっぽい あおい ライン
  ctx.strokeStyle = '#0288d1'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-30, -22); ctx.lineTo(24, -22); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-30, -34); ctx.lineTo(6, -34); ctx.stroke();

  // ほうしん（まえ むき）
  ctx.fillStyle = '#0277bd';
  roundRect(ctx, 34, -34, 14, 8, 3); ctx.fill();

  // め と くち
  ctx.fillStyle = '#01579b';
  ellipse(ctx, 18, -30, 3, 3.6); ctx.fill();
  ellipse(ctx, 28, -30, 3, 3.6); ctx.fill();
  ctx.strokeStyle = '#01579b'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(20, -20); ctx.quadraticCurveTo(23.5, -16, 27, -20); ctx.stroke();

  ctx.restore();
}

/* ---- テルテル君：みずいろの てるてるぼうず ---- */
function drawTeruteru(ctx, s) {
  const sway = Math.sin(s.t * 3.2) * 3;
  ctx.save();
  ctx.translate(sway * 0.4, Math.sin(s.t * 2.4) * 2);
  ctx.rotate(sway * 0.012);

  // からだ（したが ひろがる さんかく）
  const g = ctx.createLinearGradient(0, -46, 0, 0);
  g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#81d4fa');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-11, -46);
  ctx.lineTo(-24, -2);
  ctx.quadraticCurveTo(0, 5, 24, -2);
  ctx.lineTo(11, -46);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#0288d1'; ctx.lineWidth = 2; ctx.stroke();

  // くびの ひも
  ctx.strokeStyle = '#e53935'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-12, -46); ctx.lineTo(12, -46); ctx.stroke();

  // あたま
  const gh = ctx.createRadialGradient(-5, -62, 2, 0, -58, 20);
  gh.addColorStop(0, '#ffffff'); gh.addColorStop(1, '#b3e5fc');
  ctx.fillStyle = gh;
  ctx.beginPath(); ctx.arc(0, -58, 17, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#0288d1'; ctx.lineWidth = 2; ctx.stroke();

  // 「へ」の じの め
  ctx.strokeStyle = '#01579b'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-1, -63); ctx.lineTo(3, -66); ctx.lineTo(7, -63); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(9, -63); ctx.lineTo(13, -66); ctx.lineTo(16, -63); ctx.stroke();
  // くち
  ctx.beginPath(); ctx.arc(8, -53, 3, 0, Math.PI); ctx.stroke();

  // ためている みずの たま
  if (s.atk >= 0) {
    ctx.fillStyle = 'rgba(79,195,247,' + (0.4 + s.atk * 0.6) + ')';
    ctx.beginPath(); ctx.arc(24, -40, 4 + s.atk * 5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

/* ---- 時の旅人：くろスーツの しょうねん ---- */
function drawTokinotabibito(ctx, s) {
  const step = Math.sin(s.t * 10) * (s.moving ? 1 : 0);
  ctx.save();

  // あし
  ctx.strokeStyle = '#212121'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-3, -22); ctx.lineTo(-4 + step * 5, -1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(4, -22); ctx.lineTo(5 - step * 5, -1); ctx.stroke();

  // からだ（スーツ）
  ctx.fillStyle = '#263238';
  roundRect(ctx, -12, -50, 24, 30, 5); ctx.fill();
  // しろい シャツ
  ctx.fillStyle = '#fafafa';
  ctx.beginPath();
  ctx.moveTo(-4, -50); ctx.lineTo(4, -50); ctx.lineTo(2, -30); ctx.lineTo(-2, -30); ctx.closePath(); ctx.fill();
  // ちょうネクタイ
  ctx.fillStyle = '#d32f2f';
  ctx.beginPath();
  ctx.moveTo(0, -47); ctx.lineTo(-6, -51); ctx.lineTo(-6, -43); ctx.closePath();
  ctx.moveTo(0, -47); ctx.lineTo(6, -51); ctx.lineTo(6, -43); ctx.closePath();
  ctx.fill();

  // あたま
  ctx.fillStyle = '#ffe0b2';
  ctx.beginPath(); ctx.arc(1, -61, 12, 0, Math.PI * 2); ctx.fill();
  // かみ
  ctx.fillStyle = '#212121';
  ctx.beginPath(); ctx.arc(1, -63, 12, Math.PI * 1.05, Math.PI * 2.05); ctx.fill();
  ctx.beginPath(); ctx.moveTo(11, -66); ctx.lineTo(14, -58); ctx.lineTo(8, -62); ctx.closePath(); ctx.fill();
  // め
  ctx.fillStyle = '#3e2723';
  ellipse(ctx, 5, -60, 1.8, 2.6); ctx.fill();
  ellipse(ctx, 11, -60, 1.8, 2.6); ctx.fill();

  // うで＋とけい（こうげき中は ふりかぶる）
  const swing = s.atk >= 0 ? -1.6 + s.atk * 2.6 : -0.35;
  ctx.save();
  ctx.translate(8, -44);
  ctx.rotate(swing);
  ctx.strokeStyle = '#263238'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(16, 0); ctx.stroke();
  // とけい
  ctx.fillStyle = '#ffd54f';
  ctx.beginPath(); ctx.arc(21, 0, 7, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(21, 0); ctx.lineTo(21, -4.5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(21, 0); ctx.lineTo(24, 1.5); ctx.stroke();
  ctx.restore();

  ctx.restore();
}

/* ---- ひー坊：ほのおを まとった たかかりょく ---- */
function drawHiibou(ctx, s) {
  ctx.save();

  // まわりの ほのお
  for (let i = 0; i < 7; i++) {
    const a = s.t * 3 + i * 1.1;
    const fx = Math.cos(a) * 22;
    const fy = -26 + Math.sin(a * 1.7) * 20;
    const r = 8 + Math.sin(a * 2.3) * 4;
    ctx.fillStyle = i % 2 ? 'rgba(255,193,7,0.45)' : 'rgba(255,87,34,0.4)';
    ctx.beginPath(); ctx.arc(fx, fy, r, 0, Math.PI * 2); ctx.fill();
  }

  // あし
  const step = Math.sin(s.t * 9) * (s.moving ? 1 : 0);
  ctx.strokeStyle = '#8d2f00'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-5, -20); ctx.lineTo(-6 + step * 5, -2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(5, -20); ctx.lineTo(6 - step * 5, -2); ctx.stroke();

  // からだ
  const g = ctx.createLinearGradient(0, -52, 0, -14);
  g.addColorStop(0, '#ffca28'); g.addColorStop(0.5, '#ff7043'); g.addColorStop(1, '#e64a19');
  ctx.fillStyle = g;
  ellipse(ctx, 0, -34, 19, 21); ctx.fill();
  ctx.strokeStyle = '#bf360c'; ctx.lineWidth = 2; ctx.stroke();

  // あたまの ほのお（かんむり）
  ctx.fillStyle = '#ffeb3b';
  ctx.beginPath();
  ctx.moveTo(-8, -52);
  ctx.quadraticCurveTo(-2, -70 - Math.sin(s.t * 8) * 4, 4, -54);
  ctx.quadraticCurveTo(8, -66, 12, -52);
  ctx.closePath(); ctx.fill();

  // め
  ctx.fillStyle = '#3e2723';
  ellipse(ctx, 6, -38, 2.6, 3.4); ctx.fill();
  ellipse(ctx, 14, -38, 2.6, 3.4); ctx.fill();
  // まゆ（きりっと）
  ctx.strokeStyle = '#3e2723'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(3, -44); ctx.lineTo(9, -42); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(17, -44); ctx.lineTo(11, -42); ctx.stroke();

  // ふりかぶる うで
  const swing = s.atk >= 0 ? -2.2 + s.atk * 3.0 : -0.4;
  ctx.save();
  ctx.translate(12, -36);
  ctx.rotate(swing);
  ctx.strokeStyle = '#e64a19'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(17, 0); ctx.stroke();
  if (s.atk >= 0) {
    const r = 5 + s.atk * 7;
    const fg = ctx.createRadialGradient(21, 0, 1, 21, 0, r);
    fg.addColorStop(0, '#fff9c4'); fg.addColorStop(0.6, '#ffa726'); fg.addColorStop(1, 'rgba(255,87,34,0)');
    ctx.fillStyle = fg;
    ctx.beginPath(); ctx.arc(21, 0, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  ctx.restore();
}


/* ---- 隕坊：ひー坊の しんかけい ----
   いんせきに なった ひー坊。あかい わの なかに オレンジの まるい かお。
   めは たての くろい せんが 2ほん だけ。
   うしろに ほのおの おを ひきながら すすむ。
   こうげきの うごきは だい1けいたいと おなじく「ふりかぶって なげる」。   */
function drawInbou(ctx, s) {
  const a = s.atk;
  const bob = Math.sin(s.t * 3.2) * 3;
  ctx.save();
  ctx.translate(0, -8 + bob);

  /* --- ほのおの お（うしろ・ななめ した へ）--- */
  for (let i = 0; i < 12; i++) {
    const ph = (s.t * 1.5 + i * 0.28) % 1;
    const len = 24 + ph * 74;
    const tx = -len;
    const ty = -30 + ph * 34;
    const r  = (1 - ph) * 11 + 2.5;
    ctx.fillStyle = (i % 3 === 0)
      ? 'rgba(255,235,59,' + (0.55 * (1 - ph)) + ')'
      : ((i % 3 === 1) ? 'rgba(255,112,67,' + (0.55 * (1 - ph)) + ')'
                       : 'rgba(211,47,47,' + (0.5 * (1 - ph)) + ')');
    ctx.beginPath();
    ctx.arc(tx + Math.sin(ph * 7 + i) * 5, ty + Math.cos(ph * 5 + i) * 4, r, 0, Math.PI * 2);
    ctx.fill();
  }
  /* おの すじ（ながい ひのて）*/
  ctx.strokeStyle = 'rgba(229,57,53,.7)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const w = Math.sin(s.t * 5 + i) * 6;
    ctx.beginPath();
    ctx.moveTo(-22, -34 + i * 4);
    ctx.quadraticCurveTo(-56, -26 + i * 6 + w, -92 - i * 7, -6 + i * 5 + w);
    ctx.stroke();
  }

  /* --- そとの あかい わ --- */
  const halo = ctx.createRadialGradient(0, -34, 20, 0, -34, 42);
  halo.addColorStop(0, 'rgba(255,87,34,0)');
  halo.addColorStop(0.7, 'rgba(255,87,34,.35)');
  halo.addColorStop(1, 'rgba(255,87,34,0)');
  ctx.fillStyle = halo;
  ctx.beginPath(); ctx.arc(0, -34, 42, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#e0402a';
  ctx.beginPath(); ctx.arc(0, -34, 30, 0, Math.PI * 2); ctx.fill();

  /* --- なかの オレンジの かお --- */
  const g = ctx.createRadialGradient(-6, -42, 4, 0, -34, 22);
  g.addColorStop(0, '#ffc046'); g.addColorStop(1, '#f0a021');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, -34, 21, 0, Math.PI * 2); ctx.fill();

  /* --- め：たての くろい せんが 2ほん --- */
  ctx.strokeStyle = '#1b1b1b';
  ctx.lineWidth = 2; ctx.lineCap = 'butt';
  const blink = (Math.sin(s.t * 0.9) > 0.97) ? 0.25 : 1;
  ctx.beginPath(); ctx.moveTo(-1, -44); ctx.lineTo(-1, -44 + 20 * blink); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(9, -43); ctx.lineTo(9, -43 + 15 * blink); ctx.stroke();

  /* --- ふりかぶる うで（だい1けいたいと おなじ うごき）--- */
  const swing = (a >= 0) ? -2.2 + a * 3.0 : -0.4;
  ctx.save();
  ctx.translate(18, -34);
  ctx.rotate(swing);
  ctx.strokeStyle = '#c1341f'; ctx.lineWidth = 8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(18, 0); ctx.stroke();
  if (a >= 0) {
    const r = 6 + a * 9;
    const fg = ctx.createRadialGradient(23, 0, 1, 23, 0, r);
    fg.addColorStop(0, '#fffde7'); fg.addColorStop(0.55, '#ffa726');
    fg.addColorStop(1, 'rgba(255,87,34,0)');
    ctx.fillStyle = fg;
    ctx.beginPath(); ctx.arc(23, 0, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  ctx.restore();
}


/* ==================================================================
   だい6しょう「魔導士の里」の てきたち
   ================================================================== */

/* まほうつかいの とんがりぼうし（いろだけ かえて つかいまわす）*/
function wizHat(ctx, x, y, col, col2, sc, t) {
  ctx.save();
  ctx.translate(x, y); ctx.scale(sc, sc); ctx.rotate(-0.1);
  const g = ctx.createLinearGradient(0, -40, 0, 4);
  g.addColorStop(0, col2); g.addColorStop(1, col);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-16, 2); ctx.quadraticCurveTo(-5, -20, 5, -40);
  ctx.quadraticCurveTo(10, -18, 18, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = col;
  roundRect(ctx, -22, -2, 44, 8, 4); ctx.fill();
  ctx.fillStyle = '#ffe082';
  starPath(ctx, -3, -14, 3, 1.4, t * 1.5); ctx.fill();
  starPath(ctx, 6, -27, 2.2, 1, -t); ctx.fill();
  ctx.restore();
}

/* ① ルンルンウィスプ：ふわふわ ただよう まほうだま */
function drawRunrunwisp(ctx, s) {
  const a = s.atk;
  const fl = Math.sin(s.t * 3) * 5;
  ctx.save();
  ctx.translate(0, -40 + fl);
  /* ひかり */
  const gg = ctx.createRadialGradient(0, 0, 2, 0, 0, 30);
  gg.addColorStop(0, 'rgba(140,220,255,.6)');
  gg.addColorStop(1, 'rgba(80,160,255,0)');
  ctx.fillStyle = gg;
  ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.fill();
  /* からだ（しずくがた）*/
  const g = ctx.createLinearGradient(0, -18, 0, 18);
  g.addColorStop(0, '#cfeeff'); g.addColorStop(1, '#4fb8f0');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 16, Math.PI * 0.9, Math.PI * 0.1);
  ctx.quadraticCurveTo(10, 16, 0, 22);
  ctx.quadraticCurveTo(-10, 16, -15, 5);
  ctx.closePath(); ctx.fill();
  /* しっぽ */
  ctx.strokeStyle = 'rgba(120,200,250,.7)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-6 + i * 6, 18);
    ctx.quadraticCurveTo(-8 + i * 6 + Math.sin(s.t * 5 + i) * 5, 28, -4 + i * 6, 36);
    ctx.stroke();
  }
  /* かお */
  ctx.fillStyle = '#123a5a';
  ctx.beginPath(); ctx.arc(-5, -2, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(6, -2, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#123a5a'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(0.5, 3, 3, 0.2, Math.PI - 0.2); ctx.stroke();
  ctx.fillStyle = 'rgba(255,150,180,.4)';
  ctx.beginPath(); ctx.arc(-11, 3, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(12, 3, 3, 0, Math.PI * 2); ctx.fill();
  /* ぼうし */
  wizHat(ctx, 0, -16, '#4a3a8c', '#7a5fd0', 0.72, s.t);
  /* まほうだま */
  if (a >= 0) {
    ctx.fillStyle = 'rgba(160,220,255,' + (0.4 + a * 0.5) + ')';
    ctx.beginPath(); ctx.arc(24 + a * 10, 2, 5 + a * 4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

/* ② ホウキゴブ：ほうきに のった くろねこ */
function drawHoukigob(ctx, s) {
  const a = s.atk;
  const fl = Math.sin(s.t * 5) * 4;
  const dash = (a >= 0) ? (a < 0.4 ? -a * 8 : (a - 0.4) * 36) : 0;
  ctx.save();
  ctx.translate(dash, -44 + fl);
  ctx.rotate(-0.12);

  /* ほうき */
  ctx.strokeStyle = '#8d6e3a'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-30, 8); ctx.lineTo(26, 2); ctx.stroke();
  ctx.fillStyle = '#c9a24a';
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    ctx.moveTo(-28, 8);
    ctx.lineTo(-48 - (i % 3) * 3, 0 + i * 3);
    ctx.lineTo(-46, 4 + i * 3);
    ctx.closePath(); ctx.fill();
  }

  /* ねこ */
  ctx.fillStyle = '#2b2340';
  ellipse(ctx, 0, -8, 15, 12); ctx.fill();
  ctx.beginPath(); ctx.arc(9, -22, 11, 0, Math.PI * 2); ctx.fill();
  /* みみ */
  ctx.beginPath(); ctx.moveTo(2, -30); ctx.lineTo(4, -42); ctx.lineTo(11, -31); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(13, -31); ctx.lineTo(19, -41); ctx.lineTo(20, -29); ctx.closePath(); ctx.fill();
  /* しっぽ */
  ctx.strokeStyle = '#2b2340'; ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-13, -10);
  ctx.quadraticCurveTo(-26, -14 + Math.sin(s.t * 6) * 6, -22, -28);
  ctx.stroke();
  /* め（きいろ）*/
  ctx.fillStyle = '#ffd54f';
  ellipse(ctx, 7, -24, 3.4, 4); ctx.fill();
  ellipse(ctx, 15, -24, 3.4, 4); ctx.fill();
  ctx.fillStyle = '#1b1b1b';
  ctx.fillRect(6.3, -26, 1.6, 4); ctx.fillRect(14.3, -26, 1.6, 4);
  /* ぼうし */
  wizHat(ctx, 9, -34, '#4a3a8c', '#7a5fd0', 0.8, s.t);
  ctx.restore();
}

/* ③ マジックラビット：まきものを よむ うさぎ */
function drawMagicrabbit(ctx, s) {
  const a = s.atk;
  const hop = Math.abs(Math.sin(s.t * 5)) * (s.moving ? 3 : 0);
  ctx.save();
  ctx.translate(0, -hop);
  /* あし */
  ctx.fillStyle = '#f2f2f4';
  ellipse(ctx, -10, -6, 8, 6); ctx.fill();
  ellipse(ctx, 10, -6, 8, 6); ctx.fill();
  /* からだ */
  const g = ctx.createLinearGradient(0, -46, 0, -6);
  g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#dfe2ea');
  ctx.fillStyle = g;
  ellipse(ctx, 0, -26, 17, 20); ctx.fill();
  /* かお */
  ctx.beginPath(); ctx.arc(2, -50, 14, 0, Math.PI * 2); ctx.fill();
  /* みみ */
  ctx.fillStyle = '#f2f2f4';
  ellipse(ctx, -6, -70, 5, 15); ctx.fill();
  ellipse(ctx, 10, -71, 5, 15); ctx.fill();
  ctx.fillStyle = '#f4b8c8';
  ellipse(ctx, -6, -70, 2.4, 10); ctx.fill();
  ellipse(ctx, 10, -71, 2.4, 10); ctx.fill();
  /* め */
  ctx.fillStyle = '#2b2340';
  ctx.beginPath(); ctx.arc(-3, -52, 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(8, -52, 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f4b8c8';
  ctx.beginPath(); ctx.arc(2.5, -46, 2.4, 0, Math.PI * 2); ctx.fill();
  /* まきもの */
  ctx.save();
  ctx.translate(20, -28); ctx.rotate(-0.2);
  ctx.fillStyle = '#f0e2c0';
  roundRect(ctx, -12, -10, 26, 20, 3); ctx.fill();
  ctx.strokeStyle = '#b89a68'; ctx.lineWidth = 1.6;
  roundRect(ctx, -12, -10, 26, 20, 3); ctx.stroke();
  ctx.strokeStyle = 'rgba(120,90,50,.6)'; ctx.lineWidth = 1.2;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-8, -5 + i * 5); ctx.lineTo(9, -5 + i * 5); ctx.stroke(); }
  ctx.restore();
  /* まほうじん */
  if (a >= 0) {
    ctx.strokeStyle = 'rgba(220,120,255,' + (0.35 + a * 0.5) + ')';
    ctx.lineWidth = 2.6;
    ctx.save(); ctx.translate(34, -30); ctx.rotate(s.t * 3);
    for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.arc(0, 0, 8 + i * 6 + a * 5, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
  }
  /* ぼうし */
  wizHat(ctx, 2, -62, '#3a2f78', '#6a53c0', 0.9, s.t);
  ctx.restore();
}

/* ④ フレイムメイジ：ほのおの まどうし */
function drawFlamemage(ctx, s) {
  const a = s.atk;
  const fl = Math.sin(s.t * 2.6) * 2.4;
  ctx.save();
  ctx.translate(0, fl);
  /* ほのおの オーラ */
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = ['rgba(255,87,34,.35)', 'rgba(255,152,0,.3)', 'rgba(255,235,59,.25)'][i];
    ctx.beginPath();
    ctx.ellipse(0, -46, 30 - i * 5, 46 - i * 6 + Math.sin(s.t * 8 + i) * 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  /* ローブ */
  const g = ctx.createLinearGradient(0, -76, 0, 0);
  g.addColorStop(0, '#c62828'); g.addColorStop(1, '#5d1414');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-14, -76); ctx.quadraticCurveTo(-28, -34, -24, 0);
  ctx.lineTo(24, 0); ctx.quadraticCurveTo(28, -34, 14, -76);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e0b53a';
  roundRect(ctx, -20, -40, 42, 6, 3); ctx.fill();
  /* フード */
  ctx.fillStyle = '#8e1b1b';
  ctx.beginPath(); ctx.arc(0, -84, 17, Math.PI * 0.9, Math.PI * 2.1); ctx.fill();
  ctx.fillStyle = '#2b0f0f';
  ctx.beginPath(); ctx.arc(0, -82, 13, 0, Math.PI * 2); ctx.fill();
  /* ひかる め */
  ctx.fillStyle = '#ffd54f';
  ellipse(ctx, -5, -84, 3.4, 2.4); ctx.fill();
  ellipse(ctx, 6, -84, 3.4, 2.4); ctx.fill();
  /* つえ */
  ctx.save();
  ctx.translate(24, -52); ctx.rotate(a >= 0 ? -0.4 + a * 0.5 : -0.1);
  ctx.strokeStyle = '#8d6e3a'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(0, 30); ctx.lineTo(4, -26); ctx.stroke();
  const r = (a >= 0) ? 10 + a * 9 : 9;
  const fg = ctx.createRadialGradient(5, -30, 1, 5, -30, r);
  fg.addColorStop(0, '#fff59d'); fg.addColorStop(0.5, '#ff9800'); fg.addColorStop(1, 'rgba(255,87,34,0)');
  ctx.fillStyle = fg;
  ctx.beginPath(); ctx.arc(5, -30, r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.restore();
}

/* ⑤ アイスウィッチ：こおりの まじょ */
function drawIcewitch(ctx, s) {
  const a = s.atk;
  const fl = Math.sin(s.t * 2.2) * 2.6;
  ctx.save();
  ctx.translate(0, fl);
  /* ゆきの けっしょう */
  ctx.strokeStyle = 'rgba(180,235,255,.75)'; ctx.lineWidth = 1.8;
  for (let i = 0; i < 4; i++) {
    const px = -30 + i * 22, py = -90 - ((s.t * 26 + i * 20) % 40);
    for (let k = 0; k < 3; k++) {
      const an = k * Math.PI / 3;
      ctx.beginPath();
      ctx.moveTo(px - Math.cos(an) * 5, py - Math.sin(an) * 5);
      ctx.lineTo(px + Math.cos(an) * 5, py + Math.sin(an) * 5);
      ctx.stroke();
    }
  }
  /* ドレス */
  const g = ctx.createLinearGradient(0, -70, 0, 0);
  g.addColorStop(0, '#5a8fd0'); g.addColorStop(1, '#1e3f75');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-12, -70); ctx.quadraticCurveTo(-26, -30, -22, 0);
  ctx.lineTo(22, 0); ctx.quadraticCurveTo(26, -30, 12, -70);
  ctx.closePath(); ctx.fill();
  /* ながい みずいろの かみ */
  ctx.fillStyle = '#8fd6f5';
  ctx.beginPath();
  ctx.moveTo(-16, -96);
  ctx.quadraticCurveTo(-30, -60, -20, -24 + Math.sin(s.t * 2) * 4);
  ctx.quadraticCurveTo(-10, -56, -6, -92);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(16, -96);
  ctx.quadraticCurveTo(30, -60, 20, -24 - Math.sin(s.t * 2) * 4);
  ctx.quadraticCurveTo(10, -56, 6, -92);
  ctx.closePath(); ctx.fill();
  /* かお */
  ctx.fillStyle = '#fbe3d0';
  ctx.beginPath(); ctx.arc(0, -88, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1e3f75';
  ctx.beginPath(); ctx.arc(-4, -89, 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(5, -89, 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,150,180,.4)';
  ctx.beginPath(); ctx.arc(-9, -84, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(10, -84, 3, 0, Math.PI * 2); ctx.fill();
  /* ぼうし */
  wizHat(ctx, 0, -100, '#1e3f75', '#4a7fc0', 1.0, s.t);
  /* こおりの まほう */
  if (a >= 0) {
    ctx.fillStyle = 'rgba(180,235,255,' + (0.4 + a * 0.5) + ')';
    for (let i = 0; i < 4; i++) {
      const an = -0.8 + i * 0.45;
      ctx.beginPath();
      ctx.arc(26 + Math.cos(an) * (14 + a * 12), -56 + Math.sin(an) * (14 + a * 12), 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/* ⑥ マンドレイク：さけぶ ねっこ */
function drawMandrake(ctx, s) {
  const a = s.atk;
  const wob = Math.sin(s.t * 4) * 0.08;
  ctx.save();
  ctx.rotate(wob);
  /* ねっこの あし */
  ctx.strokeStyle = '#8a6a44'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-6, -20); ctx.quadraticCurveTo(-14, -8, -16, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(6, -20); ctx.quadraticCurveTo(14, -8, 16, 0); ctx.stroke();
  /* からだ（ねっこ）*/
  const g = ctx.createLinearGradient(0, -56, 0, -10);
  g.addColorStop(0, '#c9a06a'); g.addColorStop(1, '#8a6a44');
  ctx.fillStyle = g;
  ellipse(ctx, 0, -34, 20, 24); ctx.fill();
  /* うで */
  ctx.strokeStyle = '#a8814c'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(-16, -42); ctx.quadraticCurveTo(-30, -52, -26, -64); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(16, -42); ctx.quadraticCurveTo(30, -52, 26, -64); ctx.stroke();
  /* かお（おおきく さけぶ）*/
  ctx.fillStyle = '#2b1b12';
  ctx.beginPath(); ctx.arc(-7, -40, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(7, -40, 3, 0, Math.PI * 2); ctx.fill();
  const open = (a >= 0) ? 10 + a * 8 : 7;
  ctx.fillStyle = '#5d1414';
  ellipse(ctx, 0, -26, 9, open); ctx.fill();
  ctx.fillStyle = '#e08a86';
  ellipse(ctx, 0, -22, 4.5, open * 0.4); ctx.fill();
  /* はっぱ */
  ctx.fillStyle = '#6d9e3a';
  for (let i = -2; i <= 2; i++) {
    ctx.save();
    ctx.translate(0, -56); ctx.rotate(i * 0.42 + Math.sin(s.t * 3 + i) * 0.06);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.quadraticCurveTo(6, -16, 0, -30); ctx.quadraticCurveTo(-6, -16, 0, 0);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  /* さけびの なみ */
  if (a >= 0) {
    ctx.strokeStyle = 'rgba(140,220,120,' + (0.4 + a * 0.5) + ')';
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.arc(18, -26, 12 + i * 10 + a * 10, -0.7, 0.7); ctx.stroke();
    }
  }
  ctx.restore();
}

/* ⑦ ルーンゴーレム：ルーンが ひかる いしの きょじん */
function drawRunegolem(ctx, s) {
  const a = s.atk;
  const step = Math.sin(s.t * 2.4) * (s.moving ? 1 : 0);
  const swing = (a >= 0) ? (a < 0.6 ? -a * 1.8 : (a - 0.6) / 0.4 * 3.0 - 1.08) : -0.3;
  ctx.save();
  ctx.translate(0, -Math.abs(step) * 2);
  const ST = '#6b7f96', ST2 = '#41556b';

  /* あし */
  ctx.fillStyle = ST2;
  roundRect(ctx, -26 - step * 4, -30, 22, 30, 5); ctx.fill();
  roundRect(ctx,   6 + step * 4, -30, 22, 30, 5); ctx.fill();
  /* どうたい */
  const g = ctx.createLinearGradient(0, -100, 0, -26);
  g.addColorStop(0, ST); g.addColorStop(1, ST2);
  ctx.fillStyle = g;
  roundRect(ctx, -30, -100, 60, 74, 8); ctx.fill();
  /* ひかる ルーン */
  ctx.strokeStyle = 'rgba(120,210,255,' + (0.5 + Math.sin(s.t * 4) * 0.3 + (a >= 0 ? a * 0.3 : 0)) + ')';
  ctx.lineWidth = 3; ctx.lineCap = 'round';
  const runes = [[-16, -84], [4, -78], [-8, -60], [12, -52], [-18, -44]];
  runes.forEach(([rx, ry], i) => {
    ctx.beginPath();
    if (i % 3 === 0) { ctx.moveTo(rx - 5, ry - 6); ctx.lineTo(rx + 5, ry + 6); ctx.moveTo(rx + 5, ry - 6); ctx.lineTo(rx - 5, ry + 6); }
    else if (i % 3 === 1) { ctx.moveTo(rx, ry - 7); ctx.lineTo(rx, ry + 7); ctx.moveTo(rx - 5, ry - 3); ctx.lineTo(rx + 5, ry - 3); }
    else { ctx.moveTo(rx - 5, ry + 6); ctx.lineTo(rx, ry - 7); ctx.lineTo(rx + 5, ry + 6); }
    ctx.stroke();
  });
  /* うしろの うで */
  ctx.fillStyle = ST2;
  roundRect(ctx, -46, -92, 18, 40, 7); ctx.fill();
  /* まえの うで */
  ctx.save();
  ctx.translate(30, -88); ctx.rotate(swing);
  ctx.fillStyle = ST;
  roundRect(ctx, -6, -10, 34, 21, 8); ctx.fill();
  ctx.fillStyle = ST2;
  roundRect(ctx, 24, -14, 20, 28, 6); ctx.fill();
  ctx.restore();
  /* あたま */
  ctx.fillStyle = ST;
  roundRect(ctx, -18, -128, 36, 30, 6); ctx.fill();
  botEye(ctx, -7, -113, 4.4, '#7ad2ff');
  botEye(ctx, 8, -113, 4.4, '#7ad2ff');
  ctx.restore();
}

/* ⑧ カオススペル：うかぶ まほうしょ */
function drawChaosspell(ctx, s) {
  const a = s.atk;
  const fl = Math.sin(s.t * 2.4) * 5;
  ctx.save();
  ctx.translate(0, -56 + fl);
  ctx.rotate(Math.sin(s.t * 1.6) * 0.06);
  /* とげ */
  ctx.fillStyle = '#b8a24a';
  for (let i = 0; i < 10; i++) {
    const an = (i / 10) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(an) * 30, Math.sin(an) * 36);
    ctx.lineTo(Math.cos(an) * 42, Math.sin(an) * 48);
    ctx.lineTo(Math.cos(an + 0.2) * 30, Math.sin(an + 0.2) * 36);
    ctx.closePath(); ctx.fill();
  }
  /* ほん */
  const g = ctx.createLinearGradient(-28, -34, 28, 34);
  g.addColorStop(0, '#5a3f9c'); g.addColorStop(1, '#2b1c56');
  ctx.fillStyle = g;
  roundRect(ctx, -28, -34, 56, 68, 5); ctx.fill();
  ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 3;
  roundRect(ctx, -28, -34, 56, 68, 5); ctx.stroke();
  ctx.strokeStyle = '#b8a24a'; ctx.lineWidth = 2;
  roundRect(ctx, -21, -27, 42, 54, 3); ctx.stroke();
  /* まんなかの め */
  ctx.fillStyle = '#f0e6d0';
  ellipse(ctx, 0, 0, 15, 11); ctx.fill();
  ctx.fillStyle = '#5a3f9c';
  ctx.beginPath(); ctx.arc(2, 0, 7.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1b1b1b';
  ctx.beginPath(); ctx.arc(2, 0, 3.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(0, -2, 1.6, 0, Math.PI * 2); ctx.fill();
  /* まわる まほうじん */
  ctx.save();
  ctx.rotate(s.t * (a >= 0 ? 4 : 1.2));
  ctx.strokeStyle = 'rgba(200,130,255,' + (0.35 + (a >= 0 ? a * 0.5 : 0)) + ')';
  ctx.lineWidth = 2.6;
  for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.arc(0, 0, 46 + i * 12, 0, Math.PI * 2); ctx.stroke(); }
  ctx.restore();
  ctx.restore();
}

/* ⑨ 賢者カロン：ちゅうボス */
function drawSagecharon(ctx, s) {
  const a = s.atk;
  const fl = Math.sin(s.t * 2) * 3;
  ctx.save();
  ctx.translate(0, fl);
  /* まほうの たま */
  for (let i = 0; i < 4; i++) {
    const an = s.t * 1.6 + i * 1.57;
    ctx.fillStyle = 'rgba(120,210,255,.7)';
    ctx.beginPath();
    ctx.arc(Math.cos(an) * 46, -60 + Math.sin(an) * 34, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  /* ローブ */
  const g = ctx.createLinearGradient(0, -104, 0, 0);
  g.addColorStop(0, '#4a3f9c'); g.addColorStop(1, '#241a58');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-18, -104); ctx.quadraticCurveTo(-36, -46, -32, 0);
  ctx.lineTo(32, 0); ctx.quadraticCurveTo(36, -46, 18, -104);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e0b53a';
  roundRect(ctx, -26, -56, 54, 7, 3); ctx.fill();
  /* ながい しろひげ */
  ctx.fillStyle = '#f2f2f2';
  ctx.beginPath();
  ctx.moveTo(-16, -112);
  ctx.quadraticCurveTo(-12, -60, 0, -44);
  ctx.quadraticCurveTo(14, -60, 18, -112);
  ctx.quadraticCurveTo(0, -100, -16, -112);
  ctx.closePath(); ctx.fill();
  /* かお */
  ctx.fillStyle = '#f7d9b8';
  ellipse(ctx, 0, -120, 17, 16); ctx.fill();
  ctx.fillStyle = '#f2f2f2';
  ctx.beginPath(); ctx.arc(0, -128, 18, Math.PI * 1.05, Math.PI * 2.05); ctx.fill();
  ctx.strokeStyle = '#3a2a20'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-11, -126); ctx.lineTo(-2, -122); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(12, -126); ctx.lineTo(3, -122); ctx.stroke();
  ctx.fillStyle = '#2b2340';
  ctx.beginPath(); ctx.arc(-5, -118, 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(6, -118, 2.6, 0, Math.PI * 2); ctx.fill();
  /* ぼうし */
  wizHat(ctx, 0, -140, '#3a2f78', '#6a53c0', 1.15, s.t);
  /* つえ */
  ctx.save();
  ctx.translate(30, -90); ctx.rotate(a >= 0 ? -0.35 + a * 0.45 : -0.08);
  ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(0, 84); ctx.lineTo(2, -32); ctx.stroke();
  const r = (a >= 0) ? 12 + a * 10 : 11;
  const gg = ctx.createRadialGradient(3, -40, 1, 3, -40, r);
  gg.addColorStop(0, '#e3f6ff'); gg.addColorStop(0.5, '#4fc3f7'); gg.addColorStop(1, 'rgba(79,195,247,0)');
  ctx.fillStyle = gg;
  ctx.beginPath(); ctx.arc(3, -40, r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.restore();
}

/* ⑩ 終焉の大魔導士ゼノス：だい6しょうの おおボス */
function drawZenos(ctx, s) {
  const a = s.atk;
  const fl = Math.sin(s.t * 1.6) * 5;
  ctx.save();
  ctx.translate(0, -14 + fl);

  /* うしろの まほうじん */
  ctx.save();
  ctx.translate(0, -74); ctx.rotate(-s.t * 0.8);
  ctx.strokeStyle = 'rgba(190,110,255,' + (0.3 + (a >= 0 ? a * 0.4 : 0)) + ')';
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, 0, 60 + i * 16, 0, Math.PI * 2); ctx.stroke(); }
  for (let i = 0; i < 6; i++) {
    const an = (i / 6) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(Math.cos(an) * 60, Math.sin(an) * 60);
    ctx.lineTo(Math.cos(an + 2.09) * 60, Math.sin(an + 2.09) * 60); ctx.stroke();
  }
  ctx.restore();

  /* うかぶ むらさきの たま */
  for (let i = 0; i < 6; i++) {
    const an = s.t * 1.2 + i * 1.05;
    const rr = 62 + Math.sin(s.t * 2 + i) * 8;
    ctx.fillStyle = 'rgba(180,90,255,.75)';
    ctx.beginPath();
    ctx.arc(Math.cos(an) * rr, -74 + Math.sin(an) * rr * 0.7, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(240,200,255,.85)';
    ctx.beginPath();
    ctx.arc(Math.cos(an) * rr - 2, -76 + Math.sin(an) * rr * 0.7, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  /* ローブ（くろむらさき）*/
  const g = ctx.createLinearGradient(0, -130, 0, 0);
  g.addColorStop(0, '#3c1f6e'); g.addColorStop(1, '#150a2e');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-22, -130); ctx.quadraticCurveTo(-46, -56, -40, 6);
  ctx.lineTo(40, 6); ctx.quadraticCurveTo(46, -56, 22, -130);
  ctx.closePath(); ctx.fill();
  /* きんの もよう */
  ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-20, -70); ctx.lineTo(20, -70); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-26, -40); ctx.lineTo(26, -40); ctx.stroke();
  ctx.fillStyle = '#c9a24a';
  starPath(ctx, 0, -56, 8, 3.4, s.t); ctx.fill();

  /* かたの とげ */
  ctx.fillStyle = '#2b1550';
  for (const d of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(d * 20, -124); ctx.lineTo(d * 44, -140); ctx.lineTo(d * 34, -110);
    ctx.closePath(); ctx.fill();
  }

  /* フード */
  ctx.fillStyle = '#2b1550';
  ctx.beginPath(); ctx.arc(0, -144, 24, Math.PI * 0.86, Math.PI * 2.14); ctx.fill();
  ctx.fillStyle = '#080418';
  ctx.beginPath(); ctx.arc(0, -142, 18, 0, Math.PI * 2); ctx.fill();
  /* ひかる め */
  const eg = ctx.createRadialGradient(0, 0, 1, 0, 0, 12);
  eg.addColorStop(0, '#e9c6ff'); eg.addColorStop(1, 'rgba(190,110,255,0)');
  for (const ex of [-7, 8]) {
    ctx.save(); ctx.translate(ex, -144);
    ctx.fillStyle = eg;
    ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f3e0ff';
    ellipse(ctx, 0, 0, 3.6, 4.4); ctx.fill();
    ctx.restore();
  }

  /* つえ */
  ctx.save();
  ctx.translate(38, -104); ctx.rotate(a >= 0 ? -0.3 + a * 0.4 : -0.06);
  ctx.strokeStyle = '#2b1550'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(0, 106); ctx.lineTo(4, -40); ctx.stroke();
  ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(6, -52, 14, 0.4, Math.PI * 1.75); ctx.stroke();
  const r = (a >= 0) ? 12 + a * 12 : 10;
  const sg = ctx.createRadialGradient(6, -52, 1, 6, -52, r);
  sg.addColorStop(0, '#f3e0ff'); sg.addColorStop(0.5, '#b45cff'); sg.addColorStop(1, 'rgba(120,40,200,0)');
  ctx.fillStyle = sg;
  ctx.beginPath(); ctx.arc(6, -52, r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.restore();
}


/* ==================================================================
   だい5しょう「賑わう近海」の てきたち
   ================================================================== */

/* ① プカクラゲ：ふわふわ ただよう くらげ */
function drawPukakurage(ctx, s) {
  const a = s.atk;
  const fl = Math.sin(s.t * 2.6) * 4;
  const sq = Math.sin(s.t * 2.6) * 0.08;
  ctx.save();
  ctx.translate(0, -34 + fl);

  /* しょくしゅ */
  ctx.strokeStyle = 'rgba(120,200,240,.85)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const bx = -16 + i * 8;
    ctx.beginPath();
    ctx.moveTo(bx, 8);
    ctx.quadraticCurveTo(bx + Math.sin(s.t * 4 + i) * 7, 22, bx + Math.sin(s.t * 4 + i + 1) * 9, 34 + (a >= 0 ? 5 : 0));
    ctx.stroke();
  }

  /* かさ */
  const g = ctx.createLinearGradient(0, -24, 0, 10);
  g.addColorStop(0, 'rgba(230,248,255,.95)');
  g.addColorStop(1, 'rgba(120,200,240,.9)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, 24 * (1 + sq), 20 * (1 - sq), 0, Math.PI, 0);
  ctx.quadraticCurveTo(12, 10, 0, 6);
  ctx.quadraticCurveTo(-12, 10, -24 * (1 + sq), 0);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(80,170,220,.8)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  ellipse(ctx, -8, -8, 6, 4); ctx.fill();

  /* かお */
  ctx.fillStyle = '#1b3a4a';
  ctx.beginPath(); ctx.arc(-6, -2, 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(7, -2, 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#1b3a4a'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(0.5, 2, 3, 0.2, Math.PI - 0.2); ctx.stroke();
  ctx.fillStyle = 'rgba(255,150,160,.45)';
  ctx.beginPath(); ctx.arc(-13, 2, 3.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(14, 2, 3.4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

/* ② チビサメ：すばやい こざめ */
function drawChibisame(ctx, s) {
  const a = s.atk;
  const sw = Math.sin(s.t * 12) * (s.moving ? 1 : 0.4);
  const dash = (a >= 0) ? (a < 0.45 ? -a * 8 : (a - 0.45) * 40) : 0;
  ctx.save();
  ctx.translate(dash, -30 + Math.sin(s.t * 6) * 2);

  /* しっぽ */
  ctx.fillStyle = '#4a6f88';
  ctx.beginPath();
  ctx.moveTo(-22, 0);
  ctx.lineTo(-38 + sw * 3, -14); ctx.lineTo(-32, 0); ctx.lineTo(-38 + sw * 3, 12);
  ctx.closePath(); ctx.fill();
  /* せびれ */
  ctx.beginPath();
  ctx.moveTo(-4, -12); ctx.lineTo(2, -28); ctx.lineTo(12, -11); ctx.closePath(); ctx.fill();
  /* はらびれ */
  ctx.beginPath();
  ctx.moveTo(-2, 8); ctx.lineTo(-8 + sw * 2, 20); ctx.lineTo(8, 9); ctx.closePath(); ctx.fill();

  /* からだ */
  const g = ctx.createLinearGradient(0, -14, 0, 14);
  g.addColorStop(0, '#7f9fb5'); g.addColorStop(0.55, '#5a7f99'); g.addColorStop(1, '#e9f0f4');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-26, 0);
  ctx.quadraticCurveTo(-8, -16, 22, -8);
  ctx.quadraticCurveTo(32, -2, 30, 2);
  ctx.quadraticCurveTo(10, 16, -26, 0);
  ctx.closePath(); ctx.fill();

  /* くち と は */
  ctx.fillStyle = '#8e1b1b';
  ctx.beginPath();
  ctx.moveTo(12, 2); ctx.quadraticCurveTo(24, (a >= 0 ? 12 : 6), 30, 2);
  ctx.quadraticCurveTo(22, 2, 12, 2);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(14 + i * 4, 2); ctx.lineTo(16 + i * 4, 7); ctx.lineTo(18 + i * 4, 2);
    ctx.closePath(); ctx.fill();
  }
  /* め */
  ctx.fillStyle = '#1b1b1b';
  ctx.beginPath(); ctx.arc(16, -5, 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(15, -6, 1, 0, Math.PI * 2); ctx.fill();
  /* えら */
  ctx.strokeStyle = 'rgba(40,70,90,.6)'; ctx.lineWidth = 1.4;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(2 + i * 4, -6); ctx.lineTo(1 + i * 4, 4); ctx.stroke(); }
  ctx.restore();
}

/* ③ イカマジン：ぼうしを かぶった まほうつかいの いか */
function drawIkamajin(ctx, s) {
  const a = s.atk;
  const fl = Math.sin(s.t * 3) * 3;
  ctx.save();
  ctx.translate(0, -40 + fl);

  /* あし */
  ctx.strokeStyle = '#cfd8e6'; ctx.lineWidth = 4.4; ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const bx = -18 + i * 7.5;
    ctx.beginPath();
    ctx.moveTo(bx, 14);
    ctx.quadraticCurveTo(bx + Math.sin(s.t * 5 + i) * 8, 28, bx + Math.sin(s.t * 5 + i + 1) * 10, 40);
    ctx.stroke();
  }
  /* どうたい */
  const g = ctx.createLinearGradient(0, -22, 0, 18);
  g.addColorStop(0, '#f3f6fb'); g.addColorStop(1, '#c3cfe0');
  ctx.fillStyle = g;
  ellipse(ctx, 0, 0, 22, 20); ctx.fill();
  ctx.strokeStyle = '#94a5bd'; ctx.lineWidth = 2; ellipse(ctx, 0, 0, 22, 20); ctx.stroke();
  /* め（きんいろ・するどい）*/
  ctx.fillStyle = '#f5c518';
  ellipse(ctx, -7, -2, 6, 5); ctx.fill();
  ellipse(ctx, 9, -2, 6, 5); ctx.fill();
  ctx.fillStyle = '#1b1b1b';
  ctx.fillRect(-8, -5, 2, 6); ctx.fillRect(8, -5, 2, 6);
  ctx.strokeStyle = '#3a4a5e'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-14, -10); ctx.lineTo(-3, -6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(16, -10); ctx.lineTo(5, -6); ctx.stroke();

  /* まほうの ぼうし */
  ctx.save();
  ctx.translate(0, -20); ctx.rotate(-0.1);
  const hg = ctx.createLinearGradient(0, -34, 0, 4);
  hg.addColorStop(0, '#3b4fa0'); hg.addColorStop(1, '#22306b');
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.moveTo(-15, 2); ctx.quadraticCurveTo(-4, -18, 6, -36);
  ctx.quadraticCurveTo(10, -16, 17, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#2c3a80';
  roundRect(ctx, -19, -2, 38, 7, 3); ctx.fill();
  ctx.fillStyle = '#ffe082';
  starPath(ctx, -3, -13, 3, 1.4, s.t * 1.4); ctx.fill();
  starPath(ctx, 5, -25, 2.4, 1.1, -s.t); ctx.fill();
  ctx.restore();

  /* つえ */
  ctx.save();
  ctx.translate(22, 4); ctx.rotate(a >= 0 ? -0.5 + a * 0.6 : -0.2);
  ctx.strokeStyle = '#8d6e3a'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(10, -22); ctx.stroke();
  const r = (a >= 0) ? 8 + a * 6 : 7;
  ctx.fillStyle = 'rgba(120,200,240,' + (a >= 0 ? 0.5 + a * 0.4 : 0.45) + ')';
  ctx.beginPath(); ctx.arc(11, -25, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e3f6ff';
  ctx.beginPath(); ctx.arc(11, -25, r * 0.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.restore();
}

/* ④ トゲフグ：ふくらむ ふぐ */
function drawTogefugu(ctx, s) {
  const a = s.atk;
  const puff = (a >= 0) ? 1 + a * 0.34 : 1 + Math.sin(s.t * 2.2) * 0.04;
  const R = 26 * puff;
  ctx.save();
  ctx.translate(0, -R - 6);

  /* ひれ */
  ctx.fillStyle = '#8a9aa8';
  ctx.beginPath(); ctx.moveTo(-R + 2, 0); ctx.lineTo(-R - 14, -10); ctx.lineTo(-R - 12, 8); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(R - 6, 6); ctx.lineTo(R + 10, 12); ctx.lineTo(R - 4, 16); ctx.closePath(); ctx.fill();

  /* とげ */
  ctx.strokeStyle = '#5c6b78'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
  for (let i = 0; i < 18; i++) {
    const an = (i / 18) * Math.PI * 2;
    const len = 8 + (a >= 0 ? a * 8 : 0);
    ctx.beginPath();
    ctx.moveTo(Math.cos(an) * R * 0.94, Math.sin(an) * R * 0.9);
    ctx.lineTo(Math.cos(an) * (R + len), Math.sin(an) * (R * 0.96 + len));
    ctx.stroke();
  }

  /* からだ */
  const g = ctx.createLinearGradient(0, -R, 0, R);
  g.addColorStop(0, '#9fb0bd'); g.addColorStop(0.6, '#7d8f9d'); g.addColorStop(1, '#e8eef2');
  ctx.fillStyle = g;
  ellipse(ctx, 0, 0, R, R * 0.94); ctx.fill();
  ctx.strokeStyle = '#5c6b78'; ctx.lineWidth = 2; ellipse(ctx, 0, 0, R, R * 0.94); ctx.stroke();
  /* もよう */
  ctx.fillStyle = 'rgba(70,90,105,.35)';
  for (const [px, py] of [[-10, -10], [4, -14], [12, -4], [-14, 2]]) {
    ctx.beginPath(); ctx.arc(px * puff, py * puff, 3, 0, Math.PI * 2); ctx.fill();
  }
  /* おおきい め */
  for (let i = 0; i < 2; i++) {
    const ex = -8 + i * 17;
    ctx.fillStyle = '#ffffff';
    ellipse(ctx, ex, -3, 8, 8.6); ctx.fill();
    ctx.fillStyle = '#f5a623';
    ellipse(ctx, ex + 1, -3, 5.4, 5.8); ctx.fill();
    ctx.fillStyle = '#1b1b1b';
    ellipse(ctx, ex + 1.5, -3, 3, 3.4); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(ex - 1, -5.4, 1.6, 0, Math.PI * 2); ctx.fill();
  }
  /* くち */
  ctx.fillStyle = '#c98a86';
  ellipse(ctx, 5, 10, 5, 3.6); ctx.fill();
  ctx.restore();
}

/* ⑤ オクトキャノン：ほうを かついだ たこ */
function drawOctocannon(ctx, s) {
  const a = s.atk;
  const fl = Math.sin(s.t * 3) * 2.4;
  ctx.save();
  ctx.translate((a >= 0 && a > 0.7) ? -(a - 0.7) * 22 : 0, -40 + fl);

  /* あし */
  ctx.strokeStyle = '#c94f2e'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const bx = -20 + i * 10;
    ctx.beginPath();
    ctx.moveTo(bx, 14);
    ctx.quadraticCurveTo(bx + Math.sin(s.t * 4 + i) * 10, 28, bx + Math.sin(s.t * 4 + i + 1) * 12, 40);
    ctx.stroke();
  }
  /* あたま */
  const g = ctx.createLinearGradient(0, -24, 0, 18);
  g.addColorStop(0, '#f07a4e'); g.addColorStop(1, '#b8401f');
  ctx.fillStyle = g;
  ellipse(ctx, 0, 0, 24, 22); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.22)';
  ellipse(ctx, -9, -9, 7, 5); ctx.fill();
  /* め */
  ctx.fillStyle = '#fff8e1';
  ellipse(ctx, -7, -2, 6, 6.6); ctx.fill();
  ellipse(ctx, 9, -2, 6, 6.6); ctx.fill();
  ctx.fillStyle = '#1b1b1b';
  ellipse(ctx, -6, -2, 3.2, 3.8); ctx.fill();
  ellipse(ctx, 10, -2, 3.2, 3.8); ctx.fill();
  ctx.strokeStyle = '#7a2a12'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-14, -11); ctx.lineTo(-3, -7); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(16, -11); ctx.lineTo(5, -7); ctx.stroke();

  /* ヘルメット */
  ctx.fillStyle = '#5d6b52';
  ctx.beginPath(); ctx.ellipse(0, -14, 25, 15, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#4a5742';
  roundRect(ctx, -26, -16, 52, 6, 3); ctx.fill();

  /* 2もんの ほう */
  for (let i = 0; i < 2; i++) {
    const oy = -18 + i * 16;
    ctx.fillStyle = '#3a3f45';
    roundRect(ctx, 16, oy - 6, 40, 12, 4); ctx.fill();
    ctx.fillStyle = '#22262b';
    roundRect(ctx, 50, oy - 8, 12, 16, 3); ctx.fill();
    if (a >= 0 && a > 0.7) {
      const t2 = (a - 0.7) / 0.3;
      ctx.fillStyle = 'rgba(40,40,60,' + (1 - t2) * 0.8 + ')';
      ctx.beginPath(); ctx.arc(66 + t2 * 20, oy, 8 + t2 * 12, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

/* ⑥ ウミヘビ：しなやかな うみへび */
function drawUmihebi(ctx, s) {
  const a = s.atk;
  const w = Math.sin(s.t * 7);
  ctx.save();
  ctx.translate((a >= 0 && a > 0.5) ? (a - 0.5) * 30 : 0, 0);

  /* からだ（うねうね）*/
  ctx.strokeStyle = '#4a6f9e'; ctx.lineWidth = 15; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-52, -10);
  ctx.quadraticCurveTo(-34, -26 + w * 8, -16, -34);
  ctx.quadraticCurveTo(2, -42 - w * 8, 20, -48);
  ctx.stroke();
  ctx.strokeStyle = '#6e93c2'; ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(-52, -10);
  ctx.quadraticCurveTo(-34, -26 + w * 8, -16, -34);
  ctx.quadraticCurveTo(2, -42 - w * 8, 20, -48);
  ctx.stroke();
  /* せびれ */
  ctx.fillStyle = '#3a5a86';
  for (let i = 0; i < 5; i++) {
    const t2 = i / 5;
    const px = -52 + t2 * 70, py = -10 - t2 * 34 + Math.sin(s.t * 7 + i) * 4;
    ctx.beginPath();
    ctx.moveTo(px - 4, py - 6); ctx.lineTo(px, py - 18); ctx.lineTo(px + 5, py - 6);
    ctx.closePath(); ctx.fill();
  }

  /* あたま */
  ctx.save();
  ctx.translate(26, -52);
  ctx.rotate(0.15 + (a >= 0 ? -a * 0.3 : 0));
  ctx.fillStyle = '#5a7fae';
  ctx.beginPath();
  ctx.moveTo(-12, -8); ctx.quadraticCurveTo(16, -10, 24, 0);
  ctx.quadraticCurveTo(16, 10, -12, 10);
  ctx.closePath(); ctx.fill();
  /* くち */
  ctx.fillStyle = '#8e1b1b';
  ctx.beginPath();
  ctx.moveTo(6, 2); ctx.quadraticCurveTo(18, (a >= 0 ? 14 : 8), 24, 1);
  ctx.quadraticCurveTo(16, 3, 6, 2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.moveTo(8, 2); ctx.lineTo(11, 9); ctx.lineTo(13, 2); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(16, 2); ctx.lineTo(19, 8); ctx.lineTo(21, 2); ctx.closePath(); ctx.fill();
  /* め */
  ctx.fillStyle = '#f5c518';
  ellipse(ctx, 6, -3, 4.4, 3.6); ctx.fill();
  ctx.fillStyle = '#1b1b1b'; ctx.fillRect(5.4, -5, 1.8, 4);
  ctx.restore();
  ctx.restore();
}

/* ⑦ カニタンク：ほうを つんだ かに */
function drawKanitank(ctx, s) {
  const a = s.atk;
  const step = Math.sin(s.t * 3) * (s.moving ? 1 : 0);
  const recoil = (a >= 0 && a > 0.75) ? -(a - 0.75) * 30 : 0;
  ctx.save();
  ctx.translate(recoil, 0);

  /* あし */
  ctx.strokeStyle = '#b8482a'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    for (const dir of [-1, 1]) {
      const bx = dir * (14 + i * 11);
      ctx.beginPath();
      ctx.moveTo(bx, -26);
      ctx.lineTo(bx + dir * 10, -14 + step * 3 * (i % 2 ? 1 : -1));
      ctx.lineTo(bx + dir * 14, 0);
      ctx.stroke();
    }
  }

  /* こうら */
  const g = ctx.createLinearGradient(0, -60, 0, -20);
  g.addColorStop(0, '#e8683f'); g.addColorStop(1, '#a83a1c');
  ctx.fillStyle = g;
  ellipse(ctx, 0, -40, 40, 22); ctx.fill();
  ctx.strokeStyle = '#7d2a10'; ctx.lineWidth = 2.4;
  ellipse(ctx, 0, -40, 40, 22); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.2)';
  ellipse(ctx, -12, -48, 12, 6); ctx.fill();

  /* め（とびだし）*/
  for (const dx of [-12, 12]) {
    ctx.strokeStyle = '#b8482a'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(dx, -54); ctx.lineTo(dx, -66); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(dx, -70, 5.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1b1b1b';
    ctx.beginPath(); ctx.arc(dx + 1, -70, 2.8, 0, Math.PI * 2); ctx.fill();
  }

  /* ハサミ */
  ctx.save();
  ctx.translate(-42, -40); ctx.rotate(a >= 0 ? -0.3 : 0.1);
  ctx.fillStyle = '#e8683f';
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(-20, -12); ctx.lineTo(-26, -2); ctx.lineTo(-18, 4); ctx.lineTo(-26, 10); ctx.lineTo(-16, 14);
  ctx.closePath(); ctx.fill();
  ctx.restore();

  /* せなかの ほう */
  ctx.fillStyle = '#4a5742';
  roundRect(ctx, -6, -74, 24, 16, 4); ctx.fill();
  ctx.fillStyle = '#3a3f45';
  roundRect(ctx, 16, -70, 44, 12, 4); ctx.fill();
  ctx.fillStyle = '#22262b';
  roundRect(ctx, 54, -73, 12, 18, 3); ctx.fill();
  if (a >= 0 && a > 0.75) {
    const t2 = (a - 0.75) / 0.25;
    ctx.fillStyle = 'rgba(255,200,120,' + (1 - t2) + ')';
    ctx.beginPath(); ctx.arc(70 + t2 * 26, -64, 10 + t2 * 16, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

/* ⑧ ダイオウエイ：ひかる もようの おおきな えい */
function drawDaiouei(ctx, s) {
  const a = s.atk;
  const wave = Math.sin(s.t * 3);
  ctx.save();
  ctx.translate(0, -46 + Math.sin(s.t * 2) * 4);

  /* しっぽ */
  ctx.strokeStyle = '#1d2b3a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-36, 4);
  ctx.quadraticCurveTo(-58, 4 + wave * 8, -74, -6);
  ctx.stroke();

  /* からだ（ひしがた）*/
  const g = ctx.createLinearGradient(0, -22, 0, 22);
  g.addColorStop(0, '#2c4256'); g.addColorStop(1, '#111c28');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(34, 0);
  ctx.quadraticCurveTo(6, -26 + wave * 6, -34, -14 + wave * 8);
  ctx.quadraticCurveTo(-20, 0, -34, 14 - wave * 8);
  ctx.quadraticCurveTo(6, 26 - wave * 6, 34, 0);
  ctx.closePath(); ctx.fill();

  /* ひかる もよう */
  ctx.strokeStyle = 'rgba(120,230,255,' + (0.6 + Math.sin(s.t * 4) * 0.25) + ')';
  ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-14, -8); ctx.lineTo(2, 0); ctx.lineTo(-14, 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-2, -12); ctx.lineTo(14, 0); ctx.lineTo(-2, 12);
  ctx.stroke();

  /* め */
  ctx.fillStyle = 'rgba(150,240,255,.95)';
  ctx.beginPath(); ctx.arc(22, -5, 3.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(22, 5, 3.4, 0, Math.PI * 2); ctx.fill();

  /* かいりゅう */
  if (a >= 0) {
    ctx.strokeStyle = 'rgba(120,220,255,' + (0.3 + a * 0.5) + ')';
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(40, 0, 16 + i * 12 + a * 14, -0.7, 0.7);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/* ⑨ 深海の主 ネレイド：うみを すべる ちゅうボス */
function drawNereid(ctx, s) {
  const a = s.atk;
  const rage = !!s.enraged;
  const fl = Math.sin(s.t * 2) * 4;
  ctx.save();
  ctx.translate(0, fl);

  /* みずの うず（うしろ）*/
  ctx.strokeStyle = 'rgba(120,210,255,' + (0.3 + (a >= 0 ? a * 0.4 : 0)) + ')';
  ctx.lineWidth = 4;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(0, -60, 46 + i * 16, 40 + i * 12, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  /* さかなの したはんしん */
  const tg = ctx.createLinearGradient(0, -50, 0, 0);
  tg.addColorStop(0, '#3aa8a0'); tg.addColorStop(1, '#1b6f78');
  ctx.fillStyle = tg;
  ctx.beginPath();
  ctx.moveTo(-16, -50);
  ctx.quadraticCurveTo(-22, -20, -34, -2);
  ctx.quadraticCurveTo(-6, -12, 18, -4);
  ctx.quadraticCurveTo(10, -26, 16, -50);
  ctx.closePath(); ctx.fill();
  /* おびれ */
  ctx.fillStyle = 'rgba(90,220,220,.8)';
  ctx.beginPath();
  ctx.moveTo(-30, -6); ctx.lineTo(-52, -22); ctx.lineTo(-44, -2); ctx.lineTo(-54, 8); ctx.lineTo(-28, 4);
  ctx.closePath(); ctx.fill();

  /* うわみ */
  ctx.fillStyle = '#f2d3b8';
  roundRect(ctx, -14, -96, 28, 48, 12); ctx.fill();
  /* きんの かざり */
  ctx.fillStyle = '#e0b53a';
  roundRect(ctx, -16, -76, 32, 8, 4); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -86, 7, 0, Math.PI * 2); ctx.fill();

  /* ながい みどりの かみ */
  ctx.fillStyle = '#2f8f86';
  ctx.beginPath();
  ctx.moveTo(-18, -118);
  ctx.quadraticCurveTo(-38, -80, -26, -40 + Math.sin(s.t * 2) * 6);
  ctx.quadraticCurveTo(-14, -74, -8, -112);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(18, -118);
  ctx.quadraticCurveTo(38, -80, 26, -40 - Math.sin(s.t * 2) * 6);
  ctx.quadraticCurveTo(14, -74, 8, -112);
  ctx.closePath(); ctx.fill();

  /* かお */
  ctx.fillStyle = '#f7dcc2';
  ellipse(ctx, 0, -112, 15, 16); ctx.fill();
  ctx.fillStyle = rage ? '#ff5252' : '#2a6b78';
  ellipse(ctx, -5, -114, 3, 3.6); ctx.fill();
  ellipse(ctx, 6, -114, 3, 3.6); ctx.fill();
  ctx.strokeStyle = '#8a5a48'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(0.5, -106, 3, 0.2, Math.PI - 0.2); ctx.stroke();

  /* かんむり */
  ctx.fillStyle = '#e0b53a';
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 6 - 2.5, -126);
    ctx.lineTo(i * 6, -138 - (i === 0 ? 6 : 0));
    ctx.lineTo(i * 6 + 2.5, -126);
    ctx.closePath(); ctx.fill();
  }

  /* さんさのやり */
  ctx.save();
  ctx.translate(24, -100); ctx.rotate(a >= 0 ? -0.4 + a * 0.5 : 0.1);
  ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(0, 60); ctx.lineTo(0, -30); ctx.stroke();
  ctx.strokeStyle = '#e0b53a'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
  for (const dx of [-8, 0, 8]) { ctx.beginPath(); ctx.moveTo(dx, -26); ctx.lineTo(dx, -46); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(-8, -26); ctx.lineTo(8, -26); ctx.stroke();
  ctx.restore();

  if (rage) {
    ctx.strokeStyle = 'rgba(255,82,82,' + (0.3 + Math.sin(s.t * 10) * 0.2) + ')';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(0, -66, 58, 76, 0, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

/* ⑩ 暴海竜リヴァイザ：あばれる うみの りゅう */
function drawLeviza(ctx, s) {
  const a = s.atk;
  const rage = !!s.enraged;
  const w = Math.sin(s.t * 2.6);
  ctx.save();

  /* なみ（うしろ）*/
  ctx.fillStyle = 'rgba(60,140,200,.45)';
  ctx.beginPath();
  ctx.moveTo(-90, 0);
  ctx.quadraticCurveTo(-50, -70 + w * 10, 0, -40);
  ctx.quadraticCurveTo(40, -14, 80, -30 - w * 10);
  ctx.lineTo(80, 0);
  ctx.closePath(); ctx.fill();

  /* からだ（うねる）*/
  ctx.strokeStyle = '#2d5f8a'; ctx.lineWidth = 26; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-72, -14);
  ctx.quadraticCurveTo(-40, -46 + w * 10, -6, -60);
  ctx.quadraticCurveTo(22, -72 - w * 8, 40, -92);
  ctx.stroke();
  ctx.strokeStyle = '#4d86b8'; ctx.lineWidth = 17;
  ctx.beginPath();
  ctx.moveTo(-72, -14);
  ctx.quadraticCurveTo(-40, -46 + w * 10, -6, -60);
  ctx.quadraticCurveTo(22, -72 - w * 8, 40, -92);
  ctx.stroke();
  /* せびれ */
  ctx.fillStyle = '#1e4468';
  for (let i = 0; i < 6; i++) {
    const t2 = i / 6;
    const px = -72 + t2 * 100, py = -14 - t2 * 62 + Math.sin(s.t * 2.6 + i) * 6;
    ctx.beginPath();
    ctx.moveTo(px - 6, py - 10); ctx.lineTo(px, py - 26); ctx.lineTo(px + 7, py - 10);
    ctx.closePath(); ctx.fill();
  }

  /* あたま */
  ctx.save();
  ctx.translate(50, -100); ctx.rotate(0.1 + (a >= 0 ? -a * 0.25 : 0));
  ctx.fillStyle = '#3f74a4';
  ctx.beginPath();
  ctx.moveTo(-20, -14); ctx.quadraticCurveTo(24, -18, 36, -2);
  ctx.quadraticCurveTo(24, 16, -20, 16);
  ctx.closePath(); ctx.fill();
  /* つの */
  ctx.strokeStyle = '#cfe4f2'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-12, -14); ctx.quadraticCurveTo(-26, -34, -12, -44); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(4, -16); ctx.quadraticCurveTo(-8, -38, 6, -48); ctx.stroke();
  /* くち */
  const open = (a >= 0) ? 10 + a * 14 : 8;
  ctx.fillStyle = '#5d1414';
  ctx.beginPath();
  ctx.moveTo(6, 2); ctx.quadraticCurveTo(26, 2 + open, 36, -1);
  ctx.quadraticCurveTo(24, 0, 6, 2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(8 + i * 7, 2); ctx.lineTo(11 + i * 7, 10); ctx.lineTo(14 + i * 7, 2);
    ctx.closePath(); ctx.fill();
  }
  /* め */
  ctx.fillStyle = rage ? '#ffe082' : '#f5c518';
  ellipse(ctx, 4, -6, 5, 4); ctx.fill();
  ctx.fillStyle = '#1b1b1b'; ctx.fillRect(3.2, -8.4, 2, 5);
  ctx.restore();

  if (rage) {
    ctx.strokeStyle = 'rgba(120,220,255,' + (0.35 + Math.sin(s.t * 11) * 0.25) + ')';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.ellipse(0, -60, 88, 66, 0, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

/* ★ 波獣ザバーン：なみそのものが いきものに なった おおボス
   （かつしかほくさい「かながわおきなみうら」の おおなみの すがた）      */
function drawZabaan(ctx, s) {
  const a = s.atk;
  const t = s.t;
  ctx.save();

  /* --- おおきな なみの ほんたい --- */
  function crest(off, col, alpha, sc) {
    ctx.fillStyle = col;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(-96 + off, 0);
    ctx.quadraticCurveTo(-70 + off, -60 * sc, -20 + off, -96 * sc);
    ctx.quadraticCurveTo(26 + off, -128 * sc, 54 + off, -104 * sc);
    /* まきこむ さき */
    ctx.quadraticCurveTo(66 + off, -92 * sc, 50 + off, -84 * sc);
    ctx.quadraticCurveTo(30 + off, -76 * sc, 26 + off, -92 * sc);
    ctx.quadraticCurveTo(10 + off, -68 * sc, -14 + off, -52 * sc);
    ctx.quadraticCurveTo(-50 + off, -28 * sc, -60 + off, 0);
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
  }
  crest(-16, '#1a3f74', 0.55, 0.92);
  crest(-6,  '#25599c', 0.8,  0.98);
  crest(0,   '#3272b8', 1,    1);

  /* しろい あわ（はほう）*/
  ctx.fillStyle = '#f2f7fb';
  for (let i = 0; i < 9; i++) {
    const an = -2.3 + i * 0.24;
    const rr = 26 + (i % 3) * 8;
    ctx.beginPath();
    ctx.arc(24 + Math.cos(an) * rr, -94 + Math.sin(an) * rr * 0.7, 7 - (i % 3) * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  /* つめの ような しろい しぶき */
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const bx = 6 + i * 12, by = -104 - (i % 2) * 8;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx + 8, by - 18 - Math.sin(t * 5 + i) * 4, bx + 2, by - 30);
    ctx.stroke();
  }

  /* --- かお（なみの なかに）--- */
  ctx.fillStyle = '#0d2b4f';
  ctx.beginPath(); ctx.arc(-14, -64, 6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(8, -70, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-16, -66, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(6, -72, 2.2, 0, Math.PI * 2); ctx.fill();
  /* おおきな くち */
  ctx.fillStyle = '#08243f';
  const open = (a >= 0) ? 13 + a * 10 : 10;
  ctx.beginPath();
  ctx.ellipse(-4, -46, 17, open, -0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-17 + i * 9, -46 - open + 2);
    ctx.lineTo(-13 + i * 9, -46 - open + 11);
    ctx.lineTo(-9 + i * 9, -46 - open + 2);
    ctx.closePath(); ctx.fill();
  }

  /* --- したの うねり --- */
  ctx.fillStyle = 'rgba(50,114,184,.85)';
  ctx.beginPath();
  ctx.moveTo(-100, 0);
  for (let i = 0; i <= 8; i++) {
    const px = -100 + i * 25;
    ctx.quadraticCurveTo(px + 12, -10 - Math.sin(t * 3 + i) * 6, px + 25, -4);
  }
  ctx.lineTo(100, 0);
  ctx.closePath(); ctx.fill();

  /* --- とばす みず（こうげきの とき）--- */
  if (a >= 0) {
    ctx.fillStyle = 'rgba(160,225,255,' + (0.4 + a * 0.5) + ')';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(56 + i * 14 + a * 20, -60 + Math.sin(t * 14 + i) * 8, 6 - i, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}


/* ---- 霊太郎：ランドセルを せおって パンを くわえた おばけの しょうがくせい ---- */
function drawReitarou(ctx, s) {
  const a = s.atk;
  const float = Math.sin(s.t * 3.4) * 3.5;
  const wob = Math.sin(s.t * 5) * 0.05;
  const dash = (a >= 0) ? (a < 0.5 ? -a * 6 : (a - 0.5) * 24) : 0;

  ctx.save();
  ctx.translate(dash, -float);

  /* --- ついてくる ちいさな おばけ --- */
  ctx.fillStyle = 'rgba(255,255,255,.4)';
  for (let i = 0; i < 2; i++) {
    const px = -46 - i * 18, py = -34 - Math.sin(s.t * 3 + i * 1.6) * 12;
    ctx.beginPath();
    ctx.arc(px, py, 7 - i * 1.5, Math.PI, 0);
    ctx.lineTo(px + 7 - i * 1.5, py + 8);
    ctx.lineTo(px - 7 + i * 1.5, py + 8);
    ctx.closePath(); ctx.fill();
  }

  /* --- ランドセル（せなか）--- */
  ctx.fillStyle = '#2b3550';
  roundRect(ctx, -34, -66, 26, 30, 6); ctx.fill();
  ctx.strokeStyle = '#1a2138'; ctx.lineWidth = 2;
  roundRect(ctx, -34, -66, 26, 30, 6); ctx.stroke();
  ctx.fillStyle = '#3c4870';
  roundRect(ctx, -32, -64, 22, 10, 3); ctx.fill();
  ctx.fillStyle = '#c9a24a';
  roundRect(ctx, -24, -48, 7, 5, 2); ctx.fill();

  /* --- からだ（おばけ・したが なみなみ）--- */
  const bx = 0, by = -46;
  const g = ctx.createLinearGradient(0, by - 30, 0, by + 30);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#dfe6f0');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(bx, by, 26 * (1 + wob), Math.PI, 0);
  ctx.lineTo(bx + 26, by + 16);
  /* なみなみの すそ */
  for (let i = 0; i < 4; i++) {
    const x0 = bx + 26 - i * 13;
    ctx.quadraticCurveTo(x0 - 6.5, by + 16 + ((i % 2) ? -8 : 10) + Math.sin(s.t * 6 + i) * 2, x0 - 13, by + 16);
  }
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(140,160,190,.55)'; ctx.lineWidth = 1.8; ctx.stroke();

  /* --- て（りょうがわに ちいさく）--- */
  ctx.fillStyle = '#f4f7fb';
  ctx.beginPath(); ctx.arc(-27, by + 2, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(28 + (a >= 0 ? 6 : 0), by - 2, 7, 0, Math.PI * 2); ctx.fill();

  /* --- かお（あわてて いる）--- */
  ctx.fillStyle = '#1b2740';
  ellipse(ctx, -8, by - 6, 4.6, 6); ctx.fill();
  ellipse(ctx, 9, by - 6, 4.6, 6); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-9.5, by - 8.4, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(7.5, by - 8.4, 1.8, 0, Math.PI * 2); ctx.fill();
  /* ほっぺ */
  ctx.fillStyle = 'rgba(255,150,150,.4)';
  ctx.beginPath(); ctx.arc(-17, by + 4, 4.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(18, by + 4, 4.4, 0, Math.PI * 2); ctx.fill();

  /* --- くわえた しょくパン --- */
  ctx.save();
  ctx.translate(20, by + 8);
  ctx.rotate(-0.18);
  ctx.fillStyle = '#f0d9a8';
  ctx.beginPath();
  ctx.moveTo(-4, -9);
  ctx.quadraticCurveTo(10, -14, 18, -9);
  ctx.lineTo(18, 9); ctx.lineTo(-4, 9);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#c9a05a'; ctx.lineWidth = 1.8; ctx.stroke();
  ctx.fillStyle = '#fdf3dd';
  roundRect(ctx, -1, -6, 15, 12, 2); ctx.fill();
  ctx.restore();

  /* --- きいろい つうがくぼう --- */
  ctx.save();
  ctx.translate(1, by - 26);
  ctx.rotate(-0.06 + wob);
  ctx.fillStyle = '#f5c518';
  ctx.beginPath();
  ctx.ellipse(0, 0, 24, 8, 0, Math.PI, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, -2, 17, 15, 0, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = '#c99a10'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(0, 0, 24, 8, 0, Math.PI, 0); ctx.stroke();
  ctx.fillStyle = '#e0ac10';
  roundRect(ctx, -17, -4, 34, 5, 2); ctx.fill();
  ctx.restore();

  /* --- あせ --- */
  ctx.fillStyle = 'rgba(130,200,255,.9)';
  for (let i = 0; i < 2; i++) {
    const px = 34 + i * 12, py = by - 22 - ((s.t * 44 + i * 14) % 20);
    ctx.beginPath();
    ctx.moveTo(px, py - 6);
    ctx.quadraticCurveTo(px + 4.5, py, px, py + 4);
    ctx.quadraticCurveTo(px - 4.5, py, px, py - 6);
    ctx.fill();
  }
  ctx.restore();
}


/* ---- マッチくん：ぼうが おれて ふらふら あるく マッチぼう ---- */
function drawMatchkun(ctx, s) {
  const a = s.atk;
  const walk = Math.sin(s.t * 11) * (s.moving ? 1 : 0);
  const wobble = Math.sin(s.t * 4.5) * 0.10;         // ふらふら
  const swing = (a >= 0) ? (-1.1 + a * 2.0) : (-0.2 + walk * 0.2);

  ctx.save();
  ctx.rotate(wobble);

  /* --- あし --- */
  ctx.strokeStyle = '#c9a06a'; ctx.lineWidth = 4.4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-2, -20); ctx.lineTo(-8 + walk * 6, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(3, -20);  ctx.lineTo(9 - walk * 6, 0);  ctx.stroke();

  /* --- ぼう（したはん・おれた ところ より した）--- */
  ctx.fillStyle = '#d9b483';
  roundRect(ctx, -5, -46, 10, 28, 3); ctx.fill();
  ctx.strokeStyle = '#a8814c'; ctx.lineWidth = 1.6;
  roundRect(ctx, -5, -46, 10, 28, 3); ctx.stroke();

  /* --- おれめ（ギザギザ）--- */
  ctx.fillStyle = '#f0dcb8';
  ctx.beginPath();
  ctx.moveTo(-5, -46);
  ctx.lineTo(-2, -50); ctx.lineTo(1, -45); ctx.lineTo(4, -50); ctx.lineTo(5, -46);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#a8814c'; ctx.lineWidth = 1.4; ctx.stroke();

  /* --- うで --- */
  ctx.save();
  ctx.translate(6, -56);
  ctx.rotate(swing);
  ctx.strokeStyle = '#c9a06a'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(14, -3); ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = '#c9a06a'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-6, -56); ctx.lineTo(-18, -50 + walk * 3); ctx.stroke();

  /* --- ぼう（うえはん・かたむいて いる）--- */
  ctx.save();
  ctx.translate(0, -50);
  ctx.rotate(0.22 + Math.sin(s.t * 4.5) * 0.05);
  ctx.fillStyle = '#e0c092';
  roundRect(ctx, -5, -30, 10, 32, 3); ctx.fill();
  ctx.strokeStyle = '#a8814c'; ctx.lineWidth = 1.6;
  roundRect(ctx, -5, -30, 10, 32, 3); ctx.stroke();

  /* --- あたま（あかい やくひん）--- */
  const hg = ctx.createRadialGradient(-3, -38, 2, 0, -34, 14);
  hg.addColorStop(0, '#ff8a65');
  hg.addColorStop(1, '#b9251c');
  ctx.fillStyle = hg;
  ellipse(ctx, 0, -34, 11, 13); ctx.fill();
  ctx.strokeStyle = '#7e1a13'; ctx.lineWidth = 1.6;
  ellipse(ctx, 0, -34, 11, 13); ctx.stroke();

  /* かお（こまった かお）*/
  ctx.fillStyle = '#2b1b12';
  ctx.beginPath(); ctx.arc(-4, -36, 1.9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(4, -36, 1.9, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#2b1b12'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, -27, 3, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();

  /* --- ほのお --- */
  const fl = (a >= 0) ? 1 + a * 0.6 : 1;
  for (let i = 0; i < 3; i++) {
    const f = Math.sin(s.t * 13 + i * 1.2) * 3;
    ctx.fillStyle = ['rgba(255,87,34,.9)', 'rgba(255,152,0,.9)', 'rgba(255,235,59,.85)'][i];
    const h = (34 - i * 8) * fl;
    ctx.beginPath();
    ctx.moveTo(-9 + i * 3, -44);
    ctx.quadraticCurveTo(-4 + i * 2 + f, -44 - h * 0.6, 0 + f * 0.5, -44 - h);
    ctx.quadraticCurveTo(6 - i * 2 + f, -44 - h * 0.6, 9 - i * 3, -44);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  ctx.restore();
}


/* ---- あき坊：ぜんちぜんのうの かみさま。りょうてで へんな かお ---- */
function drawAkibou(ctx, s) {
  const a = s.atk;
  const float = Math.sin(s.t * 2.2) * 3;
  const step = Math.sin(s.t * 6) * (s.moving ? 1 : 0);
  /* こうげき：ためて → まえに つきだす */
  const push = (a >= 0) ? (a < 0.65 ? -a * 8 : (a - 0.65) / 0.35 * 30 - 5.2) : 0;

  ctx.save();
  ctx.translate(push, float);

  /* --- かみの ひかり（うしろ）--- */
  const hg = ctx.createRadialGradient(0, -62, 8, 0, -62, 78);
  hg.addColorStop(0, 'rgba(255,241,168,' + (a >= 0 ? 0.45 + a * 0.3 : 0.28) + ')');
  hg.addColorStop(1, 'rgba(255,213,79,0)');
  ctx.fillStyle = hg;
  ctx.beginPath(); ctx.arc(0, -62, 78, 0, Math.PI * 2); ctx.fill();

  /* --- かみなり（ためて いる とき）--- */
  if (a >= 0) {
    ctx.strokeStyle = 'rgba(179,229,252,' + (0.4 + a * 0.5) + ')';
    ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const bx = -50 + i * 46, by = -132;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + 7, by + 14);
      ctx.lineTo(bx - 3, by + 16);
      ctx.lineTo(bx + 5, by + 32);
      ctx.stroke();
    }
  }

  /* --- あし（すそに かくれる）--- */
  ctx.fillStyle = '#d9c9a8';
  roundRect(ctx, -26 - step * 3, -22, 22, 22, 8); ctx.fill();
  roundRect(ctx,   6 + step * 3, -22, 22, 22, 8); ctx.fill();

  /* --- ころも（しろい ローブ）--- */
  const rg = ctx.createLinearGradient(0, -96, 0, -10);
  rg.addColorStop(0, '#ffffff');
  rg.addColorStop(1, '#dcd6c6');
  ctx.fillStyle = rg;
  ctx.beginPath();
  ctx.moveTo(-30, -96);
  ctx.quadraticCurveTo(-46, -50, -40, -10);
  ctx.lineTo(40, -10);
  ctx.quadraticCurveTo(46, -50, 30, -96);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#b8ae96'; ctx.lineWidth = 2;
  ctx.stroke();
  /* きんの おび */
  ctx.fillStyle = '#e0b53a';
  roundRect(ctx, -36, -52, 74, 11, 4); ctx.fill();
  ctx.fillStyle = '#f5d76e';
  ctx.beginPath(); ctx.arc(2, -46, 8, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#a8801c'; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.arc(2, -46, 8, 0, Math.PI * 2); ctx.stroke();

  /* --- しろい ひげ（ながい）--- */
  ctx.fillStyle = '#f2f2f2';
  ctx.beginPath();
  ctx.moveTo(-22, -104);
  ctx.quadraticCurveTo(-16, -58, 2, -46);
  ctx.quadraticCurveTo(20, -58, 26, -104);
  ctx.quadraticCurveTo(2, -92, -22, -104);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#cfcfcf'; ctx.lineWidth = 1.6; ctx.stroke();

  /* --- あたま --- */
  ctx.save();
  ctx.translate(2, -126);

  /* もじゃもじゃの しらが */
  ctx.fillStyle = '#efefef';
  ctx.beginPath();
  for (let i = 0; i <= 14; i++) {
    const an = Math.PI + (i / 14) * Math.PI;
    const rr = 34 + Math.sin(i * 2.7) * 6;
    const px = Math.cos(an) * rr, py = Math.sin(an) * rr * 0.9;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath(); ctx.fill();

  /* かお */
  const fg = ctx.createLinearGradient(0, -26, 0, 26);
  fg.addColorStop(0, '#f7d9b8'); fg.addColorStop(1, '#e6b98f');
  ctx.fillStyle = fg;
  ellipse(ctx, 0, 0, 28, 26); ctx.fill();

  /* ★りょうてで かおを おしつぶす → よこに つぶれた ひょうじょう */
  /* め（まんまる・びっくり）*/
  ctx.fillStyle = '#ffffff';
  ellipse(ctx, -10, -6, 8, 9); ctx.fill();
  ellipse(ctx, 11, -6, 8, 9); ctx.fill();
  ctx.fillStyle = '#1b1b1b';
  ellipse(ctx, -9, -5, 4.2, 5); ctx.fill();
  ellipse(ctx, 12, -5, 4.2, 5); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-10.6, -7, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(10.4, -7, 1.6, 0, Math.PI * 2); ctx.fill();
  /* おしつぶされた くち（たてに ひらいた だえん）*/
  ctx.fillStyle = '#8e3b3b';
  ellipse(ctx, 1, 12, 7, (a >= 0 ? 11 : 8)); ctx.fill();
  /* ほっぺ */
  ctx.fillStyle = 'rgba(255,138,128,.45)';
  ctx.beginPath(); ctx.arc(-17, 6, 5.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(19, 6, 5.4, 0, Math.PI * 2); ctx.fill();

  /* きんの かんむり（つきの ような は）*/
  ctx.fillStyle = '#e0b53a';
  ctx.strokeStyle = '#a8801c'; ctx.lineWidth = 1.6;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 12 - 5, -30);
    ctx.quadraticCurveTo(i * 12, -48 - Math.abs(i === 0 ? 8 : 0), i * 12 + 5, -30);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.fillStyle = '#e0b53a';
  roundRect(ctx, -32, -32, 66, 8, 4); ctx.fill();
  ctx.restore();

  /* --- りょうての うで（かおを おさえて いる）--- */
  ctx.strokeStyle = '#f7d9b8'; ctx.lineWidth = 14; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-30, -80); ctx.quadraticCurveTo(-44, -110, -28, -126);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(32, -80); ctx.quadraticCurveTo(48, -110, 32, -126);
  ctx.stroke();
  /* きんの うでわ */
  ctx.strokeStyle = '#e0b53a'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(-36, -96); ctx.lineTo(-28, -92); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(40, -96);  ctx.lineTo(32, -92);  ctx.stroke();
  /* て */
  ctx.fillStyle = '#f7d9b8';
  ctx.beginPath(); ctx.arc(-28, -126, 10, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(32, -126, 10, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}


/* ---- バケ着：みずバケツを かかえた ぼうにんげん ----
   たかく とびあがって、みずバケツを ぶちまけて ちゃくちする         */
function drawBakegi(ctx, s) {
  const a = s.atk;
  /* こうげき：しゃがむ → ジャンプ → ちゃくち */
  let jump = 0, tilt = 0;
  if (a >= 0) {
    if (a < 0.25)      { jump = -a * 12; }                       // しゃがむ
    else if (a < 0.8)  { jump = Math.sin((a - 0.25) / 0.55 * Math.PI) * 78; tilt = 0.25; }
    else               { jump = 0; }                             // ちゃくち
  }
  const splash = (a >= 0 && a > 0.8) ? (a - 0.8) / 0.2 : 0;
  const walk = Math.sin(s.t * 7) * (s.moving ? 1 : 0);

  ctx.save();
  ctx.translate(0, -jump);
  ctx.rotate(tilt * 0.12);

  /* --- あし --- */
  ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -30);
  ctx.lineTo(-8 + walk * 5, -14); ctx.lineTo(-12 + walk * 6, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -30);
  ctx.lineTo(9 - walk * 5, -14); ctx.lineTo(13 - walk * 6, 0);
  ctx.stroke();
  /* あおい くつ */
  ctx.strokeStyle = '#1e6fd9'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(-12 + walk * 6, 0); ctx.lineTo(-20 + walk * 6, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(13 - walk * 6, 0);  ctx.lineTo(21 - walk * 6, 0);  ctx.stroke();

  /* --- からだ（ぼう）--- */
  ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(0, -58); ctx.stroke();

  /* --- あたま（まるい しろ）--- */
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 3.4;
  ctx.beginPath(); ctx.arc(0, -70, 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  /* かお（うれしそう）*/
  ctx.fillStyle = '#1b1b1b';
  ctx.beginPath(); ctx.arc(-5, -74, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(6, -74, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath();
  ctx.ellipse(1, -65, 5.5, (a >= 0 ? 5 : 3.4), 0, 0, Math.PI * 2);
  ctx.fill();

  /* --- うで（バケツを あたまの うえに）--- */
  ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, -52); ctx.lineTo(-14, -74); ctx.lineTo(-10, -92); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -52); ctx.lineTo(15, -74); ctx.lineTo(11, -92); ctx.stroke();

  /* --- みずバケツ --- */
  ctx.save();
  ctx.translate(0, -104);
  ctx.rotate(a >= 0 && a > 0.5 ? 0.5 + splash * 1.2 : 0.06);
  /* とって */
  ctx.strokeStyle = '#8d959d'; ctx.lineWidth = 2.6;
  ctx.beginPath(); ctx.arc(0, 2, 15, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
  /* バケツ */
  const bg = ctx.createLinearGradient(-16, 0, 16, 0);
  bg.addColorStop(0, '#b0bec5');
  bg.addColorStop(0.45, '#eceff1');
  bg.addColorStop(1, '#90a4ae');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.moveTo(-17, -2); ctx.lineTo(17, -2); ctx.lineTo(13, 24); ctx.lineTo(-13, 24);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#607d8b'; ctx.lineWidth = 2.2; ctx.stroke();
  /* なかの みず */
  ctx.fillStyle = '#4fc3f7';
  ctx.beginPath();
  ctx.ellipse(0, -2, 16, 4.4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.5)';
  ctx.beginPath(); ctx.ellipse(-5, -3, 6, 1.8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  ctx.restore();

  /* --- ちゃくちの みずしぶき（ひろい はんい）--- */
  if (splash > 0) {
    ctx.save();
    const R = 30 + splash * 90;
    ctx.strokeStyle = 'rgba(79,195,247,' + (1 - splash) * 0.9 + ')';
    ctx.lineWidth = 5;
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.ellipse(0, -12, R + i * 22, (R + i * 22) * 0.42, 0, Math.PI, 0);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(179,229,252,' + (1 - splash) * 0.85 + ')';
    for (let i = 0; i < 10; i++) {
      const an = Math.PI + (i / 9) * Math.PI;
      const rr = R * (0.7 + (i % 3) * 0.14);
      ctx.beginPath();
      ctx.arc(Math.cos(an) * rr, -12 + Math.sin(an) * rr * 0.42, 4 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}


/* ---- A（エーくん）：まほうの ぼうしを かぶった きいろい「A」---- */
function drawAkun(ctx, s) {
  const a = s.atk;
  const step = Math.sin(s.t * 8) * (s.moving ? 1 : 0);
  const swing = (a >= 0) ? (-1.5 + a * 2.4) : (-0.3 + Math.sin(s.t * 2.5) * 0.12);
  ctx.save();
  ctx.translate(0, -Math.abs(step) * 1.4);

  /* --- あし（くろい くつ）--- */
  ctx.fillStyle = '#2b2b30';
  roundRect(ctx, -16 - step * 3, -10, 12, 10, 4); ctx.fill();
  roundRect(ctx,   5 + step * 3, -10, 12, 10, 4); ctx.fill();

  /* --- ほんたい「A」--- */
  const g = ctx.createLinearGradient(0, -66, 0, -8);
  g.addColorStop(0, '#ffd95e');
  g.addColorStop(1, '#e0a422');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#8a6410'; ctx.lineWidth = 2.4; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -66);
  ctx.lineTo(21, -8); ctx.lineTo(9, -8); ctx.lineTo(5, -22);
  ctx.lineTo(-5, -22); ctx.lineTo(-9, -8); ctx.lineTo(-21, -8);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  /* Aの よこぼう */
  ctx.fillStyle = '#e8b73a';
  roundRect(ctx, -8, -34, 16, 7, 2); ctx.fill();
  ctx.strokeStyle = '#8a6410'; ctx.lineWidth = 1.6;
  roundRect(ctx, -8, -34, 16, 7, 2); ctx.stroke();

  /* --- かお --- */
  ctx.fillStyle = '#1b1b1b';
  ctx.beginPath(); ctx.arc(-5, -44, 3.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(6, -44, 3.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-6, -45.4, 1.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(5, -45.4, 1.2, 0, Math.PI * 2); ctx.fill();
  /* にっこり くち */
  ctx.fillStyle = '#7d3a20';
  ctx.beginPath(); ctx.ellipse(1, -38, 4.4, (a >= 0 ? 4 : 2.6), 0, 0, Math.PI); ctx.fill();
  /* ほっぺ */
  ctx.fillStyle = 'rgba(255,138,128,.5)';
  ctx.beginPath(); ctx.arc(-11, -40, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(12, -40, 3, 0, Math.PI * 2); ctx.fill();

  /* --- まほうの ぼうし --- */
  ctx.save();
  ctx.translate(0, -64);
  ctx.rotate(-0.12);
  const hg = ctx.createLinearGradient(0, -40, 0, 4);
  hg.addColorStop(0, '#5c4bb8');
  hg.addColorStop(1, '#2f2a72');
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.moveTo(-17, 2);
  ctx.quadraticCurveTo(-6, -22, 6, -42);
  ctx.quadraticCurveTo(10, -20, 18, 0);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#3b358f';
  roundRect(ctx, -21, -2, 42, 8, 4); ctx.fill();
  /* ほしの もよう */
  ctx.fillStyle = '#ffe082';
  for (const [sx, sy, sr] of [[-4, -14, 3], [6, -26, 2.4], [2, -6, 2]]) {
    starPath(ctx, sx, sy, sr, sr * 0.45, s.t * 1.5); ctx.fill();
  }
  ctx.restore();

  /* --- うで と つえ --- */
  ctx.save();
  ctx.translate(20, -34);
  ctx.rotate(swing);
  ctx.strokeStyle = '#2b2b30'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(16, -4); ctx.stroke();
  /* つえ */
  ctx.strokeStyle = '#8d6e3a'; ctx.lineWidth = 3.4;
  ctx.beginPath(); ctx.moveTo(14, -3); ctx.lineTo(34, -18); ctx.stroke();
  /* さきの ほし */
  const glow = (a >= 0) ? 1 + a * 0.7 : 1;
  ctx.fillStyle = 'rgba(179,229,252,' + (a >= 0 ? 0.3 + a * 0.5 : 0.25) + ')';
  ctx.beginPath(); ctx.arc(36, -20, 12 * glow, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  starPath(ctx, 36, -20, 8 * glow, 3.4 * glow, s.t * 3);
  ctx.fill();
  ctx.strokeStyle = '#4fc3f7'; ctx.lineWidth = 1.6;
  starPath(ctx, 36, -20, 8 * glow, 3.4 * glow, s.t * 3);
  ctx.stroke();
  ctx.restore();

  /* うしろの うで */
  ctx.strokeStyle = '#2b2b30'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-20, -32); ctx.lineTo(-32, -26 + step * 2); ctx.stroke();
  ctx.restore();
}


/* ---- たたみん：たった たたみ。みずに とても つよい ---- */
function drawTatamin(ctx, s) {
  const a = s.atk;
  const step = Math.sin(s.t * 4) * (s.moving ? 1 : 0);
  const lean = (a >= 0) ? (a < 0.6 ? -a * 4 : (a - 0.6) * 22) : 0;
  ctx.save();
  ctx.translate(lean, 0);

  /* --- あし --- */
  ctx.fillStyle = '#efe4d0';
  ctx.strokeStyle = '#8a7a5a'; ctx.lineWidth = 1.8;
  roundRect(ctx, -14 - step * 2, -9, 11, 9, 4); ctx.fill(); ctx.stroke();
  roundRect(ctx,   3 + step * 2, -9, 11, 9, 4); ctx.fill(); ctx.stroke();

  /* --- たたみ ほんたい --- */
  const g = ctx.createLinearGradient(-24, 0, 24, 0);
  g.addColorStop(0, '#d9d69a');
  g.addColorStop(0.5, '#e6e3ae');
  g.addColorStop(1, '#c8c488');
  ctx.fillStyle = g;
  roundRect(ctx, -24, -68, 48, 60, 3); ctx.fill();
  /* たたみの め（よこすじ）*/
  ctx.strokeStyle = 'rgba(150,145,90,.55)'; ctx.lineWidth = 1.2;
  for (let i = 0; i < 11; i++) {
    ctx.beginPath(); ctx.moveTo(-22, -64 + i * 5.2); ctx.lineTo(22, -64 + i * 5.2); ctx.stroke();
  }
  /* ふちの みどりの ぬの */
  ctx.fillStyle = '#3f6b46';
  ctx.fillRect(-24, -68, 7, 60);
  ctx.fillRect(17, -68, 7, 60);
  ctx.fillStyle = 'rgba(255,255,255,.28)';
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(-23, -64 + i * 10, 5, 3);
    ctx.fillRect(18, -64 + i * 10, 5, 3);
  }
  ctx.strokeStyle = '#8a7a5a'; ctx.lineWidth = 2.2;
  roundRect(ctx, -24, -68, 48, 60, 3); ctx.stroke();

  /* --- かお --- */
  ctx.fillStyle = '#1b1b1b';
  ctx.beginPath(); ctx.arc(-6, -46, 3.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(7, -46, 3.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-7, -47.4, 1.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(6, -47.4, 1.3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7d3a20';
  ctx.beginPath(); ctx.ellipse(0.5, -39, 5, (a >= 0 ? 4.4 : 3), 0, 0, Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(255,138,128,.45)';
  ctx.beginPath(); ctx.arc(-13, -41, 3.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(14, -41, 3.2, 0, Math.PI * 2); ctx.fill();

  /* --- て --- */
  ctx.fillStyle = '#efe4d0';
  ctx.strokeStyle = '#8a7a5a'; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.arc(-28, -30 + step * 2, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(28 + (a >= 0 ? 6 : 0), -30 - step * 2, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  /* --- みずを はじく（こうげきの とき）--- */
  if (a >= 0) {
    ctx.strokeStyle = 'rgba(79,195,247,' + (0.4 + a * 0.5) + ')';
    ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(30, -38, 10 + i * 8 + a * 6, -0.7, 0.7);
      ctx.stroke();
    }
  }
  ctx.restore();
}


/* ---- ドンドコ力士：はらたいこの りきし ---- */
function drawDondoko(ctx, s) {
  const a = s.atk;
  const step = Math.sin(s.t * 2.6) * (s.moving ? 1 : 0);
  /* バチを ふりあげて → たたく */
  const beat = (a >= 0) ? (a < 0.6 ? -a * 1.9 : (a - 0.6) / 0.4 * 2.7 - 1.14) : -0.35;
  const boom = (a >= 0 && a > 0.85) ? (a - 0.85) / 0.15 : 0;
  ctx.save();
  ctx.translate(0, -Math.abs(step) * 2);

  /* --- あし（ふとい）--- */
  ctx.fillStyle = '#e8b48a';
  ctx.strokeStyle = '#a9764c'; ctx.lineWidth = 2;
  roundRect(ctx, -30 - step * 4, -26, 24, 26, 9); ctx.fill(); ctx.stroke();
  roundRect(ctx,   7 + step * 4, -26, 24, 26, 9); ctx.fill(); ctx.stroke();

  /* --- からだ（まるい）--- */
  const bg = ctx.createLinearGradient(0, -96, 0, -20);
  bg.addColorStop(0, '#f5c9a3');
  bg.addColorStop(1, '#d99e6e');
  ctx.fillStyle = bg;
  ellipse(ctx, 0, -58, 44, 40); ctx.fill();
  ctx.strokeStyle = '#a9764c'; ctx.lineWidth = 2.4;
  ellipse(ctx, 0, -58, 44, 40); ctx.stroke();

  /* --- まわし（あかと しろ）--- */
  ctx.fillStyle = '#efe4d0';
  roundRect(ctx, -34, -30, 68, 12, 4); ctx.fill();
  ctx.fillStyle = '#c62828';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(-30 + i * 15, -18);
    ctx.lineTo(-22 + i * 15, -18);
    ctx.lineTo(-26 + i * 15, -6);
    ctx.closePath(); ctx.fill();
  }

  /* --- はらたいこ（おなかの たいこ）--- */
  ctx.save();
  ctx.translate(0, -58);
  /* たいこの どう */
  ctx.fillStyle = '#8a4b28';
  ellipse(ctx, 0, 0, 30, 27); ctx.fill();
  /* かわ */
  const dg = ctx.createRadialGradient(-7, -7, 2, 0, 0, 26);
  dg.addColorStop(0, '#f6e6c8');
  dg.addColorStop(1, '#d9c199');
  ctx.fillStyle = dg;
  ellipse(ctx, 0, 0, 26, 23); ctx.fill();
  ctx.strokeStyle = '#8a4b28'; ctx.lineWidth = 2.4;
  ellipse(ctx, 0, 0, 26, 23); ctx.stroke();
  /* びょう */
  ctx.fillStyle = '#5d3a1c';
  for (let i = 0; i < 10; i++) {
    const an = (i / 10) * Math.PI * 2;
    ctx.beginPath(); ctx.arc(Math.cos(an) * 27, Math.sin(an) * 24, 2, 0, Math.PI * 2); ctx.fill();
  }
  /* たたいた ゆれ */
  if (boom > 0) {
    ctx.strokeStyle = 'rgba(255,213,79,' + (1 - boom) + ')';
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.arc(0, 0, 22 + i * 10 + boom * 22, 0, Math.PI * 2); ctx.stroke();
    }
  }
  ctx.restore();

  /* --- あたま --- */
  ctx.save();
  ctx.translate(4, -108);
  /* まげ */
  ctx.fillStyle = '#2b1b12';
  ellipse(ctx, 0, -16, 20, 15); ctx.fill();
  ctx.beginPath(); ctx.arc(12, -24, 7, 0, Math.PI * 2); ctx.fill();
  /* かお */
  const fg = ctx.createLinearGradient(0, -14, 0, 14);
  fg.addColorStop(0, '#f5c9a3'); fg.addColorStop(1, '#e0aa7c');
  ctx.fillStyle = fg;
  ellipse(ctx, 0, 0, 19, 17); ctx.fill();
  /* きあいの まゆと め */
  ctx.strokeStyle = '#2b1b12'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-14, -8); ctx.lineTo(-3, -4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(15, -8);  ctx.lineTo(4, -4);  ctx.stroke();
  ctx.fillStyle = '#1b1b1b';
  ctx.beginPath(); ctx.arc(-7, 1, 2.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(8, 1, 2.8, 0, Math.PI * 2); ctx.fill();
  /* おおきな くち */
  ctx.fillStyle = '#8e1b1b';
  ctx.beginPath();
  ctx.ellipse(1, 9, 8, (a >= 0 ? 7 : 4), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  /* --- うで と バチ --- */
  for (let i = 0; i < 2; i++) {
    const dir = i === 0 ? -1 : 1;
    ctx.save();
    ctx.translate(dir * 40, -80);
    ctx.rotate(dir * beat);
    ctx.strokeStyle = '#e8b48a'; ctx.lineWidth = 11; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(dir * 16, -14); ctx.stroke();
    /* バチ */
    ctx.strokeStyle = '#c9a06a'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(dir * 14, -14); ctx.lineTo(dir * 24, -44); ctx.stroke();
    ctx.fillStyle = '#b8894a';
    ctx.beginPath(); ctx.arc(dir * 24, -46, 5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  /* --- しょうげきは（まわり ぜんぶ）--- */
  if (boom > 0) {
    ctx.strokeStyle = 'rgba(255,183,77,' + (1 - boom) * 0.9 + ')';
    ctx.lineWidth = 5;
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.ellipse(0, -50, 60 + boom * 70 + i * 26, 46 + boom * 54 + i * 20, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,241,118,' + (1 - boom) * 0.7 + ')';
    for (let i = 0; i < 8; i++) {
      const an = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(an) * (60 + boom * 60), -50 + Math.sin(an) * (46 + boom * 46), 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}


/* ---- ぷりぷりおぷりねこ：ぷりおぷりねこの しんかけい ----
   おおきな くちを あけた しろい ねこ。
   じゃまする じかんが 2ばいに なり、たいりょくと こうげきも 1.5ばい。   */
function drawPuripurio(ctx, s) {
  const a = s.atk;
  const wob = Math.sin(s.t * 6) * 0.06;
  const rx = 34 * (1 + wob), ry = 30 * (1 - wob);
  const cy = -ry - 10;
  /* こうげきの ときは くちが もっと おおきく あく */
  const open = (a >= 0) ? 1 + a * 0.55 : 1 + Math.sin(s.t * 3) * 0.05;

  ctx.save();

  /* --- しっぽ --- */
  ctx.strokeStyle = '#cfd3d6'; ctx.lineWidth = 8; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-rx + 6, cy + 10);
  ctx.quadraticCurveTo(-rx - 20, cy + Math.sin(s.t * 5) * 6, -rx - 18, cy - 22);
  ctx.stroke();
  ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx + 6, cy + 10);
  ctx.quadraticCurveTo(-rx - 20, cy + Math.sin(s.t * 5) * 6, -rx - 18, cy - 22);
  ctx.stroke();

  /* --- あし（ほそい てがきの せん）--- */
  ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  const step = Math.sin(s.t * 8) * (s.moving ? 4 : 0);
  ctx.beginPath();
  ctx.moveTo(-12, cy + ry - 4);
  ctx.lineTo(-15 + step, -2); ctx.lineTo(-22 + step, -2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(12, cy + ry - 4);
  ctx.lineTo(15 - step, -2); ctx.lineTo(22 - step, -2);
  ctx.stroke();

  /* --- て（りょうわきに ちいさく）--- */
  ctx.beginPath();
  ctx.moveTo(-rx + 2, cy + 6);
  ctx.quadraticCurveTo(-rx - 14, cy + 12, -rx - 12, cy + 22);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(rx - 2, cy + 4);
  ctx.quadraticCurveTo(rx + 14, cy + 8, rx + 12, cy + 20);
  ctx.stroke();

  /* --- みみ（とがった ギザギザ）--- */
  ctx.fillStyle = '#f2f4f5';
  ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-20, cy - ry + 8);
  ctx.lineTo(-14, cy - ry - 20);
  ctx.lineTo(-3, cy - ry + 2);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(6, cy - ry + 2);
  ctx.lineTo(17, cy - ry - 22);
  ctx.lineTo(23, cy - ry + 6);
  ctx.closePath(); ctx.fill(); ctx.stroke();

  /* --- かお（まるい しろい かたまり）--- */
  const g = ctx.createLinearGradient(0, cy - ry, 0, cy + ry);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.6, '#eceff0');
  g.addColorStop(1, '#c9cfd2');
  ctx.fillStyle = g;
  ellipse(ctx, 0, cy, rx, ry); ctx.fill();
  ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 3.4;
  ellipse(ctx, 0, cy, rx, ry); ctx.stroke();

  /* ひかりの はんしゃ */
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ellipse(ctx, -13, cy - 13, 8, 5); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ellipse(ctx, 6, cy - 18, 4, 2.6); ctx.fill();

  /* --- め（ちいさい てん）--- */
  ctx.fillStyle = '#1b1b1b';
  ctx.beginPath(); ctx.arc(-7, cy - 6, 2.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(11, cy - 6, 2.8, 0, Math.PI * 2); ctx.fill();

  /* --- おおきく あいた くち --- */
  const mw = 22 * open, mh = 18 * open;
  ctx.fillStyle = '#5d3a34';
  ctx.beginPath();
  ctx.moveTo(-mw, cy + 4);
  ctx.quadraticCurveTo(0, cy + 4 + mh * 1.9, mw, cy + 4);
  ctx.quadraticCurveTo(0, cy - 2, -mw, cy + 4);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 3; ctx.stroke();
  /* した */
  ctx.fillStyle = '#c98a86';
  ctx.beginPath();
  ctx.ellipse(2, cy + 4 + mh * 1.1, mw * 0.42, mh * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  /* きば 2ほん */
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-mw * 0.5, cy + 4); ctx.lineTo(-mw * 0.28, cy + 4 + mh * 0.7); ctx.lineTo(-mw * 0.1, cy + 4);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(mw * 0.14, cy + 4); ctx.lineTo(mw * 0.36, cy + 4 + mh * 0.7); ctx.lineTo(mw * 0.54, cy + 4);
  ctx.closePath(); ctx.fill(); ctx.stroke();

  /* --- じゃまの なみ（どんそくに する ちから）--- */
  if (a >= 0) {
    ctx.strokeStyle = 'rgba(120,190,255,' + (0.35 + a * 0.45) + ')';
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(rx + 6, cy + 4, 12 + i * 9 + a * 8, -0.6, 0.6);
      ctx.stroke();
    }
  }
  ctx.restore();
}


/* ---- しゅりへん：せなかに かべを かついだ しゅりけん ----
   ・こうげきの ときは ぐるぐる まわって とびかかる
   ・うしろの きいろい いたが「せなかの かべ」                    */
function drawShurihen(ctx, s) {
  const a = s.atk;                                   // 0→1 で ためて いる
  const run = Math.sin(s.t * 16) * (s.moving ? 1 : 0);
  /* こうげき：ためて → いっきに とびかかる */
  const lunge = (a >= 0) ? (a < 0.55 ? -a * 14 : (a - 0.55) / 0.45 * 46 - 7.7) : 0;
  /* まわる はやさ（ためるほど はやく）*/
  const spin = (a >= 0) ? s.t * (6 + a * 40) : s.t * 2.2;

  ctx.save();
  ctx.translate(lunge, 0);

  /* --- せなかの かべ（きいろい いた）--- */
  ctx.save();
  ctx.translate(-16, -46);
  ctx.rotate(-0.12 + run * 0.04);
  const wg = ctx.createLinearGradient(-24, -26, 24, 26);
  wg.addColorStop(0, '#f5d76e');
  wg.addColorStop(1, '#d4a72c');
  ctx.fillStyle = wg;
  roundRect(ctx, -24, -26, 48, 52, 4); ctx.fill();
  ctx.strokeStyle = 'rgba(120,90,20,.55)'; ctx.lineWidth = 2;
  roundRect(ctx, -24, -26, 48, 52, 4); ctx.stroke();
  /* いたの もくめ */
  ctx.strokeStyle = 'rgba(150,115,30,.4)'; ctx.lineWidth = 1.4;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.moveTo(-20, -16 + i * 16); ctx.lineTo(20, -14 + i * 16); ctx.stroke();
  }
  ctx.restore();

  /* --- あし（ほそい 2ほん）--- */
  ctx.strokeStyle = '#2b2b30'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-5, -26);
  ctx.quadraticCurveTo(-11 + run * 4, -14, -13 + run * 6, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(5, -26);
  ctx.quadraticCurveTo(11 - run * 4, -14, 13 - run * 6, 0);
  ctx.stroke();
  /* あしさき */
  ctx.beginPath(); ctx.moveTo(-13 + run * 6, 0); ctx.lineTo(-19 + run * 6, -2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(13 - run * 6, 0); ctx.lineTo(19 - run * 6, -2); ctx.stroke();

  /* --- うで（ほそい 2ほん）--- */
  ctx.beginPath();
  ctx.moveTo(-16, -50);
  ctx.quadraticCurveTo(-28, -46, -30, -56);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(16, -50);
  ctx.quadraticCurveTo(28, -46, 30, -56);
  ctx.stroke();

  /* --- しゅりけんの ほんたい（4ほうの ほし・まわる）--- */
  ctx.save();
  ctx.translate(0, -52);
  ctx.rotate(spin);

  /* まわって いる ときの ざんぞう */
  if (a >= 0) {
    ctx.fillStyle = 'rgba(255,255,255,' + (0.10 + a * 0.18) + ')';
    ctx.beginPath(); ctx.arc(0, 0, 30 + a * 6, 0, Math.PI * 2); ctx.fill();
  }

  const R1 = 30, R2 = 9;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const an = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const r = (i % 2 === 0) ? R1 : R2;
    const px = Math.cos(an) * r, py = Math.sin(an) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  const sg = ctx.createLinearGradient(-R1, -R1, R1, R1);
  sg.addColorStop(0, '#ffffff');
  sg.addColorStop(1, '#dfe4ea');
  ctx.fillStyle = sg; ctx.fill();
  ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 2.6; ctx.stroke();

  /* まんなかの あな */
  ctx.fillStyle = '#1b1b1b';
  ctx.beginPath(); ctx.arc(0, 0, 8.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  /* --- とびかかった しゅんかんの きりさき --- */
  if (a >= 0 && a > 0.6) {
    const t2 = (a - 0.6) / 0.4;
    ctx.strokeStyle = 'rgba(255,255,255,' + (1 - t2) + ')';
    ctx.lineWidth = 3.4; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(24 + i * 8, -86 + i * 10);
      ctx.quadraticCurveTo(44 + i * 8, -56 + i * 10, 32 + i * 8, -22 + i * 10);
      ctx.stroke();
    }
  }
  ctx.restore();
}


/* ---- たんくんDX：タンクンの しんかけい ----
   うえに ぶあつい そうこうばんを のせ、キャタピラも おおきく なりました。
   たいりょく 2ばい・はやさ 2ばい。                                 */
function drawTankundx(ctx, s) {
  const bob = Math.sin(s.t * 13) * (s.moving ? 1.4 : 0);   // はやいので こまかく ゆれる
  ctx.save();
  ctx.translate(0, bob);

  /* キャタピラ（おおきめ・ころが おおい）*/
  ctx.fillStyle = '#263238';
  roundRect(ctx, -40, -16, 80, 16, 8); ctx.fill();
  ctx.fillStyle = '#90a4ae';
  for (let i = -33; i <= 33; i += 11) {
    ctx.beginPath();
    ctx.arc(i, -8, 4.4, 0, Math.PI * 2); ctx.fill();
  }
  /* うごいて いる ときの ころがり */
  if (s.moving) {
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.6;
    for (let i = 0; i < 4; i++) {
      const px = -34 + ((i * 20 + s.t * 90) % 70);
      ctx.beginPath(); ctx.moveTo(px, -14); ctx.lineTo(px - 4, -3); ctx.stroke();
    }
  }

  /* みみ（つの）*/
  ctx.fillStyle = '#81d4fa';
  ctx.beginPath(); ctx.moveTo(14, -44); ctx.lineTo(20, -62); ctx.lineTo(27, -44); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-24, -44); ctx.lineTo(-18, -61); ctx.lineTo(-11, -44); ctx.closePath(); ctx.fill();

  /* からだ */
  const g = ctx.createLinearGradient(0, -48, 0, -12);
  g.addColorStop(0, '#b3e5fc'); g.addColorStop(1, '#4fc3f7');
  ctx.fillStyle = g;
  roundRect(ctx, -40, -48, 80, 36, 15); ctx.fill();
  ctx.strokeStyle = '#1565c0'; ctx.lineWidth = 4;      // ふとい あおの ふちどり
  roundRect(ctx, -40, -48, 80, 36, 15); ctx.stroke();

  /* せんしゃっぽい ライン */
  ctx.strokeStyle = '#4fa3e0'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-32, -22); ctx.lineTo(28, -22); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-16, -36); ctx.lineTo(16, -36); ctx.stroke();

  /* ★そうこうばん（ボルト 4つ）*/
  ctx.fillStyle = 'rgba(207,216,220,.92)';
  roundRect(ctx, -38, -52, 34, 26, 5); ctx.fill();
  ctx.strokeStyle = 'rgba(120,144,156,.8)'; ctx.lineWidth = 1.6;
  roundRect(ctx, -38, -52, 34, 26, 5); ctx.stroke();
  ctx.fillStyle = '#455a64';
  for (const [bx, by] of [[-31, -45], [-11, -45], [-31, -33], [-11, -33]]) {
    ctx.beginPath(); ctx.arc(bx, by, 2.6, 0, Math.PI * 2); ctx.fill();
  }
  /* そうこうばんの ハイライト */
  ctx.fillStyle = 'rgba(255,255,255,.45)';
  roundRect(ctx, -35, -50, 28, 4, 2); ctx.fill();

  /* ほうしん（ふとく なった）*/
  ctx.fillStyle = '#1565c0';
  roundRect(ctx, 38, -36, 18, 10, 4); ctx.fill();

  /* め と くち */
  ctx.fillStyle = '#1565c0';
  ellipse(ctx, 19, -32, 3.6, 4.4); ctx.fill();
  ellipse(ctx, 30, -32, 3.6, 4.4); ctx.fill();
  ctx.strokeStyle = '#1565c0'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(21, -21); ctx.quadraticCurveTo(25, -16, 29, -21); ctx.stroke();

  ctx.restore();
}


/* ---- デルテル君（怒り）：テルテル君の しんかけい ----
   おこった かおに なり、しずくを 6れんげき とばす。しゃていも 1.5ばい。   */
function drawDeruteru(ctx, s) {
  const a = s.atk;
  const sway = Math.sin(s.t * 4.2) * 3.4;
  const shake = (a >= 0) ? Math.sin(s.t * 30) * 1.8 : 0;
  ctx.save();
  ctx.translate(sway * 0.4 + shake, Math.sin(s.t * 3) * 2);
  ctx.rotate(sway * 0.014);

  /* からだ */
  const g = ctx.createLinearGradient(0, -50, 0, 0);
  g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#4fa8e0');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-12, -50);
  ctx.lineTo(-27, -2);
  ctx.quadraticCurveTo(0, 6, 27, -2);
  ctx.lineTo(12, -50);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#1565c0'; ctx.lineWidth = 2.6; ctx.stroke();

  /* くびの ひも */
  ctx.strokeStyle = '#e53935'; ctx.lineWidth = 3.4;
  ctx.beginPath(); ctx.moveTo(-13, -50); ctx.lineTo(13, -50); ctx.stroke();

  /* あたま */
  const gh = ctx.createRadialGradient(-5, -68, 2, 0, -64, 22);
  gh.addColorStop(0, '#ffffff'); gh.addColorStop(1, '#9fd6f5');
  ctx.fillStyle = gh;
  ctx.beginPath(); ctx.arc(0, -64, 19, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#1565c0'; ctx.lineWidth = 3; ctx.stroke();

  /* ★おこった め（つりあがった「へ」）*/
  ctx.strokeStyle = '#1a3fa0'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-13, -72); ctx.lineTo(-4, -66); ctx.lineTo(-13, -61);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(12, -72); ctx.lineTo(4, -66); ctx.lineTo(12, -61);
  ctx.stroke();
  /* おこった くち */
  ctx.beginPath();
  ctx.moveTo(-7, -52); ctx.quadraticCurveTo(0, -58, 7, -52);
  ctx.stroke();

  /* ★いかりの しるし（あかい ✕）*/
  ctx.strokeStyle = '#f44336'; ctx.lineWidth = 4.4; ctx.lineCap = 'round';
  for (const [mx, my, sc] of [[24, -84, 1], [-22, -46, 0.8]]) {
    const r = 9 * sc * (a >= 0 ? 1.2 : 1);
    ctx.beginPath();
    ctx.moveTo(mx - r, my - r); ctx.lineTo(mx + r, my + r);
    ctx.moveTo(mx + r, my - r); ctx.lineTo(mx - r, my + r);
    ctx.stroke();
  }

  /* ★ためて いる しずく（6はつぶん）*/
  if (a >= 0) {
    ctx.fillStyle = 'rgba(79,195,247,' + (0.4 + a * 0.5) + ')';
    for (let i = 0; i < 6; i++) {
      const an = -1.0 + i * 0.34;
      const rr = 26 + a * 12;
      const px = 24 + Math.cos(an) * rr, py = -60 + Math.sin(an) * rr * 0.6;
      ctx.beginPath();
      ctx.moveTo(px, py - 6);
      ctx.quadraticCurveTo(px + 4.5, py, px, py + 4);
      ctx.quadraticCurveTo(px - 4.5, py, px, py - 6);
      ctx.fill();
    }
  }
  ctx.restore();
}


/* ---- 時の柄：時の旅人の しんかけい ----
   おおきな とけいを からだに つけ、あたまの うえにも とけいを うかべる。
   つよさに かかわる ところが ぜんぶ 1.3ばい。
   あてた あいてを 1びょう とめる ちからが くわわった。               */
function drawTokinogara(ctx, s) {
  const step = Math.sin(s.t * 11) * (s.moving ? 1 : 0);
  const a = s.atk;
  ctx.save();

  /* --- うかんだ とけい（あたまの うえ）--- */
  ctx.save();
  ctx.translate(2, -104 + Math.sin(s.t * 2.4) * 3);
  ctx.strokeStyle = '#37474f'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(0, -2); ctx.stroke();
  ctx.fillStyle = '#c9a06a';
  ctx.beginPath(); ctx.arc(0, -14, 15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffd54f';
  ctx.beginPath(); ctx.arc(0, -14, 12, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#6d4c2f'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(0, -22); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(-7, -12); ctx.stroke();
  ctx.restore();

  /* --- あし --- */
  ctx.strokeStyle = '#212121'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-4, -24); ctx.lineTo(-6 + step * 6, -1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(5, -24); ctx.lineTo(7 - step * 6, -1); ctx.stroke();

  /* --- からだ（スーツ）--- */
  ctx.fillStyle = '#263238';
  roundRect(ctx, -14, -56, 28, 34, 6); ctx.fill();
  ctx.fillStyle = '#fafafa';
  ctx.beginPath();
  ctx.moveTo(-5, -56); ctx.lineTo(5, -56); ctx.lineTo(3, -34); ctx.lineTo(-3, -34); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#d32f2f';
  ctx.beginPath();
  ctx.moveTo(0, -53); ctx.lineTo(-7, -57); ctx.lineTo(-7, -48); ctx.closePath();
  ctx.moveTo(0, -53); ctx.lineTo(7, -57); ctx.lineTo(7, -48); ctx.closePath();
  ctx.fill();

  /* --- むねの おおきな とけい（しんかの しるし）--- */
  ctx.save();
  ctx.translate(6, -40);
  ctx.fillStyle = '#f5a623';
  ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffd54f';
  ctx.beginPath(); ctx.arc(0, 0, 13.5, 0, Math.PI * 2); ctx.fill();
  /* はり（こうげきの ときは はやく まわる）*/
  const sp = (a >= 0) ? s.t * 9 : s.t * 1.6;
  ctx.strokeStyle = '#3a2a12'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(sp - Math.PI / 2) * 9, Math.sin(sp - Math.PI / 2) * 9); ctx.stroke();
  ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(sp * 0.4 - Math.PI / 2) * 6, Math.sin(sp * 0.4 - Math.PI / 2) * 6); ctx.stroke();
  /* とめる ちからの ひかり */
  if (a >= 0) {
    ctx.strokeStyle = 'rgba(255,213,79,' + (0.3 + a * 0.5) + ')';
    ctx.lineWidth = 3;
    for (let i = 0; i < 2; i++) {
      ctx.beginPath(); ctx.arc(0, 0, 20 + i * 9 + a * 8, 0, Math.PI * 2); ctx.stroke();
    }
  }
  ctx.restore();

  /* --- あたま --- */
  ctx.fillStyle = '#ffe0b2';
  ctx.beginPath(); ctx.arc(1, -68, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#212121';
  ctx.beginPath(); ctx.arc(1, -70, 13, Math.PI * 1.05, Math.PI * 2.05); ctx.fill();
  ctx.beginPath(); ctx.moveTo(12, -73); ctx.lineTo(15, -64); ctx.lineTo(9, -69); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#3e2723';
  ellipse(ctx, 5, -67, 1.9, 2.8); ctx.fill();
  ellipse(ctx, 11, -67, 1.9, 2.8); ctx.fill();

  /* --- うで（ふりかぶる）--- */
  const swing = (a >= 0) ? -1.6 + a * 2.6 : -0.35;
  ctx.save();
  ctx.translate(10, -50);
  ctx.rotate(swing);
  ctx.strokeStyle = '#263238'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(18, 0); ctx.stroke();
  ctx.fillStyle = '#c9a06a';
  ctx.beginPath(); ctx.arc(24, 0, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffd54f';
  ctx.beginPath(); ctx.arc(24, 0, 6.6, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#3a2a12'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(24, 0); ctx.lineTo(24, -5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(24, 0); ctx.lineTo(28, 2); ctx.stroke();
  ctx.restore();

  ctx.restore();
}



/* ============================================================
   だい7しょう「闇の頂」の びょうが
   ============================================================ */

/* ---- 覚醒オーラ ----
   よみがえった ボスの まわりに、くろい もやと あかい ひが たつ。
   もとの ボスの えを そのまま つかい、うしろと まえに オーラを かさねる。 */
function awakenAura(ctx, s, back) {
  const pulse = 0.5 + Math.sin(s.t * 3.4) * 0.5;
  ctx.save();
  if (back) {
    /* うしろ：くろむらさきの もや */
    const g = ctx.createRadialGradient(0, -60, 10, 0, -60, 96);
    g.addColorStop(0,   'rgba(90,10,40,' + (0.42 + pulse * 0.16) + ')');
    g.addColorStop(0.6, 'rgba(48,6,26,0.26)');
    g.addColorStop(1,   'rgba(20,0,10,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, -60, 96, 0, Math.PI * 2); ctx.fill();
    /* じめんの あかい わ */
    ctx.strokeStyle = 'rgba(229,57,53,' + (0.30 + pulse * 0.25) + ')';
    ctx.lineWidth = 3;
    ctx.beginPath(); ellipse(ctx, 0, -3, 46 + pulse * 6, 12 + pulse * 2); ctx.stroke();
  } else {
    /* まえ：あかい ひのこが たちのぼる */
    ctx.fillStyle = 'rgba(255,87,34,' + (0.42 + pulse * 0.3) + ')';
    for (let i = 0; i < 7; i++) {
      const ph = (s.t * 0.85 + i * 0.37) % 1;
      const ex = -40 + ((i * 37) % 80);
      const ey = -6 - ph * 118;
      const r  = (1 - ph) * 3.4 + 0.7;
      ctx.beginPath(); ctx.arc(ex + Math.sin(ph * 7 + i) * 6, ey, r, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

/* もとの ボスの えを「覚醒」すがたに つつむ */
function awakened(fn) {
  return function (ctx, s) {
    awakenAura(ctx, s, true);
    fn(ctx, s);
    awakenAura(ctx, s, false);
  };
}


/* ---- 闇堕ちあき坊：さいごの ボス ----
   あき坊の いろちがい。くろ・グレー・シルバーが きほんで、
   めだけが まっかに ひかる。闇の ちからに あやつられて いる すがた。   */
function drawYamiAkibou(ctx, s) {
  const a = s.atk;
  const float = Math.sin(s.t * 2.2) * 3;
  const step = Math.sin(s.t * 6) * (s.moving ? 1 : 0);
  const push = (a >= 0) ? (a < 0.65 ? -a * 8 : (a - 0.65) / 0.35 * 30 - 5.2) : 0;
  const glow = (a >= 0) ? 0.45 + a * 0.45 : 0.3 + Math.sin(s.t * 3) * 0.08;

  ctx.save();
  ctx.translate(push, float);

  /* --- 闇の オーラ（うしろ）--- */
  const hg = ctx.createRadialGradient(0, -62, 8, 0, -62, 92);
  hg.addColorStop(0,   'rgba(120,10,40,' + (glow * 0.85) + ')');
  hg.addColorStop(0.5, 'rgba(40,6,24,0.4)');
  hg.addColorStop(1,   'rgba(8,0,6,0)');
  ctx.fillStyle = hg;
  ctx.beginPath(); ctx.arc(0, -62, 92, 0, Math.PI * 2); ctx.fill();

  /* --- くろい かみなり（ためて いる とき）--- */
  if (a >= 0) {
    ctx.strokeStyle = 'rgba(186,104,200,' + (0.45 + a * 0.5) + ')';
    ctx.lineWidth = 3.4; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const bx = -50 + i * 46, by = -138;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + 7, by + 14);
      ctx.lineTo(bx - 3, by + 16);
      ctx.lineTo(bx + 5, by + 32);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(229,57,53,' + (0.3 + a * 0.4) + ')';
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 3; i++) {
      const bx = -50 + i * 46, by = -138;
      ctx.beginPath();
      ctx.moveTo(bx, by); ctx.lineTo(bx + 7, by + 14);
      ctx.lineTo(bx - 3, by + 16); ctx.lineTo(bx + 5, by + 32);
      ctx.stroke();
    }
  }

  /* --- あし（くろい すそ）--- */
  ctx.fillStyle = '#2a2a30';
  roundRect(ctx, -26 - step * 3, -22, 22, 22, 8); ctx.fill();
  roundRect(ctx,   6 + step * 3, -22, 22, 22, 8); ctx.fill();

  /* --- ころも（くろ〜グレーの ローブ）--- */
  const rg = ctx.createLinearGradient(0, -96, 0, -10);
  rg.addColorStop(0, '#5a5f68');
  rg.addColorStop(0.55, '#2e3138');
  rg.addColorStop(1, '#131418');
  ctx.fillStyle = rg;
  ctx.beginPath();
  ctx.moveTo(-30, -96);
  ctx.quadraticCurveTo(-46, -50, -40, -10);
  ctx.lineTo(40, -10);
  ctx.quadraticCurveTo(46, -50, 30, -96);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#8c93a0'; ctx.lineWidth = 2; ctx.stroke();
  /* すそに はしる あかい すじ */
  ctx.strokeStyle = 'rgba(229,57,53,' + (0.5 + glow * 0.4) + ')';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-34, -18); ctx.quadraticCurveTo(-6, -30, 34, -18); ctx.stroke();

  /* シルバーの おび */
  const bg = ctx.createLinearGradient(-36, 0, 38, 0);
  bg.addColorStop(0, '#8a919c'); bg.addColorStop(0.5, '#dfe4ea'); bg.addColorStop(1, '#767c86');
  ctx.fillStyle = bg;
  roundRect(ctx, -36, -52, 74, 11, 4); ctx.fill();
  /* おびの まんなかの あかい たま */
  ctx.fillStyle = '#b71c1c';
  ctx.beginPath(); ctx.arc(2, -46, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,82,82,' + (0.55 + glow * 0.45) + ')';
  ctx.beginPath(); ctx.arc(2, -46, 4.6, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#c9ced6'; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.arc(2, -46, 8, 0, Math.PI * 2); ctx.stroke();

  /* --- ひげ（くろ〜シルバー）--- */
  const beard = ctx.createLinearGradient(0, -104, 0, -46);
  beard.addColorStop(0, '#9aa1ac'); beard.addColorStop(1, '#3a3d44');
  ctx.fillStyle = beard;
  ctx.beginPath();
  ctx.moveTo(-22, -104);
  ctx.quadraticCurveTo(-16, -58, 2, -46);
  ctx.quadraticCurveTo(20, -58, 26, -104);
  ctx.quadraticCurveTo(2, -92, -22, -104);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 1.6; ctx.stroke();

  /* --- あたま --- */
  ctx.save();
  ctx.translate(2, -126);

  /* もじゃもじゃの かみ（くろ・シルバーの ハイライト）*/
  ctx.fillStyle = '#26282e';
  ctx.beginPath();
  for (let i = 0; i <= 14; i++) {
    const an = Math.PI + (i / 14) * Math.PI;
    const rr = 34 + Math.sin(i * 2.7) * 6;
    const px = Math.cos(an) * rr, py = Math.sin(an) * rr * 0.9;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(200,208,218,.5)'; ctx.lineWidth = 1.4; ctx.stroke();

  /* かお（はいいろ）*/
  const fg = ctx.createLinearGradient(0, -26, 0, 26);
  fg.addColorStop(0, '#7e838d'); fg.addColorStop(1, '#4a4e57');
  ctx.fillStyle = fg;
  ellipse(ctx, 0, 0, 28, 26); ctx.fill();

  /* ★まっかに ひかる め */
  ctx.fillStyle = '#1a1a1e';
  ellipse(ctx, -10, -6, 8, 9); ctx.fill();
  ellipse(ctx, 11, -6, 8, 9); ctx.fill();
  ctx.save();
  ctx.shadowColor = 'rgba(255,23,68,' + (0.75 + glow * 0.25) + ')';
  ctx.shadowBlur = 16 + glow * 14;
  ctx.fillStyle = '#ff1744';
  ellipse(ctx, -9, -5, 4.6, 5.4); ctx.fill();
  ellipse(ctx, 12, -5, 4.6, 5.4); ctx.fill();
  ctx.restore();
  ctx.fillStyle = 'rgba(255,205,210,.9)';
  ctx.beginPath(); ctx.arc(-10.4, -6.6, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(10.6, -6.6, 1.5, 0, Math.PI * 2); ctx.fill();

  /* おしつぶされた くち */
  ctx.fillStyle = '#2a0d12';
  ellipse(ctx, 1, 12, 7, (a >= 0 ? 11 : 8)); ctx.fill();
  ctx.fillStyle = 'rgba(183,28,28,.55)';
  ellipse(ctx, 1, 12, 4.4, (a >= 0 ? 7.4 : 5)); ctx.fill();

  /* シルバーの かんむり */
  const cg = ctx.createLinearGradient(-32, 0, 34, 0);
  cg.addColorStop(0, '#727881'); cg.addColorStop(0.5, '#e3e8ee'); cg.addColorStop(1, '#6a707a');
  ctx.fillStyle = cg;
  ctx.strokeStyle = '#3d424a'; ctx.lineWidth = 1.6;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 12 - 5, -30);
    ctx.quadraticCurveTo(i * 12, -48 - (i === 0 ? 8 : 0), i * 12 + 5, -30);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.fillStyle = cg;
  roundRect(ctx, -32, -32, 66, 8, 4); ctx.fill();
  /* かんむりの あかい たま */
  ctx.fillStyle = 'rgba(255,23,68,' + (0.7 + glow * 0.3) + ')';
  ctx.beginPath(); ctx.arc(1, -44, 3.6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  /* --- りょうての うで（かおを おさえて いる）--- */
  ctx.strokeStyle = '#6e737d'; ctx.lineWidth = 14; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-30, -80); ctx.quadraticCurveTo(-44, -110, -28, -126); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(32, -80); ctx.quadraticCurveTo(48, -110, 32, -126); ctx.stroke();
  /* シルバーの うでわ */
  ctx.strokeStyle = '#d7dce3'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(-36, -96); ctx.lineTo(-28, -92); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(40, -96);  ctx.lineTo(32, -92);  ctx.stroke();
  /* て */
  ctx.fillStyle = '#767b85';
  ctx.beginPath(); ctx.arc(-28, -126, 10, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(32, -126, 10, 0, Math.PI * 2); ctx.fill();

  /* --- まえがわの 闇の つぶ --- */
  ctx.fillStyle = 'rgba(186,104,200,' + (0.35 + glow * 0.3) + ')';
  for (let i = 0; i < 9; i++) {
    const ph = (s.t * 0.6 + i * 0.31) % 1;
    const ex = -46 + ((i * 41) % 96);
    const ey = -8 - ph * 150;
    ctx.beginPath();
    ctx.arc(ex + Math.sin(ph * 6 + i) * 7, ey, (1 - ph) * 3.6 + 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}


/* ============================================================
   宇宙編「火星」の キャラたち
   ============================================================ */

/* ---- 魚ファイターズ：あおい タコ ＋ きいろい さかな ----
   2たい 1くみ。こうげきの ときは かわるがわる まえに とびだして
   体当たりする（2れんげき）。                                     */
function drawSakanaFighters(ctx, s) {
  const a = s.atk;
  const swim = Math.sin(s.t * 4) * 3;
  /* 1ぱつめは タコ、2はつめは さかなが とびだす */
  const dash1 = (a >= 0 && a < 0.55) ? Math.sin(a / 0.55 * Math.PI) * 26 : 0;
  const dash2 = (a >= 0.55) ? Math.sin((a - 0.55) / 0.45 * Math.PI) * 30 : 0;

  ctx.save();

  /* --- きいろい さかな（うしろ・すこし うえ）--- */
  ctx.save();
  ctx.translate(-16 + dash2 * 1.5, -54 + swim * 0.6);
  ctx.fillStyle = '#e0a521';
  ellipse(ctx, 0, 0, 22, 13); ctx.fill();
  /* おびれ */
  ctx.beginPath();
  ctx.moveTo(-20, 0);
  ctx.lineTo(-34, -10);
  ctx.lineTo(-34, 10);
  ctx.closePath(); ctx.fill();
  /* もようの だえん（うえ・した）*/
  ctx.fillStyle = '#f2bf4a';
  ellipse(ctx, 2, -5, 13, 5.5); ctx.fill();
  ellipse(ctx, 2, 5, 13, 5.5); ctx.fill();
  /* こげちゃの つぶ */
  ctx.fillStyle = '#6d5518';
  for (const [bx, by] of [[-4, -6], [1, -6], [6, -5], [-4, 5], [1, 6], [6, 5]]) {
    ctx.save(); ctx.translate(bx, by); ctx.rotate(0.3);
    roundRect(ctx, -2.4, -2.4, 4.8, 4.8, 1); ctx.fill(); ctx.restore();
  }
  /* にこにこの め（^^）と くち */
  ctx.strokeStyle = '#20160a'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(11, -5); ctx.quadraticCurveTo(14, -9, 17, -5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(15, 1); ctx.quadraticCurveTo(18, -3, 21, 1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(12, 5); ctx.quadraticCurveTo(16, 9, 20, 4); ctx.stroke();
  ctx.restore();

  /* --- あおい タコ（まえ）--- */
  ctx.save();
  ctx.translate(4 + dash1 * 1.5, -26 + swim);

  /* あし 6ぼん */
  ctx.fillStyle = '#5aabd6';
  for (let i = 0; i < 6; i++) {
    const bx = -20 + i * 8;
    const wob = Math.sin(s.t * 5 + i * 0.8) * 3;
    ctx.beginPath();
    ctx.moveTo(bx - 4, 4);
    ctx.quadraticCurveTo(bx - 2 + wob, 18, bx + 1 + wob * 1.4, 26);
    ctx.quadraticCurveTo(bx + 4 + wob, 16, bx + 4, 4);
    ctx.closePath(); ctx.fill();
  }
  /* あたま（まるい） */
  ctx.fillStyle = '#63b4dd';
  ctx.beginPath();
  ctx.moveTo(-26, 6);
  ctx.quadraticCurveTo(-26, -24, 0, -24);
  ctx.quadraticCurveTo(26, -24, 26, 6);
  ctx.closePath(); ctx.fill();

  /* ★の め */
  for (const ex of [-10, 10]) {
    ctx.fillStyle = '#12233a';
    ctx.beginPath(); ctx.arc(ex, -8, 8.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const an = -Math.PI / 2 + k * Math.PI / 5;
      const rr = (k % 2 === 0) ? 5.4 : 2.3;
      const px = ex + Math.cos(an) * rr, py = -8 + Math.sin(an) * rr;
      if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
  }
  /* あかい でんげんマークの くち */
  ctx.strokeStyle = '#e5453a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, 6, 7, Math.PI * 1.25, Math.PI * 1.75, true); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 9); ctx.stroke();

  ctx.restore();
  ctx.restore();
}


/* ---- やじるしくん：りょうほうこうの あかい やじるし ---- */
function drawYajirushi(ctx, s) {
  const a = s.atk;
  const step = Math.sin(s.t * 8) * (s.moving ? 1 : 0);
  const push = (a >= 0) ? Math.sin(a * Math.PI) * 10 : 0;
  ctx.save();
  ctx.translate(push, 0);

  /* さんかくの だい */
  ctx.fillStyle = '#c8392c';
  ctx.beginPath();
  ctx.moveTo(0, -30);
  ctx.lineTo(-17 + step * 2, 0);
  ctx.lineTo(17 + step * 2, 0);
  ctx.closePath(); ctx.fill();
  /* くび */
  ctx.fillStyle = '#d2402f';
  ctx.fillRect(-6, -44, 12, 16);

  /* やじるしの あたま（りょうほうこう）*/
  ctx.fillStyle = '#d2402f';
  ctx.beginPath();
  ctx.moveTo(-34, -62);            // ひだりの さき
  ctx.lineTo(-16, -78);
  ctx.lineTo(-16, -70);
  ctx.lineTo(16, -70);
  ctx.lineTo(16, -78);
  ctx.lineTo(34, -62);
  ctx.lineTo(16, -46);
  ctx.lineTo(16, -54);
  ctx.lineTo(-16, -54);
  ctx.lineTo(-16, -46);
  ctx.closePath(); ctx.fill();
  /* まんなかの しかく */
  ctx.fillRect(-16, -70, 32, 16);

  /* かお */
  ctx.fillStyle = '#231110';
  roundRect(ctx, -8, -70, 4.5, 12, 2); ctx.fill();
  roundRect(ctx, 3, -70, 4.5, 12, 2); ctx.fill();
  ctx.save(); ctx.rotate(-0.06);
  roundRect(ctx, -9, -54, 17, 4.5, 2); ctx.fill();
  ctx.restore();

  /* こうげきの とき まえに ひが ちる */
  if (a >= 0) {
    ctx.fillStyle = 'rgba(255,138,60,' + (0.4 + a * 0.4) + ')';
    for (let i = 0; i < 4; i++) {
      const ph = (a + i * 0.25) % 1;
      ctx.beginPath();
      ctx.arc(34 + ph * 18, -62 + Math.sin(ph * 6 + i) * 8, (1 - ph) * 4 + 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}


/* ---- ポチ：火星の おおボス。みどりの りゅう ----
   しかくい みどりの からだに、りゅうの あたま。
   こうげきの ときは くちから ひを はく。                          */
function drawPochi(ctx, s) {
  const a = s.atk;
  const step = Math.sin(s.t * 7) * (s.moving ? 1 : 0);
  const breath = (a >= 0.45) ? (a - 0.45) / 0.55 : 0;

  ctx.save();

  /* --- あし（4ほん・さんかく）--- */
  ctx.fillStyle = '#3f8f37';
  for (const [lx, ph] of [[-30, 0], [-14, 1], [14, 1], [30, 0]]) {
    const sw = step * (ph ? -5 : 5);
    ctx.beginPath();
    ctx.moveTo(lx - 9, -34);
    ctx.lineTo(lx + 9, -34);
    ctx.lineTo(lx + 3 + sw, 0);
    ctx.closePath(); ctx.fill();
  }

  /* --- からだ（しかくい みどり）--- */
  ctx.fillStyle = '#4aa63f';
  ctx.beginPath();
  ctx.moveTo(-54, -34);
  ctx.lineTo(-54, -74);
  ctx.lineTo(-40, -94);          // せなかの とんがり
  ctx.lineTo(-30, -76);
  ctx.lineTo(30, -76);
  ctx.lineTo(34, -34);
  ctx.closePath(); ctx.fill();
  /* しっぽ */
  ctx.beginPath();
  ctx.moveTo(-54, -66);
  ctx.lineTo(-84, -50 + Math.sin(s.t * 3) * 6);
  ctx.lineTo(-54, -42);
  ctx.closePath(); ctx.fill();

  /* --- くび --- */
  ctx.fillStyle = '#54b348';
  ctx.beginPath();
  ctx.moveTo(24, -78); ctx.lineTo(44, -96); ctx.lineTo(52, -78); ctx.lineTo(34, -62);
  ctx.closePath(); ctx.fill();

  /* --- あたま（りゅう）--- */
  ctx.save();
  ctx.translate(50, -96);

  /* つの 2ほん */
  ctx.strokeStyle = '#d6df6a'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-10, -14); ctx.quadraticCurveTo(-20, -30, -6, -34); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(2, -16); ctx.quadraticCurveTo(-4, -34, 10, -34); ctx.stroke();
  /* あたまの たてがみ */
  ctx.fillStyle = '#c7d95a';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(-16 + i * 7, -12);
    ctx.lineTo(-13 + i * 7, -26 - (i % 2) * 5);
    ctx.lineTo(-9 + i * 7, -12);
    ctx.closePath(); ctx.fill();
  }
  /* あたま ほんたい */
  ctx.fillStyle = '#3d8f36';
  ellipse(ctx, 0, 0, 22, 17); ctx.fill();
  /* はな さき */
  ctx.fillStyle = '#4fa544';
  ellipse(ctx, 18, 2, 12, 11); ctx.fill();
  ctx.fillStyle = '#2c6b28';
  ctx.beginPath(); ctx.arc(22, -1, 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(16, -3, 2.6, 0, Math.PI * 2); ctx.fill();
  /* め */
  ctx.fillStyle = '#ffffff';
  ellipse(ctx, 2, -6, 6.5, 6); ctx.fill();
  ctx.fillStyle = '#123018';
  ctx.beginPath(); ctx.arc(3.5, -6, 3.2, 0, Math.PI * 2); ctx.fill();
  /* くち（こうげきの ときは おおきく あく）*/
  const open = 4 + breath * 12;
  ctx.fillStyle = '#8e2b2b';
  ctx.beginPath();
  ctx.moveTo(10, 6);
  ctx.lineTo(30, 6 - open * 0.2);
  ctx.lineTo(30, 6 + open);
  ctx.lineTo(12, 12);
  ctx.closePath(); ctx.fill();
  /* きば */
  ctx.fillStyle = '#f5f5dc';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(14 + i * 6, 6); ctx.lineTo(17 + i * 6, 11); ctx.lineTo(19 + i * 6, 6);
    ctx.closePath(); ctx.fill();
  }
  /* ひげ */
  ctx.strokeStyle = '#d6df6a'; ctx.lineWidth = 2.6;
  ctx.beginPath(); ctx.moveTo(20, 4); ctx.quadraticCurveTo(36, 10, 30, 22); ctx.stroke();

  /* --- くちから はく ひ --- */
  if (breath > 0) {
    for (let i = 0; i < 14; i++) {
      const ph = ((s.t * 2.5 + i * 0.14) % 1);
      const fx = 30 + ph * 84;
      const fy = 8 + Math.sin(ph * 5 + i) * (6 + ph * 16);
      const r = (1 - ph) * 11 + 3;
      ctx.fillStyle = (i % 3 === 0) ? 'rgba(255,241,118,' + (breath * (1 - ph)) + ')'
        : ((i % 3 === 1) ? 'rgba(255,167,38,' + (breath * (1 - ph) * 0.9) + ')'
          : 'rgba(239,83,80,' + (breath * (1 - ph) * 0.8) + ')');
      ctx.beginPath(); ctx.arc(fx, fy, r, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
  ctx.restore();
}


/* ---- アイアンゴーレム ----
   しろっぽい てつの からだ。かたい しかくい あたまに おおきな はな、
   ちょっと よりめ。からだと うでに みどりの つるが まきつく。
   こうげきの ときは りょううでを おおきく ふりあげて うちあげる。      */
function drawIronGolem(ctx, s) {
  const a = s.atk;
  const step = Math.sin(s.t * 4.5) * (s.moving ? 1 : 0);
  /* ふりかぶり → ふりあげ */
  let arm = -0.15;
  if (a >= 0) arm = (a < 0.6) ? (-0.15 + a / 0.6 * 0.75) : (0.6 - (a - 0.6) / 0.4 * 2.4);
  const hurt = (s.hpRate !== undefined && s.hpRate < 0.5);

  const IRON = '#c9ccc4', IRON2 = '#a9ada4', IRON3 = '#8d918a', VINE = '#5b8f3a';

  ctx.save();

  /* --- あし（ふとい 2ほん）--- */
  ctx.fillStyle = IRON2;
  roundRect(ctx, -22 - step * 4, -34, 18, 34, 4); ctx.fill();
  roundRect(ctx,   5 + step * 4, -34, 18, 34, 4); ctx.fill();
  ctx.fillStyle = IRON3;
  roundRect(ctx, -24 - step * 4, -6, 22, 6, 3); ctx.fill();
  roundRect(ctx,   4 + step * 4, -6, 22, 6, 3); ctx.fill();

  /* --- からだ（しかくい）--- */
  const bg = ctx.createLinearGradient(-28, -96, 28, -36);
  bg.addColorStop(0, IRON); bg.addColorStop(1, IRON2);
  ctx.fillStyle = bg;
  roundRect(ctx, -28, -96, 56, 62, 6); ctx.fill();
  ctx.strokeStyle = IRON3; ctx.lineWidth = 2;
  roundRect(ctx, -28, -96, 56, 62, 6); ctx.stroke();

  /* からだの つる（みどり）*/
  ctx.strokeStyle = VINE; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-24, -88); ctx.quadraticCurveTo(-6, -74, -18, -56);
  ctx.quadraticCurveTo(-28, -44, -10, -38); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(20, -90); ctx.quadraticCurveTo(6, -78, 16, -62); ctx.stroke();
  /* つるの は */
  ctx.fillStyle = '#7cb342';
  for (const [vx, vy] of [[-22, -80], [-14, -62], [-14, -42], [16, -82], [14, -66]]) {
    ellipse(ctx, vx, vy, 5, 3.4); ctx.fill();
  }

  /* たいりょくが へると ひびが はいる（マイクラと おなじ）*/
  if (hurt) {
    ctx.strokeStyle = 'rgba(70,74,68,.8)'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(-6, -92); ctx.lineTo(2, -78); ctx.lineTo(-4, -66); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(14, -56); ctx.lineTo(6, -46); ctx.stroke();
  }

  /* --- うで（ながく、ひざの あたりまで たれる）--- */
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * 30, -88);
    ctx.rotate(side * arm * (side > 0 ? 1 : -1) - (side > 0 ? 0 : 0));
    ctx.fillStyle = (side > 0) ? IRON : IRON2;
    roundRect(ctx, -8, 0, 16, 56, 5); ctx.fill();
    ctx.strokeStyle = IRON3; ctx.lineWidth = 1.8;
    roundRect(ctx, -8, 0, 16, 56, 5); ctx.stroke();
    /* こぶし */
    ctx.fillStyle = IRON2;
    roundRect(ctx, -10, 50, 20, 16, 4); ctx.fill();
    /* うでの つる */
    ctx.strokeStyle = VINE; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-6, 10); ctx.quadraticCurveTo(4, 22, -4, 34); ctx.stroke();
    ctx.restore();
  }

  /* --- あたま --- */
  ctx.save();
  ctx.translate(2, -96);
  ctx.fillStyle = IRON;
  roundRect(ctx, -19, -34, 38, 34, 4); ctx.fill();
  ctx.strokeStyle = IRON3; ctx.lineWidth = 2;
  roundRect(ctx, -19, -34, 38, 34, 4); ctx.stroke();
  /* おおきな はな（まんなかに でっぱる）*/
  ctx.fillStyle = IRON2;
  roundRect(ctx, -5, -22, 12, 22, 3); ctx.fill();
  ctx.fillStyle = IRON3;
  roundRect(ctx, 7, -20, 6, 18, 2); ctx.fill();
  /* ちょっと よりめ */
  ctx.fillStyle = '#2b2f2a';
  roundRect(ctx, -13, -24, 7, 8, 2); ctx.fill();
  roundRect(ctx,   8, -24, 7, 8, 2); ctx.fill();
  ctx.fillStyle = '#d84315';
  roundRect(ctx, -8.5, -22, 2.6, 4, 1); ctx.fill();
  roundRect(ctx,  8.5, -22, 2.6, 4, 1); ctx.fill();
  /* あたまの つる */
  ctx.strokeStyle = VINE; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-19, -28); ctx.quadraticCurveTo(-10, -20, -16, -10); ctx.stroke();
  ctx.restore();

  /* --- ふりあげの かぜ（うちあげる ちから）--- */
  if (a >= 0.55) {
    const k = (a - 0.55) / 0.45;
    ctx.strokeStyle = 'rgba(255,255,255,' + (0.55 * (1 - k)) + ')';
    ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const yy = -30 - i * 26 - k * 40;
      ctx.beginPath();
      ctx.moveTo(34 + i * 5, yy);
      ctx.quadraticCurveTo(52 + i * 6, yy - 14, 44 + i * 5, yy - 30);
      ctx.stroke();
    }
  }

  ctx.restore();
}


/* ============================================================
   宇宙編「水星」の キャラたち
   ============================================================ */

/* ---- ウォーターサーバー君 ----
   たてながの みずいろの ボディ。あたまの うえに とがった みずぐち。
   め（たての せん 2ほん）と、ぐにゃっとした くち。したには なみの あし。
   こうげきの ときは みずぐちから みずを とばす。                    */
function drawWaterServer(ctx, s) {
  const a = s.atk;
  const wob = Math.sin(s.t * 5) * (s.moving ? 2 : 0.6);
  ctx.save();

  /* --- なみの あし --- */
  ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 3.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const bx of [-10, 8]) {
    ctx.beginPath();
    ctx.moveTo(bx - 8, -2);
    ctx.lineTo(bx - 4, -9 + wob);
    ctx.lineTo(bx,     -2);
    ctx.lineTo(bx + 4, -9 - wob);
    ctx.lineTo(bx + 8, -2);
    ctx.stroke();
  }

  /* --- ボディ（たてながの しかく）--- */
  const g = ctx.createLinearGradient(-17, 0, 17, 0);
  g.addColorStop(0, '#5aabd6'); g.addColorStop(0.5, '#71bde3'); g.addColorStop(1, '#4b9ac6');
  ctx.fillStyle = g;
  ctx.fillRect(-17, -92, 34, 90);
  /* ボディの ひかり */
  ctx.fillStyle = 'rgba(255,255,255,.18)';
  ctx.fillRect(-13, -88, 7, 82);

  /* --- あたまの みずぐち（とがった みず）--- */
  ctx.fillStyle = '#5aabd6';
  ctx.beginPath();
  ctx.moveTo(-15, -92);
  ctx.lineTo(-11, -124);
  ctx.lineTo(-6,  -104);
  ctx.lineTo(-2,  -114);
  ctx.lineTo(2,   -92);
  ctx.closePath(); ctx.fill();
  /* くちの ふち（くろい よこせん）*/
  ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-17, -92); ctx.lineTo(2, -92); ctx.stroke();

  /* --- かお --- */
  ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
  /* め（たての せん 2ほん）*/
  ctx.beginPath(); ctx.moveTo(-4, -80); ctx.lineTo(-4, -66); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(7,  -82); ctx.lineTo(7,  -68); ctx.stroke();
  /* くち（ぐにゃっと）*/
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(1, -58);
  ctx.quadraticCurveTo(4, -64, 7, -58);
  ctx.quadraticCurveTo(9, -63, 11, -57);
  ctx.quadraticCurveTo(12, -44, 5, -46);
  ctx.quadraticCurveTo(0, -48, 1, -58);
  ctx.stroke();

  /* --- こうげき：みずぐちから みずが とびだす --- */
  if (a >= 0) {
    ctx.fillStyle = 'rgba(129,212,250,' + (0.5 + a * 0.4) + ')';
    for (let i = 0; i < 6; i++) {
      const ph = (a + i * 0.17) % 1;
      ctx.beginPath();
      ctx.arc(4 + ph * 40, -110 + ph * 22 + Math.sin(ph * 5 + i) * 5, (1 - ph) * 5 + 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}


/* ---- アルティメット・ザバーン：水星の おおボス ----
   波獣ザバーンが すすんだ すがた。おおきな あおい からだに
   きんいろの かどと、いくつもの ひれ。まわりに みずの わが まわる。   */
function drawZabaanU(ctx, s) {
  const a = s.atk;
  const sw = Math.sin(s.t * 2.4) * 4;
  const glow = 0.45 + Math.sin(s.t * 3.2) * 0.15 + (a >= 0 ? a * 0.4 : 0);
  ctx.save();

  /* --- まわりを まわる みずの わ --- */
  ctx.strokeStyle = 'rgba(79,195,247,' + glow + ')';
  ctx.lineWidth = 4;
  for (let i = 0; i < 3; i++) {
    const r = 62 + i * 16;
    ctx.beginPath();
    ctx.ellipse(0, -60, r, r * 0.32, Math.sin(s.t * 1.2 + i) * 0.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  /* --- おおきな しっぽ（うしろ）--- */
  ctx.fillStyle = '#1565a8';
  ctx.beginPath();
  ctx.moveTo(-40, -70);
  ctx.quadraticCurveTo(-86, -60 + sw, -104, -96 + sw);
  ctx.quadraticCurveTo(-86, -76 + sw, -100, -40 + sw);
  ctx.quadraticCurveTo(-70, -44, -40, -46);
  ctx.closePath(); ctx.fill();

  /* --- からだ --- */
  const bg = ctx.createLinearGradient(0, -118, 0, -14);
  bg.addColorStop(0, '#4fc3f7'); bg.addColorStop(0.5, '#1e88e5'); bg.addColorStop(1, '#0d47a1');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.moveTo(-44, -20);
  ctx.quadraticCurveTo(-52, -84, -18, -112);
  ctx.quadraticCurveTo(20, -132, 46, -100);
  ctx.quadraticCurveTo(60, -76, 50, -20);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#0b3d91'; ctx.lineWidth = 3; ctx.stroke();

  /* おなかの もよう */
  ctx.fillStyle = 'rgba(178,235,242,.7)';
  ctx.beginPath();
  ctx.moveTo(-8, -24);
  ctx.quadraticCurveTo(-26, -60, -4, -92);
  ctx.quadraticCurveTo(22, -62, 22, -24);
  ctx.closePath(); ctx.fill();

  /* --- せなかの ひれ（3まい）--- */
  ctx.fillStyle = '#0d47a1';
  for (const [fx, fh] of [[-22, 40], [2, 56], [26, 38]]) {
    ctx.beginPath();
    ctx.moveTo(fx - 12, -104);
    ctx.lineTo(fx, -104 - fh);
    ctx.lineTo(fx + 12, -100);
    ctx.closePath(); ctx.fill();
  }
  /* ひれの ふちを きんいろに */
  ctx.strokeStyle = '#ffd54f'; ctx.lineWidth = 2.4;
  for (const [fx, fh] of [[-22, 40], [2, 56], [26, 38]]) {
    ctx.beginPath();
    ctx.moveTo(fx - 12, -104); ctx.lineTo(fx, -104 - fh); ctx.lineTo(fx + 12, -100);
    ctx.stroke();
  }

  /* --- きんいろの かど（アルティメットの しるし）--- */
  ctx.strokeStyle = '#ffd54f'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(16, -108); ctx.quadraticCurveTo(6, -142, 30, -150); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(36, -104); ctx.quadraticCurveTo(44, -136, 64, -132); ctx.stroke();
  ctx.fillStyle = '#fff59d';
  ctx.beginPath(); ctx.arc(30, -150, 5.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(64, -132, 5, 0, Math.PI * 2); ctx.fill();

  /* --- かお --- */
  /* め（きんに ひかる） */
  ctx.save();
  ctx.shadowColor = 'rgba(255,213,79,' + (0.6 + glow * 0.4) + ')';
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#fff176';
  ellipse(ctx, 26, -84, 8, 6.5); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#0d2b52';
  ellipse(ctx, 28, -84, 3.4, 5.4); ctx.fill();
  /* まゆ（きりっと）*/
  ctx.strokeStyle = '#0b3d91'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(17, -95); ctx.lineTo(35, -90); ctx.stroke();

  /* くち（こうげきで あく）*/
  const open = 6 + (a >= 0 ? a * 16 : 0);
  ctx.fillStyle = '#08284d';
  ctx.beginPath();
  ctx.moveTo(34, -70);
  ctx.quadraticCurveTo(56, -70 - open * 0.3, 58, -66 + open);
  ctx.quadraticCurveTo(44, -58, 34, -62);
  ctx.closePath(); ctx.fill();
  /* きば */
  ctx.fillStyle = '#e3f2fd';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(38 + i * 6, -68); ctx.lineTo(41 + i * 6, -62); ctx.lineTo(44 + i * 6, -68);
    ctx.closePath(); ctx.fill();
  }

  /* --- ひれ（よこ）--- */
  ctx.fillStyle = '#1565a8';
  ctx.beginPath();
  ctx.moveTo(-30, -56);
  ctx.quadraticCurveTo(-58, -46 + sw, -52, -18 + sw);
  ctx.quadraticCurveTo(-38, -34, -26, -34);
  ctx.closePath(); ctx.fill();

  /* --- こうげき：みずの ほうしゃ --- */
  if (a >= 0.4) {
    const k = (a - 0.4) / 0.6;
    for (let i = 0; i < 10; i++) {
      const ph = ((s.t * 3 + i * 0.1) % 1);
      ctx.fillStyle = 'rgba(129,212,250,' + (k * (1 - ph) * 0.9) + ')';
      ctx.beginPath();
      ctx.arc(58 + ph * 76, -64 + Math.sin(ph * 6 + i) * 12, (1 - ph) * 9 + 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}


/* ---- クリーパー ----
   みどりと きみどりの まだらの からだ。てが なく、みじかい あしが 4ほん。
   かおは あなの あいた ような め 2つと、ぐにゃりと した くち。
   こうげきの ときは しろく ひかって ふくらみ、さいごに ばくはつする。   */
function drawCreeper(ctx, s) {
  const a = s.atk;
  const step = Math.sin(s.t * 6) * (s.moving ? 1 : 0);
  /* ふくらむ → ひかる → ドカーン */
  const swell = (a >= 0) ? 1 + Math.min(a, 0.85) * 0.30 : 1;
  const flash = (a >= 0) ? (Math.sin(a * 34) * 0.5 + 0.5) * Math.min(1, a * 1.4) : 0;
  const boom  = (a >= 0.85) ? (a - 0.85) / 0.15 : 0;

  ctx.save();

  /* --- ばくはつ --- */
  if (boom > 0) {
    const r = 30 + boom * 74;
    const bg = ctx.createRadialGradient(0, -34, 4, 0, -34, r);
    bg.addColorStop(0, 'rgba(255,255,255,' + (0.9 * (1 - boom)) + ')');
    bg.addColorStop(0.4, 'rgba(255,213,79,' + (0.7 * (1 - boom)) + ')');
    bg.addColorStop(0.75, 'rgba(255,112,67,' + (0.5 * (1 - boom)) + ')');
    bg.addColorStop(1, 'rgba(120,120,120,0)');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.arc(0, -34, r, 0, Math.PI * 2); ctx.fill();
  }

  ctx.save();
  ctx.translate(0, -2);
  ctx.scale(swell, swell);
  ctx.translate(0, 2);

  /* --- あし 4ほん（まえ 2・うしろ 2）--- */
  const legs = [[-16, '#3f7a2e'], [-4, '#4c8f37'], [6, '#3f7a2e'], [16, '#4c8f37']];
  legs.forEach(([lx, col], i) => {
    const sw = step * ((i % 2) ? -3 : 3);
    ctx.fillStyle = col;
    ctx.fillRect(lx - 5 + sw, -16, 10, 16);
  });

  /* --- からだ（たてながの はこ）--- */
  ctx.fillStyle = '#57a943';
  ctx.fillRect(-15, -62, 30, 46);
  /* まだらの もよう */
  const spots = [[-12, -58, 6, 7], [-3, -60, 5, 5], [6, -56, 7, 6], [-10, -44, 5, 6],
                 [1, -46, 6, 7], [9, -40, 5, 5], [-13, -30, 6, 5], [3, -28, 7, 6]];
  ctx.fillStyle = '#4a9439';
  spots.forEach(([x, y, w, h]) => ctx.fillRect(x, y, w, h));
  ctx.fillStyle = '#6cbb52';
  ctx.fillRect(-8, -54, 5, 6); ctx.fillRect(4, -36, 5, 5);

  /* --- あたま（しかく）--- */
  ctx.fillStyle = '#5cb247';
  ctx.fillRect(-18, -96, 36, 34);
  ctx.fillStyle = '#4a9439';
  ctx.fillRect(-15, -92, 7, 7); ctx.fillRect(8, -70, 7, 6); ctx.fillRect(-4, -68, 6, 5);

  /* かお：あなの あいた ような め 2つ */
  ctx.fillStyle = '#182a12';
  ctx.fillRect(-13, -88, 10, 10);
  ctx.fillRect(4, -88, 10, 10);
  /* ぐにゃりと した くち */
  ctx.fillRect(-6, -78, 12, 8);
  ctx.fillRect(-11, -74, 6, 12);
  ctx.fillRect(6, -74, 6, 12);
  ctx.fillRect(-6, -66, 12, 4);

  /* --- ふくらむ ときの しろい ひかり --- */
  if (flash > 0) {
    ctx.fillStyle = 'rgba(255,255,255,' + (flash * 0.55) + ')';
    ctx.fillRect(-18, -96, 36, 34);
    ctx.fillRect(-15, -62, 30, 46);
    legs.forEach(([lx]) => ctx.fillRect(lx - 5, -16, 10, 16));
  }

  ctx.restore();
  ctx.restore();
}


/* ---- ずに太：ずにおの しんかけい。3のめ（ななめに 3つ）----
   こうげきりょくは はんぶんに なった かわりに 3れんげき。
   め が 3つ ある ぶん、3ぽんの ビームを だします。            */
function drawZunita(ctx, s) {
  const R = 25;
  const charge = s.atk >= 0 ? s.atk : 0;

  ctx.save();
  ctx.translate(0, -R - 2);
  ctx.rotate(s.roll || 0);

  /* ほんたい */
  const g = ctx.createLinearGradient(-R, -R, R, R);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#dfe4ea');
  ctx.fillStyle = g;
  roundRect(ctx, -R, -R, R * 2, R * 2, 9); ctx.fill();
  ctx.strokeStyle = '#2f3542'; ctx.lineWidth = 2.6;
  roundRect(ctx, -R, -R, R * 2, R * 2, 9); ctx.stroke();

  /* 3の め（ひだりした → まんなか → みぎうえ の ななめ）*/
  const pulse = 1 + charge * 0.16;
  const pips = [[-13, 13], [0, 0], [13, -13]];
  pips.forEach((pp, i) => {
    const bright = charge > 0 ? (0.55 + 0.45 * Math.abs(Math.sin(s.t * 9 + i * 1.1))) : 1;
    ctx.fillStyle = '#1b1b1b';
    ctx.beginPath(); ctx.arc(pp[0], pp[1], 7.4 * pulse, 0, Math.PI * 2); ctx.fill();
    if (charge > 0) {
      ctx.fillStyle = 'rgba(255,120,90,' + (0.3 + charge * 0.5) * bright + ')';
      ctx.beginPath(); ctx.arc(pp[0], pp[1], 7.4 * pulse + 4 + charge * 5, 0, Math.PI * 2); ctx.fill();
    }
  });

  /* しんかの しるし（かどの きらり）*/
  ctx.fillStyle = 'rgba(255,213,79,' + (0.5 + Math.sin(s.t * 4) * 0.3) + ')';
  starPath(ctx, R - 5, -R + 5, 5, 2.2, s.t * 2);
  ctx.fill();

  ctx.restore();

  /* 3ぽんの ビームの ため */
  if (charge > 0) {
    ctx.save();
    ctx.translate(0, -R - 2);
    for (let i = 0; i < 3; i++) {
      const oy = -12 + i * 12;
      ctx.globalAlpha = (0.3 + charge * 0.5) * (0.7 + 0.3 * Math.abs(Math.sin(s.t * 9 + i)));
      const bg = ctx.createLinearGradient(0, 0, 26 + charge * 26, 0);
      bg.addColorStop(0, 'rgba(255,80,60,0.95)');
      bg.addColorStop(1, 'rgba(255,180,120,0)');
      ctx.fillStyle = bg;
      const hh = 2.4 + charge * 4;
      ctx.fillRect(8, oy - hh / 2, 22 + charge * 28, hh);
    }
    ctx.restore();
  }
}


/* ---- かべくん：ちゃいろい かべ。こうげきは しない ---- */
function drawKabekun(ctx, s) {
  const brace = (s.atk >= 0) ? 1 : 0;                 // てきを うけとめて いる
  const wob = Math.sin(s.t * (brace ? 18 : 2.5)) * (brace ? 1.6 : 0.8);
  ctx.save();
  ctx.translate(wob, 0);

  /* ほんたい（したが 2またに とがった はた の かたち）*/
  const g = ctx.createLinearGradient(-30, 0, 30, 0);
  g.addColorStop(0, '#8a5a24');
  g.addColorStop(0.45, '#a86c2c');
  g.addColorStop(1, '#7d4f1e');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-30, -116);
  ctx.lineTo(30, -116);
  ctx.lineTo(30, -34);
  ctx.lineTo(7, -1);
  ctx.lineTo(7, -16);
  ctx.lineTo(-7, -16);
  ctx.lineTo(-7, -1);
  ctx.lineTo(-30, -34);
  ctx.closePath();
  ctx.fill();

  /* ふちの ハイライト */
  ctx.strokeStyle = 'rgba(255,225,180,0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-30, -116); ctx.lineTo(30, -116);
  ctx.stroke();

  /* かお（くろい せん）*/
  ctx.strokeStyle = '#1b1b1b';
  ctx.lineWidth = 3.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // ひだりの め「し」
  ctx.beginPath();
  ctx.moveTo(-9, -96);
  ctx.quadraticCurveTo(-14, -80, -2, -76);
  ctx.stroke();
  // みぎの め（たてぼう）
  ctx.beginPath();
  ctx.moveTo(9, -98); ctx.lineTo(9, -74);
  ctx.stroke();
  // くち（ながい うねり）
  ctx.beginPath();
  ctx.moveTo(-11, -62);
  ctx.quadraticCurveTo(-14, -44, -4, -42);
  ctx.quadraticCurveTo(8, -40, 14, -52);
  ctx.stroke();

  ctx.restore();
}

/* ---- ずにお：しろい サイコロ。ころがって すすみ、1の めから ビーム ---- */
function drawZunio(ctx, s) {
  const R = 25;                       // サイコロの はんぶんの おおきさ
  const charge = s.atk >= 0 ? s.atk : 0;

  ctx.save();
  ctx.translate(0, -R - 2);
  ctx.rotate(s.roll || 0);            // ころがり

  // ほんたい（しろい かどまる しかく）
  const g = ctx.createLinearGradient(-R, -R, R, R);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#dfe4ea');
  ctx.fillStyle = g;
  roundRect(ctx, -R, -R, R * 2, R * 2, 9); ctx.fill();
  ctx.strokeStyle = '#2f3542'; ctx.lineWidth = 2.6;
  roundRect(ctx, -R, -R, R * 2, R * 2, 9); ctx.stroke();

  // 1の め（あかい まる）
  const pulse = 1 + charge * 0.18;
  ctx.fillStyle = '#e03131';
  ctx.beginPath(); ctx.arc(0, 0, 11.5 * pulse, 0, Math.PI * 2); ctx.fill();
  if (charge > 0) {
    ctx.fillStyle = 'rgba(255,120,90,' + (0.25 + charge * 0.4) + ')';
    ctx.beginPath(); ctx.arc(0, 0, 11.5 * pulse + 5 + charge * 6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  // ビームの ため（ころがりに つられない ように がいそくで かく）
  if (charge > 0) {
    ctx.save();
    ctx.translate(0, -R - 2);
    ctx.globalAlpha = 0.35 + charge * 0.5;
    const bg = ctx.createLinearGradient(0, 0, 30 + charge * 30, 0);
    bg.addColorStop(0, 'rgba(255,80,60,0.95)');
    bg.addColorStop(1, 'rgba(255,180,120,0)');
    ctx.fillStyle = bg;
    const hh = 3 + charge * 6;
    ctx.fillRect(8, -hh / 2, 26 + charge * 34, hh);
    ctx.restore();
  }
}


/* ==================================================================
   てきキャラ
   ================================================================== */

/* ---- ほのた：まるい ひのたま ---- */
function drawHonota(ctx, s) {
  ctx.save();
  const fl = Math.sin(s.t * 12) * 2;
  const cy = -24 + Math.sin(s.t * 6) * 2;

  // ゆらめく ほのお
  ctx.fillStyle = 'rgba(255,152,0,0.5)';
  ctx.beginPath();
  ctx.moveTo(-15, cy + 6);
  ctx.quadraticCurveTo(-6, cy - 26 - fl, 2, cy - 8);
  ctx.quadraticCurveTo(8, cy - 30 + fl, 15, cy + 6);
  ctx.closePath(); ctx.fill();

  // ほんたい
  const g = ctx.createRadialGradient(-3, cy - 3, 2, 0, cy, 18);
  g.addColorStop(0, '#fff59d'); g.addColorStop(0.5, '#ffa726'); g.addColorStop(1, '#e64a19');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, cy, 16, 0, Math.PI * 2); ctx.fill();

  // め
  ctx.fillStyle = '#4e342e';
  ellipse(ctx, 4, cy - 3, 2.4, 3.2); ctx.fill();
  ellipse(ctx, 11, cy - 3, 2.4, 3.2); ctx.fill();
  // ぎざぎざの くち
  ctx.strokeStyle = '#4e342e'; ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(3, cy + 6); ctx.lineTo(6, cy + 9); ctx.lineTo(9, cy + 6); ctx.lineTo(12, cy + 9);
  ctx.stroke();

  ctx.restore();
}

/* ---- トゲハヤさん：しかくい はこがた ロボット ---- */
function drawTogehaya(ctx, s) {
  const step = Math.sin(s.t * 8) * (s.moving ? 1 : 0);
  ctx.save();

  // あし
  ctx.fillStyle = '#455a64';
  roundRect(ctx, -14, -12 + step, 10, 12, 2); ctx.fill();
  roundRect(ctx, 5, -12 - step, 10, 12, 2); ctx.fill();

  // トゲ（1ぽん だけ）
  ctx.fillStyle = '#b0bec5';
  ctx.beginPath();
  ctx.moveTo(-2, -50); ctx.lineTo(3, -74); ctx.lineTo(8, -50); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#546e7a'; ctx.lineWidth = 1.5; ctx.stroke();

  // ほんたい（しかく）
  const g = ctx.createLinearGradient(0, -52, 0, -10);
  g.addColorStop(0, '#cfd8dc'); g.addColorStop(1, '#78909c');
  ctx.fillStyle = g;
  roundRect(ctx, -20, -52, 40, 42, 6); ctx.fill();
  ctx.strokeStyle = '#37474f'; ctx.lineWidth = 2.5;
  roundRect(ctx, -20, -52, 40, 42, 6); ctx.stroke();

  // モニターの かお
  ctx.fillStyle = '#263238';
  roundRect(ctx, -14, -46, 28, 20, 4); ctx.fill();
  ctx.fillStyle = '#ff5252';
  ellipse(ctx, -4, -36, 3.4, 3.4); ctx.fill();
  ellipse(ctx, 6, -36, 3.4, 3.4); ctx.fill();
  ctx.strokeStyle = '#ff8a80'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(-6, -30); ctx.lineTo(8, -30); ctx.stroke();

  // ボタン
  ctx.fillStyle = '#ffb300';
  ctx.beginPath(); ctx.arc(-11, -18, 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#4caf50';
  ctx.beginPath(); ctx.arc(-2, -18, 2.6, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

/* ---- saba：あおい さかな。とっしんして くる ---- */
function drawSaba(ctx, s) {
  const wig = Math.sin(s.t * 16) * 4;          // すいすい およぐ うごき
  const dash = s.atk >= 0 ? s.atk * 10 : 0;    // とっしんの ため

  ctx.save();
  ctx.translate(dash, -34 + Math.sin(s.t * 5) * 3);

  // しっぽ（ふたまたの さかなの おびれ）
  ctx.fillStyle = '#1e88e5';
  ctx.beginPath();
  ctx.moveTo(-26, 0);
  ctx.lineTo(-52, -14 + wig);
  ctx.lineTo(-42, 0 + wig * 0.4);
  ctx.lineTo(-52, 14 + wig);
  ctx.closePath(); ctx.fill();

  // からだ（よこながの ひしがた）
  const g = ctx.createLinearGradient(0, -20, 0, 20);
  g.addColorStop(0, '#64b5f6');
  g.addColorStop(0.45, '#2196f3');
  g.addColorStop(1, '#1565c0');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-30, 0);
  ctx.lineTo(-4, -20);
  ctx.lineTo(26, -6);
  ctx.lineTo(26, 6);
  ctx.lineTo(-4, 20);
  ctx.closePath(); ctx.fill();

  // せびれ（こい あお の さんかく）
  ctx.fillStyle = '#0d47a1';
  ctx.beginPath();
  ctx.moveTo(-16, -2); ctx.lineTo(4, -16); ctx.lineTo(14, 4); ctx.closePath(); ctx.fill();

  // あかい くちさき（とっしんの さき）
  ctx.fillStyle = s.atk >= 0 ? '#ff1744' : '#e53935';
  ctx.beginPath();
  ctx.moveTo(24, -9); ctx.lineTo(48, 0); ctx.lineTo(24, 9); ctx.closePath(); ctx.fill();

  // め
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(16, -3, 4.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#0d1b2a';
  ctx.beginPath(); ctx.arc(17.5, -3, 2.4, 0, Math.PI * 2); ctx.fill();

  // すいせん（はやさの せん）
  if (s.moving) {
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const y = -12 + i * 12;
      const off = ((s.t * 120 + i * 30) % 40);
      ctx.beginPath();
      ctx.moveTo(-56 - off, y); ctx.lineTo(-40 - off, y); ctx.stroke();
    }
  }
  ctx.restore();
}

/* ---- 字一龍（じーりゅう）：みどりの りゅう。字を はく ---- */
function drawJiryu(ctx, s) {
  const step = Math.sin(s.t * 7) * (s.moving ? 1 : 0);
  ctx.save();

  const DARK = '#33691e', BODY = '#7cb342', LIGHT = '#aed581';

  // あし 4ほん（ほそくて さきが まるい）
  ctx.strokeStyle = DARK; ctx.lineWidth = 4; ctx.lineCap = 'round';
  const legs = [-32, -14, 10, 28];
  for (let i = 0; i < legs.length; i++) {
    const sw = step * (i % 2 ? 4 : -4);
    ctx.beginPath();
    ctx.moveTo(legs[i], -34);
    ctx.lineTo(legs[i] + sw, -12);
    ctx.stroke();
    ctx.fillStyle = BODY;
    ctx.beginPath(); ctx.arc(legs[i] + sw, -8, 7, 0, Math.PI * 2); ctx.fill();
  }

  // しっぽ（ギザギザの やじるし）
  ctx.fillStyle = BODY;
  ctx.beginPath();
  ctx.moveTo(-34, -52);
  ctx.lineTo(-62, -62);
  ctx.lineTo(-48, -46);
  ctx.lineTo(-66, -40);
  ctx.lineTo(-34, -32);
  ctx.closePath(); ctx.fill();

  // どうたい（よこながの いた）
  ctx.fillStyle = BODY;
  roundRect(ctx, -36, -52, 76, 22, 5); ctx.fill();
  ctx.fillStyle = LIGHT;
  roundRect(ctx, -30, -38, 62, 6, 3); ctx.fill();

  // くび
  ctx.fillStyle = BODY;
  ctx.beginPath();
  ctx.moveTo(24, -50); ctx.lineTo(34, -74); ctx.lineTo(50, -70); ctx.lineTo(42, -46);
  ctx.closePath(); ctx.fill();

  // あたま
  ctx.fillStyle = BODY;
  ctx.beginPath(); ctx.ellipse(48, -78, 20, 15, -0.12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = LIGHT;
  ctx.beginPath(); ctx.ellipse(46, -84, 14, 7, -0.12, 0, Math.PI * 2); ctx.fill();

  // め（にやりと わらった ほそめ）
  ctx.strokeStyle = '#1b5e20'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(48, -84); ctx.quadraticCurveTo(53, -88, 58, -84); ctx.stroke();
  ctx.fillStyle = '#1b5e20';
  ctx.beginPath(); ctx.arc(53, -85, 1.8, 0, Math.PI * 2); ctx.fill();

  // あいた くち（字を はく）
  const open = s.atk >= 0 ? 0.5 + s.atk * 0.9 : 0.5;
  ctx.fillStyle = '#2e7d32';
  ctx.beginPath();
  ctx.moveTo(56, -80);
  ctx.lineTo(80, -78 + 4 * open);
  ctx.lineTo(80, -66 + 10 * open);
  ctx.lineTo(56, -70);
  ctx.closePath(); ctx.fill();
  // した
  ctx.fillStyle = '#ef5350';
  ctx.beginPath();
  ctx.moveTo(62, -70);
  ctx.quadraticCurveTo(80, -66 + 8 * open, 90, -60 + 10 * open);
  ctx.quadraticCurveTo(78, -70 + 6 * open, 62, -74);
  ctx.closePath(); ctx.fill();
  // は
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(58 + i * 6, -78); ctx.lineTo(61 + i * 6, -73); ctx.lineTo(64 + i * 6, -78);
    ctx.closePath(); ctx.fill();
  }

  ctx.restore();
}

/* ==================================================================
   あき坊の塔の ざこてき
   ================================================================== */

/* ---- やきポックル：ちいさな こぶた。はないきで ひを ふく ---- */
function drawYakipokkuru(ctx, s) {
  const step = Math.sin(s.t * 12) * (s.moving ? 1.6 : 0);
  const puff = s.atk >= 0 ? s.atk : 0;
  ctx.save();
  ctx.translate(0, step * 0.6);

  // あし
  ctx.fillStyle = '#c47b7b';
  ctx.fillRect(-11, -10, 6, 10);
  ctx.fillRect(6, -10, 6, 10);

  // からだ（ももいろの こぶた）
  const g = ctx.createLinearGradient(0, -46, 0, -6);
  g.addColorStop(0, '#f7b7b7'); g.addColorStop(1, '#e08a8a');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(0, -26, 20, 19, 0, 0, Math.PI * 2); ctx.fill();

  // みみ
  ctx.fillStyle = '#e79a9a';
  ctx.beginPath(); ctx.moveTo(-12, -42); ctx.lineTo(-6, -54); ctx.lineTo(-2, -40); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(8, -42); ctx.lineTo(14, -54); ctx.lineTo(17, -40); ctx.closePath(); ctx.fill();

  // はな（ぶたばな）
  ctx.fillStyle = '#f4a2a2';
  ctx.beginPath(); ctx.ellipse(17, -24, 7, 5.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#b96a6a';
  ctx.beginPath(); ctx.arc(15.5, -24, 1.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(19.5, -24, 1.4, 0, Math.PI * 2); ctx.fill();

  // め（おこりぎみ）
  ctx.fillStyle = '#3b2020';
  ctx.beginPath(); ctx.ellipse(6, -33, 2.2, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(14, -33, 2.2, 3, 0, 0, Math.PI * 2); ctx.fill();

  // あたまの ちいさな ほのお
  for (let i = 0; i < 3; i++) {
    const a = s.t * 6 + i * 2.1;
    ctx.fillStyle = i % 2 ? 'rgba(255,193,7,0.75)' : 'rgba(255,112,67,0.7)';
    ctx.beginPath();
    ctx.arc(-4 + i * 5, -50 + Math.sin(a) * 4, 4.5 + Math.sin(a * 1.6) * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // はないき ファイア
  if (puff > 0) {
    const r = 4 + puff * 8;
    const fg = ctx.createRadialGradient(26, -24, 1, 26, -24, r);
    fg.addColorStop(0, '#fff59d'); fg.addColorStop(0.55, '#ffa726'); fg.addColorStop(1, 'rgba(255,87,34,0)');
    ctx.fillStyle = fg;
    ctx.beginPath(); ctx.arc(26, -24, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

/* ---- アイアン・コッコ：てつの ニワトリロボ ---- */
function drawIronkokko(ctx, s) {
  const step = Math.sin(s.t * 14) * (s.moving ? 1 : 0);
  ctx.save();

  // あし
  ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-8, -16); ctx.lineTo(-9 + step * 3, -1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(8, -16); ctx.lineTo(9 - step * 3, -1); ctx.stroke();

  // からだ（てつの たまご）
  const g = ctx.createLinearGradient(-20, -60, 20, -12);
  g.addColorStop(0, '#cfd8dc'); g.addColorStop(0.5, '#90a4ae'); g.addColorStop(1, '#546e7a');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(0, -36, 22, 24, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#37474f'; ctx.lineWidth = 2.4; ctx.stroke();
  // てっぱんの つぎめ
  ctx.strokeStyle = 'rgba(55,71,79,0.7)'; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(-18, -36); ctx.lineTo(18, -36); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-14, -50); ctx.lineTo(-14, -22); ctx.stroke();

  // せなかの ゼンマイ
  ctx.strokeStyle = '#b0bec5'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(-24, -44, 8, 0, Math.PI * 2); ctx.stroke();
  ctx.save();
  ctx.translate(-24, -44); ctx.rotate(s.moving ? s.t * 4 : 0);
  ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.stroke();
  ctx.restore();

  // あたま
  ctx.fillStyle = '#b0bec5';
  ctx.beginPath(); ctx.arc(9, -66, 15, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#37474f'; ctx.lineWidth = 2.2; ctx.stroke();
  // とさか
  ctx.fillStyle = '#e53935';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.arc(3 + i * 6, -80 - (i === 1 ? 4 : 0), 5, 0, Math.PI * 2); ctx.fill();
  }
  // くちばし
  ctx.fillStyle = '#fdd835';
  ctx.beginPath();
  ctx.moveTo(22, -68); ctx.lineTo(38, -63); ctx.lineTo(22, -58); ctx.closePath(); ctx.fill();
  // あかい め
  ctx.fillStyle = '#ff1744';
  ctx.beginPath(); ctx.arc(14, -70, 4.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,82,82,0.45)';
  ctx.beginPath(); ctx.arc(14, -70, 8, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

/* ---- ウサ・ゴリラ：マッチョな うさぎ。ニンジンで なぐる ---- */
function drawUsagorilla(ctx, s) {
  const step = Math.sin(s.t * 6) * (s.moving ? 1 : 0);
  const wind = s.atk >= 0 ? s.atk : -1;      // 0→1 で ふりあげ
  ctx.save();

  // あし
  ctx.fillStyle = '#efe4cf';
  ctx.beginPath(); ctx.ellipse(-13, -9, 9, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(13, -9, 9, 9, 0, 0, Math.PI * 2); ctx.fill();

  // からだ（きんにく）
  const g = ctx.createLinearGradient(0, -70, 0, -12);
  g.addColorStop(0, '#f7eedd'); g.addColorStop(1, '#e0d2b8');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-26, -66); ctx.quadraticCurveTo(-34, -36, -18, -14);
  ctx.lineTo(18, -14); ctx.quadraticCurveTo(34, -36, 26, -66);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#b9a888'; ctx.lineWidth = 2; ctx.stroke();
  // むねの すじ
  ctx.strokeStyle = '#c9b795'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, -60); ctx.lineTo(0, -30); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-16, -46); ctx.quadraticCurveTo(0, -40, 16, -46); ctx.stroke();

  // あたま
  ctx.fillStyle = '#f7eedd';
  ctx.beginPath(); ctx.ellipse(2, -80, 18, 16, 0, 0, Math.PI * 2); ctx.fill();
  // みみ
  ctx.fillStyle = '#f7eedd';
  ctx.beginPath(); ctx.ellipse(-6, -108, 6, 18, 0.12, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(9, -108, 6, 18, -0.12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f3c0c8';
  ctx.beginPath(); ctx.ellipse(-6, -108, 2.6, 12, 0.12, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(9, -108, 2.6, 12, -0.12, 0, Math.PI * 2); ctx.fill();
  // かお
  ctx.fillStyle = '#3b2f24';
  ctx.beginPath(); ctx.arc(-3, -82, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(9, -82, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f3a0ac';
  ctx.beginPath(); ctx.ellipse(-8, -76, 4, 2.6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(14, -76, 4, 2.6, 0, 0, Math.PI * 2); ctx.fill();

  // うで＋ニンジン（ふりかぶる）
  const a = (wind >= 0) ? (-2.4 + wind * 0.6) : -0.5;
  ctx.save();
  ctx.translate(22, -58);
  ctx.rotate(a);
  ctx.strokeStyle = '#efe4cf'; ctx.lineWidth = 13; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(22, 0); ctx.stroke();
  // ニンジン
  ctx.fillStyle = '#f57c00';
  ctx.beginPath();
  ctx.moveTo(24, -8); ctx.lineTo(56, 0); ctx.lineTo(24, 8); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#66bb6a';
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath(); ctx.ellipse(20, i * 5, 6, 2.6, i * 0.35, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  // タメて いる あいだの キラキラ
  if (wind > 0.3) {
    ctx.fillStyle = 'rgba(255,255,255,' + ((wind - 0.3) * 0.9).toFixed(2) + ')';
    for (let i = 0; i < 4; i++) {
      const an = s.t * 8 + i * 1.6;
      ctx.beginPath(); ctx.arc(-30 + i * 22, -96 + Math.sin(an) * 6, 2.6, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

/* ---- モーモー・プラント：くさを せおった うし ---- */
function drawMomoplant(ctx, s) {
  const step = Math.sin(s.t * 5) * (s.moving ? 1 : 0);
  ctx.save();

  // あし
  ctx.fillStyle = '#cfd8dc';
  ctx.fillRect(-16, -12, 7, 12);
  ctx.fillRect(9, -12, 7, 12);

  // からだ（しろい うし）
  const g = ctx.createLinearGradient(0, -50, 0, -8);
  g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#dfe6e9');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(0, -30, 24, 20, 0, 0, Math.PI * 2); ctx.fill();
  // くろい ぶち
  ctx.fillStyle = '#455a64';
  ctx.beginPath(); ctx.ellipse(-8, -34, 7, 5, 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(9, -24, 5, 4, -0.2, 0, Math.PI * 2); ctx.fill();

  // せなかの くさばな
  ctx.strokeStyle = '#66bb6a'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const bx = -12 + i * 11, sway = Math.sin(s.t * 2 + i) * 3;
    ctx.beginPath();
    ctx.moveTo(bx, -46); ctx.quadraticCurveTo(bx + sway, -58, bx + sway * 1.6, -66);
    ctx.stroke();
    ctx.fillStyle = ['#f48fb1', '#fff59d', '#ce93d8'][i];
    ctx.beginPath(); ctx.arc(bx + sway * 1.6, -68, 4.5, 0, Math.PI * 2); ctx.fill();
  }

  // あたま
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(20, -40, 15, 13, 0, 0, Math.PI * 2); ctx.fill();
  // つの
  ctx.fillStyle = '#bcaaa4';
  ctx.beginPath(); ctx.moveTo(12, -52); ctx.lineTo(9, -62); ctx.lineTo(17, -54); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(27, -52); ctx.lineTo(31, -62); ctx.lineTo(23, -54); ctx.closePath(); ctx.fill();
  // はな
  ctx.fillStyle = '#f8bbd0';
  ctx.beginPath(); ctx.ellipse(31, -36, 7, 5.5, 0, 0, Math.PI * 2); ctx.fill();
  // め（にこにこ）
  ctx.strokeStyle = '#37474f'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(17, -45, 3.5, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  ctx.beginPath(); ctx.arc(27, -45, 3.5, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();

  // かいふくの ひかり
  const glow = (Math.sin(s.t * 2.2) + 1) / 2;
  ctx.fillStyle = 'rgba(102,187,106,' + (0.10 + glow * 0.14).toFixed(2) + ')';
  ctx.beginPath(); ctx.arc(0, -34, 42 + glow * 6, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

/* ---- モコ魔道士：かんむりを かぶった ひつじの まほうつかい ---- */
function drawMokomadoushi(ctx, s) {
  const float = Math.sin(s.t * 2.4) * 3;
  const charge = s.atk >= 0 ? s.atk : 0;
  ctx.save();
  ctx.translate(0, float);

  // あし
  ctx.strokeStyle = '#8e6aa8'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-9, -22); ctx.lineTo(-10, -2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(9, -22); ctx.lineTo(10, -2); ctx.stroke();

  // まほうの ひかり（うしろ）
  ctx.fillStyle = 'rgba(206,147,216,0.35)';
  ctx.beginPath(); ctx.arc(0, -48, 34, 0, Math.PI * 2); ctx.fill();

  // からだ（もこもこの け）
  ctx.fillStyle = '#f4c9e8';
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 20, -48 + Math.sin(a) * 17, 12, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#fbe0f2';
  ctx.beginPath(); ctx.ellipse(0, -48, 20, 17, 0, 0, Math.PI * 2); ctx.fill();

  // かお
  ctx.fillStyle = '#f6ddc9';
  ctx.beginPath(); ctx.ellipse(11, -52, 12, 13, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#4a3a55';
  ctx.beginPath(); ctx.ellipse(8, -55, 2, 3.2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(17, -55, 2, 3.2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#4a3a55'; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(5, -61); ctx.lineTo(11, -59); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(20, -61); ctx.lineTo(15, -59); ctx.stroke();
  // たれみみ
  ctx.fillStyle = '#e8c4b0';
  ctx.beginPath(); ctx.ellipse(1, -52, 6, 3.4, 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(22, -50, 6, 3.4, -0.4, 0, Math.PI * 2); ctx.fill();

  // かんむり
  ctx.fillStyle = '#7b3fa0';
  ctx.beginPath();
  ctx.moveTo(-6, -70); ctx.lineTo(-9, -88); ctx.lineTo(0, -79);
  ctx.lineTo(7, -92); ctx.lineTo(14, -79); ctx.lineTo(22, -88); ctx.lineTo(20, -70);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffd54f';
  ctx.beginPath(); ctx.arc(7, -92, 3.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(-9, -88, 2.6, 0, Math.PI * 2); ctx.fill();

  // つえ（おおきな えんぴつ）
  ctx.save();
  ctx.translate(20, -44);
  ctx.rotate(-0.5 - charge * 0.35);
  ctx.fillStyle = '#c69664';
  ctx.fillRect(-6, -4, 44, 9);
  ctx.fillStyle = '#f6d9a8';
  ctx.beginPath(); ctx.moveTo(38, -5); ctx.lineTo(54, 0); ctx.lineTo(38, 5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#5d4037';
  ctx.beginPath(); ctx.moveTo(50, -1.6); ctx.lineTo(54, 0); ctx.lineTo(50, 1.6); ctx.closePath(); ctx.fill();
  if (charge > 0) {
    const r = 5 + charge * 10;
    const gg = ctx.createRadialGradient(56, 0, 1, 56, 0, r);
    gg.addColorStop(0, '#ffffff'); gg.addColorStop(0.5, '#e1a8ef'); gg.addColorStop(1, 'rgba(186,104,200,0)');
    ctx.fillStyle = gg;
    ctx.beginPath(); ctx.arc(56, 0, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  ctx.restore();
}


/* ---- バケッチン：みずを なみなみ もった バケツの おばけ ---- */
function drawBakecchin(ctx, s) {
  const hop = Math.abs(Math.sin(s.t * 7)) * (s.moving ? 7 : 1);
  const splash = s.atk >= 0 ? s.atk : 0;
  ctx.save();
  ctx.translate(0, -hop);

  // とって
  ctx.strokeStyle = '#9e9e9e'; ctx.lineWidth = 3.4;
  ctx.beginPath(); ctx.arc(0, -52, 20, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();

  // バケツ（ブリキ）
  const g = ctx.createLinearGradient(-24, 0, 24, 0);
  g.addColorStop(0, '#9fb4c2'); g.addColorStop(0.4, '#dbe6ee'); g.addColorStop(1, '#8fa5b4');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-24, -52); ctx.lineTo(24, -52); ctx.lineTo(18, -2); ctx.lineTo(-18, -2);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#607d8b'; ctx.lineWidth = 2.2; ctx.stroke();
  // よこの おび
  ctx.beginPath(); ctx.moveTo(-22, -38); ctx.lineTo(22, -38); ctx.stroke();

  // なかの みず
  ctx.fillStyle = 'rgba(79,195,247,0.9)';
  ctx.beginPath();
  ctx.moveTo(-23, -48);
  for (let x = -23; x <= 23; x += 4) ctx.lineTo(x, -48 + Math.sin(x * 0.35 + s.t * 6) * 2.5);
  ctx.lineTo(23, -48); ctx.lineTo(18, -4); ctx.lineTo(-18, -4);
  ctx.closePath(); ctx.fill();

  // おばけの かお（みずに うかぶ）
  ctx.fillStyle = '#0d3b52';
  ctx.beginPath(); ctx.ellipse(-6, -32, 3.4, 4.6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(7, -32, 3.4, 4.6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#0d3b52'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(1, -22, 5, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();

  // こぼれる みず
  for (let i = 0; i < 3; i++) {
    const a = s.t * 5 + i * 2;
    ctx.fillStyle = 'rgba(129,212,250,' + (0.5 + Math.sin(a) * 0.3).toFixed(2) + ')';
    ctx.beginPath();
    ctx.ellipse(-26 - i * 6, -20 + Math.sin(a) * 8, 3.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // ばしゃばしゃ スプラッシュ
  if (splash > 0) {
    ctx.fillStyle = 'rgba(79,195,247,' + (0.4 + splash * 0.5) + ')';
    for (let i = 0; i < 5; i++) {
      const r = 4 + splash * 6;
      ctx.beginPath();
      ctx.arc(28 + i * 7, -30 + Math.sin(i * 1.7 + s.t * 12) * 10, r * (1 - i * 0.13), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/* ---- ブロック・ワン：しかくい ブロックの いぬ ---- */
function drawBlockwan(ctx, s) {
  const slide = Math.sin(s.t * 6) * (s.moving ? 1.4 : 0);
  ctx.save();
  ctx.translate(slide, 0);

  const O = '#d9762f', O2 = '#b85c1e', L = '#f0a468';

  // あし（4ほんの しかく）
  ctx.fillStyle = O2;
  ctx.fillRect(-26, -14, 11, 14);
  ctx.fillRect(-8, -14, 11, 14);
  ctx.fillRect(9, -14, 11, 14);
  ctx.fillRect(24, -14, 11, 14);

  // どうたい（おおきな ブロック）
  ctx.fillStyle = O;
  ctx.fillRect(-30, -58, 62, 46);
  ctx.fillStyle = L;
  ctx.fillRect(-30, -58, 62, 9);
  ctx.strokeStyle = O2; ctx.lineWidth = 2;
  ctx.strokeRect(-30, -58, 62, 46);
  // ブロックの ぽっち
  ctx.fillStyle = L;
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(-22 + i * 20, -66, 13, 9);
  }

  // あたま（しかく）
  ctx.fillStyle = O;
  ctx.fillRect(18, -86, 40, 34);
  ctx.strokeStyle = O2; ctx.lineWidth = 2;
  ctx.strokeRect(18, -86, 40, 34);
  // みみ（しかく）
  ctx.fillStyle = O2;
  ctx.fillRect(20, -100, 12, 15);
  ctx.fillRect(44, -100, 12, 15);
  // はな
  ctx.fillStyle = '#3e2a20';
  ctx.fillRect(50, -66, 12, 9);
  // め
  ctx.fillStyle = '#2b1a12';
  ctx.fillRect(30, -78, 6, 7);
  ctx.fillRect(44, -78, 6, 7);
  // くび わ
  ctx.fillStyle = '#e53935';
  ctx.fillRect(14, -58, 8, 20);

  // しっぽ（しかく）
  ctx.fillStyle = O;
  ctx.fillRect(-40, -50, 12, 11);

  ctx.restore();
}

/* ---- ニョロリ〜ヌ：うどんの ヘビ ---- */
function drawNyororiinu(ctx, s) {
  ctx.save();
  const wave = s.t * 9;
  const Y = '#f2d98c', Y2 = '#d9b95e';

  // からだ（くねくね）
  ctx.strokeStyle = Y; ctx.lineWidth = 13; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i <= 10; i++) {
    const x = -46 + i * 8;
    const y = -16 + Math.sin(wave + i * 0.8) * 9;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.strokeStyle = Y2; ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i <= 10; i++) {
    const x = -46 + i * 8;
    const y = -12 + Math.sin(wave + i * 0.8) * 9;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // あたま
  const hy = -16 + Math.sin(wave + 8 * 0.8) * 9;
  ctx.fillStyle = Y;
  ctx.beginPath(); ctx.ellipse(40, hy - 8, 15, 12, -0.2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = Y2; ctx.lineWidth = 2; ctx.stroke();
  // め
  ctx.fillStyle = '#3b2f16';
  ctx.beginPath(); ctx.arc(44, hy - 12, 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(37, hy - 13, 2.4, 0, Math.PI * 2); ctx.fill();
  // した
  ctx.strokeStyle = '#e57373'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(53, hy - 5); ctx.lineTo(62, hy - 3); ctx.stroke();

  ctx.restore();
}

/* ---- おじい農園長：むぎわらぼうしの のうか ---- */
function drawOjiinouenchou(ctx, s) {
  const step = Math.sin(s.t * 4) * (s.moving ? 1 : 0);
  const throwing = s.atk >= 0 ? s.atk : -1;
  ctx.save();

  // あし
  ctx.fillStyle = '#6d5b45';
  ctx.fillRect(-14, -18, 11, 18);
  ctx.fillRect(4, -18, 11, 18);
  ctx.fillStyle = '#4e3b2a';
  ctx.fillRect(-17, -6 + step, 16, 6);
  ctx.fillRect(2, -6 - step, 16, 6);

  // からだ（オーバーオール）
  ctx.fillStyle = '#cbb185';
  ctx.beginPath();
  ctx.moveTo(-22, -72); ctx.quadraticCurveTo(-30, -40, -20, -16);
  ctx.lineTo(20, -16); ctx.quadraticCurveTo(30, -40, 22, -72);
  ctx.closePath(); ctx.fill();
  // あかい チェックの シャツ（かた）
  ctx.fillStyle = '#c94a3d';
  ctx.fillRect(-24, -78, 48, 20);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.6;
  for (let i = -20; i < 24; i += 9) { ctx.beginPath(); ctx.moveTo(i, -78); ctx.lineTo(i, -58); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(-24, -68); ctx.lineTo(24, -68); ctx.stroke();
  // オーバーオールの かたひも
  ctx.fillStyle = '#cbb185';
  ctx.fillRect(-14, -78, 7, 22);
  ctx.fillRect(7, -78, 7, 22);

  // かお
  ctx.fillStyle = '#e8bd93';
  ctx.beginPath(); ctx.arc(2, -92, 15, 0, Math.PI * 2); ctx.fill();
  // ひげ
  ctx.fillStyle = '#4a3a2c';
  ctx.beginPath(); ctx.arc(2, -86, 13, 0, Math.PI); ctx.fill();
  ctx.fillRect(-6, -92, 16, 4);
  // め
  ctx.fillStyle = '#2b1a12';
  ctx.beginPath(); ctx.arc(-2, -96, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(7, -96, 2, 0, Math.PI * 2); ctx.fill();
  // むぎわらぼうし
  ctx.fillStyle = '#e3b856';
  ctx.beginPath(); ctx.ellipse(2, -104, 28, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(2, -112, 14, 11, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#b8913a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(2, -106, 14, 5, 0, 0, Math.PI * 2); ctx.stroke();

  // うで＋トマト
  const a = (throwing >= 0) ? (-2.2 + throwing * 1.9) : -0.3;
  ctx.save();
  ctx.translate(20, -66);
  ctx.rotate(a);
  ctx.strokeStyle = '#e8bd93'; ctx.lineWidth = 8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(18, 0); ctx.stroke();
  ctx.fillStyle = '#e53935';
  ctx.beginPath(); ctx.arc(23, 0, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#66bb6a';
  ctx.beginPath(); ctx.arc(23, -6, 3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // かご
  ctx.strokeStyle = '#a1743c'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(-24, -34, 10, 0, Math.PI); ctx.stroke();

  ctx.restore();
}

/* ---- クマべぇ：もふもふの クマ ---- */
function drawKumabee(ctx, s) {
  const step = Math.sin(s.t * 4.5) * (s.moving ? 1 : 0);
  const swipe = s.atk >= 0 ? s.atk : -1;
  ctx.save();

  const B = '#8a5c37', B2 = '#6d4527', L = '#c99a6a';

  // あし
  ctx.fillStyle = B2;
  ctx.beginPath(); ctx.ellipse(-13, -12 + step * 2, 12, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(13, -12 - step * 2, 12, 12, 0, 0, Math.PI * 2); ctx.fill();

  // からだ
  ctx.fillStyle = B;
  ctx.beginPath(); ctx.ellipse(0, -48, 26, 30, 0, 0, Math.PI * 2); ctx.fill();
  // おなか（エプロン）
  ctx.fillStyle = '#e0cba8';
  ctx.beginPath(); ctx.ellipse(2, -40, 16, 20, 0, 0, Math.PI * 2); ctx.fill();

  // あたま
  ctx.fillStyle = B;
  ctx.beginPath(); ctx.ellipse(6, -88, 21, 19, 0, 0, Math.PI * 2); ctx.fill();
  // みみ
  ctx.beginPath(); ctx.arc(-8, -104, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(20, -104, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = L;
  ctx.beginPath(); ctx.arc(-8, -104, 4.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(20, -104, 4.2, 0, Math.PI * 2); ctx.fill();
  // はなさき
  ctx.fillStyle = L;
  ctx.beginPath(); ctx.ellipse(16, -82, 12, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2f1d10';
  ctx.beginPath(); ctx.ellipse(21, -85, 4.6, 3.4, 0, 0, Math.PI * 2); ctx.fill();
  // め
  ctx.beginPath(); ctx.arc(2, -92, 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(13, -93, 2.6, 0, Math.PI * 2); ctx.fill();
  // くち（あくび）
  ctx.strokeStyle = '#2f1d10'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(16, -76, 5, 0, Math.PI); ctx.stroke();

  // まえあし（ひっかき）
  const a = (swipe >= 0) ? (-1.4 + swipe * 2.2) : -0.2;
  ctx.save();
  ctx.translate(22, -52);
  ctx.rotate(a);
  ctx.strokeStyle = B; ctx.lineWidth = 12; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(20, 0); ctx.stroke();
  ctx.strokeStyle = '#fff8e1'; ctx.lineWidth = 2.4;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath(); ctx.moveTo(22, i * 4); ctx.lineTo(31, i * 6); ctx.stroke();
  }
  ctx.restore();

  ctx.restore();
}

/* ---- カモメェル：そらを とぶ カモメ ---- */
function drawKamomeeru(ctx, s) {
  const flap = Math.sin(s.t * 14);
  const dive = s.atk >= 0 ? s.atk : 0;
  ctx.save();
  ctx.translate(0, -20 + Math.sin(s.t * 3) * 4 + dive * 14);
  ctx.rotate(dive * 0.5);

  // つばさ（うしろ）
  ctx.fillStyle = '#b0bec5';
  ctx.beginPath();
  ctx.moveTo(-6, -34);
  ctx.quadraticCurveTo(-34, -46 - flap * 14, -40, -22 - flap * 8);
  ctx.quadraticCurveTo(-24, -26, -6, -26);
  ctx.closePath(); ctx.fill();

  // からだ
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(0, -30, 22, 14, -0.12, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#cfd8dc'; ctx.lineWidth = 1.6; ctx.stroke();

  // つばさ（まえ）
  ctx.fillStyle = '#eceff1';
  ctx.beginPath();
  ctx.moveTo(-2, -34);
  ctx.quadraticCurveTo(-22, -50 + flap * 16, -30, -30 + flap * 10);
  ctx.quadraticCurveTo(-14, -30, -2, -28);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#b0bec5'; ctx.lineWidth = 1.4; ctx.stroke();

  // あたま
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(19, -40, 11, 0, Math.PI * 2); ctx.fill();
  // くちばし
  ctx.fillStyle = '#ffb300';
  ctx.beginPath();
  ctx.moveTo(28, -42); ctx.lineTo(44, -38); ctx.lineTo(28, -35); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e53935';
  ctx.beginPath(); ctx.arc(31, -38, 1.8, 0, Math.PI * 2); ctx.fill();
  // め
  ctx.fillStyle = '#263238';
  ctx.beginPath(); ctx.arc(22, -43, 2.4, 0, Math.PI * 2); ctx.fill();

  // あし
  ctx.strokeStyle = '#ffa726'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(2, -18); ctx.lineTo(4, -8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(10, -18); ctx.lineTo(12, -8); ctx.stroke();

  ctx.restore();
}

/* ---- スティーブ：つちブロックの うえから ひの やを うつ ----
   マイクラの ゆみに あわせて、ひきしぼりを 3だんかいで あらわします。
   0だんかい → 1だんかい → 2だんかい（フルチャージ／1びょう）          */
function drawSteve(ctx, s) {
  const draw = (s.atk >= 0) ? s.atk : -1;          // 0→1 で ひきしぼり
  const fired = !!s.fired;                          // うった ちょくご（バタバタ）

  /* マイクラの ゆみは 3だんかい。なめらかでは なく カクッと かわります */
  let stage = -1;
  if (draw >= 0) stage = (draw < 0.33) ? 0 : (draw < 0.75) ? 1 : 2;
  const pullBy = [3, 8, 14];                        // つるを ひく ながさ
  const pull   = (stage >= 0) ? pullBy[stage] : 0;
  const bend   = (stage >= 0) ? [0.50, 0.58, 0.68][stage] : 0.45;   // ゆみの しなり

  /* フルチャージは からだが すこし ふるえる（マイクラの がめんゆれ）*/
  const shake = (stage === 2) ? Math.sin(s.t * 34) * 2.2 : 0;
  /* うった ちょくごは おちそうで バタバタ */
  const flail = fired ? Math.sin(s.t * 22) : Math.sin(s.t * 2) * 0.25;

  ctx.save();

  /* --- つちブロック 3だん --- */
  const BW = 34, BH = 24;
  for (let i = 0; i < 3; i++) {
    const by = -BH * (i + 1);
    ctx.fillStyle = '#7b5230';
    ctx.fillRect(-BW / 2, by, BW, BH);
    ctx.fillStyle = '#6b452a';
    for (let k = 0; k < 5; k++) {
      ctx.fillRect(-BW / 2 + (k * 7 + (i % 2) * 3) % (BW - 5), by + 4 + (k % 3) * 6, 4, 4);
    }
    if (i === 2) {
      ctx.fillStyle = '#5d9c3c';
      ctx.fillRect(-BW / 2, by, BW, 7);
      ctx.fillStyle = '#4c8531';
      for (let k = 0; k < 4; k++) ctx.fillRect(-BW / 2 + 3 + k * 8, by + 1, 4, 4);
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 1.4;
    ctx.strokeRect(-BW / 2, by, BW, BH);
  }

  /* --- スティーブ本体 --- */
  ctx.save();
  ctx.translate(shake * 0.5 + flail * 1.2, -72);
  ctx.rotate(fired ? flail * 0.05 : 0);

  const SKIN = '#c58c58', SHIRT = '#26c6c6', PANTS = '#3f47a8', SHOE = '#4a4a4a', HAIR = '#3f2b1c';

  // あし（ブロックの ふちに つまさきだち）
  ctx.fillStyle = PANTS;
  ctx.fillRect(-11, -22, 10, 22);
  ctx.fillRect(2, -22, 10, 22);
  ctx.fillStyle = SHOE;
  ctx.fillRect(-11, -5, 10, 5);
  ctx.fillRect(2, -5, 10, 5);

  // からだ
  ctx.fillStyle = SHIRT;
  ctx.fillRect(-13, -50, 26, 28);

  /* --- うしろの うで ---
     ゆみを ひいて いる ときは つるを ひく。
     うった あとは おちそうで バタバタ させる          */
  ctx.save();
  ctx.translate(-11, -46);
  if (stage >= 0) ctx.rotate(-1.15 + pull * 0.02);
  else            ctx.rotate(fired ? (-2.3 + flail * 0.9) : (-0.15 + flail));
  ctx.fillStyle = SHIRT; ctx.fillRect(0, -5, 18, 10);
  ctx.fillStyle = SKIN;  ctx.fillRect(16, -5, 8, 10);
  ctx.restore();

  /* --- まえの うで：ゆみを まっすぐ かまえる（マイクラの さんにんしょう）--- */
  ctx.save();
  ctx.translate(11, -46);
  if (stage >= 0) ctx.rotate(-0.05);
  else            ctx.rotate(fired ? (-2.0 - flail * 0.9) : (0.12 - flail));
  ctx.fillStyle = SHIRT; ctx.fillRect(0, -5, 18, 10);
  ctx.fillStyle = SKIN;  ctx.fillRect(16, -5, 8, 10);
  ctx.restore();

  // あたま
  ctx.fillStyle = SKIN;
  ctx.fillRect(-13, -76, 26, 26);
  ctx.fillStyle = HAIR;
  ctx.fillRect(-13, -78, 26, 10);
  ctx.fillRect(-13, -78, 5, 22);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, -68, 6, 5); ctx.fillRect(9, -68, 6, 5);
  ctx.fillStyle = '#5b4fd6'; ctx.fillRect(3, -68, 3, 5); ctx.fillRect(12, -68, 3, 5);
  ctx.fillStyle = HAIR; ctx.fillRect(1, -60, 11, 3);

  /* --- ゆみ（ひきしぼると しなる）--- */
  if (!fired || stage >= 0) {
    ctx.save();
    ctx.translate(33, -46);
    ctx.strokeStyle = '#8d6e3a'; ctx.lineWidth = 3.6; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, 18, -Math.PI * bend, Math.PI * bend);
    ctx.stroke();
    // つる（3だんかいで カクッと ひける）
    const ax = Math.cos(-Math.PI * bend) * 18, ay = Math.sin(-Math.PI * bend) * 18;
    const bx = Math.cos(Math.PI * bend) * 18,  by2 = Math.sin(Math.PI * bend) * 18;
    ctx.strokeStyle = '#efe7d6'; ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(ax, ay); ctx.lineTo(-pull, 0); ctx.lineTo(bx, by2);
    ctx.stroke();

    // ひの や
    if (stage >= 0) {
      ctx.strokeStyle = '#7b5230'; ctx.lineWidth = 2.8;
      ctx.beginPath(); ctx.moveTo(-pull, 0); ctx.lineTo(15, 0); ctx.stroke();
      ctx.fillStyle = '#cfd8dc';
      ctx.beginPath(); ctx.moveTo(23, 0); ctx.lineTo(14, -5); ctx.lineTo(14, 5); ctx.closePath(); ctx.fill();
      const r = 6 + stage * 5;
      const fg = ctx.createRadialGradient(20, 0, 1, 20, 0, r);
      fg.addColorStop(0, '#fff59d'); fg.addColorStop(0.5, '#ff9800'); fg.addColorStop(1, 'rgba(255,87,34,0)');
      ctx.fillStyle = fg;
      ctx.beginPath(); ctx.arc(20, 0, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  /* --- フルチャージの キラキラ（マイクラの エンチャントの ように）--- */
  if (stage === 2) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 4; i++) {
      const an = s.t * 9 + i * 1.57;
      ctx.beginPath();
      ctx.arc(34 + Math.cos(an) * 22, -46 + Math.sin(an) * 16, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
  ctx.restore();
}



/* ---- フタバッポ：うえきばちの ふたば。みずを すいとって げんきに なる ---- */
function drawFutabappo(ctx, s) {
  const step  = Math.sin(s.t * 8) * (s.moving ? 1 : 0);      // ピョコピョコ
  const hop   = Math.abs(step) * (s.moving ? 3.5 : 0);
  const sway  = Math.sin(s.t * 2.6) * 2.2;                   // はっぱが そよぐ
  /* あたまで ポカポカ：ためて → まえに つきだす */
  const a = s.atk;
  const lunge = (a >= 0) ? (a < 0.6 ? -a * 9 : (a - 0.6) * 42) : 0;

  ctx.save();
  ctx.translate(lunge, -hop);

  /* --- うえきばち（すやきの さかさ だいけい）--- */
  const pg = ctx.createLinearGradient(-20, -46, 22, -6);
  pg.addColorStop(0, '#e08a5a');
  pg.addColorStop(0.55, '#c96f42');
  pg.addColorStop(1, '#a95733');
  ctx.fillStyle = pg;
  ctx.beginPath();
  ctx.moveTo(-19, -40);
  ctx.lineTo(19, -40);
  ctx.lineTo(14, 0);
  ctx.lineTo(-14, 0);
  ctx.closePath();
  ctx.fill();

  /* はちの ふち */
  ctx.fillStyle = '#eb9a68';
  roundRect(ctx, -22, -50, 44, 11, 4);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,60,30,.35)'; ctx.lineWidth = 1.4;
  roundRect(ctx, -22, -50, 44, 11, 4);
  ctx.stroke();

  /* つち */
  ctx.fillStyle = '#5d4033';
  roundRect(ctx, -18, -48, 36, 6, 3);
  ctx.fill();

  /* --- くき --- */
  ctx.strokeStyle = '#7cb342'; ctx.lineWidth = 5.5; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -44);
  ctx.quadraticCurveTo(sway * 0.5, -66, sway, -84);
  ctx.stroke();

  /* --- ふたば（2まい。それぞれ かおが ある）--- */
  for (let i = 0; i < 2; i++) {
    const dir = i === 0 ? -1 : 1;                 // -1=うしろ / 1=まえ
    const flap = Math.sin(s.t * 5 + i * 1.4) * 0.16 + (a >= 0 ? 0.2 : 0);
    ctx.save();
    ctx.translate(sway, -84);
    ctx.rotate(dir * (0.55 + flap));

    const lg = ctx.createLinearGradient(0, -14, dir * 30, 6);
    lg.addColorStop(0, '#aed581');
    lg.addColorStop(1, '#7cb342');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(dir * 16, -16, dir * 30, -2);
    ctx.quadraticCurveTo(dir * 16, 12, 0, 0);
    ctx.closePath();
    ctx.fill();

    /* はっぱの すじ */
    ctx.strokeStyle = 'rgba(60,110,30,.45)'; ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(dir * 4, -1); ctx.lineTo(dir * 25, -2);
    ctx.stroke();

    /* かお（ちいさい ドットの め ＋ にっこり）*/
    ctx.save();
    ctx.rotate(-dir * (0.55 + flap));           // かおは まっすぐ
    const fx = dir * 16, fy = -2;
    ctx.fillStyle = '#33691e';
    ctx.beginPath(); ctx.arc(fx - 4, fy - 2, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(fx + 4, fy - 2, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#33691e'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(fx, fy + 1, 2.6, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,138,128,.55)';
    ctx.beginPath(); ctx.arc(fx - 7, fy + 2, 2.0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(fx + 7, fy + 2, 2.0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  /* --- はちの かお（メインの ひょうじょう）--- */
  ctx.fillStyle = '#3e2723';
  ctx.beginPath(); ctx.arc(-6, -26, 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(7, -26, 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#3e2723'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
  ctx.beginPath();
  if (a >= 0) { ctx.arc(0.5, -20, 4, Math.PI * 1.15, Math.PI * 1.85); }   // こうげきちゅうは「＞＜」ぐち
  else        { ctx.arc(0.5, -22, 4, 0.25, Math.PI - 0.25); }
  ctx.stroke();

  ctx.restore();
}


/* ---- シャドウヤマネコ：みみに ふさげ。するどい ツメで れんぞく スラッシュ ---- */
function drawShadowyamaneko(ctx, s) {
  const run  = Math.sin(s.t * 14) * (s.moving ? 1 : 0);      // はやあし
  const bob  = Math.abs(run) * (s.moving ? 2.4 : 0);
  const a    = s.atk;
  /* ツメ：ためて → はやく ふりぬく */
  const slash = (a >= 0) ? (a < 0.45 ? -0.7 * (a / 0.45) : (a - 0.45) / 0.55 * 2.2 - 0.7) : -0.2;

  const FUR  = '#6d5a4e';       // かげいろの けなみ
  const FUR2 = '#8d7563';
  const BELLY= '#d7c6b4';
  const DARK = '#2b2320';

  ctx.save();
  ctx.translate(0, -bob);

  /* --- しっぽ（みじかい ボブテイル）--- */
  ctx.strokeStyle = FUR; ctx.lineWidth = 9; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-22, -44);
  ctx.quadraticCurveTo(-36, -52 + Math.sin(s.t * 6) * 5, -34, -66);
  ctx.stroke();
  ctx.strokeStyle = DARK; ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-35, -62); ctx.lineTo(-34, -66);
  ctx.stroke();

  /* --- うしろあし --- */
  ctx.fillStyle = FUR;
  roundRect(ctx, -20 - run * 3, -22, 14, 22, 6); ctx.fill();

  /* --- どうたい --- */
  const bg = ctx.createLinearGradient(0, -62, 0, -6);
  bg.addColorStop(0, FUR2);
  bg.addColorStop(1, FUR);
  ctx.fillStyle = bg;
  ellipse(ctx, -3, -34, 22, 26); ctx.fill();
  ctx.fillStyle = BELLY;
  ellipse(ctx, 4, -28, 13, 17); ctx.fill();

  /* ぶちもよう */
  ctx.fillStyle = 'rgba(43,35,32,.42)';
  const spots = [[-14, -50], [-6, -44], [-16, -34], [-9, -26], [-19, -22]];
  for (const p of spots) { ctx.beginPath(); ctx.arc(p[0], p[1], 2.6, 0, Math.PI * 2); ctx.fill(); }

  /* --- まえあし（おおきい にくきゅう）--- */
  ctx.fillStyle = FUR2;
  roundRect(ctx, 2 + run * 3, -20, 14, 20, 7); ctx.fill();
  ctx.fillStyle = '#4e4038';
  ellipse(ctx, 9 + run * 3, -3, 5.5, 3); ctx.fill();

  /* --- あたま --- */
  ctx.save();
  ctx.translate(6, -70);

  /* みみ ＋ ふさげ */
  for (let i = 0; i < 2; i++) {
    const ex = i === 0 ? -13 : 9;
    ctx.fillStyle = FUR2;
    ctx.beginPath();
    ctx.moveTo(ex, -4); ctx.lineTo(ex + 5, -20); ctx.lineTo(ex + 12, -4);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c98f88';
    ctx.beginPath();
    ctx.moveTo(ex + 3, -6); ctx.lineTo(ex + 5.5, -15); ctx.lineTo(ex + 8.5, -6);
    ctx.closePath(); ctx.fill();
    // ふさげ（リンクスの みみの さき）
    ctx.strokeStyle = DARK; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ex + 5, -19);
    ctx.lineTo(ex + 5 + Math.sin(s.t * 4 + i) * 2, -30);
    ctx.stroke();
  }

  /* かおの まる */
  const hg = ctx.createLinearGradient(0, -18, 0, 14);
  hg.addColorStop(0, FUR2);
  hg.addColorStop(1, FUR);
  ctx.fillStyle = hg;
  ellipse(ctx, 0, 0, 19, 17); ctx.fill();
  ctx.fillStyle = BELLY;
  ellipse(ctx, 3, 5, 11, 9); ctx.fill();

  /* ほおの けなみ */
  ctx.strokeStyle = FUR2; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-15, -4 + i * 6); ctx.lineTo(-22, -7 + i * 7);
    ctx.stroke();
  }

  /* おおきい め（あおい）*/
  for (let i = 0; i < 2; i++) {
    const ex = i === 0 ? -5 : 9;
    ctx.fillStyle = '#ffffff';
    ellipse(ctx, ex, -2, 5.4, 6.2); ctx.fill();
    ctx.fillStyle = '#29b6f6';
    ellipse(ctx, ex + 0.6, -2, 4.0, 4.8); ctx.fill();
    ctx.fillStyle = DARK;
    // こうげきちゅうは ひとみが ほそく なる（ロックオン）
    ellipse(ctx, ex + 0.8, -2, (a >= 0 ? 1.2 : 2.2), 4.4); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(ex - 1.4, -4.4, 1.5, 0, Math.PI * 2); ctx.fill();
  }

  /* はな と くち */
  ctx.fillStyle = '#e57373';
  ctx.beginPath();
  ctx.moveTo(4, 5); ctx.lineTo(9, 5); ctx.lineTo(6.5, 8); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = DARK; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(6.5, 8); ctx.lineTo(6.5, 10);
  ctx.arc(3.6, 10, 2.9, 0, Math.PI * 0.9);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(6.5, 10); ctx.arc(9.4, 10, 2.9, Math.PI * 0.1, Math.PI);
  ctx.stroke();

  /* ひげ */
  ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.1;
  for (let i = 0; i < 2; i++) {
    ctx.beginPath(); ctx.moveTo(12, 3 + i * 4); ctx.lineTo(26, 0 + i * 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-2, 4 + i * 4); ctx.lineTo(-15, 3 + i * 7); ctx.stroke();
  }
  ctx.restore();

  /* --- こうげきの ツメ --- */
  if (a >= 0) {
    ctx.save();
    ctx.translate(16, -46);
    ctx.rotate(slash);
    /* ツメの て */
    ctx.fillStyle = FUR2;
    roundRect(ctx, 0, -7, 16, 14, 6); ctx.fill();
    ctx.strokeStyle = '#fffde7'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(14, -5 + i * 5); ctx.lineTo(23, -7 + i * 6);
      ctx.stroke();
    }
    ctx.restore();

    /* きりさきの あと（ふりぬいた あと だけ）*/
    if (a > 0.5) {
      ctx.strokeStyle = 'rgba(255,255,255,' + (1 - a) * 1.6 + ')';
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(24 + i * 5, -74 + i * 6);
        ctx.quadraticCurveTo(36 + i * 5, -54 + i * 6, 30 + i * 5, -30 + i * 6);
        ctx.stroke();
      }
    }
  }

  ctx.restore();
}


/* ---- 豪傑天むす丸：おにぎりの ごうけつ。エビ天を フルスイング ---- */
function drawTenmusumaru(ctx, s) {
  const step = Math.sin(s.t * 4.5) * (s.moving ? 1 : 0);     // ドシンドシン
  const bob  = Math.abs(step) * (s.moving ? 2.6 : 0);
  const a    = s.atk;
  /* フルスイング：おおきく ふりかぶって → まえに たたきつける */
  const swing = (a >= 0) ? (a < 0.65 ? -2.3 * (a / 0.65) : -2.3 + (a - 0.65) / 0.35 * 3.5) : -0.4;
  const lean  = (a >= 0 && a > 0.65) ? (a - 0.65) * 10 : 0;

  ctx.save();
  ctx.translate(lean, -bob);

  /* --- あし（みじかくて ふとい）--- */
  ctx.fillStyle = '#4e342e';
  roundRect(ctx, -17 - step * 3, -14, 15, 14, 6); ctx.fill();
  roundRect(ctx,   3 + step * 3, -14, 15, 14, 6); ctx.fill();

  /* --- どうたい：さんかくおにぎり --- */
  const R = 10;
  const rg = ctx.createLinearGradient(0, -104, 0, -10);
  rg.addColorStop(0, '#ffffff');
  rg.addColorStop(0.7, '#f7f2e6');
  rg.addColorStop(1, '#e9e0cd');
  ctx.fillStyle = rg;
  ctx.beginPath();
  ctx.moveTo(0, -104);
  ctx.arcTo(38, -12, -38, -12, R);
  ctx.arcTo(-38, -12, 0, -104, R);
  ctx.arcTo(0, -104, 38, -12, R);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(150,135,105,.5)'; ctx.lineWidth = 1.6;
  ctx.stroke();

  /* こめつぶ */
  ctx.fillStyle = 'rgba(190,175,145,.5)';
  const rice = [[-14, -40], [10, -46], [-4, -60], [16, -30], [-20, -26], [2, -30]];
  for (const p of rice) { ellipse(ctx, p[0], p[1], 2.6, 1.6); ctx.fill(); }

  /* --- のりの はらまき --- */
  ctx.fillStyle = '#20302a';
  ctx.beginPath();
  ctx.moveTo(-31, -30);
  ctx.lineTo(31, -30);
  ctx.arcTo(35, -12, -35, -12, R);
  ctx.arcTo(-35, -12, 31, -30, R);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.10)';
  for (let i = 0; i < 4; i++) ctx.fillRect(-28 + i * 15, -28, 5, 15);

  /* --- かお --- */
  ctx.fillStyle = '#2b2018';
  ctx.beginPath(); ctx.arc(-9, -56, 3.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(11, -56, 3.4, 0, Math.PI * 2); ctx.fill();
  /* きりっと した まゆ */
  ctx.strokeStyle = '#2b2018'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-15, -66); ctx.lineTo(-4, -62); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(17, -66); ctx.lineTo(6, -62); ctx.stroke();
  /* ほっぺ */
  ctx.fillStyle = 'rgba(255,138,128,.5)';
  ctx.beginPath(); ctx.arc(-19, -48, 4.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(21, -48, 4.6, 0, Math.PI * 2); ctx.fill();
  /* くち */
  ctx.strokeStyle = '#2b2018'; ctx.lineWidth = 2.4;
  ctx.beginPath();
  if (a >= 0) {                       // きあいの「かっ！」
    ctx.moveTo(-6, -44);
    ctx.quadraticCurveTo(1, -34, 8, -44);
  } else {
    ctx.moveTo(-6, -44);
    ctx.quadraticCurveTo(1, -39, 8, -44);
  }
  ctx.stroke();

  /* --- うしろの うで --- */
  ctx.strokeStyle = '#f2ead8'; ctx.lineWidth = 8; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-22, -48);
  ctx.lineTo(-33, -38 + (a >= 0 ? -6 : 0));
  ctx.stroke();

  /* --- まえの うで ＋ エビ天（ぶき）--- */
  ctx.save();
  ctx.translate(22, -50);
  ctx.rotate(swing);

  ctx.strokeStyle = '#f2ead8'; ctx.lineWidth = 8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(15, 0); ctx.stroke();

  /* エビ天：ころもの ぶぶん */
  const tg = ctx.createLinearGradient(15, -12, 48, 10);
  tg.addColorStop(0, '#f5c869');
  tg.addColorStop(0.6, '#e0a13c');
  tg.addColorStop(1, '#c07d22');
  ctx.fillStyle = tg;
  ctx.beginPath();
  ctx.moveTo(15, -8);
  ctx.quadraticCurveTo(34, -14, 46, -5);
  ctx.quadraticCurveTo(50, 0, 46, 5);
  ctx.quadraticCurveTo(34, 13, 15, 8);
  ctx.closePath();
  ctx.fill();
  /* ころもの ゴツゴツ */
  ctx.fillStyle = 'rgba(255,236,180,.6)';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(20 + i * 6, -4 + (i % 2) * 8, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  /* エビの しっぽ */
  ctx.fillStyle = '#ef5350';
  ctx.beginPath();
  ctx.moveTo(46, 0);
  ctx.lineTo(60, -9);
  ctx.lineTo(57, 0);
  ctx.lineTo(60, 9);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#b71c1c'; ctx.lineWidth = 1.2; ctx.stroke();

  ctx.restore();

  /* --- しょうげきは（たたきつけた しゅんかん）--- */
  if (a >= 0 && a > 0.7) {
    const p = (a - 0.7) / 0.3;
    ctx.strokeStyle = 'rgba(255,213,79,' + (1 - p) + ')';
    ctx.lineWidth = 5;
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.arc(46, -26, 16 + p * 26 + i * 12, -Math.PI * 0.42, Math.PI * 0.42);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,241,118,' + (1 - p) * 0.8 + ')';
    for (let i = 0; i < 5; i++) {
      const an = -0.7 + i * 0.35;
      ctx.beginPath();
      ctx.arc(48 + Math.cos(an) * (18 + p * 24), -26 + Math.sin(an) * (18 + p * 24), 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}


/* ---- 獄熱オニごん：あかおに＋あおおに の ふたりぐみ おおボス ----
   ・とおくから キビだんごを なげて くる
   ・ふところ（minRange）に はいられると なげられず、2にんで あわてる  */
function drawOnigon(ctx, s) {
  const a       = s.atk;                       // 0→1 で ふりかぶり
  const blocked = !!s.blocked;                 // ちかすぎて なげられない
  const step    = Math.sin(s.t * 3.2) * (s.moving ? 1 : 0);
  const bob     = Math.abs(step) * (s.moving ? 3.2 : 0);
  const panic   = blocked ? Math.sin(s.t * 20) : 0;

  ctx.save();
  ctx.translate(0, -bob);

  /* =============== あおおに（うしろ・ジャンプして いる）=============== */
  ctx.save();
  const jump = blocked ? Math.abs(Math.sin(s.t * 9)) * 10 : Math.abs(Math.sin(s.t * 2.4)) * 6;
  ctx.translate(-40, -jump);
  drawOniBody(ctx, s, {
    skin: '#5fb6c4', skin2: '#4a98a6', hair: '#1f6b74',
    horns: 1, scale: 0.86, angry: false, panic: panic,
    armSwing: blocked ? panic * 1.1 : Math.sin(s.t * 3) * 0.5 + 0.6,
    windup: -1,
  });
  ctx.restore();

  /* =============== あかおに（まえ・かなぼう を もつ）=============== */
  ctx.save();
  ctx.translate(14, 0);
  drawOniBody(ctx, s, {
    skin: '#f0603c', skin2: '#cf4529', hair: '#7d2418',
    horns: 2, scale: 1.0, angry: true, panic: panic,
    armSwing: blocked ? -panic * 1.2 : (a >= 0 ? -2.3 + a * 3.1 : -0.35),
    windup: a,
  });
  ctx.restore();

  /* =============== ふところに はいられて あわてて いる =============== */
  if (blocked) {
    /* あせ */
    ctx.fillStyle = 'rgba(130,200,255,.9)';
    for (let i = 0; i < 3; i++) {
      const px = -52 + i * 46, py = -118 - ((s.t * 60 + i * 30) % 26);
      ctx.beginPath();
      ctx.moveTo(px, py - 7);
      ctx.quadraticCurveTo(px + 5, py, px, py + 4);
      ctx.quadraticCurveTo(px - 5, py, px, py - 7);
      ctx.fill();
    }
    /* ！！ */
    ctx.fillStyle = '#ffd54f';
    ctx.strokeStyle = '#4e2600'; ctx.lineWidth = 2;
    for (let i = 0; i < 2; i++) {
      const px = -6 + i * 20, py = -150 + Math.sin(s.t * 12 + i) * 3;
      ctx.beginPath();
      ctx.moveTo(px - 4, py); ctx.lineTo(px + 4, py); ctx.lineTo(px + 2, py + 17);
      ctx.lineTo(px - 2, py + 17); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(px, py + 23, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
  }

  /* =============== なげる キビだんごを かまえる =============== */
  if (a >= 0 && !blocked) {
    const r = 9 + a * 5;
    ctx.save();
    ctx.translate(34 + a * 16, -108 - a * 22);
    const dg = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r);
    dg.addColorStop(0, '#fffde7');
    dg.addColorStop(0.6, '#f5e6a8');
    dg.addColorStop(1, '#d8bf6a');
    ctx.fillStyle = dg;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(140,110,40,.55)'; ctx.lineWidth = 1.4; ctx.stroke();
    /* ためて いる ねつ */
    ctx.fillStyle = 'rgba(255,138,60,' + (a * 0.5) + ')';
    ctx.beginPath(); ctx.arc(0, 0, r + 6 + a * 5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

/* おに 1たいぶんの からだ（あか／あお で いろだけ かえる）*/
function drawOniBody(ctx, s, o) {
  const k = o.scale;
  ctx.save();
  ctx.scale(k, k);

  const SKIN = o.skin, SKIN2 = o.skin2, HAIR = o.hair;

  /* --- あし --- */
  const legSwing = Math.sin(s.t * 3.2) * (s.moving ? 6 : 0);
  ctx.fillStyle = SKIN2;
  roundRect(ctx, -22 - legSwing * 0.4, -34, 18, 34, 8); ctx.fill();
  roundRect(ctx,   5 + legSwing * 0.4, -34, 18, 34, 8); ctx.fill();

  /* --- どうたい --- */
  const bg = ctx.createLinearGradient(0, -110, 0, -30);
  bg.addColorStop(0, SKIN);
  bg.addColorStop(1, SKIN2);
  ctx.fillStyle = bg;
  roundRect(ctx, -28, -104, 56, 74, 20); ctx.fill();

  /* おなかの ×（きずあと）*/
  ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-14, -74); ctx.lineTo(-6, -66);
  ctx.moveTo(-6, -74);  ctx.lineTo(-14, -66);
  ctx.stroke();

  /* --- とらがらの こしまき --- */
  ctx.fillStyle = '#ffd24a';
  roundRect(ctx, -30, -46, 60, 20, 6); ctx.fill();
  ctx.fillStyle = '#3a2a12';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-25 + i * 15, -46);
    ctx.lineTo(-20 + i * 15, -46);
    ctx.lineTo(-24 + i * 15, -26);
    ctx.lineTo(-29 + i * 15, -26);
    ctx.closePath(); ctx.fill();
  }
  /* いなずまの もよう */
  ctx.fillStyle = '#3a2a12';
  ctx.beginPath();
  ctx.moveTo(3, -44); ctx.lineTo(11, -44); ctx.lineTo(6, -37);
  ctx.lineTo(12, -37); ctx.lineTo(2, -27); ctx.lineTo(6, -36);
  ctx.lineTo(0, -36); ctx.closePath();
  ctx.fill();

  /* --- うで --- */
  /* うしろの うで */
  ctx.save();
  ctx.translate(-26, -92);
  ctx.rotate(-0.5 - o.panic * 0.5);
  ctx.fillStyle = SKIN2;
  roundRect(ctx, -22, -8, 26, 16, 8); ctx.fill();
  ctx.restore();

  /* まえの うで（なげる／かなぼう）*/
  ctx.save();
  ctx.translate(24, -92);
  ctx.rotate(o.armSwing);
  ctx.fillStyle = SKIN;
  roundRect(ctx, -4, -9, 30, 18, 9); ctx.fill();

  /* あかおには かなぼう */
  if (o.horns === 2) {
    ctx.save();
    ctx.translate(26, 0);
    ctx.fillStyle = '#8d6e63';
    roundRect(ctx, 0, -7, 40, 14, 6); ctx.fill();
    ctx.fillStyle = '#5d4037';
    roundRect(ctx, 22, -11, 22, 22, 7); ctx.fill();
    ctx.fillStyle = '#bcaaa4';
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 2; j++) {
        ctx.beginPath();
        ctx.arc(27 + i * 6, -5 + j * 10, 2.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
  ctx.restore();

  /* --- あたま --- */
  ctx.save();
  ctx.translate(0, -104);

  /* かみ（もじゃもじゃ）*/
  ctx.fillStyle = HAIR;
  ctx.beginPath();
  for (let i = 0; i <= 12; i++) {
    const an = Math.PI + (i / 12) * Math.PI;
    const rr = 34 + Math.sin(i * 2.3) * 5;
    const px = Math.cos(an) * rr, py = Math.sin(an) * rr * 0.85;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath(); ctx.fill();

  /* かお */
  const hg = ctx.createLinearGradient(0, -30, 0, 26);
  hg.addColorStop(0, SKIN);
  hg.addColorStop(1, SKIN2);
  ctx.fillStyle = hg;
  ellipse(ctx, 0, -2, 31, 28); ctx.fill();

  /* つの */
  ctx.fillStyle = '#ffd24a';
  ctx.strokeStyle = '#c99a1c'; ctx.lineWidth = 1.6;
  const hornX = (o.horns === 2) ? [-16, 16] : [0];
  for (const hx of hornX) {
    ctx.beginPath();
    ctx.moveTo(hx - 7, -26);
    ctx.quadraticCurveTo(hx, -50, hx + 7, -26);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  }

  /* め */
  if (o.panic) {
    // あわてて グルグルめ
    ctx.strokeStyle = '#2b1b12'; ctx.lineWidth = 2.4;
    for (let i = 0; i < 2; i++) {
      const ex = -12 + i * 24;
      ctx.beginPath();
      for (let t = 0; t < 14; t++) {
        const an = t * 0.62 + s.t * 6, rr = 1 + t * 0.55;
        const px = ex + Math.cos(an) * rr, py = -4 + Math.sin(an) * rr;
        if (t === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  } else if (o.angry) {
    // おこった「＞＜」め
    ctx.strokeStyle = '#2b1b12'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
    for (let i = 0; i < 2; i++) {
      const ex = -13 + i * 26, d = i === 0 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(ex - 7 * d, -11); ctx.lineTo(ex + 5 * d, -4); ctx.lineTo(ex - 7 * d, 3);
      ctx.stroke();
    }
    // まゆ
    ctx.lineWidth = 3.6;
    ctx.beginPath(); ctx.moveTo(-24, -20); ctx.lineTo(-6, -14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(24, -20);  ctx.lineTo(6, -14);  ctx.stroke();
  } else {
    // まんまるの め
    for (let i = 0; i < 2; i++) {
      const ex = -13 + i * 26;
      ctx.fillStyle = '#ffffff';
      ellipse(ctx, ex, -5, 8, 9); ctx.fill();
      ctx.fillStyle = '#1b1b1b';
      ellipse(ctx, ex + 1.5, -4, 4.6, 5.4); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(ex, -7, 2, 0, Math.PI * 2); ctx.fill();
    }
  }

  /* くち（おおきく あいて きばが みえる）*/
  ctx.fillStyle = '#8e1b1b';
  ctx.beginPath();
  ctx.ellipse(0, 13, 15, o.panic ? 11 : 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff8a80';
  ctx.beginPath();
  ctx.ellipse(0, 18, 8, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(-10, 5); ctx.lineTo(-5, 5); ctx.lineTo(-7.5, 12); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(10, 5); ctx.lineTo(5, 5); ctx.lineTo(7.5, 12); ctx.closePath(); ctx.fill();

  /* ほっぺ */
  ctx.fillStyle = 'rgba(255,255,255,.22)';
  ctx.beginPath(); ctx.arc(-22, 8, 6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(22, 8, 6, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
  ctx.restore();
}


/* ==================================================================
   だい3しょう「けものみち」の てきたち
   ================================================================== */

/* よつあしの けものの きほんの からだ（いろと かたちだけ かえる）*/
function beastBody(ctx, s, o) {
  const step = Math.sin(s.t * (o.fast ? 13 : 7)) * (s.moving ? 1 : 0);
  const bob  = Math.abs(step) * (s.moving ? (o.fast ? 3 : 1.8) : 0);
  ctx.translate(0, -bob);

  const L = o.len || 34, H2 = o.hi || 46, TH = o.thick || 20;

  /* あし 4ほん */
  ctx.fillStyle = o.dark;
  const legs = [[-L * 0.62, -step * 4], [-L * 0.28, step * 4], [L * 0.24, step * 4], [L * 0.58, -step * 4]];
  for (const [lx, sw] of legs) {
    roundRect(ctx, lx + sw - TH * 0.22, -H2 * 0.52, TH * 0.44, H2 * 0.52, TH * 0.2);
    ctx.fill();
  }

  /* どうたい */
  const bg = ctx.createLinearGradient(0, -H2, 0, -H2 * 0.35);
  bg.addColorStop(0, o.light);
  bg.addColorStop(1, o.main);
  ctx.fillStyle = bg;
  ellipse(ctx, 0, -H2 * 0.75, L * 0.78, H2 * 0.34);
  ctx.fill();

  /* おなかの あかるい ところ */
  if (o.belly) {
    ctx.fillStyle = o.belly;
    ellipse(ctx, L * 0.1, -H2 * 0.6, L * 0.42, H2 * 0.2);
    ctx.fill();
  }
  return { L, H2, step };
}

/* まるい かおの パーツ */
function beastFace(ctx, o, x, y, r, opt) {
  opt = opt || {};
  const fg = ctx.createLinearGradient(0, y - r, 0, y + r);
  fg.addColorStop(0, o.light); fg.addColorStop(1, o.main);
  ctx.fillStyle = fg;
  ellipse(ctx, x, y, r, r * 0.9); ctx.fill();
  /* め */
  if (opt.sleepy) {
    ctx.strokeStyle = '#3a2a20'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.1, r * 0.2, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + r * 0.35, y - r * 0.1, r * 0.2, 0.2, Math.PI - 0.2); ctx.stroke();
  } else if (opt.angry) {
    ctx.fillStyle = opt.eye || '#ffe082';
    ellipse(ctx, x - r * 0.28, y - r * 0.12, r * 0.19, r * 0.16); ctx.fill();
    ellipse(ctx, x + r * 0.36, y - r * 0.12, r * 0.19, r * 0.16); ctx.fill();
    ctx.fillStyle = '#1b1b1b';
    ellipse(ctx, x - r * 0.26, y - r * 0.12, r * 0.07, r * 0.14); ctx.fill();
    ellipse(ctx, x + r * 0.38, y - r * 0.12, r * 0.07, r * 0.14); ctx.fill();
    ctx.strokeStyle = '#2b1b12'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - r * 0.52, y - r * 0.44); ctx.lineTo(x - r * 0.1, y - r * 0.28); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + r * 0.62, y - r * 0.44); ctx.lineTo(x + r * 0.2, y - r * 0.28); ctx.stroke();
  } else {
    ctx.fillStyle = '#ffffff';
    ellipse(ctx, x - r * 0.28, y - r * 0.12, r * 0.2, r * 0.22); ctx.fill();
    ellipse(ctx, x + r * 0.36, y - r * 0.12, r * 0.2, r * 0.22); ctx.fill();
    ctx.fillStyle = '#231a14';
    ellipse(ctx, x - r * 0.25, y - r * 0.1, r * 0.12, r * 0.14); ctx.fill();
    ellipse(ctx, x + r * 0.39, y - r * 0.1, r * 0.12, r * 0.14); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(x - r * 0.29, y - r * 0.17, r * 0.05, 0, Math.PI * 2); ctx.fill();
  }
  /* はな */
  ctx.fillStyle = opt.nose || '#3a2a20';
  ellipse(ctx, x + r * 0.62, y + r * 0.18, r * 0.15, r * 0.12); ctx.fill();
}


/* ---- ① イノっち：つっこんで くる いのしし ---- */
function drawInocchi(ctx, s) {
  const a = s.atk;
  const dash = (a >= 0) ? (a < 0.5 ? -a * 8 : (a - 0.5) * 34) : 0;
  ctx.save();
  ctx.translate(dash, 0);
  const o = { main: '#6b4f38', light: '#8a6a4c', dark: '#4a3626', belly: '#a98b68', len: 38, hi: 46, thick: 22, fast: true };
  const b = beastBody(ctx, s, o);

  /* しっぽ（くるん）*/
  ctx.strokeStyle = o.dark; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(-30, -38, 5, Math.PI * 0.4, Math.PI * 1.9);
  ctx.stroke();

  /* せなかの けなみ */
  ctx.strokeStyle = '#3b2a1c'; ctx.lineWidth = 2.2;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(-16 + i * 8, -46); ctx.lineTo(-19 + i * 8, -56);
    ctx.stroke();
  }

  /* あたま（まえに つきだす）*/
  ctx.save();
  ctx.translate(26, -34);
  ctx.rotate(a >= 0 ? 0.12 : 0);
  const hg = ctx.createLinearGradient(0, -14, 0, 12);
  hg.addColorStop(0, o.light); hg.addColorStop(1, o.main);
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.moveTo(-14, -13);
  ctx.quadraticCurveTo(14, -12, 22, -1);
  ctx.quadraticCurveTo(14, 12, -14, 12);
  ctx.closePath(); ctx.fill();
  /* みみ */
  ctx.fillStyle = o.dark;
  ctx.beginPath(); ctx.moveTo(-11, -12); ctx.lineTo(-5, -24); ctx.lineTo(1, -11); ctx.closePath(); ctx.fill();
  /* はな */
  ctx.fillStyle = '#e8a0a8';
  ellipse(ctx, 20, -1, 5, 5.5); ctx.fill();
  ctx.fillStyle = '#b4707a';
  ctx.beginPath(); ctx.arc(19, -2.5, 1.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(19, 1.5, 1.2, 0, Math.PI * 2); ctx.fill();
  /* きば */
  ctx.fillStyle = '#fffde7'; ctx.strokeStyle = '#c9bfa0'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(14, 6); ctx.quadraticCurveTo(20, 2, 17, -6); ctx.quadraticCurveTo(13, 1, 10, 6);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  /* おこった め */
  ctx.strokeStyle = '#2b1b12'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(8, -4); ctx.stroke();
  ctx.fillStyle = '#2b1b12';
  ctx.beginPath(); ctx.arc(6, -1, 2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  /* すなぼこり */
  if (s.moving || a >= 0) {
    ctx.fillStyle = 'rgba(200,180,150,0.5)';
    for (let i = 0; i < 3; i++) {
      const px = -34 - i * 9, py = -6 - Math.abs(Math.sin(s.t * 8 + i)) * 8;
      ctx.beginPath(); ctx.arc(px, py, 5 - i, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}


/* ---- ② たぬポン：おなかを たたく たぬき ---- */
function drawTanupon(ctx, s) {
  const a = s.atk;
  const pat = (a >= 0) ? Math.sin(a * Math.PI * 3) * 5 : 0;
  ctx.save();
  const sway = Math.sin(s.t * 4) * (s.moving ? 2 : 0.6);
  ctx.translate(sway, 0);

  /* しっぽ（ふとい しま）*/
  ctx.fillStyle = '#5d4433';
  roundRect(ctx, -40, -34, 20, 12, 6); ctx.fill();
  ctx.fillStyle = '#3a2a1e';
  ctx.fillRect(-36, -34, 5, 12);
  ctx.fillRect(-27, -34, 5, 12);

  /* あし */
  ctx.fillStyle = '#4a3526';
  roundRect(ctx, -18, -13, 12, 13, 5); ctx.fill();
  roundRect(ctx, 6, -13, 12, 13, 5); ctx.fill();

  /* まるい からだ */
  const bg = ctx.createLinearGradient(0, -66, 0, -6);
  bg.addColorStop(0, '#8a6a4c'); bg.addColorStop(1, '#5d4433');
  ctx.fillStyle = bg;
  ellipse(ctx, 0, -34, 28, 30); ctx.fill();
  /* おなか */
  ctx.fillStyle = '#efdcbe';
  ellipse(ctx, 3 + pat * 0.3, -30, 19 + Math.abs(pat) * 0.6, 20); ctx.fill();

  /* て（おなかを ポンポン）*/
  ctx.fillStyle = '#4a3526';
  roundRect(ctx, -24, -46 + pat, 13, 10, 5); ctx.fill();
  roundRect(ctx, 12, -46 - pat, 13, 10, 5); ctx.fill();

  /* あたま */
  ctx.save();
  ctx.translate(6, -60);
  ctx.fillStyle = '#4a3526';
  ctx.beginPath(); ctx.moveTo(-16, -4); ctx.lineTo(-12, -18); ctx.lineTo(-3, -5); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(6, -5); ctx.lineTo(13, -18); ctx.lineTo(17, -4); ctx.closePath(); ctx.fill();
  beastFace(ctx, { main: '#5d4433', light: '#8a6a4c' }, 0, 0, 17);
  /* めの まわりの くろい わ */
  ctx.fillStyle = 'rgba(50,34,22,.55)';
  ellipse(ctx, -5, -2, 7, 6); ctx.fill();
  ellipse(ctx, 6, -2, 7, 6); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ellipse(ctx, -5, -2, 3.6, 4); ctx.fill();
  ellipse(ctx, 6, -2, 3.6, 4); ctx.fill();
  ctx.fillStyle = '#231a14';
  ellipse(ctx, -4.4, -1.6, 2.2, 2.6); ctx.fill();
  ellipse(ctx, 6.6, -1.6, 2.2, 2.6); ctx.fill();
  /* あたまの はっぱ */
  ctx.fillStyle = '#7cb342';
  ctx.beginPath();
  ctx.moveTo(0, -17);
  ctx.quadraticCurveTo(12, -28, 20, -20);
  ctx.quadraticCurveTo(10, -14, 0, -17);
  ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.restore();
}


/* ---- ③ ヤマネム：ねぶくろで ねむる やまね ---- */
function drawYamanemu(ctx, s) {
  ctx.save();
  const breathe = Math.sin(s.t * 1.8) * 1.6;
  ctx.translate(0, breathe * 0.3);

  /* ねぶくろ */
  ctx.fillStyle = '#e8e2d0';
  ellipse(ctx, -4, -20, 30, 19 + breathe * 0.3); ctx.fill();
  ctx.strokeStyle = '#c9c0a8'; ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-24 + i * 15, -36); ctx.lineTo(-24 + i * 15, -4);
    ctx.stroke();
  }

  /* かお（ねむって いる）*/
  ctx.save();
  ctx.translate(20, -26);
  const fg = ctx.createLinearGradient(0, -16, 0, 14);
  fg.addColorStop(0, '#b9b2a8'); fg.addColorStop(1, '#8d8780');
  ctx.fillStyle = fg;
  ellipse(ctx, 0, 0, 17, 15); ctx.fill();
  /* みみ */
  ctx.fillStyle = '#a49c92';
  ctx.beginPath(); ctx.arc(-8, -13, 6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(7, -14, 6.5, 0, Math.PI * 2); ctx.fill();
  /* ねむりめ */
  ctx.strokeStyle = '#3a3430'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(-5, -1, 4, 0.25, Math.PI - 0.25); ctx.stroke();
  ctx.beginPath(); ctx.arc(7, -1, 4, 0.25, Math.PI - 0.25); ctx.stroke();
  /* はな・くち */
  ctx.fillStyle = '#e8a0a8';
  ellipse(ctx, 13, 3, 3.4, 2.8); ctx.fill();
  ctx.fillStyle = 'rgba(255,150,150,.35)';
  ctx.beginPath(); ctx.arc(-11, 4, 4.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(8, 5, 4.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  /* ゆめの あわ */
  ctx.strokeStyle = 'rgba(186,104,200,.75)'; ctx.lineWidth = 1.8;
  ctx.fillStyle = 'rgba(225,190,240,.5)';
  for (let i = 0; i < 3; i++) {
    const t2 = (s.t * 0.6 + i * 0.34) % 1;
    const r = 3 + i * 2.4;
    ctx.beginPath();
    ctx.arc(26 + i * 9, -48 - t2 * 16 - i * 6, r, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}


/* ---- ④ モエリス：ほのおの りす ---- */
function drawMoeris(ctx, s) {
  const a = s.atk;
  ctx.save();
  const hop = Math.abs(Math.sin(s.t * 9)) * (s.moving ? 3 : 0);
  ctx.translate(0, -hop);

  /* ほのおの しっぽ */
  for (let i = 0; i < 3; i++) {
    const f = Math.sin(s.t * 9 + i) * 4;
    ctx.fillStyle = ['rgba(255,87,34,.9)', 'rgba(255,152,0,.9)', 'rgba(255,235,59,.85)'][i];
    ctx.beginPath();
    ctx.moveTo(-12, -18);
    ctx.quadraticCurveTo(-34 - i * 2, -34 + f, -24 + i * 3, -62 - i * 4 + f);
    ctx.quadraticCurveTo(-18 + i * 4, -38, -8 - i * 2, -18);
    ctx.closePath(); ctx.fill();
  }

  /* あし・からだ */
  ctx.fillStyle = '#8b4a22';
  roundRect(ctx, -8, -12, 9, 12, 4); ctx.fill();
  roundRect(ctx, 4, -12, 9, 12, 4); ctx.fill();
  const bg = ctx.createLinearGradient(0, -46, 0, -8);
  bg.addColorStop(0, '#c96a2e'); bg.addColorStop(1, '#9c4d1c');
  ctx.fillStyle = bg;
  ellipse(ctx, 0, -26, 15, 18); ctx.fill();
  ctx.fillStyle = '#f0c49a';
  ellipse(ctx, 5, -24, 8, 12); ctx.fill();

  /* もえる どんぐりを もつ て */
  ctx.fillStyle = '#a5551f';
  roundRect(ctx, 10, -36, 12, 8, 4); ctx.fill();
  const nx = 24 + (a >= 0 ? a * 8 : 0), ny = -34 - (a >= 0 ? a * 8 : 0);
  ctx.fillStyle = '#c8a06a';
  ellipse(ctx, nx, ny, 5, 6); ctx.fill();
  ctx.fillStyle = '#6d4c2f';
  roundRect(ctx, nx - 5, ny - 8, 10, 5, 2); ctx.fill();
  const r = 7 + (a >= 0 ? a * 7 : 0) + Math.sin(s.t * 12) * 1.5;
  const fg2 = ctx.createRadialGradient(nx, ny - 2, 1, nx, ny - 2, r);
  fg2.addColorStop(0, 'rgba(255,245,157,.95)');
  fg2.addColorStop(0.5, 'rgba(255,152,0,.7)');
  fg2.addColorStop(1, 'rgba(255,87,34,0)');
  ctx.fillStyle = fg2;
  ctx.beginPath(); ctx.arc(nx, ny - 2, r, 0, Math.PI * 2); ctx.fill();

  /* あたま */
  ctx.save();
  ctx.translate(6, -50);
  ctx.fillStyle = '#9c4d1c';
  ctx.beginPath(); ctx.moveTo(-12, -6); ctx.lineTo(-9, -20); ctx.lineTo(-1, -7); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(4, -7); ctx.lineTo(10, -20); ctx.lineTo(13, -6); ctx.closePath(); ctx.fill();
  beastFace(ctx, { main: '#9c4d1c', light: '#c96a2e' }, 0, 0, 14, { angry: true, eye: '#ffe082' });
  ctx.restore();
  ctx.restore();
}


/* ---- ⑤ ツユガエル：はっぱの かさの かえる ---- */
function drawTsuyugaeru(ctx, s) {
  const a = s.atk;
  ctx.save();
  const hop = Math.abs(Math.sin(s.t * 5)) * (s.moving ? 4 : 0);
  ctx.translate(0, -hop);

  /* あし */
  ctx.fillStyle = '#5a9e63';
  ellipse(ctx, -16, -6, 11, 6); ctx.fill();
  ellipse(ctx, 15, -6, 11, 6); ctx.fill();

  /* からだ */
  const bg = ctx.createLinearGradient(0, -44, 0, -4);
  bg.addColorStop(0, '#8fd18a'); bg.addColorStop(1, '#4f9e79');
  ctx.fillStyle = bg;
  ellipse(ctx, 0, -22, 24, 21); ctx.fill();
  ctx.fillStyle = '#dff3d0';
  ellipse(ctx, 4, -16, 14, 12); ctx.fill();
  /* みずの もよう */
  ctx.fillStyle = 'rgba(79,195,247,.45)';
  for (const [px, py, pr] of [[-12, -30, 4], [-4, -38, 3], [10, -33, 3.5]]) {
    ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();
  }

  /* め（うえに とびだす）*/
  for (let i = 0; i < 2; i++) {
    const ex = -6 + i * 15;
    ctx.fillStyle = '#8fd18a';
    ctx.beginPath(); ctx.arc(ex, -42, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(ex, -43, 5.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1b1b1b';
    ctx.beginPath(); ctx.arc(ex + 1.4, -43, 3, 0, Math.PI * 2); ctx.fill();
  }
  /* くち */
  ctx.strokeStyle = '#2f6b4a'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath();
  if (a >= 0) { ctx.arc(6, -22, 8, 0.15, Math.PI - 0.15); }
  else        { ctx.moveTo(-2, -20); ctx.quadraticCurveTo(8, -16, 17, -22); }
  ctx.stroke();

  /* はっぱの かさ */
  ctx.save();
  ctx.translate(2, -54);
  ctx.rotate(Math.sin(s.t * 2) * 0.06);
  ctx.strokeStyle = '#6d9e3a'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -8); ctx.stroke();
  const lg = ctx.createLinearGradient(-26, -14, 26, -2);
  lg.addColorStop(0, '#a5d76a'); lg.addColorStop(1, '#6d9e3a');
  ctx.fillStyle = lg;
  ctx.beginPath();
  ctx.moveTo(-30, -8);
  ctx.quadraticCurveTo(0, -30, 30, -8);
  ctx.quadraticCurveTo(0, -14, -30, -8);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(50,90,25,.5)'; ctx.lineWidth = 1.4;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(-24 + i * 16, -8); ctx.stroke();
  }
  ctx.restore();

  /* しずく */
  ctx.fillStyle = 'rgba(79,195,247,.85)';
  for (let i = 0; i < 3; i++) {
    const t2 = (s.t * 1.4 + i * 0.33) % 1;
    const px = -34 + i * 34, py = -50 + t2 * 34;
    ctx.beginPath();
    ctx.moveTo(px, py - 6);
    ctx.quadraticCurveTo(px + 4, py, px, py + 4);
    ctx.quadraticCurveTo(px - 4, py, px, py - 6);
    ctx.fill();
  }
  ctx.restore();
}


/* ---- ⑥ コケジカ：こけと きのこの しか ---- */
function drawKokejika(ctx, s) {
  ctx.save();
  const o = { main: '#a98155', light: '#c69f72', dark: '#7d5c3a', belly: '#e3cdae', len: 40, hi: 58, thick: 20 };
  beastBody(ctx, s, o);

  /* せなかの こけ */
  ctx.fillStyle = '#6d9e3a';
  ctx.beginPath();
  ctx.moveTo(-28, -50);
  ctx.quadraticCurveTo(-10, -62, 12, -52);
  ctx.quadraticCurveTo(-6, -44, -28, -50);
  ctx.closePath(); ctx.fill();
  /* きのこ */
  for (const [mx, my, mr] of [[-20, -54, 5], [-8, -60, 6.5], [4, -55, 4.5]]) {
    ctx.fillStyle = '#efe4d0';
    ctx.fillRect(mx - 1.6, my, 3.2, 6);
    ctx.fillStyle = '#e05b4a';
    ctx.beginPath(); ctx.ellipse(mx, my, mr, mr * 0.7, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(mx - mr * 0.3, my - mr * 0.25, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(mx + mr * 0.35, my - mr * 0.3, 1, 0, Math.PI * 2); ctx.fill();
  }

  /* くび と あたま */
  ctx.strokeStyle = o.main; ctx.lineWidth = 13; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(24, -44); ctx.lineTo(34, -70); ctx.stroke();

  ctx.save();
  ctx.translate(36, -78);
  /* つの */
  ctx.strokeStyle = '#8d6e3a'; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
  for (const d of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(d * 5, -8);
    ctx.quadraticCurveTo(d * 12, -24, d * 6, -32);
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(d * 10, -20); ctx.lineTo(d * 19, -25); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(d * 8, -27); ctx.lineTo(d * 16, -34); ctx.stroke();
  }
  /* みみ */
  ctx.fillStyle = o.dark;
  ellipse(ctx, -12, -6, 6, 4); ctx.fill();
  ellipse(ctx, 13, -7, 6, 4); ctx.fill();
  /* かお（ほそながい）*/
  const fg = ctx.createLinearGradient(0, -12, 0, 14);
  fg.addColorStop(0, o.light); fg.addColorStop(1, o.main);
  ctx.fillStyle = fg;
  ellipse(ctx, 3, 2, 15, 12); ctx.fill();
  ctx.fillStyle = '#231a14';
  ellipse(ctx, -1, -1, 2.6, 3); ctx.fill();
  ellipse(ctx, 10, -1, 2.6, 3); ctx.fill();
  ctx.fillStyle = '#3a2a20';
  ellipse(ctx, 15, 6, 4, 3); ctx.fill();
  ctx.restore();
  ctx.restore();
}


/* ---- ⑦ ハリ千本：はりねずみ ---- */
function drawHarisenbon(ctx, s) {
  const a = s.atk;
  const bristle = (a >= 0) ? a * 9 : 0;
  ctx.save();
  const step = Math.sin(s.t * 6) * (s.moving ? 1.4 : 0);
  ctx.translate(step * 0.6, 0);

  /* はり */
  ctx.strokeStyle = '#4a4a52'; ctx.lineCap = 'round';
  for (let i = 0; i < 22; i++) {
    const an = Math.PI * (0.98 + (i / 21) * 1.06);
    const len = 20 + ((i * 7) % 11) + bristle;
    const bx = Math.cos(an) * 22 - 4, by = Math.sin(an) * 17 - 28;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + Math.cos(an) * len, by + Math.sin(an) * len * 0.9);
    ctx.stroke();
  }
  ctx.strokeStyle = '#8d8d96'; ctx.lineWidth = 1.2;
  for (let i = 0; i < 11; i++) {
    const an = Math.PI * (1.02 + (i / 10) * 0.98);
    const len = 16 + ((i * 5) % 9) + bristle;
    const bx = Math.cos(an) * 20 - 4, by = Math.sin(an) * 15 - 28;
    ctx.beginPath();
    ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(an) * len, by + Math.sin(an) * len * 0.9);
    ctx.stroke();
  }

  /* あし */
  ctx.fillStyle = '#a9958a';
  roundRect(ctx, -10, -8, 8, 8, 3); ctx.fill();
  roundRect(ctx, 6, -8, 8, 8, 3); ctx.fill();

  /* からだ */
  const bg = ctx.createLinearGradient(0, -42, 0, -4);
  bg.addColorStop(0, '#c9b6a6'); bg.addColorStop(1, '#9d8878');
  ctx.fillStyle = bg;
  ellipse(ctx, -2, -22, 24, 20); ctx.fill();

  /* かお */
  ctx.save();
  ctx.translate(20, -22);
  ctx.fillStyle = '#e8dccb';
  ctx.beginPath();
  ctx.moveTo(-8, -12); ctx.quadraticCurveTo(14, -8, 20, 2);
  ctx.quadraticCurveTo(10, 12, -8, 11);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#2b1b12'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-5, -8); ctx.lineTo(4, -4); ctx.stroke();
  ctx.fillStyle = '#231a14';
  ctx.beginPath(); ctx.arc(3, 0, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3a2a20';
  ellipse(ctx, 18, 2, 3.6, 3); ctx.fill();
  ctx.fillStyle = 'rgba(255,150,150,.4)';
  ctx.beginPath(); ctx.arc(2, 6, 4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.restore();
}


/* ---- ⑧ クマった：こまった かおの くま ---- */
function drawKumatta(ctx, s) {
  const a = s.atk;
  const swing = (a >= 0) ? (a < 0.6 ? -a * 1.8 : (a - 0.6) * 5.5 - 1.08) : -0.3;
  ctx.save();
  const step = Math.sin(s.t * 3.6) * (s.moving ? 1 : 0);
  ctx.translate(0, -Math.abs(step) * 1.6);

  /* あし */
  ctx.fillStyle = '#2b2320';
  roundRect(ctx, -22 - step * 3, -20, 18, 20, 8); ctx.fill();
  roundRect(ctx,   4 + step * 3, -20, 18, 20, 8); ctx.fill();

  /* からだ */
  const bg = ctx.createLinearGradient(0, -84, 0, -14);
  bg.addColorStop(0, '#3d3330'); bg.addColorStop(1, '#231d1b');
  ctx.fillStyle = bg;
  ellipse(ctx, 0, -50, 30, 34); ctx.fill();
  /* むねの しろい もよう（Vじ）*/
  ctx.fillStyle = '#efe0c2';
  ctx.beginPath();
  ctx.moveTo(-13, -66); ctx.lineTo(2, -44); ctx.lineTo(15, -66);
  ctx.quadraticCurveTo(2, -58, -13, -66);
  ctx.closePath(); ctx.fill();

  /* うしろの うで */
  ctx.fillStyle = '#2b2320';
  roundRect(ctx, -34, -62, 16, 30, 8); ctx.fill();

  /* まえの うで（あたまを かく／ふりおろす）*/
  ctx.save();
  ctx.translate(22, -66);
  ctx.rotate(swing);
  ctx.fillStyle = '#3d3330';
  roundRect(ctx, -6, -8, 30, 17, 8); ctx.fill();
  ctx.fillStyle = '#1b1614';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.arc(24, -4 + i * 5, 2.4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  /* あたま */
  ctx.save();
  ctx.translate(6, -94);
  ctx.fillStyle = '#2b2320';
  ctx.beginPath(); ctx.arc(-16, -12, 8.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(16, -13, 8.5, 0, Math.PI * 2); ctx.fill();
  const fg = ctx.createLinearGradient(0, -20, 0, 18);
  fg.addColorStop(0, '#3d3330'); fg.addColorStop(1, '#231d1b');
  ctx.fillStyle = fg;
  ellipse(ctx, 0, 0, 21, 19); ctx.fill();
  /* こまった まゆ */
  ctx.strokeStyle = '#efe0c2'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-13, -10); ctx.lineTo(-4, -6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(14, -10); ctx.lineTo(6, -6); ctx.stroke();
  /* め */
  ctx.fillStyle = '#efe0c2';
  ctx.beginPath(); ctx.arc(-7, -1, 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(9, -1, 2.6, 0, Math.PI * 2); ctx.fill();
  /* はな */
  ctx.fillStyle = '#d8c8ac';
  ellipse(ctx, 5, 8, 10, 7); ctx.fill();
  ctx.fillStyle = '#1b1614';
  ellipse(ctx, 8, 5, 4, 3); ctx.fill();
  ctx.strokeStyle = '#1b1614'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(6, 11, 3.4, 0.15, Math.PI - 0.15); ctx.stroke();
  ctx.restore();

  /* こまった あせ */
  if (a < 0) {
    ctx.fillStyle = 'rgba(130,200,255,.8)';
    const py = -108 - ((s.t * 30) % 12);
    ctx.beginPath();
    ctx.moveTo(30, py - 6); ctx.quadraticCurveTo(35, py, 30, py + 4);
    ctx.quadraticCurveTo(25, py, 30, py - 6);
    ctx.fill();
  }
  ctx.restore();
}


/* ---- ⑨ ヌシノオオカミ：けものみちの ぬし（ちゅうボス）---- */
function drawNushinoookami(ctx, s) {
  const a = s.atk;
  const rage = !!s.enraged;
  ctx.save();

  /* つき（うしろ）*/
  ctx.fillStyle = rage ? 'rgba(255,120,90,.35)' : 'rgba(230,240,255,.3)';
  ctx.beginPath(); ctx.arc(-18, -104, 30, 0, Math.PI * 2); ctx.fill();

  const o = { main: '#7b7f88', light: '#a3a8b2', dark: '#4e525a', belly: '#d5d8de', len: 46, hi: 62, thick: 22, fast: true };
  beastBody(ctx, s, o);

  /* しっぽ（ふさふさ）*/
  ctx.fillStyle = o.dark;
  ctx.save();
  ctx.translate(-38, -48);
  ctx.rotate(Math.sin(s.t * 4) * 0.18 - 0.5);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-18, -12, -30, -30);
  ctx.quadraticCurveTo(-12, -24, 0, -12);
  ctx.closePath(); ctx.fill();
  ctx.restore();

  /* せなかの たてがみ */
  ctx.fillStyle = '#5a5f68';
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(-24 + i * 9, -52);
    ctx.lineTo(-28 + i * 9, -68 - (i % 2) * 5);
    ctx.lineTo(-18 + i * 9, -52);
    ctx.closePath(); ctx.fill();
  }

  /* あたま */
  ctx.save();
  ctx.translate(34, -66);
  ctx.rotate(a >= 0 ? -0.14 : 0);
  /* みみ */
  ctx.fillStyle = o.dark;
  ctx.beginPath(); ctx.moveTo(-13, -10); ctx.lineTo(-9, -28); ctx.lineTo(0, -11); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(6, -11); ctx.lineTo(13, -28); ctx.lineTo(17, -9); ctx.closePath(); ctx.fill();
  /* かお */
  const fg = ctx.createLinearGradient(0, -16, 0, 16);
  fg.addColorStop(0, o.light); fg.addColorStop(1, o.main);
  ctx.fillStyle = fg;
  ellipse(ctx, 0, 0, 20, 17); ctx.fill();
  /* はなさき */
  ctx.fillStyle = o.main;
  ctx.beginPath();
  ctx.moveTo(10, -6); ctx.quadraticCurveTo(28, -2, 26, 6);
  ctx.quadraticCurveTo(18, 11, 8, 9);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#1b1b1b';
  ellipse(ctx, 25, 2, 4, 3.2); ctx.fill();
  /* するどい め */
  ctx.fillStyle = rage ? '#ff5252' : '#ffd54f';
  ctx.beginPath(); ctx.moveTo(-8, -4); ctx.lineTo(2, -7); ctx.lineTo(2, -1); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(12, -4); ctx.lineTo(4, -7); ctx.lineTo(4, -1); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#1b1b1b';
  ctx.fillRect(-3, -6, 1.8, 5);
  ctx.fillRect(7, -6, 1.8, 5);
  /* きば */
  if (a >= 0 || rage) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(12, 8); ctx.lineTo(15, 16); ctx.lineTo(18, 8); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(19, 8); ctx.lineTo(22, 15); ctx.lineTo(24, 8); ctx.closePath(); ctx.fill();
  }
  ctx.restore();

  /* ほんきモードの オーラ */
  if (rage) {
    ctx.strokeStyle = 'rgba(255,82,82,' + (0.35 + Math.sin(s.t * 10) * 0.2) + ')';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(0, -46, 52, 44, 0, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}


/* ---- ⑩ 森喰らい・ガオウ：けものみちの おおボス ---- */
function drawGaou(ctx, s) {
  const a = s.atk;
  const rage = !!s.enraged;
  ctx.save();
  const step = Math.sin(s.t * 2.6) * (s.moving ? 1 : 0);
  ctx.translate(0, -Math.abs(step) * 2);

  /* あし（ふとい 4ほん）*/
  ctx.fillStyle = '#3a4a2a';
  for (const [lx, sw] of [[-40, -step * 4], [-16, step * 4], [14, step * 4], [40, -step * 4]]) {
    roundRect(ctx, lx + sw - 11, -30, 22, 30, 9); ctx.fill();
  }

  /* どうたい */
  const bg = ctx.createLinearGradient(0, -104, 0, -24);
  bg.addColorStop(0, '#6b7a48'); bg.addColorStop(1, '#3f4a2c');
  ctx.fillStyle = bg;
  ellipse(ctx, 0, -66, 54, 42); ctx.fill();

  /* せなかの こけ と き */
  ctx.fillStyle = '#5d8a34';
  ctx.beginPath();
  ctx.moveTo(-46, -88);
  ctx.quadraticCurveTo(-10, -116, 34, -92);
  ctx.quadraticCurveTo(-6, -78, -46, -88);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#4a3a22'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (const [tx, th] of [[-30, 20], [-12, 26], [8, 18]]) {
    ctx.beginPath(); ctx.moveTo(tx, -96); ctx.lineTo(tx + 2, -96 - th); ctx.stroke();
    ctx.fillStyle = '#4e9a3f';
    ctx.beginPath(); ctx.arc(tx + 2, -98 - th, 7, 0, Math.PI * 2); ctx.fill();
  }

  /* あたま */
  ctx.save();
  ctx.translate(48, -84);
  ctx.rotate(a >= 0 ? -0.1 : 0);
  /* つの */
  ctx.strokeStyle = '#c9bfa0'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  for (const d of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(d * 12, -18);
    ctx.quadraticCurveTo(d * 30, -34, d * 20, -50);
    ctx.stroke();
  }
  /* かお */
  const fg = ctx.createLinearGradient(0, -24, 0, 22);
  fg.addColorStop(0, '#6b7a48'); fg.addColorStop(1, '#3f4a2c');
  ctx.fillStyle = fg;
  ellipse(ctx, 0, 0, 30, 26); ctx.fill();
  /* ひかる め */
  const eg = ctx.createRadialGradient(0, 0, 1, 0, 0, 12);
  eg.addColorStop(0, rage ? '#fff59d' : '#b9f6ca');
  eg.addColorStop(1, 'rgba(120,255,180,0)');
  for (const ex of [-11, 12]) {
    ctx.save(); ctx.translate(ex, -6);
    ctx.fillStyle = eg;
    ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = rage ? '#fff176' : '#e8fff0';
    ctx.beginPath(); ctx.arc(0, 0, 4.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1b2b1b';
    ctx.fillRect(-1, -4, 2, 8);
    ctx.restore();
  }
  /* おおきな くち と きば */
  const open = (a >= 0) ? 10 + a * 12 : 6;
  ctx.fillStyle = '#5d1414';
  ellipse(ctx, 8, 14, 20, open); ctx.fill();
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-6 + i * 9, 14 - open); ctx.lineTo(-2 + i * 9, 14 - open + 9); ctx.lineTo(2 + i * 9, 14 - open);
    ctx.closePath(); ctx.fill();
  }
  /* したの おおきな きば */
  ctx.beginPath(); ctx.moveTo(-14, 16); ctx.lineTo(-10, 0); ctx.lineTo(-5, 16); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(24, 16); ctx.lineTo(28, 0); ctx.lineTo(32, 16); ctx.closePath(); ctx.fill();
  ctx.restore();

  /* ピンチの オーラ */
  if (rage) {
    ctx.strokeStyle = 'rgba(255,213,79,' + (0.3 + Math.sin(s.t * 12) * 0.2) + ')';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(0, -66, 74, 62, 0, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}


/* ==================================================================
   だい4しょう「廃れたメカニック工場」の てきたち
   ================================================================== */

/* さびた てつの ぬりかた */
function rustFill(ctx, x, y, w, h, base, rust) {
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, base);
  g.addColorStop(1, rust);
  ctx.fillStyle = g;
}
/* さびの しみ */
function rustSpots(ctx, cx, cy, w, h, seed) {
  ctx.fillStyle = 'rgba(140,80,40,.45)';
  for (let i = 0; i < 6; i++) {
    const px = cx + ((i * 37 + seed * 13) % w) - w / 2;
    const py = cy + ((i * 23 + seed * 7) % h) - h / 2;
    ctx.beginPath(); ctx.arc(px, py, 1.6 + (i % 3), 0, Math.PI * 2); ctx.fill();
  }
}
/* ひかる め（きかいの め）*/
function botEye(ctx, x, y, r, color) {
  const g = ctx.createRadialGradient(x, y, 0.5, x, y, r * 2.4);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r * 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}


/* ---- ① ネジロー：あたまを まわして たいあたり ---- */
function drawNejiro(ctx, s) {
  const a = s.atk;
  const spin = (a >= 0) ? a * 14 : s.t * 1.2;
  ctx.save();
  const step = Math.sin(s.t * 8) * (s.moving ? 1 : 0);
  ctx.translate((a >= 0 && a > 0.6) ? (a - 0.6) * 26 : 0, 0);

  /* あし */
  ctx.strokeStyle = '#6b7078'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-5, -22); ctx.lineTo(-10 + step * 4, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(5, -22); ctx.lineTo(10 - step * 4, 0); ctx.stroke();

  /* ねじの じくと ねじやま */
  rustFill(ctx, -8, -60, 16, 40, '#b8bec6', '#7d858e');
  roundRect(ctx, -8, -60, 16, 40, 3); ctx.fill();
  ctx.strokeStyle = 'rgba(90,96,104,.9)'; ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(-8, -56 + i * 8); ctx.lineTo(8, -52 + i * 8);
    ctx.stroke();
  }
  ctx.fillStyle = '#8d959d';
  ctx.beginPath(); ctx.moveTo(-8, -22); ctx.lineTo(8, -22); ctx.lineTo(0, -12); ctx.closePath(); ctx.fill();

  /* うで */
  ctx.strokeStyle = '#6b7078'; ctx.lineWidth = 3.4;
  ctx.beginPath(); ctx.moveTo(-7, -48); ctx.lineTo(-17, -40 + step * 3); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(7, -48); ctx.lineTo(17, -40 - step * 3); ctx.stroke();

  /* あたま（まわる）*/
  ctx.save();
  ctx.translate(0, -68);
  ctx.rotate(spin);
  rustFill(ctx, -18, -10, 36, 20, '#d0d6dd', '#98a0a8');
  ellipse(ctx, 0, 0, 18, 10); ctx.fill();
  ctx.strokeStyle = '#5a6068'; ctx.lineWidth = 3.4; ctx.lineCap = 'butt';
  ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(12, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(0, 7); ctx.stroke();
  rustSpots(ctx, 0, 0, 30, 16, 1);
  ctx.restore();

  /* かいてんの かぜ */
  if (a >= 0) {
    ctx.strokeStyle = 'rgba(200,210,220,' + (0.3 + a * 0.4) + ')';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(0, -68, 22 + i * 5, -0.6 + s.t * 9, 0.6 + s.t * 9);
      ctx.stroke();
    }
  }
  ctx.restore();
}


/* ---- ② ハコボット：ダンボールの はこロボ ---- */
function drawHakobot(ctx, s) {
  const a = s.atk;
  const push = (a >= 0) ? a * 8 : 0;
  ctx.save();
  const step = Math.sin(s.t * 3.4) * (s.moving ? 1 : 0);
  ctx.translate(push, 0);

  /* あし */
  ctx.fillStyle = '#5a6068';
  roundRect(ctx, -18 - step * 3, -16, 12, 16, 4); ctx.fill();
  roundRect(ctx,   6 + step * 3, -16, 12, 16, 4); ctx.fill();

  /* うで（パイプ）*/
  ctx.strokeStyle = '#7d858e'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-22, -46); ctx.lineTo(-32, -30); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(22, -46); ctx.lineTo(34, -34 - push * 0.4); ctx.stroke();

  /* はこ の からだ */
  const g = ctx.createLinearGradient(0, -74, 0, -14);
  g.addColorStop(0, '#c9a878');
  g.addColorStop(1, '#9c7b4e');
  ctx.fillStyle = g;
  roundRect(ctx, -24, -74, 48, 60, 4); ctx.fill();
  ctx.strokeStyle = 'rgba(90,60,30,.5)'; ctx.lineWidth = 2;
  roundRect(ctx, -24, -74, 48, 60, 4); ctx.stroke();
  /* テープ */
  ctx.fillStyle = 'rgba(220,205,170,.6)';
  ctx.fillRect(-24, -50, 48, 7);
  /* ラベル */
  ctx.fillStyle = '#efe4d0';
  ctx.fillRect(6, -34, 14, 12);
  ctx.fillStyle = '#5a4a34';
  for (let i = 0; i < 4; i++) ctx.fillRect(8 + i * 3, -32, 1.4, 8);

  /* め */
  botEye(ctx, -10, -62, 4.4, '#ffd54f');
  botEye(ctx, 10, -62, 4.4, '#ffd54f');
  ctx.restore();
}


/* ---- ③ サビンチ：さびた ペンチ ---- */
function drawSabinchi(ctx, s) {
  const a = s.atk;
  const open = (a >= 0) ? (0.36 - a * 0.34) : 0.3 + Math.sin(s.t * 3) * 0.05;
  ctx.save();
  const step = Math.sin(s.t * 7) * (s.moving ? 1 : 0);
  ctx.translate(0, -Math.abs(step) * 1.6);

  /* もちて（あかい 2ほんの あし）*/
  ctx.strokeStyle = '#b03a2e'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-4, -34); ctx.lineTo(-16 + step * 4, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(4, -34); ctx.lineTo(14 - step * 4, 0); ctx.stroke();
  ctx.strokeStyle = 'rgba(60,20,15,.35)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-8, -20); ctx.lineTo(-14, -8); ctx.stroke();

  /* ちゅうしんの ねじ */
  ctx.fillStyle = '#8d959d';
  ctx.beginPath(); ctx.arc(0, -38, 7, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#5a6068'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-4, -38); ctx.lineTo(4, -38); ctx.stroke();

  /* はさむ ぶぶん（ギザギザ）*/
  for (const d of [-1, 1]) {
    ctx.save();
    ctx.translate(0, -38);
    ctx.rotate(d * open);
    rustFill(ctx, 4, -8, 40, 16, '#c7a58a', '#8a5a3a');
    ctx.beginPath();
    ctx.moveTo(4, -6 * d);
    ctx.lineTo(44, -2 * d);
    ctx.lineTo(44, 4 * d);
    ctx.lineTo(4, 7 * d);
    ctx.closePath(); ctx.fill();
    /* ギザギザ */
    ctx.fillStyle = '#6b4a30';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(12 + i * 6, 5 * d);
      ctx.lineTo(15 + i * 6, 1 * d);
      ctx.lineTo(18 + i * 6, 5 * d);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  /* め（ひとつめ）*/
  ctx.fillStyle = '#efe4d0';
  ctx.beginPath(); ctx.arc(-2, -50, 8.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2b2320';
  ctx.beginPath(); ctx.arc(0, -50, 4.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(-2, -52, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}


/* ---- ④ バーナー君：ほのおを ふく ガスボンベ ---- */
function drawBurner(ctx, s) {
  const a = s.atk;
  ctx.save();
  const step = Math.sin(s.t * 5) * (s.moving ? 1 : 0);
  ctx.translate(0, -Math.abs(step) * 1.2);

  /* しゃりん */
  ctx.fillStyle = '#3a3430';
  ctx.beginPath(); ctx.arc(-6, -9, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#6b7078';
  ctx.beginPath(); ctx.arc(-6, -9, 4, 0, Math.PI * 2); ctx.fill();

  /* ボンベ */
  const g = ctx.createLinearGradient(-18, 0, 18, 0);
  g.addColorStop(0, '#a8382a');
  g.addColorStop(0.4, '#d2503c');
  g.addColorStop(1, '#8a2c20');
  ctx.fillStyle = g;
  roundRect(ctx, -17, -72, 34, 58, 14); ctx.fill();
  rustSpots(ctx, 0, -44, 30, 46, 3);
  /* ライン */
  ctx.strokeStyle = 'rgba(255,220,200,.35)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-13, -60); ctx.lineTo(-13, -22); ctx.stroke();

  /* おこった め */
  ctx.strokeStyle = '#2b1b12'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-12, -58); ctx.lineTo(-3, -53); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(12, -58); ctx.lineTo(3, -53); ctx.stroke();
  ctx.fillStyle = '#fff59d';
  ctx.beginPath(); ctx.arc(-7, -47, 3.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(7, -47, 3.2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#2b1b12'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, -34, 6, 0.2, Math.PI - 0.2); ctx.stroke();

  /* うえの ノズル */
  ctx.strokeStyle = '#8d959d'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -72);
  ctx.quadraticCurveTo(6, -90, 22, -86);
  ctx.stroke();
  ctx.fillStyle = '#6b7078';
  roundRect(ctx, 20, -92, 16, 11, 3); ctx.fill();

  /* ほのお */
  const fl = (a >= 0) ? 18 + a * 26 : 12 + Math.sin(s.t * 14) * 3;
  const fg = ctx.createLinearGradient(36, -86, 36 + fl, -86);
  fg.addColorStop(0, 'rgba(255,255,200,.95)');
  fg.addColorStop(0.4, 'rgba(255,152,0,.85)');
  fg.addColorStop(1, 'rgba(255,87,34,0)');
  ctx.fillStyle = fg;
  ctx.beginPath();
  ctx.moveTo(36, -92);
  ctx.quadraticCurveTo(36 + fl * 0.6, -94 - Math.sin(s.t * 18) * 3, 36 + fl, -86);
  ctx.quadraticCurveTo(36 + fl * 0.6, -78 + Math.sin(s.t * 16) * 3, 36, -80);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}


/* ---- ⑤ ポタンク：みずを ふんしゃする タンク ---- */
function drawPotank(ctx, s) {
  const a = s.atk;
  ctx.save();
  const step = Math.sin(s.t * 3.2) * (s.moving ? 1 : 0);

  /* キャタピラ */
  ctx.fillStyle = '#3a3430';
  roundRect(ctx, -30, -18, 60, 18, 9); ctx.fill();
  ctx.fillStyle = '#6b7078';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(-22 + i * 11, -9, 4.2, 0, Math.PI * 2); ctx.fill();
  }

  /* タンク */
  const g = ctx.createLinearGradient(0, -70, 0, -18);
  g.addColorStop(0, '#5fa8d8');
  g.addColorStop(1, '#2f6f9e');
  ctx.fillStyle = g;
  roundRect(ctx, -28, -70, 56, 54, 16); ctx.fill();
  ctx.strokeStyle = 'rgba(20,60,90,.4)'; ctx.lineWidth = 2;
  roundRect(ctx, -28, -70, 56, 54, 16); ctx.stroke();
  rustSpots(ctx, 0, -44, 46, 42, 5);
  /* ハイライト */
  ctx.fillStyle = 'rgba(255,255,255,.25)';
  roundRect(ctx, -22, -64, 12, 32, 6); ctx.fill();

  /* め */
  ctx.fillStyle = '#efe4d0';
  roundRect(ctx, -16, -56, 32, 13, 6); ctx.fill();
  ctx.fillStyle = '#2b2320';
  ctx.beginPath(); ctx.arc(-7, -50, 3.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(7, -50, 3.6, 0, Math.PI * 2); ctx.fill();

  /* パイプ */
  ctx.strokeStyle = '#8d959d'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(20, -50); ctx.lineTo(40, -44); ctx.stroke();
  ctx.fillStyle = '#6b7078';
  roundRect(ctx, 38, -50, 12, 12, 3); ctx.fill();

  /* みずの ふんしゃ */
  const w = (a >= 0) ? 16 + a * 30 : 0;
  if (w > 0) {
    ctx.fillStyle = 'rgba(79,195,247,.7)';
    ctx.beginPath();
    ctx.moveTo(50, -48);
    ctx.quadraticCurveTo(50 + w * 0.7, -50, 50 + w, -40);
    ctx.quadraticCurveTo(50 + w * 0.7, -34, 50, -38);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(179,229,252,.8)';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(52 + i * w * 0.32, -44 + Math.sin(s.t * 14 + i) * 4, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}


/* ---- ⑥ モジャコード：からまった コードのかたまり ---- */
function drawMojacord(ctx, s) {
  const a = s.atk;
  ctx.save();
  const wob = Math.sin(s.t * 4) * (s.moving ? 2.4 : 1);
  ctx.translate(wob * 0.4, 0);

  /* あし（コードの たば）*/
  ctx.strokeStyle = '#2b2b30'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-8, -22); ctx.quadraticCurveTo(-16, -10, -12, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(8, -22); ctx.quadraticCurveTo(16, -10, 12, 0); ctx.stroke();

  /* モジャモジャの かたまり */
  const cols = ['#2b2b30', '#4a4a52', '#6b6b74', '#3d5a3d', '#5a4a2a'];
  for (let i = 0; i < 16; i++) {
    ctx.strokeStyle = cols[i % cols.length];
    ctx.lineWidth = 4;
    const an = (i / 16) * Math.PI * 2;
    const r1 = 16 + (i % 4) * 4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(an) * r1 * 0.4, -44 + Math.sin(an) * r1 * 0.3);
    ctx.quadraticCurveTo(
      Math.cos(an) * r1 * 1.3 + Math.sin(s.t * 3 + i) * 3,
      -44 + Math.sin(an) * r1 * 0.9,
      Math.cos(an + 0.7) * r1 * 1.1,
      -44 + Math.sin(an + 0.7) * r1 * 0.8);
    ctx.stroke();
  }

  /* みどりの つた */
  ctx.strokeStyle = '#6d9e3a'; ctx.lineWidth = 2.6;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-18 + i * 12, -30);
    ctx.quadraticCurveTo(-14 + i * 12, -46, -20 + i * 12, -60);
    ctx.stroke();
    ctx.fillStyle = '#8bc34a';
    ellipse(ctx, -20 + i * 12, -60, 4, 2.6); ctx.fill();
  }

  /* ひかる め */
  botEye(ctx, -6, -46, 4.6, '#b9f6ca');
  botEye(ctx, 9, -47, 4.6, '#b9f6ca');

  /* プラグ（こうげきの とき まえに のびる）*/
  const ex = (a >= 0) ? 26 + a * 22 : 24;
  ctx.strokeStyle = '#2b2b30'; ctx.lineWidth = 4.5; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(14, -44);
  ctx.quadraticCurveTo(ex * 0.7, -52, ex, -42);
  ctx.stroke();
  ctx.fillStyle = '#efe4d0';
  roundRect(ctx, ex - 2, -49, 12, 14, 3); ctx.fill();
  ctx.fillStyle = '#8d959d';
  ctx.fillRect(ex + 10, -46, 6, 3);
  ctx.fillRect(ex + 10, -40, 6, 3);
  ctx.restore();
}


/* ---- ⑦ フォークン：フォークリフト ---- */
function drawForkun(ctx, s) {
  const a = s.atk;
  const lift = (a >= 0) ? (a < 0.6 ? -a * 10 : (a - 0.6) * 40) : 0;
  ctx.save();
  ctx.translate(lift, 0);

  /* しゃりん */
  ctx.fillStyle = '#2b2b30';
  ctx.beginPath(); ctx.arc(-22, -12, 12, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(16, -10, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#6b7078';
  ctx.beginPath(); ctx.arc(-22, -12, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(16, -10, 4, 0, Math.PI * 2); ctx.fill();

  /* しゃたい（きいろ）*/
  const g = ctx.createLinearGradient(0, -56, 0, -14);
  g.addColorStop(0, '#f0b429');
  g.addColorStop(1, '#c98a12');
  ctx.fillStyle = g;
  roundRect(ctx, -34, -56, 52, 42, 6); ctx.fill();
  rustSpots(ctx, -8, -34, 44, 34, 7);

  /* うんてんせき の やね */
  ctx.strokeStyle = '#5a6068'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-30, -56); ctx.lineTo(-30, -86); ctx.lineTo(-2, -86); ctx.lineTo(-2, -56); ctx.stroke();
  ctx.fillStyle = '#6b7078';
  ctx.fillRect(-34, -90, 36, 5);

  /* ひかる め */
  botEye(ctx, 0, -44, 4.6, '#ffd54f');
  botEye(ctx, 12, -44, 4.6, '#ffd54f');

  /* マスト と フォーク */
  ctx.fillStyle = '#5a6068';
  ctx.fillRect(20, -78, 7, 66);
  ctx.fillRect(29, -70, 5, 58);
  ctx.fillStyle = '#8d959d';
  roundRect(ctx, 26, -26, 34, 7, 2); ctx.fill();
  roundRect(ctx, 26, -14, 34, 7, 2); ctx.fill();
  /* さきの ひかり */
  if (a >= 0 && a > 0.6) {
    ctx.strokeStyle = 'rgba(255,213,79,' + (1 - (a - 0.6) / 0.4) + ')';
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(62 + i * 6, -34 + i * 3); ctx.lineTo(74 + i * 6, -24 + i * 3);
      ctx.stroke();
    }
  }
  ctx.restore();
}


/* ---- ⑧ プレスケ：じめんごと おしつぶす プレス ---- */
function drawPressuke(ctx, s) {
  const a = s.atk;
  const press = (a >= 0) ? (a < 0.55 ? -a * 12 : (a - 0.55) / 0.45 * 46 - 6.6) : 0;
  ctx.save();

  /* した の だい */
  ctx.fillStyle = '#4a4a52';
  roundRect(ctx, -40, -22, 80, 22, 4); ctx.fill();
  /* とらもよう */
  ctx.fillStyle = '#f0b429';
  ctx.fillRect(-40, -22, 80, 8);
  ctx.fillStyle = '#2b2b30';
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(-40 + i * 11, -22); ctx.lineTo(-34 + i * 11, -22);
    ctx.lineTo(-40 + i * 11, -14); ctx.lineTo(-46 + i * 11, -14);
    ctx.closePath(); ctx.fill();
  }

  /* はしら */
  ctx.fillStyle = '#6b7078';
  ctx.fillRect(-34, -96, 9, 76);
  ctx.fillRect(25, -96, 9, 76);

  /* うえの プレスばん（うごく）*/
  ctx.save();
  ctx.translate(0, press);
  const g = ctx.createLinearGradient(0, -96, 0, -66);
  g.addColorStop(0, '#8d959d');
  g.addColorStop(1, '#5a6068');
  ctx.fillStyle = g;
  roundRect(ctx, -42, -96, 84, 30, 4); ctx.fill();
  ctx.fillStyle = '#f0b429';
  ctx.fillRect(-42, -72, 84, 6);
  ctx.fillStyle = '#2b2b30';
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(-42 + i * 11, -72); ctx.lineTo(-36 + i * 11, -72);
    ctx.lineTo(-42 + i * 11, -66); ctx.lineTo(-48 + i * 11, -66);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();

  /* かお（まんなかの ボディ）*/
  ctx.fillStyle = '#7d858e';
  roundRect(ctx, -22, -62, 44, 36, 5); ctx.fill();
  rustSpots(ctx, 0, -44, 36, 30, 9);
  ctx.fillStyle = '#2b2320';
  ctx.beginPath(); ctx.arc(-8, -48, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(8, -48, 4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#2b2320'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  ctx.beginPath();
  if (a >= 0) ctx.arc(0, -36, 7, Math.PI * 1.15, Math.PI * 1.85);
  else        ctx.moveTo(-7, -36), ctx.lineTo(7, -36);
  ctx.stroke();

  /* おしつぶした しょうげき */
  if (a >= 0 && a > 0.9) {
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3;
    for (let i = 0; i < 2; i++) {
      ctx.beginPath(); ctx.arc(0, -8, 40 + i * 16, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    }
  }
  ctx.restore();
}


/* ---- ⑨ ガラク帝：はがねの おう（ちゅうボス）---- */
function drawGarakutei(ctx, s) {
  const a = s.atk;
  const rage = !!s.enraged;
  const swing = (a >= 0) ? (a < 0.6 ? -a * 2.2 : (a - 0.6) / 0.4 * 3.4 - 1.32) : -0.4;
  ctx.save();
  const step = Math.sin(s.t * 2.8) * (s.moving ? 1 : 0);

  /* あし */
  ctx.fillStyle = '#4a4a52';
  roundRect(ctx, -30 - step * 4, -34, 22, 34, 6); ctx.fill();
  roundRect(ctx,   8 + step * 4, -34, 22, 34, 6); ctx.fill();
  ctx.fillStyle = '#2b2b30';
  ctx.fillRect(-32 - step * 4, -8, 26, 8);
  ctx.fillRect(6 + step * 4, -8, 26, 8);

  /* どうたい（スクラップ）*/
  const g = ctx.createLinearGradient(0, -104, 0, -30);
  g.addColorStop(0, '#8d959d');
  g.addColorStop(1, '#4a4a52');
  ctx.fillStyle = g;
  roundRect(ctx, -34, -104, 68, 72, 8); ctx.fill();
  rustSpots(ctx, 0, -68, 58, 62, 11);
  /* はりつけた てっぱん */
  ctx.fillStyle = 'rgba(120,80,50,.5)';
  ctx.fillRect(-26, -90, 22, 16);
  ctx.fillRect(4, -66, 26, 14);
  ctx.strokeStyle = '#3a3430'; ctx.lineWidth = 1.6;
  ctx.strokeRect(-26, -90, 22, 16);
  ctx.strokeRect(4, -66, 26, 14);

  /* うしろの うで */
  ctx.fillStyle = '#5a6068';
  roundRect(ctx, -48, -98, 18, 44, 8); ctx.fill();

  /* まえの うで＋ハンマー */
  ctx.save();
  ctx.translate(30, -94);
  ctx.rotate(swing);
  ctx.fillStyle = '#6b7078';
  roundRect(ctx, -6, -9, 34, 19, 8); ctx.fill();
  ctx.fillStyle = '#8d959d';
  roundRect(ctx, 26, -22, 26, 44, 5); ctx.fill();
  ctx.strokeStyle = '#3a3430'; ctx.lineWidth = 2;
  roundRect(ctx, 26, -22, 26, 44, 5); ctx.stroke();
  ctx.restore();

  /* あたま */
  ctx.save();
  ctx.translate(2, -124);
  ctx.fillStyle = '#7d858e';
  roundRect(ctx, -24, -22, 48, 40, 6); ctx.fill();
  rustSpots(ctx, 0, 0, 40, 32, 13);
  /* あかい め */
  botEye(ctx, -10, -4, 5, rage ? '#ff1744' : '#ff5252');
  botEye(ctx, 11, -4, 5, rage ? '#ff1744' : '#ff5252');
  /* くちの こうし */
  ctx.fillStyle = '#2b2320';
  ctx.fillRect(-14, 6, 28, 9);
  ctx.strokeStyle = '#8d959d'; ctx.lineWidth = 1.6;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath(); ctx.moveTo(-12 + i * 6, 6); ctx.lineTo(-12 + i * 6, 15); ctx.stroke();
  }
  /* かんむり */
  ctx.fillStyle = '#f0b429';
  ctx.beginPath();
  ctx.moveTo(-22, -22);
  ctx.lineTo(-16, -40); ctx.lineTo(-8, -26);
  ctx.lineTo(0, -44); ctx.lineTo(8, -26);
  ctx.lineTo(16, -40); ctx.lineTo(22, -22);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#a87a10'; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.fillStyle = '#e53935';
  ctx.beginPath(); ctx.arc(0, -28, 3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  if (rage) {
    ctx.strokeStyle = 'rgba(255,82,82,' + (0.3 + Math.sin(s.t * 10) * 0.2) + ')';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(0, -70, 62, 76, 0, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}


/* ---- ⑩ 廃炉獣メルトギア：さいしゅうボス ---- */
function drawMeltgear(ctx, s) {
  const a = s.atk;
  const rage = !!s.enraged;
  ctx.save();
  const step = Math.sin(s.t * 2.2) * (s.moving ? 1 : 0);
  ctx.translate(0, -Math.abs(step) * 2);

  /* あし 4ほん（キャタピラ）*/
  ctx.fillStyle = '#2b2b30';
  for (const [lx, sw] of [[-46, -step * 4], [-16, step * 4], [16, step * 4], [46, -step * 4]]) {
    roundRect(ctx, lx + sw - 13, -32, 26, 32, 7); ctx.fill();
  }

  /* えんとつ */
  for (const [cx, ch] of [[-40, 44], [-22, 58], [-4, 38]]) {
    ctx.fillStyle = '#5a6068';
    ctx.fillRect(cx - 7, -110 - ch, 14, ch + 12);
    ctx.fillStyle = '#3a3430';
    ctx.fillRect(cx - 9, -112 - ch, 18, 6);
    /* けむり */
    ctx.fillStyle = 'rgba(120,120,130,.4)';
    for (let i = 0; i < 3; i++) {
      const t2 = (s.t * 0.5 + i * 0.33) % 1;
      ctx.beginPath();
      ctx.arc(cx + Math.sin(s.t + i) * 5, -118 - ch - t2 * 30, 5 + t2 * 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* どうたい（ろ）*/
  const g = ctx.createLinearGradient(0, -114, 0, -28);
  g.addColorStop(0, '#6b5a4a');
  g.addColorStop(1, '#3a3028');
  ctx.fillStyle = g;
  roundRect(ctx, -58, -114, 116, 86, 12); ctx.fill();
  rustSpots(ctx, 0, -70, 100, 76, 17);
  /* ボルト */
  ctx.fillStyle = '#8d959d';
  for (let i = 0; i < 6; i++) {
    ctx.beginPath(); ctx.arc(-50 + i * 20, -108, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-50 + i * 20, -34, 3, 0, Math.PI * 2); ctx.fill();
  }

  /* ひかる め */
  botEye(ctx, 16, -92, 6.5, rage ? '#fff176' : '#ff7043');
  botEye(ctx, 42, -92, 6.5, rage ? '#fff176' : '#ff7043');

  /* とけた くち（ろの ひぐち）*/
  const open = (a >= 0) ? 16 + a * 14 : 12 + Math.sin(s.t * 4) * 2;
  ctx.fillStyle = '#2b1b12';
  roundRect(ctx, -18, -76, 74, open + 26, 8); ctx.fill();
  const mg = ctx.createLinearGradient(0, -76, 0, -76 + open + 26);
  mg.addColorStop(0, rage ? '#fff59d' : '#ffb300');
  mg.addColorStop(0.5, '#ff6d00');
  mg.addColorStop(1, '#bf360c');
  ctx.fillStyle = mg;
  roundRect(ctx, -14, -72, 66, open + 18, 6); ctx.fill();
  /* きば */
  ctx.fillStyle = '#c9bfa0';
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(-12 + i * 11, -72); ctx.lineTo(-7 + i * 11, -62); ctx.lineTo(-2 + i * 11, -72);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-12 + i * 11, -72 + open + 18); ctx.lineTo(-7 + i * 11, -82 + open + 18); ctx.lineTo(-2 + i * 11, -72 + open + 18);
    ctx.closePath(); ctx.fill();
  }

  /* せなかの ギア */
  ctx.save();
  ctx.translate(-34, -104);
  ctx.rotate(s.t * (rage ? 3.2 : 1.2));
  ctx.fillStyle = '#8d959d';
  for (let i = 0; i < 8; i++) {
    const an = (i / 8) * Math.PI * 2;
    ctx.fillRect(Math.cos(an) * 16 - 4, Math.sin(an) * 16 - 4, 8, 8);
  }
  ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3a3430';
  ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  if (rage) {
    ctx.strokeStyle = 'rgba(255,152,0,' + (0.35 + Math.sin(s.t * 12) * 0.25) + ')';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.ellipse(0, -72, 84, 78, 0, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}


/* ---- 下手なきりん（ボス）：わざと ガタガタの え ---- */
function drawHetakirin(ctx, s) {
  ctx.save();
  const sway = Math.sin(s.t * 1.6) * 3;

  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const OUT = '#5d4037';   // ふとい えんぴつの せん
  const BODY = '#ffd54f';

  // あし（4ほん、ながさ バラバラ）
  ctx.strokeStyle = OUT; ctx.lineWidth = 5;
  const legs = [[-26, -6], [-13, 2], [11, -3], [24, 4]];
  for (let i = 0; i < legs.length; i++) {
    ctx.beginPath();
    roughLine(ctx, legs[i][0], -44, legs[i][0] + legs[i][1], -1, i * 31, 5);
    ctx.stroke();
  }

  // どうたい（ガタガタの まる）
  ctx.beginPath(); roughCircle(ctx, 0, -60, 32, 100, 7); ctx.closePath();
  ctx.fillStyle = BODY; ctx.fill();
  ctx.strokeStyle = OUT; ctx.lineWidth = 4; ctx.stroke();

  // もよう（へたくそな まだら）
  ctx.fillStyle = '#a1662f';
  for (let i = 0; i < 5; i++) {
    const px = -20 + srand(i * 3) * 40;
    const py = -78 + srand(i * 9) * 34;
    ctx.beginPath(); roughCircle(ctx, px, py, 6 + srand(i) * 4, 200 + i * 17, 4); ctx.closePath(); ctx.fill();
  }

  // くび（ながい、かたむいてる）
  ctx.save();
  ctx.translate(14, -78);
  ctx.rotate((sway * 0.01) - 0.12);
  ctx.strokeStyle = OUT; ctx.lineWidth = 4;
  ctx.fillStyle = BODY;
  ctx.beginPath();
  ctx.moveTo(-9, 6);
  roughLine(ctx, -9, 6, -3, -66, 400, 6);
  ctx.lineTo(15, -64);
  roughLine(ctx, 15, -64, 12, 4, 420, 6);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // あたま（バランス おかしい）
  ctx.beginPath(); roughCircle(ctx, 8, -74, 15, 500, 5); ctx.closePath();
  ctx.fill(); ctx.stroke();

  // くち（ながく つきでてる）
  ctx.beginPath(); roughCircle(ctx, 24, -68, 9, 520, 4); ctx.closePath();
  ctx.fillStyle = '#ffe082'; ctx.fill(); ctx.stroke();

  // つの（ながさ ちがう）
  ctx.lineWidth = 3.5;
  ctx.beginPath(); roughLine(ctx, 2, -87, -1, -101, 600, 4); ctx.stroke();
  ctx.beginPath(); roughLine(ctx, 12, -88, 16, -98, 620, 4); ctx.stroke();
  ctx.fillStyle = '#795548';
  ctx.beginPath(); ctx.arc(-1, -102, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(16, -99, 3, 0, Math.PI * 2); ctx.fill();

  // め（ひだりと みぎで おおきさ ちがう）
  ctx.fillStyle = '#fff';
  ctx.beginPath(); roughCircle(ctx, 6, -78, 5.5, 700, 2.5); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); roughCircle(ctx, 16, -79, 4, 720, 2.5); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#3e2723';
  ctx.beginPath(); ctx.arc(7.5, -77, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(17, -79.5, 2, 0, Math.PI * 2); ctx.fill();

  // くち（もぐもぐ / くさが みえる）
  ctx.strokeStyle = OUT; ctx.lineWidth = 2.2;
  ctx.beginPath(); roughLine(ctx, 20, -64, 30, -63, 740, 3); ctx.stroke();
  if (s.atk >= 0) {
    ctx.fillStyle = '#7cb342';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(28 + i * 2, -66 - i * 2 - s.atk * 6, 3, 6, 0.6 + i * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // しっぽ
  ctx.strokeStyle = OUT; ctx.lineWidth = 3.5;
  ctx.beginPath(); roughLine(ctx, -30, -64, -44, -46 + sway, 800, 5); ctx.stroke();
  ctx.fillStyle = '#5d4037';
  ctx.beginPath(); ctx.arc(-44, -45 + sway, 4, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}


/* ほしの かたちを かく（ほしくん ／ ほしの たま で つかう）*/
function starPath(ctx, cx, cy, rOut, rIn, rot) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = (i % 2 === 0) ? rOut : rIn;
    const a = (rot || 0) - Math.PI / 2 + i * Math.PI / 5;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/* ---- ほしくん：きいろい ほしの からだ ＋ たてながの あたま ---- */
function drawHoshikun(ctx, s) {
  const bob = Math.sin(s.t * 3) * 2 + (s.moving ? Math.sin(s.t * 9) * 1.5 : 0);
  const charge = s.atk >= 0 ? s.atk : 0;
  const Y = '#e8bf2e', Y2 = '#f5d356';

  ctx.save();
  ctx.translate(0, bob);

  // からだ（ほし）
  ctx.fillStyle = Y;
  starPath(ctx, 0, -34, 38, 16, 0);
  ctx.fill();

  // あたま（たてながの かどまる）
  ctx.fillStyle = Y2;
  roundRect(ctx, -13, -104, 26, 58, 9); ctx.fill();
  ctx.fillStyle = Y;
  roundRect(ctx, -13, -104, 26, 58, 9);

  // め（2ほんの たてせん）
  ctx.strokeStyle = '#20202a'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
  const eyeH = 22 - charge * 6;
  ctx.beginPath(); ctx.moveTo(-5, -96); ctx.lineTo(-5, -96 + eyeH); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(5, -96);  ctx.lineTo(5, -96 + eyeH);  ctx.stroke();

  // なげる まえの ほしを ためる
  if (charge > 0) {
    ctx.save();
    ctx.translate(30 + charge * 8, -62);
    ctx.rotate(s.t * 6);
    ctx.fillStyle = 'rgba(255,241,118,' + (0.5 + charge * 0.5) + ')';
    starPath(ctx, 0, 0, 8 + charge * 7, 3.5 + charge * 3, 0);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}


/* ---- コンガラガーン：あおい あたま・オレンジの からだ・やじるしの て ---- */
function drawKongaragan(ctx, s) {
  const step = Math.sin(s.t * 8) * (s.moving ? 1 : 0);
  const reach = s.atk >= 0 ? s.atk : 0;     // てを のばす ぐあい
  const BLUE = '#1f39c4', ORANGE = '#d9832a', ARM = '#63b3e0';

  ctx.save();

  /* あし（くろい だ円 2つ）*/
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.ellipse(-9, -8 + step * 1.5, 8, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(9, -8 - step * 1.5, 8, 10, 0, 0, Math.PI * 2); ctx.fill();

  /* からだ（うえが せまい だいけい）*/
  ctx.fillStyle = ORANGE;
  ctx.beginPath();
  ctx.moveTo(-12, -78); ctx.lineTo(12, -78); ctx.lineTo(24, -14); ctx.lineTo(-24, -14);
  ctx.closePath(); ctx.fill();

  /* うで（りょうがわに のびる みずいろの やじるし）*/
  const baseY = -62;
  const leftLen  = 34;
  const rightLen = 34 + reach * 34;         // まえの てが のびる
  ctx.fillStyle = ARM;
  // よこぼう
  ctx.fillRect(-leftLen, baseY - 5, leftLen + rightLen, 10);
  // ひだりの やじり
  ctx.beginPath();
  ctx.moveTo(-leftLen - 16, baseY); ctx.lineTo(-leftLen, baseY - 13); ctx.lineTo(-leftLen, baseY + 13);
  ctx.closePath(); ctx.fill();
  // みぎの やじり（こうげきの さき）
  ctx.beginPath();
  ctx.moveTo(rightLen + 17, baseY); ctx.lineTo(rightLen, baseY - 14); ctx.lineTo(rightLen, baseY + 14);
  ctx.closePath(); ctx.fill();
  if (reach > 0.55) {                        // のばしきる ときの ひかり
    ctx.fillStyle = 'rgba(255,255,255,' + ((reach - 0.55) * 1.2).toFixed(2) + ')';
    ctx.beginPath();
    ctx.moveTo(rightLen + 17, baseY); ctx.lineTo(rightLen + 2, baseY - 9); ctx.lineTo(rightLen + 2, baseY + 9);
    ctx.closePath(); ctx.fill();
  }

  /* あたま（あおい しかく）*/
  ctx.fillStyle = BLUE;
  ctx.fillRect(-21, -122, 42, 44);
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.fillRect(-21, -122, 42, 12);

  /* め（メタルらしい ひかる せん）*/
  ctx.fillStyle = '#8fd7ff';
  ctx.fillRect(2, -108, 12, 4);
  ctx.fillRect(-14, -108, 12, 4);

  ctx.restore();
}


/* ---- お菓子マン（おおボス）：やじるしで できた おかしの きょじん ---- */
function drawOkashiman(ctx, s) {
  ctx.save();
  const Y = '#f5c518', Y2 = '#e0a800', G = '#5cb85c', ST = '#9e9e9e';
  const sway = Math.sin(s.t * 1.4) * 2;

  /* あし（みどりの したむき やじるし）*/
  ctx.fillStyle = G;
  ctx.beginPath();
  ctx.moveTo(-15, -40); ctx.lineTo(15, -40); ctx.lineTo(15, -20);
  ctx.lineTo(27, -20); ctx.lineTo(9, -1); ctx.lineTo(4, -14);
  ctx.lineTo(-4, -14); ctx.lineTo(-9, -1); ctx.lineTo(-27, -20);
  ctx.lineTo(-15, -20);
  ctx.closePath(); ctx.fill();

  /* うで（きいろい したむき やじるし 2ほん）*/
  ctx.fillStyle = Y;
  for (const ax of [-46, 46]) {
    ctx.beginPath();
    ctx.moveTo(ax - 10, -96); ctx.lineTo(ax + 10, -96); ctx.lineTo(ax + 10, -56);
    ctx.lineTo(ax + 20, -56); ctx.lineTo(ax, -32); ctx.lineTo(ax - 20, -56);
    ctx.lineTo(ax - 10, -56);
    ctx.closePath(); ctx.fill();
  }

  /* どうたい */
  ctx.fillStyle = Y;
  roundRect(ctx, -26, -98, 52, 52, 4); ctx.fill();
  ctx.fillStyle = G;                    // したの みどり
  roundRect(ctx, -26, -50, 52, 12, 3); ctx.fill();

  /* からだの おかし */
  // だんご（3れんの まるい おだんご）
  ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(-19, -92); ctx.lineTo(-19, -74); ctx.stroke();
  const dango = ['#f8bbd0', '#ffffff', '#a5d6a7'];
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = dango[i];
    ctx.beginPath(); ctx.arc(-19, -88 + i * 5.5, 3.4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#00000022'; ctx.lineWidth = 0.8; ctx.stroke();
  }
  // ペロペロキャンディ 2つ
  for (const [cx, cy] of [[-3, -87], [12, -87]]) {
    ctx.strokeStyle = '#795548'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(cx, cy + 4); ctx.lineTo(cx, cy + 11); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ec407a'; ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let a = 0; a < 10; a++) {
      const r = a * 0.5, an = a * 0.85;
      const px = cx + Math.cos(an) * r, py = cy + Math.sin(an) * r;
      if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  // クッキー
  ctx.fillStyle = '#c68642';
  ctx.beginPath(); ctx.arc(10, -68, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5d4037';
  for (const [dx, dy] of [[-2, -2], [2, 1], [-1, 3]]) {
    ctx.beginPath(); ctx.arc(10 + dx, -68 + dy, 1.2, 0, Math.PI * 2); ctx.fill();
  }
  // ようかん
  ctx.fillStyle = '#4e342e';
  roundRect(ctx, -22, -72, 12, 9, 2); ctx.fill();
  ctx.fillStyle = '#2e7d32';
  roundRect(ctx, -22, -72, 12, 3.5, 2); ctx.fill();

  /* あたま */
  ctx.fillStyle = Y;
  ctx.beginPath(); ctx.ellipse(0, -110, 22, 19, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = Y2;
  ctx.beginPath(); ctx.ellipse(0, -103, 20, 10, 0, 0, Math.PI); ctx.fill();
  // め（するどい）
  ctx.fillStyle = '#3e2723';
  ctx.beginPath(); ctx.ellipse(7, -114, 2.6, 3.6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-6, -114, 2.6, 3.6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#3e2723'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(2, -121); ctx.lineTo(11, -118); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-11, -121); ctx.lineTo(-2, -118); ctx.stroke();

  /* あたまの うえの いし（こうげき ちゅうは もちあげて ゆれる）*/
  const lift = s.atk >= 0 ? s.atk * 12 : 0;
  const shake = s.atk >= 0 ? Math.sin(s.t * 40) * s.atk * 3 : sway * 0.5;
  ctx.save();
  ctx.translate(shake, -lift);
  const gs = ctx.createRadialGradient(-6, -146, 3, 0, -142, 24);
  gs.addColorStop(0, '#cfcfcf'); gs.addColorStop(1, '#7d7d7d');
  ctx.fillStyle = gs;
  ctx.beginPath(); ctx.arc(0, -142, 22, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = ST; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.beginPath(); ctx.arc(7, -136, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(-8, -149, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  ctx.restore();
}


/* ==================================================================
   なまえ ↔ かんすう の たいおうひょう
   （がぞうに さしかえる ときは ここの さきの かんすうを かきかえる）
   ================================================================== */
const DRAWERS = {
  runrunwisp: drawRunrunwisp,
  houkigob: drawHoukigob,
  magicrabbit: drawMagicrabbit,
  flamemage: drawFlamemage,
  icewitch: drawIcewitch,
  mandrake: drawMandrake,
  runegolem: drawRunegolem,
  chaosspell: drawChaosspell,
  sagecharon: drawSagecharon,
  zenos: drawZenos,
  pukakurage: drawPukakurage,
  chibisame: drawChibisame,
  ikamajin: drawIkamajin,
  togefugu: drawTogefugu,
  octocannon: drawOctocannon,
  umihebi: drawUmihebi,
  kanitank: drawKanitank,
  daiouei: drawDaiouei,
  nereid: drawNereid,
  leviza: drawLeviza,
  zabaan: drawZabaan,
  zabaan_u: drawZabaanU,
  waterserver: drawWaterServer,
  reitarou: drawReitarou,
  matchkun: drawMatchkun,
  akibou: drawAkibou,
  sakanafighters: drawSakanaFighters,
  yajirushi: drawYajirushi,
  pochi: drawPochi,
  bakegi: drawBakegi,
  akun: drawAkun,
  tatamin: drawTatamin,
  dondoko: drawDondoko,
  irongolem: drawIronGolem,
  creeper: drawCreeper,
  irongolem_e: drawIronGolem,
  purio: drawPurio,
  puripurio: drawPuripurio,
  tankun: drawTankun,
  tankundx: drawTankundx,
  teruteru: drawTeruteru,
  deruteru: drawDeruteru,
  tokinotabibito: drawTokinotabibito,
  tokinogara: drawTokinogara,
  hiibou: drawHiibou,
  inbou: drawInbou,
  zunio: drawZunio,
  zunita: drawZunita,
  shurihen: drawShurihen,
  kabekun: drawKabekun,
  futabappo: drawFutabappo,
  shadowyamaneko: drawShadowyamaneko,
  tenmusumaru: drawTenmusumaru,
  honota: drawHonota,
  togehaya: drawTogehaya,
  saba: drawSaba,
  jiryu: drawJiryu,
  hoshikun: drawHoshikun,
  yakipokkuru: drawYakipokkuru,
  ironkokko: drawIronkokko,
  usagorilla: drawUsagorilla,
  momoplant: drawMomoplant,
  mokomadoushi: drawMokomadoushi,
  bakecchin: drawBakecchin,
  blockwan: drawBlockwan,
  nyororiinu: drawNyororiinu,
  ojiinouenchou: drawOjiinouenchou,
  kumabee: drawKumabee,
  kamomeeru: drawKamomeeru,
  steve: drawSteve,
  onigon: drawOnigon,
  inocchi: drawInocchi,
  tanupon: drawTanupon,
  yamanemu: drawYamanemu,
  moeris: drawMoeris,
  tsuyugaeru: drawTsuyugaeru,
  kokejika: drawKokejika,
  harisenbon: drawHarisenbon,
  kumatta: drawKumatta,
  nushinoookami: drawNushinoookami,
  gaou: drawGaou,
  nejiro: drawNejiro,
  hakobot: drawHakobot,
  sabinchi: drawSabinchi,
  burner: drawBurner,
  potank: drawPotank,
  mojacord: drawMojacord,
  forkun: drawForkun,
  pressuke: drawPressuke,
  garakutei: drawGarakutei,
  meltgear: drawMeltgear,
  kongaragan: drawKongaragan,
  hetakirin: drawHetakirin,
  okashiman: drawOkashiman,

  /* ---- だい7しょう「闇の頂」---- */
  /* 覚醒ボス：もとの えに 闇の オーラを かさねる */
  hetakirin_x:      awakened(drawHetakirin),
  okashiman_x:      awakened(drawOkashiman),
  nushinoookami_x:  awakened(drawNushinoookami),
  gaou_x:           awakened(drawGaou),
  garakutei_x:      awakened(drawGarakutei),
  meltgear_x:       awakened(drawMeltgear),
  nereid_x:         awakened(drawNereid),
  leviza_x:         awakened(drawLeviza),
  zabaan_x:         awakened(drawZabaan),
  onigon_x:         awakened(drawOnigon),
  sagecharon_x:     awakened(drawSagecharon),
  zenos_x:          awakened(drawZenos),
  /* さいごの ボス */
  yamiakibou:       drawYamiAkibou,
};


/* ==================================================================
   たま（とんでいく こうげき）
   ================================================================== */
/* ---- はどう：まえに はしる なみ（あき坊）---- */
function drawShock(ctx, s) {
  const t = s.age || 0;
  for (let i = 0; i < 4; i++) {
    const ph = (t * 5 + i * 0.25) % 1;
    ctx.strokeStyle = 'rgba(120,200,255,' + (0.85 - i * 0.16) + ')';
    ctx.lineWidth = 6 - i;
    ctx.beginPath();
    ctx.ellipse(-i * 9, -46, 16 + i * 5, 46 + i * 5 + ph * 4, 0, -Math.PI * 0.46, Math.PI * 0.46);
    ctx.stroke();
  }
  /* しんの ひかり */
  const g = ctx.createLinearGradient(-24, 0, 18, 0);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(200,240,255,.85)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, -46, 14, 48, 0, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.fill();
  /* しぶき */
  ctx.fillStyle = 'rgba(255,255,255,.7)';
  for (let i = 0; i < 5; i++) {
    const an = -1.2 + i * 0.6;
    ctx.beginPath();
    ctx.arc(Math.cos(an) * 18, -46 + Math.sin(an) * 44, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
}


function drawProjectile(ctx, p) {
  const t = p.age;
  ctx.save();
  ctx.translate(p.x, p.y);
  switch (p.kind) {
    case 'drop':      // テルテル君の しずく
      ctx.fillStyle = '#4fc3f7';
      ctx.strokeStyle = '#0288d1'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.quadraticCurveTo(7, 0, 0, 7);
      ctx.quadraticCurveTo(-7, 0, 0, -9);
      ctx.fill(); ctx.stroke();
      break;
    case 'jelly':     // ぷりおの ゼリー
      ctx.fillStyle = 'rgba(255,152,40,0.8)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 8 + Math.sin(t * 20) * 2, 7 - Math.sin(t * 20) * 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,235,190,0.9)'; ctx.lineWidth = 1.5; ctx.stroke();
      break;
    case 'clock':     // 時の旅人の とけい
      ctx.rotate(t * 12 * p.dir);
      ctx.fillStyle = '#ffd54f';
      ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 2; ctx.stroke();
      ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(3.5, 2); ctx.stroke();
      break;
    case 'fireball':  // ひー坊の ひのたま
      {
        const r = 11 + Math.sin(t * 25) * 2;
        const g = ctx.createRadialGradient(0, 0, 1, 0, 0, r);
        g.addColorStop(0, '#fff9c4'); g.addColorStop(0.5, '#ffa726'); g.addColorStop(1, 'rgba(230,74,25,0.1)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      }
      break;
    case 'moji':      // 字一龍が はく「字」
      {
        ctx.rotate(Math.sin(t * 9) * 0.3);
        const k = 1 + Math.sin(t * 14) * 0.12;
        ctx.scale(k, k);
        ctx.font = 'bold 22px "Hiragino Mincho ProN", "Yu Mincho", serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(124,179,66,0.85)';
        ctx.strokeText('字', 0, 0);
        ctx.fillStyle = '#1b3d0a';
        ctx.fillText('字', 0, 0);
      }
      break;
    case 'tomato':    // おじい農園長の トマト
      {
        ctx.rotate(t * 9 * p.dir);
        ctx.fillStyle = '#e53935';
        ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath(); ctx.arc(-3, -3, 2.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#66bb6a';
        for (let i = 0; i < 4; i++) {
          ctx.save(); ctx.rotate(i * 1.57);
          ctx.beginPath(); ctx.ellipse(0, -8, 2.4, 4, 0, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
      }
      break;
    case 'ink': {     // オクトキャノンの すみだん
      ctx.fillStyle = 'rgba(30,30,50,.35)';
      ctx.beginPath(); ctx.arc(-9, 0, 8, 0, Math.PI * 2); ctx.fill();
      const ig = ctx.createRadialGradient(-3, -3, 1, 0, 0, 11);
      ig.addColorStop(0, '#4a4a66');
      ig.addColorStop(1, '#12121e');
      ctx.fillStyle = ig;
      ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      ctx.beginPath(); ctx.arc(-3.5, -4, 2.4, 0, Math.PI * 2); ctx.fill();
      break;
    }

    case 'splash': {  // ザバーンの とばす みず
      const sg = ctx.createLinearGradient(-14, 0, 14, 0);
      sg.addColorStop(0, 'rgba(160,225,255,0)');
      sg.addColorStop(0.5, 'rgba(120,205,250,.9)');
      sg.addColorStop(1, 'rgba(230,248,255,.95)');
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.moveTo(-16, -6);
      ctx.quadraticCurveTo(4, -10, 15, 0);
      ctx.quadraticCurveTo(4, 10, -16, 6);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.8)';
      ctx.beginPath(); ctx.arc(9, -2, 3, 0, Math.PI * 2); ctx.fill();
      break;
    }

    case 'flame': {   // バーナー君の ほのお
      const fg = ctx.createLinearGradient(-14, 0, 14, 0);
      fg.addColorStop(0, 'rgba(255,255,220,.95)');
      fg.addColorStop(0.5, 'rgba(255,152,0,.85)');
      fg.addColorStop(1, 'rgba(255,87,34,0)');
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.moveTo(-14, -7);
      ctx.quadraticCurveTo(4, -11 - Math.sin(t * 22) * 3, 16, 0);
      ctx.quadraticCurveTo(4, 11 + Math.sin(t * 20) * 3, -14, 7);
      ctx.closePath(); ctx.fill();
      break;
    }

    case 'cord': {    // モジャコードの コード
      ctx.strokeStyle = '#2b2b30'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-14, 0);
      ctx.quadraticCurveTo(0, Math.sin(t * 20) * 6, 12, 0);
      ctx.stroke();
      ctx.fillStyle = '#efe4d0';
      roundRect(ctx, 10, -6, 11, 12, 3); ctx.fill();
      ctx.fillStyle = '#8d959d';
      ctx.fillRect(20, -4, 5, 2.6);
      ctx.fillRect(20, 1, 5, 2.6);
      ctx.fillStyle = 'rgba(185,246,202,.5)';
      ctx.beginPath(); ctx.arc(16, 0, 8, 0, Math.PI * 2); ctx.fill();
      break;
    }

    case 'bubble':    // ヤマネムの ゆめの あわ
      ctx.strokeStyle = 'rgba(186,104,200,.9)'; ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(225,190,240,.45)';
      ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.8)';
      ctx.beginPath(); ctx.arc(-3, -3.4, 2.4, 0, Math.PI * 2); ctx.fill();
      break;

    case 'nut': {     // モエリスの もえる どんぐり
      ctx.fillStyle = 'rgba(255,152,0,.45)';
      ctx.beginPath(); ctx.arc(-7, 0, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c8a06a';
      ellipse(ctx, 0, 1, 5.5, 6.5); ctx.fill();
      ctx.fillStyle = '#6d4c2f';
      roundRect(ctx, -5.5, -8, 11, 5, 2); ctx.fill();
      const ng = ctx.createRadialGradient(0, -1, 1, 0, -1, 13);
      ng.addColorStop(0, 'rgba(255,245,157,.9)');
      ng.addColorStop(0.55, 'rgba(255,152,0,.6)');
      ng.addColorStop(1, 'rgba(255,87,34,0)');
      ctx.fillStyle = ng;
      ctx.beginPath(); ctx.arc(0, -1, 13, 0, Math.PI * 2); ctx.fill();
      break;
    }

    case 'needle':    // ハリ千本の はり
      ctx.strokeStyle = '#4a4a52'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(-11, i * 5); ctx.lineTo(11, i * 3.2);
        ctx.stroke();
      }
      ctx.fillStyle = '#cfd8dc';
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(15, i * 3.2); ctx.lineTo(9, i * 3.2 - 3); ctx.lineTo(9, i * 3.2 + 3);
        ctx.closePath(); ctx.fill();
      }
      break;

    case 'dango': {   // キビだんご（ちゃくだんてんで ばくはつ）
      const rr = 9;
      /* ねつの しっぽ */
      ctx.fillStyle = 'rgba(255,150,60,.35)';
      ctx.beginPath(); ctx.arc(-8, 0, rr * 0.9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,190,90,.28)';
      ctx.beginPath(); ctx.arc(-15, 0, rr * 0.6, 0, Math.PI * 2); ctx.fill();
      /* だんご ほんたい */
      const dg = ctx.createRadialGradient(-3, -3, 1, 0, 0, rr);
      dg.addColorStop(0, '#fffde7');
      dg.addColorStop(0.6, '#f3e3a2');
      dg.addColorStop(1, '#cdb15c');
      ctx.fillStyle = dg;
      ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(130,100,35,.6)'; ctx.lineWidth = 1.4; ctx.stroke();
      /* まわる もよう */
      ctx.strokeStyle = 'rgba(160,125,45,.5)'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, rr * 0.55, t * 9, t * 9 + Math.PI * 1.2);
      ctx.stroke();
      /* ハイライト */
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      ctx.beginPath(); ctx.arc(-3.2, -3.4, 2.2, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'firearrow': // スティーブの ひを まとった や
      {
        const dir = p.dir;
        // ほのおの お
        const fg = ctx.createLinearGradient(-30 * dir, 0, 6 * dir, 0);
        fg.addColorStop(0, 'rgba(255,87,34,0)');
        fg.addColorStop(0.6, 'rgba(255,152,0,0.85)');
        fg.addColorStop(1, 'rgba(255,241,118,0.95)');
        ctx.fillStyle = fg;
        const h = 8 + Math.sin(t * 30) * 2.5;
        ctx.beginPath();
        ctx.moveTo(-32 * dir, 0);
        ctx.lineTo(4 * dir, -h / 2);
        ctx.lineTo(4 * dir, h / 2);
        ctx.closePath(); ctx.fill();
        // やがら
        ctx.strokeStyle = '#7b5230'; ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.moveTo(-12 * dir, 0); ctx.lineTo(12 * dir, 0); ctx.stroke();
        // やじり
        ctx.fillStyle = '#cfd8dc';
        ctx.beginPath();
        ctx.moveTo(20 * dir, 0); ctx.lineTo(11 * dir, -5); ctx.lineTo(11 * dir, 5);
        ctx.closePath(); ctx.fill();
      }
      break;
    case 'wool':      // モコ魔道士の ひかる ひつじの け
      {
        const gw = ctx.createRadialGradient(0, 0, 1, 0, 0, 15);
        gw.addColorStop(0, '#ffffff');
        gw.addColorStop(0.45, '#e1a8ef');
        gw.addColorStop(1, 'rgba(186,104,200,0)');
        ctx.fillStyle = gw;
        ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f6d3f2';
        for (let i = 0; i < 5; i++) {
          const a = t * 7 + i * 1.257;
          ctx.beginPath(); ctx.arc(Math.cos(a) * 5, Math.sin(a) * 5, 4, 0, Math.PI * 2); ctx.fill();
        }
      }
      break;
    case 'star':      // ほしくんの ほし
      {
        ctx.rotate(t * 7 * p.dir);
        const r = 13 + Math.sin(t * 18) * 1.5;
        ctx.fillStyle = '#ffe082';
        starPath(ctx, 0, 0, r, r * 0.42, 0);
        ctx.fill();
        ctx.strokeStyle = '#e8a800'; ctx.lineWidth = 1.8;
        starPath(ctx, 0, 0, r, r * 0.42, 0);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        starPath(ctx, -2, -2, r * 0.42, r * 0.18, 0);
        ctx.fill();
      }
      break;
    case 'beam':      // ずにおの ビーム
      {
        const g = ctx.createLinearGradient(-26 * p.dir, 0, 22 * p.dir, 0);
        g.addColorStop(0, 'rgba(255,120,90,0)');
        g.addColorStop(0.55, 'rgba(255,90,60,0.95)');
        g.addColorStop(1, 'rgba(255,240,220,1)');
        ctx.fillStyle = g;
        const h = 9 + Math.sin(t * 40) * 2;
        ctx.fillRect(-26 * p.dir, -h / 2, 48 * p.dir, h);
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath(); ctx.arc(18 * p.dir, 0, 5.5, 0, Math.PI * 2); ctx.fill();
      }
      break;
    case 'stone':     // お菓子マンの いし
      {
        ctx.rotate(t * 5 * p.dir);
        const g = ctx.createRadialGradient(-3, -3, 2, 0, 0, 13);
        g.addColorStop(0, '#d4d4d4'); g.addColorStop(1, '#6f6f6f');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#9e9e9e'; ctx.lineWidth = 1.6; ctx.stroke();
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.beginPath(); ctx.arc(4, 3, 3, 0, Math.PI * 2); ctx.fill();
      }
      break;
    case 'grass':     // きりんの くさ
      ctx.fillStyle = '#7cb342';
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.rotate(t * 8 + i * 2.1);
        ctx.beginPath(); ctx.ellipse(5, 0, 3.5, 9, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      break;
  }
  ctx.restore();
}


/* ==================================================================
   エフェクト（ヒット・ばくはつ・ダメージすうじ）
   ================================================================== */
function drawEffect(ctx, e) {
  const k = e.age / e.life;          // 0 → 1
  ctx.save();
  if (e.type === 'hit') {
    ctx.globalAlpha = 1 - k;
    ctx.strokeStyle = e.color || '#fff59d';
    ctx.lineWidth = 3;
    const r = 6 + k * 16;
    for (let i = 0; i < 5; i++) {
      const a = i * 1.256 + e.seed;
      ctx.beginPath();
      ctx.moveTo(e.x + Math.cos(a) * r * 0.5, e.y + Math.sin(a) * r * 0.5);
      ctx.lineTo(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r);
      ctx.stroke();
    }
  } else if (e.type === 'boom') {
    ctx.globalAlpha = 1 - k;
    const r = e.radius * (0.35 + k * 0.75);
    const g = ctx.createRadialGradient(e.x, e.y, 1, e.x, e.y, r);
    g.addColorStop(0, '#fffde7');
    g.addColorStop(0.45, e.color || '#ffa726');
    g.addColorStop(1, 'rgba(255,87,34,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, Math.PI * 2); ctx.fill();
  } else if (e.type === 'dmg') {
    ctx.globalAlpha = 1 - k * k;
    ctx.font = 'bold ' + (e.big ? 22 : 15) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(0,0,0,.65)';
    ctx.fillStyle = e.color || '#fff';
    const y = e.y - k * 34;
    ctx.strokeText(e.text, e.x, y);
    ctx.fillText(e.text, e.x, y);
  } else if (e.type === 'healMark') {
    ctx.globalAlpha = (1 - k) * 0.95;
    ctx.fillStyle = '#66bb6a';
    ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center';
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.85)';
    ctx.strokeText('＋', e.x, e.y - k * 26);
    ctx.fillText('＋', e.x, e.y - k * 26);
  } else if (e.type === 'restMark') {
    ctx.globalAlpha = (1 - k * 0.6);
    ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(e.text || '💤', e.x + k * 8, e.y - k * 22);
  } else if (e.type === 'stunMark') {
    ctx.globalAlpha = (1 - k) * 0.95;
    ctx.fillStyle = '#ffd54f';
    ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.6)';
    ctx.strokeText('ピタッ!', e.x, e.y - k * 20);
    ctx.fillText('ピタッ!', e.x, e.y - k * 20);
  } else if (e.type === 'slowMark') {
    ctx.globalAlpha = (1 - k) * 0.9;
    ctx.fillStyle = '#ffb74d';
    ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('おそい!', e.x, e.y - k * 20);
  }
  ctx.restore();
}


/* ==================================================================
   ごうのすけの へやの かぐ

   どれも（0,0）が「おいた ばしょの ゆかの ちゅうしん」です。
   おおきさは よびだしがわで きめます。
   ================================================================== */

/* ---- ソファ（いろを かえて 3しゅるい）---- */
function sofaBase(ctx, main, dark, light) {
  ctx.fillStyle = '#6d4c2f';
  ctx.fillRect(-44, -8, 8, 8);
  ctx.fillRect(36, -8, 8, 8);
  ctx.fillStyle = main;
  roundRect(ctx, -50, -34, 100, 28, 7); ctx.fill();
  ctx.fillStyle = dark;
  roundRect(ctx, -50, -66, 100, 36, 9); ctx.fill();
  ctx.fillStyle = light;
  roundRect(ctx, -46, -38, 44, 16, 5); ctx.fill();
  roundRect(ctx, 2, -38, 44, 16, 5); ctx.fill();
  ctx.fillStyle = dark;
  roundRect(ctx, -58, -50, 16, 44, 6); ctx.fill();
  roundRect(ctx, 42, -50, 16, 44, 6); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.18)';
  roundRect(ctx, -46, -62, 88, 8, 4); ctx.fill();
}
function drawSofaGreen(ctx)  { sofaBase(ctx, '#66bb6a', '#43a047', '#a5d6a7'); }
function drawSofaOrange(ctx) { sofaBase(ctx, '#ffa726', '#f57c00', '#ffcc80'); }
function drawSofaNavy(ctx)   { sofaBase(ctx, '#5c6bc0', '#3949ab', '#9fa8da'); }

/* ---- カーペット（ゆかに しく・ひらたい）---- */
function carpetBase(ctx, main, edge, deco) {
  ctx.fillStyle = main;
  ctx.beginPath(); ctx.ellipse(0, 0, 120, 26, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = edge; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.ellipse(0, 0, 120, 26, 0, 0, Math.PI * 2); ctx.stroke();
  if (deco) deco(ctx);
}
function drawCarpetRed(ctx) {
  carpetBase(ctx, '#e57373', '#c62828', (c) => {
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 4;
    c.beginPath(); c.ellipse(0, 0, 84, 17, 0, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.ellipse(0, 0, 48, 10, 0, 0, Math.PI * 2); c.stroke();
  });
}
function drawCarpetBlue(ctx) {
  carpetBase(ctx, '#64b5f6', '#1565c0', (c) => {
    c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 4;
    for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 40, -22); c.lineTo(i * 40, 22); c.stroke(); }
  });
}
function drawCarpetStar(ctx) {
  carpetBase(ctx, '#9575cd', '#5e35b1', (c) => {
    c.fillStyle = '#fff59d';
    for (const [sx, sy, sr] of [[-70, -4, 9], [-24, 7, 7], [22, -7, 8], [68, 5, 9], [0, -12, 6]]) {
      c.beginPath();
      for (let k = 0; k < 10; k++) {
        const an = -Math.PI / 2 + k * Math.PI / 5;
        const rr = (k % 2 === 0) ? sr : sr * 0.44;
        const px = sx + Math.cos(an) * rr, py = sy + Math.sin(an) * rr * 0.55;
        if (k === 0) c.moveTo(px, py); else c.lineTo(px, py);
      }
      c.closePath(); c.fill();
    }
  });
}

/* ---- テレビ ---- */
function drawTv(ctx, s) {
  const t = (s && s.t) || 0;
  ctx.fillStyle = '#8d6e63';
  roundRect(ctx, -46, -26, 92, 26, 4); ctx.fill();
  ctx.fillStyle = '#6d4c41';
  roundRect(ctx, -40, -20, 36, 14, 3); ctx.fill();
  ctx.fillStyle = '#37474f';
  roundRect(ctx, -42, -84, 84, 58, 6); ctx.fill();
  const g = ctx.createLinearGradient(0, -78, 0, -34);
  g.addColorStop(0, '#4fc3f7'); g.addColorStop(1, '#1976d2');
  ctx.fillStyle = g;
  roundRect(ctx, -36, -78, 72, 44, 4); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.3)';
  for (let i = 0; i < 3; i++) {
    const y = -74 + ((t * 22 + i * 15) % 40);
    ctx.fillRect(-34, y, 68, 3);
  }
  ctx.fillStyle = '#fff59d';
  ctx.beginPath(); ctx.arc(-14 + Math.sin(t * 2) * 10, -56, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#263238';
  ctx.fillRect(-8, -30, 16, 6);
}

/* ---- かんようしょくぶつ ---- */
function drawPlant(ctx, s) {
  const t = (s && s.t) || 0;
  ctx.fillStyle = '#a1887f';
  ctx.beginPath();
  ctx.moveTo(-22, -30); ctx.lineTo(22, -30); ctx.lineTo(16, 0); ctx.lineTo(-16, 0);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#8d6e63';
  roundRect(ctx, -25, -36, 50, 8, 3); ctx.fill();
  ctx.fillStyle = '#5d4037';
  roundRect(ctx, -18, -30, 36, 5, 2); ctx.fill();
  ctx.strokeStyle = '#4caf50'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  for (let i = -2; i <= 2; i++) {
    const sway = Math.sin(t * 1.3 + i) * 4;
    ctx.beginPath();
    ctx.moveTo(i * 4, -30);
    ctx.quadraticCurveTo(i * 12 + sway, -62, i * 20 + sway * 1.5, -88 + Math.abs(i) * 6);
    ctx.stroke();
  }
  ctx.fillStyle = '#66bb6a';
  for (let i = -2; i <= 2; i++) {
    const sway = Math.sin(t * 1.3 + i) * 4;
    ctx.save();
    ctx.translate(i * 20 + sway * 1.5, -88 + Math.abs(i) * 6);
    ctx.rotate(i * 0.35);
    ellipse(ctx, 0, 0, 16, 9); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#81c784';
  ellipse(ctx, 0, -96, 13, 8); ctx.fill();
}

const ROOM_DRAWERS = {
  sofaGreen:  drawSofaGreen,
  sofaOrange: drawSofaOrange,
  sofaNavy:   drawSofaNavy,
  carpetRed:  drawCarpetRed,
  carpetBlue: drawCarpetBlue,
  carpetStar: drawCarpetStar,
  tv:         drawTv,
  plant:      drawPlant,
};


/* ==== こうさくアイテム 20しゅるい ====
   だい2ひきすう s に { t, pal } が きます。
   pal は { main, dark, light, accent } の 4いろ。              */

const WOODC = '#a1683a', WOODD = '#7b4a24', METAL = '#b0bec5', METALD = '#78909c';
function P(s) { return (s && s.pal) || { main: '#e57373', dark: '#c62828', light: '#ffcdd2', accent: '#fff59d' }; }

/* 1 ベッド */
function drawBed(ctx, s) { const p = P(s);
  ctx.fillStyle = WOODD; ctx.fillRect(-64, -14, 8, 14); ctx.fillRect(56, -14, 8, 14);
  ctx.fillStyle = WOODC; roundRect(ctx, -66, -34, 132, 22, 5); ctx.fill();
  ctx.fillStyle = p.main; roundRect(ctx, -62, -46, 124, 14, 5); ctx.fill();
  ctx.fillStyle = p.light; roundRect(ctx, -58, -56, 40, 14, 6); ctx.fill();   // まくら
  ctx.fillStyle = p.dark; roundRect(ctx, -10, -48, 70, 8, 4); ctx.fill();
  ctx.fillStyle = WOODD; roundRect(ctx, -70, -66, 12, 54, 4); ctx.fill();     // ヘッドボード
  roundRect(ctx, 58, -50, 10, 38, 4); ctx.fill();
}
/* 2 テーブル */
function drawTable(ctx, s) { const p = P(s);
  ctx.fillStyle = WOODD; ctx.fillRect(-42, -40, 9, 40); ctx.fillRect(33, -40, 9, 40);
  ctx.fillStyle = p.main; roundRect(ctx, -52, -52, 104, 14, 5); ctx.fill();
  ctx.fillStyle = p.light; roundRect(ctx, -48, -50, 96, 5, 3); ctx.fill();
  ctx.fillStyle = p.dark; ctx.fillRect(-40, -38, 80, 5);
}
/* 3 いす */
function drawChair(ctx, s) { const p = P(s);
  ctx.fillStyle = WOODD; ctx.fillRect(-22, -30, 7, 30); ctx.fillRect(15, -30, 7, 30);
  ctx.fillStyle = p.main; roundRect(ctx, -26, -40, 52, 12, 4); ctx.fill();
  ctx.fillStyle = p.dark; roundRect(ctx, -24, -74, 48, 36, 6); ctx.fill();
  ctx.fillStyle = p.light; roundRect(ctx, -18, -68, 36, 10, 4); ctx.fill();
}
/* 4 ほんだな */
function drawShelf(ctx, s) { const p = P(s);
  ctx.fillStyle = p.dark; roundRect(ctx, -46, -108, 92, 108, 5); ctx.fill();
  ctx.fillStyle = p.main; ctx.fillRect(-40, -102, 80, 96);
  ctx.fillStyle = p.dark;
  for (let i = 1; i < 4; i++) ctx.fillRect(-40, -102 + i * 24, 80, 6);
  /* ほん */
  const cols = [p.light, p.accent, '#ffffff', p.dark];
  for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) {
    ctx.fillStyle = cols[(r + i) % 4];
    ctx.fillRect(-36 + i * 12, -100 + r * 24, 9, 18);
  }
}
/* 5 たんす */
function drawDrawer(ctx, s) { const p = P(s);
  ctx.fillStyle = p.dark; roundRect(ctx, -42, -92, 84, 92, 5); ctx.fill();
  ctx.fillStyle = p.main;
  for (let i = 0; i < 3; i++) roundRect(ctx, -37, -87 + i * 29, 74, 25, 4), ctx.fill();
  ctx.fillStyle = METAL;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, -75 + i * 29, 4, 0, Math.PI * 2); ctx.fill(); }
}
/* 6 とけい */
function drawClock(ctx, s) { const p = P(s); const t = (s && s.t) || 0;
  ctx.fillStyle = WOODD; ctx.fillRect(-8, -14, 16, 14);
  ctx.fillStyle = p.dark; ctx.beginPath(); ctx.arc(0, -34, 22, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fffde7'; ctx.beginPath(); ctx.arc(0, -34, 17, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = p.dark; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, -34); ctx.lineTo(Math.cos(t * 0.8 - 1.57) * 11, -34 + Math.sin(t * 0.8 - 1.57) * 11); ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, -34); ctx.lineTo(Math.cos(t * 0.2 - 1.57) * 7, -34 + Math.sin(t * 0.2 - 1.57) * 7); ctx.stroke();
  ctx.fillStyle = p.main; ctx.beginPath(); ctx.arc(0, -34, 3, 0, Math.PI * 2); ctx.fill();
}
/* 7 ランプ */
function drawLamp(ctx, s) { const p = P(s);
  ctx.fillStyle = METALD; ctx.beginPath(); ctx.ellipse(0, -4, 20, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = METAL; ctx.fillRect(-3, -74, 6, 70);
  ctx.fillStyle = p.main;
  ctx.beginPath(); ctx.moveTo(-26, -74); ctx.lineTo(26, -74); ctx.lineTo(17, -104); ctx.lineTo(-17, -104);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = p.light; roundRect(ctx, -24, -80, 48, 6, 3); ctx.fill();
  ctx.fillStyle = 'rgba(255,241,118,.45)';
  ctx.beginPath(); ctx.moveTo(-24, -74); ctx.lineTo(24, -74); ctx.lineTo(34, -40); ctx.lineTo(-34, -40);
  ctx.closePath(); ctx.fill();
}
/* 8 え（かべに かける）*/
function drawPicture(ctx, s) { const p = P(s);
  ctx.fillStyle = p.dark; roundRect(ctx, -38, -60, 76, 56, 4); ctx.fill();
  ctx.fillStyle = '#fffde7'; ctx.fillRect(-32, -54, 64, 44);
  ctx.fillStyle = p.light; ctx.fillRect(-32, -30, 64, 20);
  ctx.fillStyle = p.main;
  ctx.beginPath(); ctx.moveTo(-24, -30); ctx.lineTo(-6, -48); ctx.lineTo(12, -30); ctx.closePath(); ctx.fill();
  ctx.fillStyle = p.accent; ctx.beginPath(); ctx.arc(18, -44, 6, 0, Math.PI * 2); ctx.fill();
}
/* 9 ラグ（ゆかに しく）*/
function drawRug(ctx, s) { const p = P(s);
  ctx.fillStyle = p.main; ctx.beginPath(); ctx.ellipse(0, 0, 90, 20, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = p.dark; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.ellipse(0, 0, 90, 20, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = p.light; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(0, 0, 58, 12, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, 0, 28, 6, 0, 0, Math.PI * 2); ctx.stroke();
}
/* 10 カーテン */
function drawCurtain(ctx, s) { const p = P(s);
  ctx.fillStyle = METALD; ctx.fillRect(-48, -116, 96, 6);
  ctx.fillStyle = p.main;
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sx * 16, -112);
    ctx.quadraticCurveTo(sx * 40, -70, sx * 30, -8);
    ctx.lineTo(sx * 46, -8);
    ctx.quadraticCurveTo(sx * 52, -70, sx * 46, -112);
    ctx.closePath(); ctx.fill();
  }
  ctx.strokeStyle = p.dark; ctx.lineWidth = 2.5;
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(sx * (22 + i * 8), -108);
    ctx.quadraticCurveTo(sx * (36 + i * 6), -60, sx * (34 + i * 5), -12);
    ctx.stroke();
  }
}
/* 11 くまの ぬいぐるみ */
function drawBear(ctx, s) { const p = P(s);
  ctx.fillStyle = p.main;
  ctx.beginPath(); ctx.arc(-14, -12, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(14, -12, 9, 0, Math.PI * 2); ctx.fill();
  ellipse(ctx, 0, -26, 17, 16); ctx.fill();
  ctx.beginPath(); ctx.arc(-19, -32, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(19, -32, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(-11, -52, 6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(11, -52, 6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -46, 15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = p.light; ellipse(ctx, 0, -42, 8, 6); ctx.fill();
  ctx.fillStyle = '#3e2723';
  ctx.beginPath(); ctx.arc(-5, -50, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(5, -50, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -44, 2.6, 0, Math.PI * 2); ctx.fill();
}
/* 12 うさぎの ぬいぐるみ */
function drawRabbit(ctx, s) { const p = P(s);
  ctx.fillStyle = p.main;
  ellipse(ctx, 0, -22, 15, 15); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -44, 13, 0, Math.PI * 2); ctx.fill();
  ellipse(ctx, -8, -62, 5, 13); ctx.fill();
  ellipse(ctx, 8, -62, 5, 13); ctx.fill();
  ctx.fillStyle = p.light;
  ellipse(ctx, -8, -62, 2.6, 8); ctx.fill();
  ellipse(ctx, 8, -62, 2.6, 8); ctx.fill();
  ellipse(ctx, 0, -18, 8, 7); ctx.fill();
  ctx.fillStyle = '#3e2723';
  ctx.beginPath(); ctx.arc(-5, -46, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(5, -46, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = p.dark; ctx.beginPath(); ctx.arc(0, -40, 2.4, 0, Math.PI * 2); ctx.fill();
}
/* 13 ボール */
function drawBall(ctx, s) { const p = P(s); const t = (s && s.t) || 0;
  const y = -20 - Math.abs(Math.sin(t * 1.6)) * 6;
  ctx.fillStyle = 'rgba(0,0,0,.18)';
  ctx.beginPath(); ctx.ellipse(0, -2, 14, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = p.main; ctx.beginPath(); ctx.arc(0, y, 18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = p.light;
  ctx.beginPath(); ctx.moveTo(-18, y); ctx.quadraticCurveTo(0, y - 10, 18, y);
  ctx.quadraticCurveTo(0, y + 6, -18, y); ctx.fill();
  ctx.fillStyle = p.dark; ctx.beginPath(); ctx.arc(0, y, 5, 0, Math.PI * 2); ctx.fill();
}
/* 14 つみき */
function drawBlocks(ctx, s) { const p = P(s);
  const cols = [p.main, p.light, p.dark, p.accent];
  const put = (x, y, col) => { ctx.fillStyle = col; roundRect(ctx, x, y, 20, 20, 3); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 1.5; roundRect(ctx, x, y, 20, 20, 3); ctx.stroke(); };
  put(-30, -20, cols[0]); put(-8, -20, cols[1]); put(14, -20, cols[2]);
  put(-19, -42, cols[3]); put(3, -42, cols[0]);
  put(-8, -64, cols[1]);
}
/* 15 たいこ */
function drawDrum(ctx, s) { const p = P(s);
  ctx.fillStyle = p.main; roundRect(ctx, -28, -44, 56, 40, 6); ctx.fill();
  ctx.fillStyle = p.light; ellipse(ctx, 0, -44, 28, 9); ctx.fill();
  ctx.strokeStyle = p.dark; ctx.lineWidth = 3;
  ctx.beginPath(); ellipse(ctx, 0, -44, 28, 9); ctx.stroke();
  ctx.strokeStyle = p.accent; ctx.lineWidth = 2.5;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath(); ctx.moveTo(i * 11, -40); ctx.lineTo(i * 11 + 5, -8); ctx.stroke();
  }
  ctx.strokeStyle = WOODC; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(20, -50); ctx.lineTo(34, -62); ctx.stroke();
  ctx.fillStyle = WOODD; ctx.beginPath(); ctx.arc(35, -64, 4, 0, Math.PI * 2); ctx.fill();
}
/* 16 ギター */
function drawGuitar(ctx, s) { const p = P(s);
  ctx.fillStyle = p.main;
  ctx.beginPath(); ctx.arc(0, -26, 24, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -56, 18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = p.dark; ctx.beginPath(); ctx.arc(0, -46, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = WOODD; ctx.fillRect(-5, -100, 10, 44);
  ctx.fillStyle = p.light; roundRect(ctx, -9, -108, 18, 12, 3); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.2;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath(); ctx.moveTo(i * 3, -100); ctx.lineTo(i * 3, -14); ctx.stroke();
  }
}
/* 17 ゴミばこ */
function drawBin(ctx, s) { const p = P(s);
  ctx.fillStyle = p.main;
  ctx.beginPath(); ctx.moveTo(-18, -40); ctx.lineTo(18, -40); ctx.lineTo(14, 0); ctx.lineTo(-14, 0);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = p.dark; roundRect(ctx, -21, -48, 42, 9, 3); ctx.fill();
  ctx.fillStyle = p.light; roundRect(ctx, -6, -52, 12, 5, 2); ctx.fill();
  ctx.strokeStyle = p.dark; ctx.lineWidth = 2;
  for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 9, -36); ctx.lineTo(i * 8, -6); ctx.stroke(); }
}
/* 18 すいそう */
function drawTank(ctx, s) { const p = P(s); const t = (s && s.t) || 0;
  ctx.fillStyle = WOODD; roundRect(ctx, -44, -14, 88, 14, 3); ctx.fill();
  ctx.fillStyle = 'rgba(129,212,250,.75)'; ctx.fillRect(-40, -62, 80, 48);
  ctx.fillStyle = '#c8a06a'; ctx.fillRect(-40, -20, 80, 6);
  /* さかな */
  for (let i = 0; i < 3; i++) {
    const fx = -26 + ((t * 16 + i * 30) % 62);
    const fy = -50 + Math.sin(t * 1.5 + i) * 8;
    ctx.fillStyle = [p.main, p.accent, p.light][i];
    ellipse(ctx, fx, fy, 7, 4.5); ctx.fill();
    ctx.beginPath(); ctx.moveTo(fx - 7, fy); ctx.lineTo(fx - 13, fy - 4); ctx.lineTo(fx - 13, fy + 4);
    ctx.closePath(); ctx.fill();
  }
  ctx.strokeStyle = p.dark; ctx.lineWidth = 4;
  ctx.strokeRect(-40, -62, 80, 48);
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-36, -58, 10, 40);
}
/* 19 かがみ */
function drawMirror(ctx, s) { const p = P(s);
  ctx.fillStyle = WOODD; roundRect(ctx, -14, -12, 28, 12, 3); ctx.fill();
  ctx.fillStyle = p.dark; roundRect(ctx, -25, -96, 50, 86, 24); ctx.fill();
  const g = ctx.createLinearGradient(-20, -92, 20, -16);
  g.addColorStop(0, '#e3f2fd'); g.addColorStop(0.5, '#b3e5fc'); g.addColorStop(1, '#eceff1');
  ctx.fillStyle = g; roundRect(ctx, -19, -90, 38, 74, 19); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.6)';
  ctx.beginPath(); ctx.moveTo(-14, -30); ctx.lineTo(-2, -84); ctx.lineTo(6, -84); ctx.lineTo(-6, -30);
  ctx.closePath(); ctx.fill();
}
/* 20 せきぞう */
function drawStatue(ctx, s) { const p = P(s);
  ctx.fillStyle = '#9e9e9e'; roundRect(ctx, -28, -18, 56, 18, 4); ctx.fill();
  ctx.fillStyle = '#bdbdbd'; roundRect(ctx, -22, -26, 44, 10, 3); ctx.fill();
  ctx.fillStyle = p.main;
  roundRect(ctx, -16, -62, 32, 38, 6); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -72, 14, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = p.dark;
  ctx.beginPath(); ctx.arc(-5, -74, 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(5, -74, 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = p.light;
  roundRect(ctx, -24, -58, 8, 24, 4); ctx.fill();
  roundRect(ctx, 16, -58, 8, 24, 4); ctx.fill();
  ctx.fillStyle = p.accent; ctx.beginPath(); ctx.arc(0, -86, 5, 0, Math.PI * 2); ctx.fill();
}

Object.assign(ROOM_DRAWERS, {
  bed: drawBed, table: drawTable, chair: drawChair, shelf: drawShelf, drawer: drawDrawer,
  clock: drawClock, lamp: drawLamp, picture: drawPicture, rug: drawRug, curtain: drawCurtain,
  bear: drawBear, rabbit: drawRabbit, ball: drawBall, blocks: drawBlocks, drum: drawDrum,
  guitar: drawGuitar, bin: drawBin, tank: drawTank, mirror: drawMirror, statue: drawStatue,
});
