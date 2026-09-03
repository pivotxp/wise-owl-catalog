/* ============================================================
   Striking Out Cancer — fan experience flow (POC)
   Screens: splash → team → personalize → post → thanks
   No data leaves the browser; signs persist to localStorage
   only so the Live Wall page can display them.
   ============================================================ */

(function () {
  'use strict';

  var STORE_KEY = 'soc_signs_v1';
  var channel = 'BroadcastChannel' in window ? new BroadcastChannel('soc-wall') : null;

  var state = {
    team: null,
    message: APPROVED_MESSAGES[0],
    name: '',
    style: 'home', // home | classic | postseason
  };

  /* ---------- screen router ---------- */

  var screens = Array.prototype.slice.call(document.querySelectorAll('.screen'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('#stepDots .dot'));

  function show(step) {
    screens.forEach(function (s) {
      s.classList.toggle('active', Number(s.dataset.step) === step);
    });
    dots.forEach(function (d) {
      var n = Number(d.dataset.step);
      d.classList.toggle('active', n === step);
      d.classList.toggle('done', n < step);
    });
    window.scrollTo({ top: 0 });
  }

  /* ---------- splash ---------- */

  document.getElementById('btnBegin').addEventListener('click', function (e) {
    e.stopPropagation();
    show(1);
  });
  document.getElementById('screen-splash').addEventListener('click', function () {
    show(1);
  });

  /* ---------- team picker ---------- */

  var grid = document.getElementById('teamGrid');

  function renderTeams(filter) {
    grid.innerHTML = '';
    MLB_TEAMS
      .filter(function (t) { return filter === 'ALL' || t.league === filter; })
      .sort(function (a, b) { return a.name.localeCompare(b.name); })
      .forEach(function (t, i) {
        var card = document.createElement('button');
        card.className = 'team-card';
        card.style.setProperty('--tp', t.primary);
        card.style.setProperty('--ts', t.secondary);
        card.style.animationDelay = (i * 18) + 'ms';
        card.setAttribute('aria-label', (t.city + ' ' + t.name).trim());
        card.innerHTML =
          '<img class="team-mark" src="assets/teams/' + t.id + '.png" alt="" loading="lazy" />' +
          '<div class="t-city">' + t.city + '</div>' +
          '<div class="t-name">' + (t.name || '&nbsp;') + '</div>';
        card.addEventListener('click', function () { pickTeam(t); });
        grid.appendChild(card);
      });
  }

  document.getElementById('teamFilters').addEventListener('click', function (e) {
    var chip = e.target.closest('.chip');
    if (!chip) return;
    this.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('active'); });
    chip.classList.add('active');
    renderTeams(chip.dataset.filter);
  });

  function pickTeam(t) {
    state.team = t;
    updatePreview(true);
    show(2);
  }

  /* ---------- personalize ---------- */

  var msgSelect = document.getElementById('msgSelect');
  APPROVED_MESSAGES.forEach(function (m) {
    var o = document.createElement('option');
    o.value = m;
    o.textContent = m;
    msgSelect.appendChild(o);
  });

  msgSelect.addEventListener('change', function () {
    state.message = this.value;
    updatePreview(true);
  });

  var nameInput = document.getElementById('nameInput');
  var nameHint = document.getElementById('nameHint');
  var nameHintDefault = nameHint.textContent;
  var btnAddToWall = document.getElementById('btnAddToWall');

  nameInput.addEventListener('input', function () {
    var value = this.value.replace(/[<>]/g, '').slice(0, 18);
    var clean = Moderation.isClean(value);

    this.classList.toggle('flagged', !clean);
    nameHint.classList.toggle('warn', !clean);
    nameHint.textContent = clean
      ? nameHintDefault
      : "Let's keep the wall about the people we're honoring — that name can't be displayed.";
    btnAddToWall.disabled = !clean;

    state.name = clean ? value : '';
    updatePreview(false);
  });

  document.getElementById('styleRow').addEventListener('click', function (e) {
    var opt = e.target.closest('.style-option');
    if (!opt) return;
    this.querySelectorAll('.style-option').forEach(function (b) { b.classList.remove('selected'); });
    opt.classList.add('selected');
    state.style = opt.dataset.style;
    updatePreview(true);
  });

  function applySignStyle(el, sign) {
    var t = getTeam(sign.teamId) || sign.team || state.team;
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
    /* official lockups: full-color on pinstripe, white on team colors */
    var logo = el.querySelector('.sign-logo');
    var lockup = el.querySelector('.sign-lockup');
    if (logo) logo.src = pin ? 'assets/soc-primary-color.svg' : 'assets/soc-primary-white.svg';
    if (lockup) lockup.src = pin ? 'assets/abbvie-mlb-color.png' : 'assets/abbvie-mlb-white-tag.png';
  }

  function updatePreview(stamp) {
    if (!state.team) return;
    var sign = document.getElementById('signPreview');
    applySignStyle(sign, { teamId: state.team.id, style: state.style });
    document.getElementById('pvMsg').textContent = state.message;
    document.getElementById('pvName').textContent = state.name;
    // hint the team style also on the home/postseason toggles
    var row = document.getElementById('styleRow');
    row.querySelector('[data-style="home"]').style.setProperty('--tp', state.team.primary);
    row.querySelector('[data-style="classic"]').style.setProperty('--tp', state.team.primary);
    if (stamp) {
      var k = document.getElementById('pvK');
      k.classList.remove('stamp-anim');
      void k.offsetWidth; // restart animation
      k.classList.add('stamp-anim');
    }
  }

  document.getElementById('btnBackTeam').addEventListener('click', function () { show(1); });

  /* ---------- post to wall ---------- */

  function makeSignEl(sign, extraClass) {
    var el = document.createElement('div');
    el.className = 'k-sign' + (extraClass ? ' ' + extraClass : '');
    el.innerHTML =
      '<img class="sign-logo" src="assets/soc-primary-white.svg" alt="" />' +
      '<div class="sign-k">K</div>' +
      '<div class="sign-msg">' + escapeHtml(sign.message) + '</div>' +
      '<div class="sign-name">' + escapeHtml(sign.name || '') + '</div>' +
      '<img class="sign-lockup" src="assets/abbvie-mlb-white-tag.png" alt="" />' +
      '<div class="sign-donate">Donations to <b>fight cancer</b> with every strikeout</div>';
    applySignStyle(el, sign);
    return el;
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function randomAmbientSign() {
    var t = MLB_TEAMS[Math.floor(Math.random() * MLB_TEAMS.length)];
    var styles = ['home', 'home', 'classic', 'postseason'];
    return {
      teamId: t.id,
      message: APPROVED_MESSAGES[Math.floor(Math.random() * APPROVED_MESSAGES.length)],
      name: '',
      style: styles[Math.floor(Math.random() * styles.length)],
    };
  }

  btnAddToWall.addEventListener('click', function () {
    if (!Moderation.isClean(state.name)) return; // belt and suspenders
    var sign = {
      teamId: state.team.id,
      message: state.message,
      name: state.name.trim(),
      style: state.style,
      ts: Date.now(),
    };
    persistSign(sign);
    show(3);
    runPostAnimation(sign);
  });

  function persistSign(sign) {
    try {
      var all = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
      all.push(sign);
      if (all.length > 60) all = all.slice(-60); // cap the demo store
      localStorage.setItem(STORE_KEY, JSON.stringify(all));
    } catch (e) { /* storage unavailable — demo continues without wall sync */ }
    if (channel) channel.postMessage({ type: 'new-sign', sign: sign });
  }

  function runPostAnimation(sign) {
    var wall = document.getElementById('miniWall');
    var status = document.getElementById('postStatus');
    wall.innerHTML = '';
    status.textContent = 'Sending your sign to the wall…';

    var cols = window.matchMedia('(max-width: 780px)').matches ? 4 : 6;
    var total = cols * 2;
    var yourSlot = Math.floor(total / 2) + Math.floor(Math.random() * cols) - 1;

    var i = 0;
    var fill = setInterval(function () {
      if (i >= total) {
        clearInterval(fill);
        return;
      }
      var slot = i;
      i++;
      var el;
      if (slot === yourSlot) {
        el = makeSignEl(sign, 'highlight');
        setTimeout(function () {
          status.innerHTML = '<span class="ok">✔ Your K is on the wall</span> — and it counts.';
          setTimeout(function () { show(4); }, 1600);
        }, 700);
      } else {
        el = makeSignEl(randomAmbientSign(), 'incoming');
      }
      wall.appendChild(el);
    }, 110);
  }

  /* ---------- download (canvas render) ---------- */

  /* official artwork preloaded for the canvas render */
  function loadImg(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = src;
    });
  }

  var canvasAssets = Promise.all([
    loadImg('assets/soc-primary-white.svg'),
    loadImg('assets/soc-primary-color.svg'),
    loadImg('assets/abbvie-mlb-white-tag.png'),
    loadImg('assets/abbvie-mlb-color.png'),
  ]).then(function (imgs) {
    return { socWhite: imgs[0], socColor: imgs[1], mlbWhite: imgs[2], mlbColor: imgs[3] };
  });

  document.getElementById('btnDownload').addEventListener('click', function () {
    canvasAssets.then(downloadSign);
  });

  function drawCentered(ctx, img, W, y, w) {
    if (!img) return 0;
    var h = w * (img.naturalHeight / img.naturalWidth);
    ctx.drawImage(img, (W - w) / 2, y, w, h);
    return h;
  }

  function downloadSign(assets) {
    var t = state.team || MLB_TEAMS[0];
    var canvas = document.getElementById('renderCanvas');
    var ctx = canvas.getContext('2d');
    var W = canvas.width, H = canvas.height;

    var isPin = state.style === 'classic';
    var bg = state.style === 'postseason' ? '#0c2340' : t.primary;
    var kColor = isPin ? t.primary : (state.style === 'postseason' ? postseasonAccent(t.secondary) : '#ffffff');
    var textColor = isPin ? t.primary : 'rgba(255,255,255,0.95)';

    // background
    if (isPin) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(12,35,64,0.16)';
      for (var x = 0; x < W; x += 44) ctx.fillRect(x, 0, 6, H);
    } else {
      var g = ctx.createLinearGradient(0, 0, W * 0.4, H);
      g.addColorStop(0, shade(bg, 22));
      g.addColorStop(0.55, bg);
      g.addColorStop(1, shade(bg, -12));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    // official SOC lockup
    drawCentered(ctx, isPin ? assets.socColor : assets.socWhite, W, 64, 380);

    // giant K
    ctx.textAlign = 'center';
    ctx.fillStyle = kColor;
    ctx.font = '700 640px "Barlow Condensed", "Arial Narrow", sans-serif';
    if (!isPin) {
      ctx.shadowColor = 'rgba(0,0,0,0.35)';
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 16;
    }
    ctx.fillText('K', W / 2, 860);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // message
    ctx.fillStyle = textColor;
    ctx.font = '600 60px "Barlow Condensed", "Arial Narrow", sans-serif';
    ctx.fillText(state.message.toUpperCase(), W / 2, 1000);

    // name (script)
    if (state.name.trim()) {
      ctx.save();
      ctx.translate(W / 2, 1108);
      ctx.rotate(-0.05);
      ctx.fillStyle = isPin ? '#b3372f' : '#ffc52f';
      ctx.font = '600 92px Caveat, "Snell Roundhand", cursive';
      ctx.fillText(state.name.trim(), 0, 0);
      ctx.restore();
    }

    // AbbVie | MLB partner lockup + compliance strip
    drawCentered(ctx, isPin ? assets.mlbColor : assets.mlbWhite, W, 1140, 380);
    ctx.fillStyle = isPin ? 'rgba(12,35,64,0.75)' : 'rgba(255,255,255,0.8)';
    ctx.font = '600 30px "Barlow Condensed", "Arial Narrow", sans-serif';
    ctx.fillText('DONATIONS TO FIGHT CANCER WITH EVERY STRIKEOUT', W / 2, 1312);

    var a = document.createElement('a');
    a.download = 'striking-out-cancer-' + t.id + '.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
  }

  function shade(hex, pct) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.min(255, Math.max(0, (n >> 16) + Math.round(2.55 * pct)));
    var g = Math.min(255, Math.max(0, ((n >> 8) & 255) + Math.round(2.55 * pct)));
    var b = Math.min(255, Math.max(0, (n & 255) + Math.round(2.55 * pct)));
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  /* ---------- restart ---------- */

  document.getElementById('btnRestart').addEventListener('click', function () {
    state.name = '';
    nameInput.value = '';
    nameInput.classList.remove('flagged');
    nameHint.classList.remove('warn');
    nameHint.textContent = nameHintDefault;
    btnAddToWall.disabled = false;
    show(1);
  });

  /* ---------- boot ---------- */

  renderTeams('ALL');
  show(0);
})();
