/* ============================================================
   Kreator światów i wrogów – pełny pixel editor
   ============================================================ */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);

  const PALETTE = [
    '#000000', '#1a1a2e', '#16213e', '#0f3460', '#e94560', '#f2c14e', '#4ad66a', '#4aa3ff',
    '#ffffff', '#c0c0c0', '#808080', '#404040', '#8b4513', '#d2691e', '#f5deb3', '#228b22',
    '#32cd32', '#90ee90', '#191970', '#4169e1', '#87ceeb', '#ff6347', '#ffd700', '#da70d6',
    '#8b008b', '#ff69b4', '#00ced1', '#20b2aa', '#f0e68c', '#cd853f', '#a0522d', '#2f4f4f',
    '#ff4500', '#ff8c00', '#7b68ee', '#00fa9a', '#dc143c', '#b22222', '#5c4033', '#3d5c5c',
    '#6a3a1a', '#3a5a2a', '#c8a050', '#e8d090', '#5a2a7a', '#8ac07a', '#101020', '#ffe070'
  ];

  let mod = null;
  let mode = 'maps';
  let selKey = null;
  let tool = 'pencil';
  let color = '#f2c14e';
  let brush = 1;
  let gridOn = true;
  let drawing = false;
  let anim = 'idle';
  let scale = 4;
  let pw = 160, ph = 80;
  let buf = null;
  let undoStack = [];
  const MAX_UNDO = 30;

  const cv = $('draw');
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = false;

  function init() {
    if (typeof ModAPI === 'undefined') {
      alert('Brak mod-api.js – otwórz edytor z folderu gry (editor/editor.html).');
      return;
    }
    buildPalette();
    bindUI();
    ModAPI.loadAll();
    const list = ModAPI.list;
    if (list.length) {
      mod = JSON.parse(JSON.stringify(list[list.length - 1]));
    } else {
      mod = ModAPI.template('Mój pierwszy świat');
    }
    loadModToForm();
    renderLists();
    const firstMap = Object.keys(mod.maps || {})[0];
    if (firstMap) selectMap(firstMap);
    else setupCanvas(160, 80, 4);
    toast('Kreator gotowy – rysuj na canvasie');
  }

  function buildPalette() {
    const el = $('palette');
    el.innerHTML = '';
    PALETTE.forEach((c) => {
      const s = document.createElement('span');
      s.style.background = c;
      s.title = c;
      if (c === color) s.classList.add('sel');
      s.addEventListener('click', () => {
        color = c;
        el.querySelectorAll('span').forEach((x) => x.classList.remove('sel'));
        s.classList.add('sel');
      });
      el.appendChild(s);
    });
  }

  function bindUI() {
    $('btn-new').onclick = () => {
      if (!confirm('Nowy mod? Niezapisane zmiany przepadną.')) return;
      mod = ModAPI.template('Nowy świat');
      selKey = null;
      loadModToForm();
      renderLists();
      const k = Object.keys(mod.maps)[0];
      if (k) selectMap(k);
      toast('Nowy mod');
    };
    $('btn-save').onclick = () => {
      commitAll();
      ModAPI.upsert(mod);
      const err = ModAPI.validate(mod);
      if (err.length) alert('Mod zapisany, ale ma uwagi:\n\n• ' + err.join('\n• '));
      toast('Zapisano ✓');
    };
    $('btn-export').onclick = () => {
      commitAll();
      ModAPI.exportFile(mod);
      toast('Eksport…');
    };
    $('btn-import').onchange = async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      try {
        mod = await ModAPI.importFile(f);
        selKey = null;
        loadModToForm();
        renderLists();
        const k = Object.keys(mod.maps || {})[0];
        if (k) selectMap(k);
        toast('Zaimportowano: ' + mod.name);
      } catch (err) {
        alert('Błąd importu: ' + err.message);
      }
      e.target.value = '';
    };

    document.querySelectorAll('.tab').forEach((b) => {
      b.onclick = () => {
        commitAll();
        document.querySelectorAll('.tab').forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
        mode = b.dataset.tab;
        $('panel-maps').classList.toggle('hidden', mode !== 'maps');
        $('panel-enemies').classList.toggle('hidden', mode !== 'enemies');
        if (mode === 'maps') {
          const k = Object.keys(mod.maps || {})[0];
          if (k) selectMap(k);
        } else {
          const k = Object.keys(mod.enemies || {})[0];
          if (k) selectEnemy(k);
          else {
            selKey = null;
            showProps(null);
            setupCanvas(32, 32, 8);
            clearBuf();
          }
        }
      };
    });

    $('add-map').onclick = () => {
      commitAll();
      const key = 'map_' + Date.now().toString(36);
      mod.maps[key] = {
        name: 'Nowa mapa', sky: '#6ec6f0', ground: '#4a9a3a', decor: '#2c6b2c',
        tone: 0.8, amb: 'leaf', bg: null, foes: [], boss: null
      };
      if (!(mod.campaign && mod.campaign.length)) {
        mod.campaign = [{ name: mod.name, map: key, foes: [], boss: null }];
      }
      renderLists();
      selectMap(key);
      toast('Dodano mapę');
    };

    $('add-enemy').onclick = () => {
      commitAll();
      const key = 'enemy_' + Date.now().toString(36);
      mod.enemies[key] = {
        name: 'Nowy wróg',
        hp: 40, atk: 12, def: 2, dodge: 0.1, crit: 0.1,
        xp: 20, scale: 2.8, fw: 32, fh: 32, boss: 0,
        behaveType: 'normal', line: '', move: 'dash', tags: ['human'], pois: 0, burn: 0, freeze: 0,
        sprites: { idle: null, attack: null, hurt: null, death: null },
        color: '#8a6a3a'
      };
      renderLists();
      selectEnemy(key);
      toast('Dodano wroga');
    };

    document.querySelectorAll('#tools [data-tool]').forEach((b) => {
      b.onclick = () => {
        document.querySelectorAll('#tools [data-tool]').forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
        tool = b.dataset.tool;
      };
    });
    $('brush').oninput = (e) => { brush = +e.target.value || 1; };
    $('btn-undo') && ($('btn-undo').onclick = () => undo());
    $('btn-clear').onclick = () => {
      if (!confirm('Wyczyścić canvas?')) return;
      pushUndo();
      clearBuf();
      snapshotToMod();
      toast('Wyczyszczono');
    };
    $('btn-grid').onclick = () => { gridOn = !gridOn; redraw(); };

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        commitAll();
        ModAPI.upsert(mod);
        toast('Zapisano ✓');
      }
    });

    function posFromEvent(e) {
      const rect = cv.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const x = Math.floor(((clientX - rect.left) / rect.width) * pw);
      const y = Math.floor(((clientY - rect.top) / rect.height) * ph);
      return {
        x: Math.max(0, Math.min(pw - 1, x)),
        y: Math.max(0, Math.min(ph - 1, y))
      };
    }

    function onDown(e) {
      e.preventDefault();
      drawing = true;
      pushUndo();
      const p = posFromEvent(e);
      paintAt(p.x, p.y);
      if (cv.setPointerCapture && e.pointerId != null) {
        try { cv.setPointerCapture(e.pointerId); } catch (_) {}
      }
    }
    function onMove(e) {
      if (!drawing) return;
      e.preventDefault();
      const p = posFromEvent(e);
      paintAt(p.x, p.y);
    }
    function onUp() {
      if (!drawing) return;
      drawing = false;
      snapshotToMod();
    }

    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp);
    cv.addEventListener('pointercancel', onUp);
    cv.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    cv.addEventListener('mousemove', (e) => { if (drawing) onMove(e); });
    cv.addEventListener('touchstart', onDown, { passive: false });
    cv.addEventListener('touchmove', onMove, { passive: false });
    cv.addEventListener('touchend', onUp);

    ['m-name', 'm-sky', 'm-ground', 'm-decor', 'm-amb', 'm-tone'].forEach((id) => {
      const el = $(id);
      if (!el) return;
      el.addEventListener('change', commitMapProps);
      el.addEventListener('input', commitMapProps);
    });
    ['e-name', 'e-hp', 'e-atk', 'e-def', 'e-dodge', 'e-crit', 'e-xp', 'e-scale', 'e-size', 'e-boss', 'e-behave', 'e-line', 'e-move', 'e-tags', 'e-pois', 'e-burn', 'e-freeze'].forEach((id) => {
      const el = $(id);
      if (!el) return;
      el.addEventListener('change', commitEnemyProps);
      el.addEventListener('input', commitEnemyProps);
    });
    $('e-anim').onchange = () => {
      snapshotToMod();
      anim = $('e-anim').value;
      loadEnemyFrame();
    };
    $('e-size').onchange = () => {
      commitEnemyProps();
      const sz = +$('e-size').value;
      setupCanvas(sz, sz, Math.max(4, Math.floor(320 / sz)));
      clearBuf();
      loadEnemyFrame();
    };
  }

  function setupCanvas(w, h, sc) {
    pw = w;
    ph = h;
    scale = sc || Math.max(2, Math.floor(480 / w));
    cv.width = pw;
    cv.height = ph;
    cv.style.width = (pw * scale) + 'px';
    cv.style.height = (ph * scale) + 'px';
    buf = new Uint8ClampedArray(pw * ph * 4);
    undoStack = [];
    redraw();
  }

  function clearBuf() {
    if (!buf) return;
    buf.fill(0);
    redraw();
    updatePreview();
  }

  function setPx(x, y, rgba) {
    if (x < 0 || y < 0 || x >= pw || y >= ph || !buf) return;
    const i = (y * pw + x) * 4;
    buf[i] = rgba[0];
    buf[i + 1] = rgba[1];
    buf[i + 2] = rgba[2];
    buf[i + 3] = rgba[3];
  }

  function getPx(x, y) {
    const i = (y * pw + x) * 4;
    return [buf[i], buf[i + 1], buf[i + 2], buf[i + 3]];
  }

  function paintAt(x, y) {
    if (!buf) return;
    if (tool === 'picker') {
      const p = getPx(x, y);
      if (p[3] < 8) return;
      color = rgbToHex(p[0], p[1], p[2]);
      buildPalette();
      return;
    }
    if (tool === 'fill') {
      floodFill(x, y, hexToRgba(color));
      redraw();
      updatePreview();
      return;
    }
    const rgba = tool === 'eraser' ? [0, 0, 0, 0] : hexToRgba(color);
    const r = brush;
    for (let dy = -r + 1; dy < r; dy++) {
      for (let dx = -r + 1; dx < r; dx++) {
        if (r > 1 && dx * dx + dy * dy >= r * r) continue;
        setPx(x + dx, y + dy, rgba);
      }
    }
    redraw();
    updatePreview();
  }

  function floodFill(sx, sy, target) {
    const start = getPx(sx, sy);
    if (same(start, target)) return;
    const stack = [[sx, sy]];
    const seen = new Uint8Array(pw * ph);
    while (stack.length) {
      const [x, y] = stack.pop();
      const idx = y * pw + x;
      if (seen[idx]) continue;
      seen[idx] = 1;
      if (!same(getPx(x, y), start)) continue;
      setPx(x, y, target);
      if (x > 0) stack.push([x - 1, y]);
      if (x < pw - 1) stack.push([x + 1, y]);
      if (y > 0) stack.push([x, y - 1]);
      if (y < ph - 1) stack.push([x, y + 1]);
    }
  }

  function same(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
  }

  function redraw() {
    if (!buf) return;
    const img = new ImageData(new Uint8ClampedArray(buf), pw, ph);
    ctx.putImageData(img, 0, 0);
    if (gridOn && scale >= 3) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1 / scale;
      ctx.beginPath();
      for (let x = 0; x <= pw; x++) { ctx.moveTo(x, 0); ctx.lineTo(x, ph); }
      for (let y = 0; y <= ph; y++) { ctx.moveTo(0, y); ctx.lineTo(pw, y); }
      ctx.stroke();
      ctx.restore();
    }
  }

  function updatePreview() {
    const pv = $('preview');
    if (!pv || !buf) return;
    const pctx = pv.getContext('2d');
    pctx.imageSmoothingEnabled = false;
    pctx.clearRect(0, 0, 96, 96);
    const tmp = document.createElement('canvas');
    tmp.width = pw; tmp.height = ph;
    tmp.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(buf), pw, ph), 0, 0);
    const s = Math.max(1, Math.floor(96 / Math.max(pw, ph)));
    const dw = pw * s, dh = ph * s;
    pctx.drawImage(tmp, (96 - dw) / 2, (96 - dh) / 2, dw, dh);
  }

  function canvasToDataURL() {
    if (!buf) return null;
    const t = document.createElement('canvas');
    t.width = pw; t.height = ph;
    t.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(buf), pw, ph), 0, 0);
    return t.toDataURL('image/png');
  }

  function loadDataURL(url) {
    if (!url || !buf) { clearBuf(); return; }
    const im = new Image();
    im.onload = () => {
      const t = document.createElement('canvas');
      t.width = pw; t.height = ph;
      const tctx = t.getContext('2d');
      tctx.clearRect(0, 0, pw, ph);
      tctx.drawImage(im, 0, 0, pw, ph);
      buf.set(tctx.getImageData(0, 0, pw, ph).data);
      redraw();
      updatePreview();
    };
    im.onerror = () => clearBuf();
    im.src = url;
  }

  function fillSkyGround(sky, ground) {
    if (!buf) return;
    const sc = hexToRgba(sky);
    const gc = hexToRgba(ground);
    const hz = Math.floor(ph * 0.55);
    for (let y = 0; y < ph; y++) {
      for (let x = 0; x < pw; x++) setPx(x, y, y < hz ? sc : gc);
    }
    redraw();
  }

  function pushUndo() {
    if (!buf) return;
    undoStack.push(new Uint8ClampedArray(buf));
    if (undoStack.length > MAX_UNDO) undoStack.shift();
  }
  function undo() {
    if (!undoStack.length) { toast('Brak cofnięć'); return; }
    buf = undoStack.pop();
    redraw();
    updatePreview();
    snapshotToMod();
    toast('Cofnięto');
  }

  function selectMap(key) {
    commitAll();
    mode = 'maps';
    selKey = key;
    document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('active', x.dataset.tab === 'maps'));
    $('panel-maps').classList.remove('hidden');
    $('panel-enemies').classList.add('hidden');
    showProps('map');
    const m = mod.maps[key];
    $('m-key').value = key;
    $('m-name').value = m.name || '';
    $('m-sky').value = m.sky || '#6ec6f0';
    $('m-ground').value = m.ground || '#4a9a3a';
    $('m-decor').value = m.decor || '#2c6b2c';
    $('m-amb').value = m.amb || '';
    $('m-tone').value = m.tone != null ? m.tone : 0.8;
    $('ws-title').textContent = 'Mapa: ' + (m.name || key);
    $('ws-hint').textContent = 'Tło 160×80 (w grze ×4). LPM = rysuj. Ctrl+Z = cofnij. Ctrl+S = zapisz.';
    setupCanvas(160, 80, 4);
    if (m.bg) loadDataURL(m.bg);
    else fillSkyGround(m.sky || '#6ec6f0', m.ground || '#4a9a3a');
    renderLists();
  }

  function selectEnemy(key) {
    commitAll();
    mode = 'enemies';
    selKey = key;
    anim = 'idle';
    if ($('e-anim')) $('e-anim').value = 'idle';
    document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('active', x.dataset.tab === 'enemies'));
    $('panel-maps').classList.add('hidden');
    $('panel-enemies').classList.remove('hidden');
    showProps('enemy');
    const e = mod.enemies[key];
    $('e-key').value = key;
    $('e-name').value = e.name || '';
    $('e-hp').value = e.hp; $('e-atk').value = e.atk; $('e-def').value = e.def;
    $('e-dodge').value = e.dodge; $('e-crit').value = e.crit;
    $('e-xp').value = e.xp; $('e-scale').value = e.scale;
    $('e-size').value = String(e.fw || 32);
    $('e-boss').checked = !!e.boss;
    $('e-behave').value = e.behaveType || 'normal';
    $('e-line').value = e.line || '';
    $('e-move').value = e.move || 'dash';
    [...$('e-tags').options].forEach((o) => { o.selected = (e.tags || ['human']).includes(o.value); });
    $('e-pois').value = e.pois || 0; $('e-burn').value = e.burn || 0; $('e-freeze').value = e.freeze || 0;
    $('ws-title').textContent = 'Wróg: ' + (e.name || key) + ' [' + anim + ']';
    $('ws-hint').textContent = 'Sprite w PRAWO. Klatki: idle / attack / hurt / death. Boss 48×48.';
    const sz = e.fw || 32;
    setupCanvas(sz, sz, Math.max(4, Math.floor(320 / sz)));
    loadEnemyFrame();
    renderLists();
  }

  function showProps(which) {
    $('props-empty').classList.toggle('hidden', !!which);
    $('props-map').classList.toggle('hidden', which !== 'map');
    $('props-enemy').classList.toggle('hidden', which !== 'enemy');
  }

  function loadEnemyFrame() {
    if (!selKey || !mod.enemies[selKey]) return;
    const e = mod.enemies[selKey];
    const src = (e.sprites && e.sprites[anim]) || null;
    if (src) loadDataURL(src);
    else clearBuf();
    $('ws-title').textContent = 'Wróg: ' + (e.name || selKey) + ' [' + anim + ']';
  }

  function renderLists() {
    const ml = $('map-list');
    ml.innerHTML = '';
    Object.keys(mod.maps || {}).forEach((key) => {
      const m = mod.maps[key];
      const div = document.createElement('div');
      div.className = 'list-item' + (selKey === key && mode === 'maps' ? ' active' : '');
      div.innerHTML = '<span>' + esc(m.name || key) + '</span><button type="button" class="del" title="Usuń">×</button>';
      div.onclick = (e) => { if (e.target.classList.contains('del')) return; selectMap(key); };
      div.querySelector('.del').onclick = (e) => {
        e.stopPropagation();
        if (!confirm('Usunąć mapę?')) return;
        delete mod.maps[key];
        mod.campaign = (mod.campaign || []).filter((c) => c.map !== key);
        if (selKey === key) {
          const n = Object.keys(mod.maps)[0];
          if (n) selectMap(n);
          else { selKey = null; clearBuf(); showProps(null); }
        }
        renderLists();
      };
      ml.appendChild(div);
    });

    const el = $('enemy-list');
    el.innerHTML = '';
    Object.keys(mod.enemies || {}).forEach((key) => {
      const en = mod.enemies[key];
      const div = document.createElement('div');
      div.className = 'list-item' + (selKey === key && mode === 'enemies' ? ' active' : '');
      div.innerHTML = '<span>' + (en.boss ? '👑 ' : '') + esc(en.name || key) + '</span><button type="button" class="del">×</button>';
      div.onclick = (e) => { if (e.target.classList.contains('del')) return; selectEnemy(key); };
      div.querySelector('.del').onclick = (e) => {
        e.stopPropagation();
        if (!confirm('Usunąć wroga?')) return;
        delete mod.enemies[key];
        if (selKey === key) {
          const n = Object.keys(mod.enemies)[0];
          if (n) selectEnemy(n);
          else { selKey = null; clearBuf(); showProps(null); }
        }
        renderLists();
      };
      el.appendChild(div);
    });
    renderCampaign();
  }

  function renderCampaign() {
    const box = $('campaign-editor');
    box.innerHTML = '';
    const B = ModAPI.BUILTIN;
    const optg = (label, items, sel, multi) => items.length
      ? '<optgroup label="' + label + '">' + items.map(([k, n]) => '<option value="' + escAttr(k) + '"' + (multi ? ((sel || []).includes(k) ? ' selected' : '') : (sel === k ? ' selected' : '')) + '>' + esc(n) + '</option>').join('') + '</optgroup>'
      : '';
    const modEn = (boss) => Object.keys(mod.enemies || {}).filter((k) => boss === null || !!mod.enemies[k].boss === boss).map((k) => [k, mod.enemies[k].name || k]);
    const bi = (boss) => B.enemies.filter((e) => boss === null || !!e[2] === boss).map((e) => [e[0], e[1]]);
    (mod.campaign || []).forEach((stage, i) => {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'background:#2a2140;padding:8px;margin:6px 0;border:1px solid #5a4a2a;font-size:11px';
      const mapOpts = optg('Własne mapy', Object.keys(mod.maps || {}).map((k) => [k, mod.maps[k].name || k]), stage.map) + optg('Mapy gry', B.maps, stage.map);
      const foesOpts = optg('Własni wrogowie', modEn(false), stage.foes, true) + optg('Wrogowie gry', bi(false), stage.foes, true);
      const bossOpts = '<option value="">—</option>' + optg('Własni bossowie', modEn(true), stage.boss) + optg('Bossowie gry', bi(true), stage.boss);
      const mg = [['', 'brak'], ['dam', 'Bobrza tama'], ['maze', 'Labirynt w piramidzie'], ['lava', 'Lawowa zagadka'], ['pong', 'Pong (mecz)']]
        .map(([k, n]) => '<option value="' + k + '"' + ((stage.minigame || '') === k ? ' selected' : '') + '>' + n + '</option>').join('');
      wrap.innerHTML =
        '<b>Etap ' + (i + 1) + '</b> <button type="button" class="del" data-del="' + i + '" style="float:right;color:#d64545;background:none;border:none;cursor:pointer">× usuń</button>' +
        '<label>Nazwa</label><input type="text" data-i="' + i + '" data-f="name" value="' + escAttr(stage.name || '') + '">' +
        '<label>Mapa</label><select data-i="' + i + '" data-f="map">' + mapOpts + '</select>' +
        '<label>Wrogowie (Ctrl+klik – wielokrotny wybór)</label><select data-i="' + i + '" data-f="foes" multiple size="6">' + foesOpts + '</select>' +
        '<label>Boss</label><select data-i="' + i + '" data-f="boss">' + bossOpts + '</select>' +
        '<label>Minigra w tym etapie</label><select data-i="' + i + '" data-f="minigame">' + mg + '</select>' +
        '<label>Numer fali z minigrą (etap ma i+3 fale)</label><input type="number" min="1" max="12" data-i="' + i + '" data-f="mgWave" value="' + (stage.mgWave || 2) + '">';
      box.appendChild(wrap);
    });
    box.querySelectorAll('input,select').forEach((el) => {
      el.onchange = () => {
        const i = +el.dataset.i, f = el.dataset.f;
        if (f === 'foes') mod.campaign[i].foes = [...el.selectedOptions].map((o) => o.value);
        else if (f === 'mgWave') mod.campaign[i].mgWave = +el.value || 2;
        else mod.campaign[i][f] = el.value || null;
      };
    });
    box.querySelectorAll('[data-del]').forEach((b) => {
      b.onclick = () => { mod.campaign.splice(+b.dataset.del, 1); renderCampaign(); };
    });
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'btn';
    add.textContent = '+ etap';
    add.onclick = () => {
      const firstMap = Object.keys(mod.maps)[0] || 'forest';
      mod.campaign = mod.campaign || [];
      mod.campaign.push({ name: 'Etap ' + (mod.campaign.length + 1), map: firstMap, foes: ['slime'], boss: 'slimeking' });
      renderCampaign();
    };
    box.appendChild(add);
  }

  function snapshotToMod() {
    if (!selKey || !buf) return;
    const dataURL = canvasToDataURL();
    if (mode === 'maps' && mod.maps[selKey]) mod.maps[selKey].bg = dataURL;
    else if (mode === 'enemies' && mod.enemies[selKey]) {
      mod.enemies[selKey].sprites = mod.enemies[selKey].sprites || {};
      mod.enemies[selKey].sprites[anim] = dataURL;
    }
  }

  function commitMapProps() {
    if (!selKey || !mod.maps[selKey]) return;
    const m = mod.maps[selKey];
    m.name = $('m-name').value;
    m.sky = $('m-sky').value;
    m.ground = $('m-ground').value;
    m.decor = $('m-decor').value;
    m.amb = $('m-amb').value || null;
    m.tone = parseFloat($('m-tone').value) || 0.8;
    renderLists();
  }

  function commitEnemyProps() {
    if (!selKey || !mod.enemies[selKey]) return;
    const e = mod.enemies[selKey];
    e.name = $('e-name').value;
    e.hp = +$('e-hp').value; e.atk = +$('e-atk').value; e.def = +$('e-def').value;
    e.dodge = +$('e-dodge').value; e.crit = +$('e-crit').value;
    e.xp = +$('e-xp').value; e.scale = +$('e-scale').value;
    const sz = +$('e-size').value;
    e.fw = sz; e.fh = sz;
    e.boss = $('e-boss').checked ? 1 : 0;
    e.behaveType = $('e-behave').value;
    e.line = $('e-line').value || null;
    e.move = $('e-move').value || 'dash';
    e.tags = [...$('e-tags').selectedOptions].map((o) => o.value);
    e.pois = +$('e-pois').value || 0; e.burn = +$('e-burn').value || 0; e.freeze = +$('e-freeze').value || 0;
    renderLists();
  }

  function commitAll() {
    snapshotToMod();
    if (mode === 'maps') commitMapProps();
    else commitEnemyProps();
    mod.name = $('mod-name').value || mod.name;
    mod.author = $('mod-author').value || '';
    mod.version = $('mod-ver').value || '1.0';
  }

  function loadModToForm() {
    $('mod-name').value = mod.name || '';
    $('mod-author').value = mod.author || '';
    $('mod-ver').value = mod.version || '1.0';
  }

  function hexToRgba(hex) {
    let h = (hex || '#000').replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
  }
  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function escAttr(s) { return esc(s); }
  function toast(msg) {
    const s = $('status');
    s.textContent = msg;
    s.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => s.classList.remove('show'), 2200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
