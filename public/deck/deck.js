/* ===== Meera deck — engine ===== */
(() => {
  const stage = document.getElementById('stage');
  const slides = [...stage.querySelectorAll('.slide')];
  const $ = id => document.getElementById(id);
  const counter = $('counter'), barDone = $('bar').querySelector('b'), barNow = $('bar').querySelector('i');
  const DEFAULT_MS = 8000;
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let cur = -1, playing = true, timer = null, t0 = 0, elapsed = 0, raf = 0;

  /* --- Fit 1920×1080 stage to the window --- */
  const fit = () => {
    const s = Math.min(innerWidth / 1920, innerHeight / 1080);
    stage.style.transform = `translate(-50%,-50%) scale(${s})`;
  };
  addEventListener('resize', fit); fit();

  /* --- Text splitting helpers --- */
  document.querySelectorAll('.split').forEach(el => {
    const txt = el.textContent; el.textContent = ''; el.setAttribute('aria-label', txt);
    [...txt].forEach((c, i) => {
      const s = document.createElement('span'); s.className = 'ch'; s.style.setProperty('--i', i);
      s.setAttribute('aria-hidden', 'true'); s.textContent = c === ' ' ? ' ' : c; el.appendChild(s);
    });
  });
  document.querySelectorAll('.lines').forEach(el => {
    const parts = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = parts.map((p, i) => `<span class="ln"><span style="--i:${i}">${p.trim()}</span></span>`).join('');
  });

  /* --- Ornaments --- */
  const ORN = '<svg viewBox="0 0 32 32"><g transform="translate(16 16)">' +
    [0, 90, 180, 270].map(r => `<path d="M0-2C2.6-5 2.6-9 0-13-2.6-9-2.6-5 0-2z" transform="rotate(${r})"/>`).join('') +
    [45, 135, 225, 315].map(r => `<path d="M0-2C2.6-5 2.6-9 0-13-2.6-9-2.6-5 0-2z" transform="rotate(${r}) scale(.6)"/>`).join('') +
    '<circle r="1.6"/></g></svg>';
  document.querySelectorAll('.orn').forEach(el => el.innerHTML = ORN);
  document.querySelectorAll('.bul').forEach(ul => [...ul.children].forEach((li, i) => li.style.setProperty('--i', i)));

  /* --- Count-up numbers: <span data-count data-delay="1.2">27+</span> --- */
  function countUp(slide) {
    slide.querySelectorAll('[data-count]').forEach(el => {
      const src = el.dataset.src || (el.dataset.src = el.textContent);
      const nums = src.match(/\d+/g) || []; if (REDUCED) { el.textContent = src; return; }
      const delay = (+el.dataset.delay || 0) * 1000, dur = +el.dataset.dur || 1600;
      const t0 = performance.now() + delay;
      el.textContent = src.replace(/\d+/g, m => '0'.padStart(m.length > 1 && m[0] === '0' ? m.length : 1, '0'));
      const step = now => {
        if (!slide.classList.contains('active')) return;
        const k = Math.min(1, Math.max(0, (now - t0) / dur)), e = 1 - Math.pow(1 - k, 4);
        let i = 0; el.textContent = src.replace(/\d+/g, m => String(Math.round(+nums[i++] * e)));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  /* --- Floating petals (canvas) --- */
  const petalSystems = new Map();
  function petals(slide) {
    const cv = slide.querySelector('canvas.petals'); if (!cv || REDUCED) return null;
    if (petalSystems.has(cv)) return petalSystems.get(cv);
    const ctx = cv.getContext('2d'); cv.width = 1920; cv.height = 1080;
    const N = +cv.dataset.count || 14, colors = cv.dataset.colors ? cv.dataset.colors.split(',') : ['#c8283a', '#e0505e', '#a3121f', '#f08a8f'];
    const P = Array.from({ length: N }, () => spawn(true));
    function spawn(init) {
      return { x: Math.random() * 1920, y: init ? Math.random() * 1080 : -60, r: 10 + Math.random() * 22,
        vx: .15 + Math.random() * .45, vy: .35 + Math.random() * .7, a: Math.random() * 6.28,
        va: (Math.random() - .5) * .02, sw: Math.random() * 6.28, blur: Math.random() < .35 ? 6 + Math.random() * 8 : 0,
        c: colors[(Math.random() * colors.length) | 0], o: .45 + Math.random() * .45 };
    }
    let on = false;
    const sys = {
      start() { if (on) return; on = true; loop(); },
      stop() { on = false; }
    };
    function loop() {
      if (!on) return;
      ctx.clearRect(0, 0, 1920, 1080);
      for (const p of P) {
        p.sw += .012; p.x += p.vx + Math.sin(p.sw) * .6; p.y += p.vy; p.a += p.va;
        if (p.y > 1140 || p.x > 1980) Object.assign(p, spawn(false), { x: Math.random() * 1600 - 200 });
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.globalAlpha = p.o;
        ctx.filter = p.blur ? `blur(${p.blur}px)` : 'none'; ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.moveTo(0, -p.r);
        ctx.bezierCurveTo(p.r * .9, -p.r * .6, p.r * .7, p.r * .7, 0, p.r);
        ctx.bezierCurveTo(-p.r * .7, p.r * .7, -p.r * .9, -p.r * .6, 0, -p.r); ctx.fill();
        ctx.restore();
      }
      requestAnimationFrame(loop);
    }
    petalSystems.set(cv, sys); return sys;
  }

  /* --- Navigation --- */
  function go(n, dir) {
    n = Math.max(0, Math.min(slides.length - 1, n));
    if (n === cur) return;
    const back = dir === undefined ? n < cur : dir < 0;
    const prev = slides[cur];
    if (prev) {
      prev.classList.remove('active'); prev.classList.add('leaving'); prev.classList.toggle('back', back);
      setTimeout(() => { prev.classList.remove('leaving', 'back'); const p = petals(prev); p && !prev.classList.contains('active') && p.stop(); }, 950);
    }
    const next = slides[n];
    // restart CSS animations
    next.classList.remove('active'); void next.offsetWidth; next.classList.add('active');
    const p = petals(next); p && p.start(); countUp(next);
    cur = n; history.replaceState(null, '', '#' + (n + 1));
    counter.textContent = String(n + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
    barDone.style.transform = `scaleX(${n / slides.length})`;
    preload(n + 1);
    elapsed = 0; schedule();
  }
  const next = () => cur < slides.length - 1 ? go(cur + 1, 1) : (playing && go(0, 1));
  const prev = () => go(cur - 1, -1);

  function duration() { return +slides[cur].dataset.duration || DEFAULT_MS; }
  function schedule() {
    clearTimeout(timer); cancelAnimationFrame(raf);
    if (!playing) { drawBar(); return; }
    t0 = performance.now() - elapsed;
    timer = setTimeout(next, duration() - elapsed);
    const tick = () => { elapsed = performance.now() - t0; drawBar(); if (playing) raf = requestAnimationFrame(tick); };
    tick();
  }
  function drawBar() {
    const frac = Math.min(1, elapsed / duration());
    barNow.style.transform = `scaleX(${(cur + frac) / slides.length})`;
  }
  function setPlaying(v) {
    playing = v; document.body.classList.toggle('playing', v);
    $('play').setAttribute('aria-label', v ? 'Pause' : 'Play');
    if (v) schedule(); else { clearTimeout(timer); cancelAnimationFrame(raf); elapsed = performance.now() - t0; drawBar(); }
  }
  function preload(i) {
    const s = slides[i]; if (!s) return;
    s.querySelectorAll('[data-bg]').forEach(el => { const im = new Image(); im.src = el.dataset.bg; });
  }
  // lazy backgrounds
  slides.forEach(s => s.querySelectorAll('[data-bg]').forEach(el => el.style.backgroundImage = `url("${el.dataset.bg}")`));

  /* --- Inputs --- */
  addEventListener('keydown', e => {
    const k = e.key;
    if (['ArrowRight', 'PageDown', 'Enter'].includes(k) || (k === ' ' && !e.shiftKey)) { e.preventDefault(); next(); }
    else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(k)) { e.preventDefault(); prev(); }
    else if (k === 'Home') go(0); else if (k === 'End') go(slides.length - 1);
    else if (k === 'p' || k === 'P' || k === 'k') setPlaying(!playing);
    else if (k === 'f' || k === 'F') toggleFs();
    wake();
  });
  stage.addEventListener('click', e => { (e.clientX < innerWidth * .25 ? prev : next)(); });
  let tx = 0, ty = 0;
  addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) (dx < 0 ? next : prev)();
  });
  $('prev').onclick = e => { e.stopPropagation(); prev(); };
  $('next').onclick = e => { e.stopPropagation(); next(); };
  $('play').onclick = e => { e.stopPropagation(); setPlaying(!playing); };
  $('fs').onclick = e => { e.stopPropagation(); toggleFs(); };
  $('bar').onclick = e => { const r = e.currentTarget.getBoundingClientRect(); go(Math.floor((e.clientX - r.left) / r.width * slides.length)); };
  function toggleFs() { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.(); }
  document.addEventListener('visibilitychange', () => { if (document.hidden && playing) { setPlaying(false); document.body.dataset.resume = 1; } else if (!document.hidden && document.body.dataset.resume) { delete document.body.dataset.resume; setPlaying(true); } });

  // hide UI when idle
  let idleT; const wake = () => { document.body.classList.remove('idle'); clearTimeout(idleT); idleT = setTimeout(() => document.body.classList.add('idle'), 2500); };
  addEventListener('mousemove', wake); wake();

  const start = Math.max(0, (parseInt(location.hash.slice(1)) || 1) - 1);
  document.body.classList.add('playing');
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  fontsReady.then(() => go(start));
})();
