/* ============================================================
   Strikeout Wall — video-board display (POC)
   Features one fan dedication at a time on a 1920×1080 canvas,
   rotating every ROTATE_MS with a crossfade. Signs created in
   the fan app on this device are queued next and tagged LIVE.
   Production: real-time feed service + moderation queue.
   ============================================================ */

(function () {
  'use strict';

  var STORE_KEY = 'soc_signs_v1';
  var ROTATE_MS = 10000;
  var SIGN_NO_BASE = 12431; // simulated national participation baseline

  /* ---------- scale the fixed 1920×1080 stage to the window ---------- */

  var stage = document.getElementById('stage');
  function fit() {
    var s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    stage.style.transform = 'translate(-50%, -50%) scale(' + s + ')';
  }
  window.addEventListener('resize', fit);
  fit();

  /* ---------- dedication queue ---------- */

  /* Curated sample dedications (simulated fans, for rotation depth) */
  var SAMPLES = [
    { teamId: 'chc', message: 'For my mom',                              name: 'Maria',       style: 'home' },
    { teamId: 'nyy', message: 'In memory of a champion',                 name: 'Pop',         style: 'classic' },
    { teamId: 'lad', message: 'For those fighting for a cure',           name: '',            style: 'home' },
    { teamId: 'det', message: 'Thank you, oncology healthcare workers',  name: '4th Floor',   style: 'postseason' },
    { teamId: 'atl', message: 'In celebration of all cancer survivors',  name: 'Coach D',     style: 'home' },
    { teamId: 'sea', message: 'For my teammate for life',                name: 'Jess',        style: 'classic' },
    { teamId: 'phi', message: 'For everyone still in the fight',         name: '',            style: 'postseason' },
    { teamId: 'stl', message: 'For my hero',                             name: 'Grandma Rose', style: 'home' },
  ];

  var queue = [];
  var stored = [];
  try { stored = JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch (e) {}

  // Device-created signs lead the rotation, newest first, tagged live
  stored.slice(-4).reverse().forEach(function (s, i) {
    queue.push({ sign: s, live: false, no: SIGN_NO_BASE + stored.length - i });
  });
  SAMPLES.forEach(function (s, i) {
    queue.push({ sign: s, live: false, no: SIGN_NO_BASE - 40 + i * 3 });
  });

  var idx = 0;

  /* ---------- rendering ---------- */

  var main = document.getElementById('bMain');
  var featSign = document.getElementById('featSign');

  function applySignStyle(el, sign) {
    var t = getTeam(sign.teamId) || MLB_TEAMS[0];
    var pin = sign.style === 'classic';
    el.classList.remove('pinstripe');
    if (pin) {
      el.classList.add('pinstripe');
      el.style.setProperty('--sp', t.primary);
      el.style.setProperty('--ss', t.primary);
    } else if (sign.style === 'postseason') {
      el.style.setProperty('--sp', '#0c2340');
      el.style.setProperty('--ss', postseasonAccent(t.secondary));
    } else {
      el.style.setProperty('--sp', t.primary);
      el.style.setProperty('--ss', '#ffffff');
    }
    var logo = el.querySelector('.sign-logo');
    var lockup = el.querySelector('.sign-lockup');
    if (logo) logo.src = pin ? 'assets/soc-primary-color.svg' : 'assets/soc-primary-white.svg';
    if (lockup) lockup.src = pin ? 'assets/abbvie-mlb-color.png' : 'assets/abbvie-mlb-white-tag.png';
  }

  function renderEntry(entry) {
    var sign = entry.sign;
    var t = getTeam(sign.teamId) || MLB_TEAMS[0];
    var name = Moderation.displayName(sign.name || ''); // re-screen before board display

    applySignStyle(featSign, sign);
    document.getElementById('signMsg').textContent = sign.message;
    document.getElementById('signName').textContent = name;

    document.getElementById('detailMsg').textContent = sign.message;
    document.getElementById('detailName').textContent = name ? '— ' + name : '';
    document.getElementById('detailTeam').textContent =
      (t.city + ' ' + t.name).trim() + ' fan · Sign No. ' + entry.no.toLocaleString('en-US');

    main.classList.toggle('has-live', !!entry.live);
  }

  function showNext() {
    main.classList.add('fading');
    setTimeout(function () {
      idx = (idx + 1) % queue.length;
      renderEntry(queue[idx]);
      main.classList.remove('fading');
    }, 620);
  }

  var timer = setInterval(showNext, ROTATE_MS);

  // parent catalog pauses rotation when the board is scrolled off-screen
  var wallPaused = false;
  window.addEventListener('message', function (e) {
    if (e.origin !== window.location.origin) return;   // only the hosting catalog drives us
    if (!e.data || !e.data.cmd) return;
    if (e.data.cmd === 'pause' && !wallPaused) { wallPaused = true; clearInterval(timer); }
    if (e.data.cmd === 'resume' && wallPaused) { wallPaused = false; timer = setInterval(showNext, ROTATE_MS); }
  });

  /* ---------- live signs from the fan app (same device) ---------- */

  function enqueueLive(sign) {
    queue.splice(idx + 1, 0, { sign: sign, live: true, no: SIGN_NO_BASE + stored.length + 1 });
    stored.push(sign);
    clearInterval(timer);
    showNext(); // feature it right away
    timer = setInterval(showNext, ROTATE_MS);
  }

  if ('BroadcastChannel' in window) {
    new BroadcastChannel('soc-wall').onmessage = function (e) {
      if (e.data && e.data.type === 'new-sign') enqueueLive(e.data.sign);
    };
  }

  if (!('BroadcastChannel' in window)) window.addEventListener('storage', function (e) {
    if (e.key !== STORE_KEY || !e.newValue) return;
    try {
      var all = JSON.parse(e.newValue);
      if (all.length) enqueueLive(all[all.length - 1]);
    } catch (err) {}
  });

  /* ---------- boot ---------- */

  renderEntry(queue[idx]);
})();
