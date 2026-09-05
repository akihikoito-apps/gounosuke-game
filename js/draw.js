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
  purio: drawPurio,
  tankun: drawTankun,
  teruteru: drawTeruteru,
  tokinotabibito: drawTokinotabibito,
  hiibou: drawHiibou,
  zunio: drawZunio,
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
  kongaragan: drawKongaragan,
  hetakirin: drawHetakirin,
  okashiman: drawOkashiman,
};


/* ==================================================================
   たま（とんでいく こうげき）
   ================================================================== */
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
