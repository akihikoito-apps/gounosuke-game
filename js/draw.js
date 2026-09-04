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
  honota: drawHonota,
  togehaya: drawTogehaya,
  saba: drawSaba,
  jiryu: drawJiryu,
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
