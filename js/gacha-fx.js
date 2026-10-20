/* ガチャの えんしゅつ */
const GachaFX = (() => {
  function play(canvas, opts) {
    opts = opts || {};
    const special = !!opts.special;
    const openAt = special ? 2.60 : 1.45;
    const revealAt = openAt + 0.15;
    const endAt = revealAt + 0.70;
    let start = performance.now();
    let stopped = false, ended = false, revealed = false;
    let landed = false, bounced = false, rolled = false, opened = false;
    let ctx, w = 0, h = 0;
    const color = opts.color || '#ffcc33';
    const light = opts.color2 || '#fff3c0';
    const clamp = (v) => Math.max(0, Math.min(1, v));
    const ease = (v) => 1 - Math.pow(1 - clamp(v), 3);

    // おそとへ知らせる関数がなくても、あそべるようにする。
    function call(fn, a, b) {
      try { if (typeof fn === 'function') fn(a, b); } catch (_) {}
    }
    function sound(name) { if (!stopped) call(opts.se, name); }
    function stop() { stopped = true; }
    function skip() {
      if (stopped || ended || opened) return;
      const now = performance.now();
      if ((now - start) / 1000 >= openAt) return;
      start = now - openAt * 1000;
      landed = bounced = rolled = true;
    }

    // 画面の大きさを、まいかい見なおす。
    function resize() {
      w = Math.max(0, canvas.clientWidth || 0);
      h = Math.max(0, canvas.clientHeight || 0);
      const dpr = typeof devicePixelRatio === 'number'
        ? Math.max(1, Math.min(2, devicePixelRatio || 1)) : 1;
      const pw = Math.round(w * dpr), ph = Math.round(h * dpr);
      if (canvas.width !== pw) canvas.width = pw;
      if (canvas.height !== ph) canvas.height = ph;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
    }

    // まるい光と、きらっとした星をかく。
    function glow(x, y, r, alpha) {
      if (r <= 0) return;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, light);
      g.addColorStop(0.35, color);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalAlpha = clamp(alpha);
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
      ctx.globalAlpha = 1;
    }
    function sparkle(x, y, r) {
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.lineTo(x + r * 0.3, y - r * 0.3);
      ctx.lineTo(x + r, y);
      ctx.lineTo(x + r * 0.3, y + r * 0.3);
      ctx.lineTo(x, y + r);
      ctx.lineTo(x - r * 0.3, y + r * 0.3);
      ctx.lineTo(x - r, y);
      ctx.lineTo(x - r * 0.3, y - r * 0.3);
      ctx.closePath();
      ctx.fill();
    }

    // カプセルの上と下。まんなかに、あわせ目をつける。
    function half(r, top, tint) {
      ctx.beginPath();
      ctx.arc(0, 0, r, top ? Math.PI : 0, top ? Math.PI * 2 : Math.PI);
      ctx.closePath();
      ctx.fillStyle = top ? color : 'rgba(255,255,255,0.72)';
      ctx.fill();
      if (tint > 0) {
        ctx.globalAlpha = tint;
        ctx.fillStyle = light;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.strokeStyle = 'rgba(49,36,70,0.8)';
      ctx.lineWidth = Math.max(2, r * 0.045);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-r * 0.26, top ? -r * 0.37 : r * 0.36, r * 0.16, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.fill();
    }

    // パカーンのあと、うしろの光がゆっくりまわる。
    function rays(x, y, r, t) {
      ctx.save();
      try {
        ctx.translate(x, y);
        ctx.rotate(t * 0.28);
        ctx.globalAlpha = 0.34 * ease(t / 0.18);
        ctx.fillStyle = light;
        for (let i = 0; i < 12; i++) {
          ctx.rotate(Math.PI / 6);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(r, -r * 0.065);
          ctx.lineTo(r, r * 0.065);
          ctx.closePath();
          ctx.fill();
        }
      } finally { ctx.restore(); }
    }

    function draw(t) {
      if (!w || !h) return;
      const x = w / 2, ground = h * 0.68;
      const r = Math.min(w * 0.13, h * 0.085);
      const cy = ground - r;
      const charH = Math.min(h * 0.3, w * 0.5);
      if (t < openAt) {
        let y = cy, sx = 1, sy = 1;
        if (t < 0.45) {
          y = -r * 1.5 + (cy + r * 1.5) * Math.pow(t / 0.45, 2);
        } else if (t < 0.85) {
          const b = t - 0.45;
          const first = b < 0.24;
          const p = first ? b / 0.24 : (b - 0.24) / 0.16;
          const lift = Math.sin(p * Math.PI);
          y -= lift * r * (first ? 0.95 : 0.4);
          const squash = Math.exp(-p * 13) * (first ? 0.27 : 0.15);
          sx += squash;
          sy -= squash;
          y += r * squash;
        }
        const q = clamp((t - 0.85) / (openAt - 0.85));
        const shake = t >= 0.85 ? Math.sin(t * 95) * r * (0.025 + q * 0.09) : 0;

        // じめんに近づくほど、かげが大きくなる。
        const near = clamp((y + r) / ground);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(x, ground + 4, r * (0.25 + near * 0.8), r * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        if (q > 0) glow(x, cy, r * (1.3 + q * 2), q * 0.65);

        // めずらしいときは、輪がひろがり、光のつぶが集まる。
        if (special && t >= 0.85) {
          for (let i = 0; i < 3; i++) {
            const p = ((t - 0.85) * 0.9 + i / 3) % 1;
            ctx.globalAlpha = (1 - p) * 0.6;
            ctx.strokeStyle = i % 2 ? light : color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x, cy, r * (1.1 + p * 2.6), 0, Math.PI * 2);
            ctx.stroke();
          }
          for (let i = 0; i < 24; i++) {
            const p = ((t - 0.85) * 0.8 + i * 0.137) % 1;
            const a = i * 2.4 + t * 0.3;
            const dist = r * (1 + (1 - p) * 3);
            ctx.globalAlpha = Math.sin(p * Math.PI);
            ctx.fillStyle = i % 2 ? light : color;
            sparkle(x + Math.cos(a) * dist, cy + Math.sin(a) * dist, 2 + p * 4);
          }
          ctx.globalAlpha = 1;
        }
        ctx.save();
        try {
          ctx.translate(x + shake, y);
          ctx.scale(sx, sy);
          ctx.rotate(Math.sin(t * 65) * q * 0.065);
          half(r, true, special ? (1 - q) * 0.45 : 0);
          half(r, false, 0);
          if (q > 0) {
            ctx.shadowColor = light;
            ctx.shadowBlur = q * 28;
            ctx.strokeStyle = light;
            ctx.lineWidth = 1 + q * 7;
            ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.stroke();
          }
        } finally { ctx.restore(); }
        return;
      }

      const burst = t - openAt;
      rays(x, ground - charH * 0.5, Math.max(w, h) * 0.7, burst);
      glow(x, ground - charH * 0.5, charH * 0.95, 0.4);

      // 上と下のカプセルが、くるっととび出す。
      for (let i = 0; i < 2; i++) {
        ctx.save();
        try {
          const dir = i === 0 ? -1 : 1;
          ctx.globalAlpha = clamp(1 - burst / 0.5);
          ctx.translate(x + dir * burst * r * 2.5, cy + dir * burst * h * 0.75);
          ctx.rotate(dir * burst * 4);
          half(r, i === 0, 0);
        } finally { ctx.restore(); }
      }

      if (t >= revealAt) {
        const p = clamp((t - revealAt) / 0.5);
        const z = p - 1;
        const scale = 1 + 2.70158 * z * z * z + 1.70158 * z * z;
        // 足もとをそろえて、ふわっと大きく出す。
        ctx.save();
        try {
          ctx.translate(x, ground + (1 - ease(p)) * charH * 0.28);
          ctx.scale(Math.max(0, scale), Math.max(0, scale));
          call(opts.drawChar, ctx, charH);
        } finally { ctx.restore(); }
        if (stopped) return;
        ctx.save();
        try {
          ctx.globalAlpha = ease(p * 2);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.lineJoin = 'round';
          ctx.strokeStyle = '#30213f';
          ctx.fillStyle = color;
          const size = Math.min(w * 0.075, h * 0.045);
          ctx.lineWidth = Math.max(3, size * 0.18);
          ctx.font = 'bold ' + size + 'px sans-serif';
          const ty = ground - charH * 1.18;
          ctx.strokeText(opts.star || '', x, ty - size * 1.3, w * 0.9);
          ctx.fillText(opts.star || '', x, ty - size * 1.3, w * 0.9);
          ctx.strokeText(opts.label || '', x, ty, w * 0.9);
          ctx.fillText(opts.label || '', x, ty, w * 0.9);
        } finally { ctx.restore(); }

        // おいわいの紙ふぶきと、きらきらがふってくる。
        if (special) {
          for (let i = 0; i < 42; i++) {
            const age = t - revealAt;
            const px = ((i * 0.6180339) % 1) * w + Math.sin(age * 4 + i) * 12;
            const py = ((i * 0.373) % 1) * h * 0.7 + age * h * 0.32;
            ctx.save();
            try {
              ctx.translate(px, py);
              ctx.rotate(i + age * (i % 2 ? 3 : -3));
              ctx.globalAlpha = ease(age / 0.1);
              ctx.fillStyle = [color, light, '#ff91bb', '#83e6ff'][i % 4];
              if (i % 3) ctx.fillRect(-3, -5, 6, 10);
              else sparkle(0, 0, 6);
            } finally { ctx.restore(); }
          }
        }
      }
      // 白いフラッシュは、すぐに消す。
      if (burst < 0.18) {
        ctx.globalAlpha = 0.95 * (1 - burst / 0.18);
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;
      }
    }

    // 音とお知らせは、それぞれ一度だけ。
    function frame() {
      if (stopped || ended) return;
      const t = Math.max(0, (performance.now() - start) / 1000);
      if (!landed && t >= 0.45) { landed = true; sound('ball'); }
      if (!bounced && t >= 0.85) { bounced = true; sound('bounce'); }
      if (!rolled && special && t >= 0.85) { rolled = true; sound('roll'); }
      if (!opened && t >= openAt) { opened = true; sound('pakaan'); }
      if (stopped) return;
      if (!revealed && t >= revealAt) {
        revealed = true;
        call(opts.onReveal);
        sound('fanfare');
        if (special) sound('rare');
      }
      if (stopped) return;
      if (ctx) {
        try {
          resize();
          ctx.save();
          try { draw(Math.min(t, endAt)); } finally { ctx.restore(); }
        } catch (_) {
          // 絵をかけないときも、お知らせはさいごまで進める。
        }
      }
      if (stopped) return;
      if (t >= endAt) {
        ended = true;
        call(opts.onEnd);
        return;
      }
      requestAnimationFrame(frame);
    }
    try { ctx = canvas && canvas.getContext('2d'); } catch (_) {}
    requestAnimationFrame(frame);
    return { skip, stop };
  }
  // いくつものボールをならべて、ひとつずつあける。
  function playMulti(canvas, opts) {
    opts = opts || {};
    const items = [];
    for (let i = 0; i < Math.min(10, (opts.items || []).length); i++) {
      items.push(opts.items[i] || {});
    }
    const n = items.length, cols = Math.min(5, n) || 1;
    const rows = Math.ceil(n / cols) || 1;
    const lastLand = 0.5 + Math.max(0, n - 1) * 0.06;
    const shakeAt = lastLand + 0.28, readyAt = shakeAt + 0.45;
    const times = [], opened = [], revealed = [];
    let next = readyAt, hasSpecial = false;
    for (let i = 0; i < n; i++) {
      if (items[i].special) { next += 0.55; hasSpecial = true; }
      times.push(next);
      next += 0.33;
    }
    const endAt = n ? times[n - 1] + 0.12 + 0.8 : 0;
    let start = performance.now();
    const clamp = (v) => Math.max(0, Math.min(1, v));
    const ease = (v) => 1 - Math.pow(1 - clamp(v), 3);
    let ctx, w = 0, h = 0, stopped = false, ended = false;
    let landed = false, bounced = false, rolled = false;
    let fanfare = false, rare = false, running = false, skipping = false;

    // お知らせがなくてもへいき。とばす、とめるは何度でもよい。
    function call(fn, a, b) {
      try { if (typeof fn === 'function') fn(a, b); } catch (_) {}
    }
    function sound(name) { if (!stopped && !ended) call(opts.se, name); }
    function stop() { stopped = true; }
    function reveal(i) {
      if (stopped || ended || revealed[i]) return;
      revealed[i] = true;
      call(opts.onReveal, i);
      if (!fanfare) { fanfare = true; sound('fanfare'); }
      if (items[i].special && !rare) { rare = true; sound('rare'); }
    }
    function finish() {
      if (stopped || ended) return;
      ended = true;
      call(opts.onEnd);
    }
    function skip() {
      if (stopped || ended || skipping) return;
      skipping = true;
      if (!running) finishSkip();
    }
    function finishSkip() {
      if (stopped || ended) return;
      running = true;
      try {
        /* ★とばした ときは、のこりを ぜんぶ あけて、
             ならんだ すがたを すこしだけ みせてから おわります
             （いきなり きえると、なにが でたか わかりません）*/
        let left = false;
        for (let i = 0; i < n; i++) if (!opened[i]) { opened[i] = true; left = true; }
        if (left) sound('pakaan');
        for (let i = 0; i < n && !stopped; i++) reveal(i);
        if (!stopped) {
          const hold = 0.7;
          start = performance.now() - Math.max(0, endAt - hold) * 1000;
          skipping = false;
        }
      } finally { running = false; }
    }

    // ひとつ用とおなじ大きさの合わせかた。背景はぬらない。
    function resize() {
      w = Math.max(0, canvas.clientWidth || 0);
      h = Math.max(0, canvas.clientHeight || 0);
      const dpr = typeof devicePixelRatio === 'number'
        ? Math.max(1, Math.min(2, devicePixelRatio || 1)) : 1;
      const pw = Math.round(w * dpr), ph = Math.round(h * dpr);
      if (canvas.width !== pw) canvas.width = pw;
      if (canvas.height !== ph) canvas.height = ph;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
    }

    // ひとつ用の光とカプセルをもとに、いろをえらんでかく。
    function glow(x, y, r, alpha, color, light) {
      if (r <= 0) return;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, light);
      g.addColorStop(0.35, color);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalAlpha = clamp(alpha);
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
      ctx.globalAlpha = 1;
    }
    function half(r, top, color) {
      ctx.beginPath();
      ctx.arc(0, 0, r, top ? Math.PI : 0, top ? Math.PI * 2 : Math.PI);
      ctx.closePath();
      ctx.fillStyle = top ? color : 'rgba(255,255,255,0.72)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(49,36,70,0.8)';
      ctx.lineWidth = Math.max(2, r * 0.045);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-r * 0.26, top ? -r * 0.37 : r * 0.36, r * 0.16, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.fill();
    }
    function sparkle(x, y, r) {
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.lineTo(x + r * 0.3, y - r * 0.3);
      ctx.lineTo(x + r, y);
      ctx.lineTo(x + r * 0.3, y + r * 0.3);
      ctx.lineTo(x, y + r);
      ctx.lineTo(x - r * 0.3, y + r * 0.3);
      ctx.lineTo(x - r, y);
      ctx.lineTo(x - r * 0.3, y - r * 0.3);
      ctx.closePath();
      ctx.fill();
    }
    function rays(x, y, r, age, light) {
      ctx.save();
      try {
        ctx.translate(x, y);
        ctx.rotate(age * 0.28);
        ctx.globalAlpha = 0.34 * ease(age / 0.18);
        ctx.fillStyle = light;
        for (let j = 0; j < 12; j++) {
          ctx.rotate(Math.PI / 6);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(r, -r * 0.065);
          ctx.lineTo(r, r * 0.065);
          ctx.closePath();
          ctx.fill();
        }
      } finally { ctx.restore(); }
    }

    // めずらしいボールだけ、輪がひろがり、つぶがすいこまれる。
    function charge(x, y, r, age, color, light) {
      for (let j = 0; j < 3; j++) {
        const p = (age / 0.55 + j / 3) % 1;
        ctx.globalAlpha = (1 - p) * 0.7;
        ctx.strokeStyle = j % 2 ? light : color;
        ctx.lineWidth = Math.max(1, r * 0.06);
        ctx.beginPath();
        ctx.arc(x, y, r * (1 + p * 1.1), 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let j = 0; j < 18; j++) {
        const p = (age / 0.55 + j * 0.137) % 1;
        const a = j * 2.4 + age * 0.3, dist = r * (2.2 - p * 1.8);
        ctx.globalAlpha = Math.sin(p * Math.PI);
        ctx.fillStyle = j % 2 ? light : color;
        sparkle(x + Math.cos(a) * dist, y + Math.sin(a) * dist, r * 0.1);
      }
      ctx.globalAlpha = 1;
    }

    // よこは五こまで。あいたキャラは、その場所にのこす。
    function drawItem(i, t, cellW, cellH, charH) {
      const item = items[i], color = item.color || '#ffcc33';
      const light = item.color2 || '#fff3c0';
      const x = w * 0.05 + (i % cols + 0.5) * cellW;
      const ground = h * 0.16 + (Math.floor(i / cols) + 0.78) * cellH;
      const r = Math.min(cellW * 0.28, cellH * 0.18, h * 0.085);
      const cy = ground - r, age = t - times[i];
      if (age < 0) {
        const local = t - i * 0.06;
        if (local < 0) return;
        let y = cy, sx = 1, sy = 1;
        if (local < 0.5) {
          y = -r * 1.5 + (cy + r * 1.5) * Math.pow(local / 0.5, 2);
        } else if (local < 0.78) {
          const p = (local - 0.5) / 0.28;
          const squash = Math.exp(-p * 16) * 0.28;
          y -= Math.sin(p * Math.PI) * r * 0.8;
          sx += squash; sy -= squash; y += r * squash;
        }
        const q = clamp((t - shakeAt) / 0.45);
        const near = clamp((y + r) / ground);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(x, ground + r * 0.1, r * (0.25 + near * 0.8), r * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        if (q > 0) glow(x, cy, r * 1.8, q * 0.45, color, light);
        if (item.special && age >= -0.55) charge(x, cy, r, age + 0.55, color, light);
        ctx.save();
        try {
          ctx.translate(x + Math.sin(t * 95 + i) * r * q * 0.07, y);
          ctx.scale(sx, sy);
          ctx.rotate(Math.sin(t * 65 + i) * q * 0.06);
          // 背景をぬらずに、ボールの明るさをすこしおさえる。
          ctx.globalAlpha = hasSpecial && t >= shakeAt && t < readyAt ? 0.72 : 1;
          half(r, true, color);
          half(r, false, color);
          ctx.globalAlpha = 1;
          if (q > 0) {
            ctx.shadowColor = light;
            ctx.shadowBlur = q * r * 0.6;
            ctx.strokeStyle = light;
            ctx.lineWidth = 1 + q * r * 0.12;
            ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.stroke();
          }
        } finally { ctx.restore(); }
        return;
      }

      // パカーン！ 光はそのボールのまわりだけにひろげる。
      rays(x, ground - charH * 0.5, Math.min(cellW, cellH) * 0.48, age, light);
      glow(x, ground - charH * 0.5, charH * 0.65, 0.3, color, light);
      if (age < 0.45) {
        for (let j = 0; j < 2; j++) {
          ctx.save();
          try {
            const dir = j === 0 ? -1 : 1;
            ctx.globalAlpha = clamp(1 - age / 0.45);
            ctx.translate(x + dir * age * r, cy + dir * age * r * 4);
            ctx.rotate(dir * age * 5);
            half(r, j === 0, color);
          } finally { ctx.restore(); }
        }
      }
      if (age < 0.16) glow(x, cy, r * 2, 1 - age / 0.16, '#fff', '#fff');
      if (age < 0.12) return;

      // 足もとからふわっとのびる。星と名前にもふちをつける。
      const p = ease((age - 0.12) / 0.25);
      ctx.save();
      try {
        ctx.translate(x, ground + (1 - p) * charH * 0.18);
        ctx.scale(p, p);
        call(item.drawChar, ctx, charH);
      } finally { ctx.restore(); }
      if (stopped) return;
      ctx.save();
      try {
        const size = Math.min(20, cellW * 0.16, cellH * 0.07);
        ctx.globalAlpha = p;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round'; ctx.strokeStyle = '#30213f';
        ctx.fillStyle = color; ctx.lineWidth = Math.max(2, size * 0.18);
        ctx.font = 'bold ' + size + 'px sans-serif';
        ctx.strokeText(item.star || '', x, ground - charH - size, cellW * 0.9);
        ctx.fillText(item.star || '', x, ground - charH - size, cellW * 0.9);
        ctx.font = 'bold ' + size * 0.7 + 'px sans-serif';
        ctx.strokeText(item.label || '', x, ground + size, cellW * 0.9);
        ctx.fillText(item.label || '', x, ground + size, cellW * 0.9);
      } finally { ctx.restore(); }

      // めずらしいキャラのまわりに、紙ふぶきと星がふる。
      if (item.special) {
        for (let j = 0; j < 20; j++) {
          ctx.save();
          try {
            const fall = ((j * 0.373 + (age - 0.12) * 0.55) % 1);
            ctx.translate(x + ((j * 0.6180339) % 1 - 0.5) * cellW * 0.85,
              ground - charH * 1.3 + fall * charH * 1.5);
            ctx.rotate(j + age * (j % 2 ? 3 : -3));
            ctx.globalAlpha = p * (1 - fall * 0.5);
            ctx.fillStyle = [color, light, '#ff91bb', '#83e6ff'][j % 4];
            const size = Math.min(5, cellW * 0.045);
            if (j % 3) ctx.fillRect(-size / 2, -size, size, size * 2);
            else sparkle(0, 0, size);
          } finally { ctx.restore(); }
        }
      }
    }
    function paint(t) {
      if (!ctx || stopped || ended) return;
      try {
        resize();
        if (!w || !h) return;
        const cellW = w * 0.9 / cols, cellH = h * 0.68 / rows;
        const charH = Math.min(cellW * 0.8, h / (rows + 1) * 0.8, h * 0.3);
        for (let i = 0; i < n && !stopped && !ended; i++) {
          ctx.save();
          try { drawItem(i, t, cellW, cellH, charH); } finally { ctx.restore(); }
        }
      } catch (_) {
        // 絵をかけないときも、お知らせはさいごまで進める。
      }
    }

    // 時間がとんでも、あく順とお知らせの回数をまもる。
    function frame() {
      if (stopped || ended) return;
      running = true;
      try {
        const t = Math.max(0, (performance.now() - start) / 1000);
        if (n && !landed && t >= 0.5) { landed = true; sound('ball'); }
        if (n && !bounced && t >= lastLand) { bounced = true; sound('bounce'); }
        if (!rolled && hasSpecial && t >= shakeAt) { rolled = true; sound('roll'); }
        for (let i = 0; i < n && !stopped && !skipping; i++) {
          if (!opened[i] && t >= times[i]) { opened[i] = true; sound('pakaan'); }
          if (!stopped && !skipping && t >= times[i] + 0.12) reveal(i);
        }
        if (!stopped && !skipping) paint(Math.min(t, endAt));
        if (!skipping && t >= endAt) finish();
      } finally { running = false; }
      if (stopped || ended) return;
      if (skipping) {
        finishSkip();
        if (!stopped && !ended) requestAnimationFrame(frame);
        return;
      }
      requestAnimationFrame(frame);
    }
    try { ctx = canvas && canvas.getContext('2d'); } catch (_) {}
    requestAnimationFrame(frame);
    return { skip, stop };
  }
  return { play, playMulti };
})();
