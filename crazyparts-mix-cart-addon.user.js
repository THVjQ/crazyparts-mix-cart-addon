// ==UserScript==
// @name         Crazyparts Mix Cart Addon v4.2 (New Site)
// @namespace    http://tampermonkey.net/
// @version      4.2
// @description  Add multiple colour variants of one product to cart in one click — for the new React/Next.js crazyparts.com.au
// @author       You
// @match        *://www.crazyparts.com.au/*
// @match        *://crazyparts.com.au/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==
(function () {
  'use strict';

  // ─────────────────────────────────────────────────────
  // CONFIG
  // ─────────────────────────────────────────────────────
  const ADD_DELAY_MS   = 1500;  // wait after each add-to-cart click
  const CLICK_DELAY_MS = 600;   // wait after selecting a colour swatch
  const PROBE_DELAY_MS = 450;   // wait between probe clicks during stock scan
  const SCAN_INTERVAL  = 600;   // SPA re-scan interval

  // ─────────────────────────────────────────────────────
  // STYLES
  // ─────────────────────────────────────────────────────
  if (!document.getElementById('mca-style')) {
    const st = document.createElement('style');
    st.id = 'mca-style';
    st.textContent = `
    #mca-wrap{margin-top:12px;border:1.5px solid #1769c0;border-radius:6px;overflow:hidden;
      font-family:-apple-system,'Segoe UI',Arial,sans-serif;font-size:13px;color:#1a2b3c;background:#fff;}
    #mca-hdr{display:flex;align-items:center;gap:8px;padding:9px 12px;background:#1a3a6e;color:#fff;cursor:pointer;user-select:none;}
    #mca-hdr-label{flex:1;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;}
    #mca-toggle-arrow{font-size:11px;transition:transform .2s;flex-shrink:0;}
    #mca-toggle-arrow.open{transform:rotate(90deg);}
    #mca-body{display:none;padding:12px;background:#f6f8fd;border-top:2px solid #1769c0;}
    #mca-body.open{display:block;}
    #mca-controls{display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap;}
    #mca-controls label{font-size:11.5px;font-weight:700;color:#5a6a82;white-space:nowrap;}
    #mca-total-inp{width:58px;border:1px solid #cdd6ea;border-radius:3px;padding:4px 6px;font-size:12px;
      font-family:inherit;text-align:center;background:#fff;color:#1a2b3c;}
    #mca-total-inp:focus{outline:none;border-color:#1769c0;}
    #mca-split-btn{padding:5px 12px;background:#eef2f9;color:#1a3a6e;border:1px solid #cdd6ea;border-radius:3px;
      font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;transition:background .15s;}
    #mca-split-btn:hover{background:#dce6f5;}
    #mca-clear-btn{padding:5px 10px;background:#fff;color:#5a6a82;border:1px solid #cdd6ea;border-radius:3px;
      font-size:11.5px;font-weight:600;cursor:pointer;font-family:inherit;transition:background .15s;}
    #mca-clear-btn:hover{background:#f0f0f0;}
    #mca-colour-list{display:flex;flex-direction:column;gap:5px;margin-bottom:12px;}
    .mca-row{display:flex;align-items:center;gap:8px;padding:7px 10px;background:#fff;border:1px solid #cdd6ea;
      border-radius:4px;transition:border-color .15s;}
    .mca-row:focus-within{border-color:#1769c0;}
    .mca-row.ofs{background:#fafafa;border-color:#e0e0e0;opacity:.7;}
    .mca-dot{width:16px;height:16px;border-radius:50%;border:1px solid #cdd6ea;flex-shrink:0;}
    .mca-colour-name{flex:1;font-size:12.5px;font-weight:600;color:#1a3a6e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .mca-ofs-badge{font-size:9.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#c0392b;
      background:#fde8e6;border:1px solid #f5bfba;border-radius:3px;padding:2px 5px;flex-shrink:0;}
    .mca-qty{width:52px;border:1px solid #cdd6ea;border-radius:3px;padding:3px 5px;font-size:12px;font-family:inherit;
      text-align:center;background:#fff;color:#1a2b3c;}
    .mca-qty:focus{outline:none;border-color:#1769c0;}
    .mca-qty:disabled{background:#f0f0f0;color:#aaa;cursor:not-allowed;}
    #mca-summary{display:flex;align-items:center;justify-content:space-between;padding:7px 10px;background:#eef2f9;
      border:1px solid #cdd6ea;border-radius:4px;margin-bottom:10px;font-size:12px;color:#5a6a82;}
    #mca-summary strong{color:#1a3a6e;}
    #mca-add-btn{width:100%;padding:10px;background:#1769c0;color:#fff;border:none;border-radius:4px;font-size:13px;
      font-weight:800;cursor:pointer;font-family:inherit;letter-spacing:.04em;transition:background .15s;}
    #mca-add-btn:hover{background:#1257a8;}
    #mca-add-btn:disabled{background:#9aafcc;cursor:not-allowed;}
    #mca-progress{display:none;margin-top:10px;}
    #mca-progress.show{display:block;}
    #mca-progress-bar-wrap{height:6px;background:#dce6f5;border-radius:3px;overflow:hidden;margin-bottom:6px;}
    #mca-progress-bar{height:100%;background:#1769c0;border-radius:3px;width:0%;transition:width .3s;}
    #mca-progress-msg{font-size:11.5px;color:#5a6a82;text-align:center;}
    #mca-no-colours{font-size:12px;color:#c0392b;padding:8px 0;text-align:center;display:none;}`;
    document.head.appendChild(st);
  }

  const sleep   = ms => new Promise(r => setTimeout(r, ms));
  const visible = el => !!(el && el.offsetParent !== null);
  const BAD_TEXT = /add\s*to|wishlist|cart|buy|checkout|qty|quantity|login|share|compare/i;

  // ─────────────────────────────────────────────────────
  // PAGE / ELEMENT DETECTION
  // ─────────────────────────────────────────────────────
  function isProductPage() {
    return /\/products\/detail\/\d+/.test(location.pathname);
  }

  function findAddToCartBtn() {
    const candidates = Array.from(document.querySelectorAll('button, a, div[role="button"]'));
    return candidates.find(el =>
      visible(el) &&
      !el.closest('#mca-wrap') &&
      /^\s*add\s*to\s*cart\s*$/i.test(el.textContent || '')
    ) || null;
  }

  function findQtyInput(addBtn) {
    const inputs = Array.from(document.querySelectorAll('input[type="number"], input[inputmode="numeric"], input[type="text"][value]'))
      .filter(i => visible(i) && !i.closest('#mca-wrap') && /^\d*$/.test(i.value));
    if (!inputs.length) return null;
    if (!addBtn) return inputs[0];
    const by = addBtn.getBoundingClientRect().top;
    inputs.sort((a, b) =>
      Math.abs(a.getBoundingClientRect().top - by) - Math.abs(b.getBoundingClientRect().top - by));
    return inputs[0];
  }

  // ─────────────────────────────────────────────────────
  // OFS DETECTION
  // ─────────────────────────────────────────────────────
  const OFS_CLASS = /\b(disabled|out[-_ ]?of[-_ ]?stock|sold[-_ ]?out|not[-_ ]?available|ofs|unavailable|forbidden)\b/i;

  function hasSlashOverlay(el) {
    const nodes = [el, ...el.querySelectorAll('*')];
    for (const n of nodes) {
      // diagonal slash drawn with a pseudo-element
      for (const p of ['::before', '::after']) {
        try {
          const cs = getComputedStyle(n, p);
          if (cs.content !== 'none' && cs.content !== 'normal') {
            if ((cs.backgroundImage || '').includes('gradient')) return true;
            if (cs.transform && cs.transform !== 'none' &&
                (parseFloat(cs.borderTopWidth) > 0 || parseRGB(cs.backgroundColor))) return true;
          }
        } catch (e) { /* ignore */ }
      }
      // slash drawn as a linear-gradient background line
      if (((getComputedStyle(n).backgroundImage) || '').includes('linear-gradient')) return true;
      // slash drawn as an inline SVG line
      if (n.tagName === 'svg' || n.tagName === 'LINE' || n.tagName === 'PATH') return true;
    }
    return false;
  }

  function isSelectedSwatch(el) {
    const nodes = [el, el.parentElement, ...el.querySelectorAll('*')];
    for (const n of nodes) {
      if (!n || !n.getAttribute) continue;
      if (/\b(active|selected|checked|current|on)\b/i.test(String(n.className || ''))) return true;
      if (n.getAttribute('aria-checked') === 'true' || n.getAttribute('aria-selected') === 'true') return true;
    }
    return false;
  }

  function looksOFS(el) {
    let node = el;
    for (let i = 0; i < 2 && node; i++, node = node.parentElement) {
      if (node.disabled === true || node.getAttribute('aria-disabled') === 'true') return true;
      if (OFS_CLASS.test(String(node.className || ''))) return true;
    }
    if (Array.from(el.querySelectorAll('*')).some(c => OFS_CLASS.test(String(c.className || '')))) return true;
    const cs = getComputedStyle(el);
    if (parseFloat(cs.opacity) < 0.55) return true;
    if (cs.cursor === 'not-allowed') return true;
    if (/grayscale\(\s*(0?\.[6-9]|1)/.test(cs.filter || '')) return true;
    return false;
  }

  // ─────────────────────────────────────────────────────
  // COLOUR NAMING FROM BACKGROUND
  // ─────────────────────────────────────────────────────
  const PALETTE = [
    ['Black',0,0,0],['White',255,255,255],['Grey',128,128,128],['Silver',195,195,200],
    ['Red',215,35,35],['Dark Red',140,20,20],['Orange',255,140,0],['Yellow',248,205,45],
    ['Green',45,155,70],['Dark Green',20,80,40],['Teal',0,150,150],['Sky Blue',120,185,240],
    ['Blue',35,95,200],['Navy',22,40,85],['Purple',130,60,180],['Pink',240,130,170],
    ['Rose Gold',225,170,160],['Brown',125,80,50],['Gold',210,175,60],['Beige',230,215,185]
  ];

  function parseRGB(str) {
    const m = (str || '').match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?/);
    if (!m) return null;
    if (m[4] !== undefined && parseFloat(m[4]) === 0) return null; // transparent
    return [+m[1], +m[2], +m[3]];
  }

  function swatchBgRGB(el) {
    // check the element, then descendants, for a non-transparent background
    const nodes = [el, ...el.querySelectorAll('*')];
    for (const n of nodes) {
      const cs = getComputedStyle(n);
      const rgb = parseRGB(cs.backgroundColor) || parseRGB(cs.background);
      if (rgb) return rgb;
    }
    return null;
  }

  function nearestColourName(rgb) {
    if (!rgb) return null;
    let best = null, bestD = Infinity;
    for (const [name, r, g, b] of PALETTE) {
      const d = (rgb[0]-r)**2 + (rgb[1]-g)**2 + (rgb[2]-b)**2;
      if (d < bestD) { bestD = d; best = name; }
    }
    return best;
  }

  function swatchName(el, idx) {
    const attr = el.getAttribute('aria-label') || el.getAttribute('title') ||
      el.dataset?.color || el.dataset?.colour || el.dataset?.value || el.dataset?.label ||
      el.querySelector('img')?.alt || '';
    const txt = (attr || el.textContent || '').trim();
    if (txt && txt.length <= 30 && !BAD_TEXT.test(txt)) return txt;
    const named = nearestColourName(swatchBgRGB(el));
    return named || ('Colour ' + (idx + 1));
  }

  // Read the live "Color ● Black" label text → currently selected name
  function findColourLabelEl() {
    return Array.from(document.querySelectorAll('span,div,label,p,b,strong,dt,h3,h4'))
      .find(el => {
        if (!visible(el) || el.closest('#mca-wrap')) return false;
        const own = (el.childNodes[0]?.nodeType === 3 ? el.childNodes[0].textContent : el.textContent) || '';
        return /^colou?r[:：]?$/i.test(own.trim());
      }) || null;
  }

  function currentSelectedColourName() {
    const lab = findColourLabelEl();
    if (!lab) return null;
    const row = lab.parentElement;
    if (!row) return null;
    const t = (row.textContent || '').replace(/colou?r[:：]?/i, '').replace(/[•●○◦]/g, '').trim();
    return t && t.length <= 40 ? t : null;
  }

  // ─────────────────────────────────────────────────────
  // SWATCH CLUSTER DETECTION
  // Looks for a group of small, equal-sized clickable elements
  // (the colour circles) near the "Color" label.
  // ─────────────────────────────────────────────────────
  function clickableish(el) {
    if (['BUTTON','A','LI','LABEL','IMG','SPAN','DIV'].indexOf(el.tagName) === -1 && !el.getAttribute('role')) return false;
    return true;
  }

  function collectSwatchCluster(container) {
    const cands = [];
    for (const el of container.querySelectorAll('*')) {
      if (!visible(el) || el.closest('#mca-wrap') || !clickableish(el)) continue;
      const t = (el.textContent || '').trim();
      if (t.length > 20 || BAD_TEXT.test(t)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 12 || r.width > 80 || r.height < 12 || r.height > 80) continue;
      if (Math.abs(r.width - r.height) > 30) continue; // roughly square/round
      cands.push({ el, w: Math.round(r.width / 8), h: Math.round(r.height / 8) });
    }
    // group by rounded size, keep biggest group
    const groups = {};
    for (const c of cands) (groups[c.w + 'x' + c.h] ||= []).push(c.el);
    let best = [];
    for (const k in groups) if (groups[k].length > best.length) best = groups[k];
    // drop nested duplicates (keep outermost of each ancestor chain)
    best = best.filter(el => !best.some(other => other !== el && other.contains(el)));
    return best.length >= 2 ? best : null;
  }

  function detectColourOptions() {
    // 1) anchored on the "Color" label
    const lab = findColourLabelEl();
    if (lab) {
      let container = lab.parentElement;
      for (let hop = 0; hop < 4 && container; hop++, container = container.parentElement) {
        const cluster = collectSwatchCluster(container);
        if (cluster) {
          return cluster.map((el, i) => ({
            name: swatchName(el, i),
            ofs:  looksOFS(el) || hasSlashOverlay(el),
            rgb:  swatchBgRGB(el),
            el
          }));
        }
      }
    }

    // 2) class-based fallback
    const byClass = Array.from(document.querySelectorAll(
      '[class*="swatch"], [class*="color-item"], [class*="colour-item"], [class*="colorItem"], [class*="sku-item"], [class*="spec-item"], [class*="variant"]'
    )).filter(el => visible(el) && !el.closest('#mca-wrap') && !BAD_TEXT.test((el.textContent || '').trim()));
    if (byClass.length >= 2) {
      return byClass.map((el, i) => ({ name: swatchName(el, i), ofs: looksOFS(el), rgb: swatchBgRGB(el), el }));
    }

    // 3) <select> fallback
    for (const sel of document.querySelectorAll('select')) {
      if (!visible(sel) || sel.closest('#mca-wrap')) continue;
      const opts = Array.from(sel.options).filter(o => o.value !== '' && o.text.trim());
      if (opts.length >= 2) {
        return opts.map(o => ({ name: o.text.trim(), ofs: o.disabled, rgb: null, el: sel, optValue: o.value }));
      }
    }
    return [];
  }

  // ─────────────────────────────────────────────────────
  // REACT-SAFE INPUT SETTER + SELECT + ADD
  // ─────────────────────────────────────────────────────
  function setReactInputValue(input, value) {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, String(value));
    input.dispatchEvent(new Event('input',  { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function selectColour(opt) {
    if (opt.el.tagName === 'SELECT') {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
      setter.call(opt.el, opt.optValue);
      opt.el.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      opt.el.scrollIntoView({ block: 'center' });
      opt.el.click();
    }
    await sleep(CLICK_DELAY_MS);
  }

  async function addOne(opt, qty) {
    try {
      await selectColour(opt);
      const addBtn = findAddToCartBtn();
      if (!addBtn) return { ok: false, why: 'Add To Cart button not found' };
      if (addBtn.disabled || looksOFS(addBtn)) return { ok: false, why: 'Add button disabled (out of stock?)' };

      const live = currentSelectedColourName();
      const qtyInp = findQtyInput(addBtn);
      if (qtyInp) {
        setReactInputValue(qtyInp, qty);
        await sleep(250);
        addBtn.click();
        await sleep(ADD_DELAY_MS);
        return { ok: true, live };
      }
      for (let i = 0; i < qty; i++) {
        addBtn.click();
        await sleep(ADD_DELAY_MS);
      }
      return { ok: true, live };
    } catch (e) {
      return { ok: false, why: e.message };
    }
  }

  // ─────────────────────────────────────────────────────
  // ACTIVE STOCK PROBE — authoritative OFS check.
  // Clicks each swatch, watches whether the "Color: X" label
  // updates and whether the real Add To Cart button stays alive.
  // Also captures the site's real colour names. Restores the
  // original selection afterwards.
  // ─────────────────────────────────────────────────────
  async function probeOptions(colours, onProgress) {
    if (!colours.length || colours[0].el.tagName === 'SELECT') return;
    const originalName = currentSelectedColourName();

    for (let i = 0; i < colours.length; i++) {
      const c = colours[i];
      onProgress && onProgress(i, colours.length, c.name);
      const before = currentSelectedColourName();
      const wasSelected = isSelectedSwatch(c.el);
      c.el.click();
      await sleep(PROBE_DELAY_MS);
      const after  = currentSelectedColourName();
      const addBtn = findAddToCartBtn();
      const btnDead = !addBtn || addBtn.disabled ||
        addBtn.getAttribute('aria-disabled') === 'true' ||
        /\b(disabled)\b/i.test(String(addBtn.className || ''));

      const changed = !!after && after !== before;
      const nowSelected = isSelectedSwatch(c.el);

      if (changed) c.name = after;            // real site name
      else if (after && (wasSelected || nowSelected)) c.name = after;

      // OFS if the button died, or the click did nothing
      // (label unchanged AND swatch never shows as selected)
      c.ofs = btnDead || (!changed && !wasSelected && !nowSelected);
    }

    // restore original selection
    const back = colours.find(c => !c.ofs && c.name === originalName) ||
                 colours.find(c => !c.ofs);
    if (back) { back.el.click(); await sleep(PROBE_DELAY_MS); }
  }

  // ─────────────────────────────────────────────────────
  // WIDGET BUILD
  // ─────────────────────────────────────────────────────
  function buildWidget() {
    const addBtn = findAddToCartBtn();
    if (!addBtn) return false;
    if (document.getElementById('mca-wrap')) return true;

    const colours = detectColourOptions();

    const wrap = document.createElement('div');
    wrap.id = 'mca-wrap';
    wrap.innerHTML = `
      <div id="mca-hdr">
        <div id="mca-hdr-label">🎨 Mix &amp; Add to Cart</div>
        <span id="mca-toggle-arrow">›</span>
      </div>
      <div id="mca-body">
        <div id="mca-no-colours">⚠️ No colour options detected on this page.</div>
        <div id="mca-controls">
          <label for="mca-total-inp">Total qty:</label>
          <input type="number" id="mca-total-inp" min="1" max="9999" value="10" placeholder="10">
          <button type="button" id="mca-split-btn">Auto-split evenly</button>
          <button type="button" id="mca-clear-btn">Clear all</button>
        </div>
        <div id="mca-colour-list"></div>
        <div id="mca-summary">
          <span>Items selected: <strong id="mca-count">0</strong></span>
          <span>Total qty: <strong id="mca-total-disp">0</strong></span>
        </div>
        <button type="button" id="mca-add-btn" disabled>Add Mix to Cart</button>
        <div id="mca-progress">
          <div id="mca-progress-bar-wrap"><div id="mca-progress-bar"></div></div>
          <div id="mca-progress-msg"></div>
        </div>
      </div>`;

    const host = addBtn.closest('div') || addBtn;
    host.insertAdjacentElement('afterend', wrap);

    const body      = wrap.querySelector('#mca-body');
    const arrow     = wrap.querySelector('#mca-toggle-arrow');
    const noColours = wrap.querySelector('#mca-no-colours');
    const colourList= wrap.querySelector('#mca-colour-list');
    const totalInp  = wrap.querySelector('#mca-total-inp');
    const countEl   = wrap.querySelector('#mca-count');
    const totalDisp = wrap.querySelector('#mca-total-disp');
    const mixBtn    = wrap.querySelector('#mca-add-btn');
    const progress  = wrap.querySelector('#mca-progress');
    const pBar      = wrap.querySelector('#mca-progress-bar');
    const pMsg      = wrap.querySelector('#mca-progress-msg');

    let probed = false;
    wrap.querySelector('#mca-hdr').addEventListener('click', async () => {
      const open = body.classList.toggle('open');
      arrow.classList.toggle('open', open);
      if (open && !probed && colours.length && colours[0].el.tagName !== 'SELECT') {
        probed = true;
        pMsg.textContent = 'Verifying colours & stock…';
        progress.classList.add('show');
        pBar.style.width = '0%';
        await probeOptions(colours, (i, n, name) => {
          pMsg.textContent = `Checking ${name}… (${i + 1}/${n})`;
          pBar.style.width = Math.round(((i + 1) / n) * 100) + '%';
        });
        renderRows();
        progress.classList.remove('show');
        pMsg.textContent = '';
      }
    });

    function renderRows() {
      // preserve any typed quantities by index
      const prevQty = {};
      colourList.querySelectorAll('.mca-qty').forEach(i => { prevQty[i.dataset.idx] = i.value; });
      colourList.innerHTML = '';
      colours.forEach((c, idx) => {
        const row = document.createElement('div');
        row.className = 'mca-row' + (c.ofs ? ' ofs' : '');

        if (c.rgb) {
          const dot = document.createElement('span');
          dot.className = 'mca-dot';
          dot.style.background = `rgb(${c.rgb[0]},${c.rgb[1]},${c.rgb[2]})`;
          row.appendChild(dot);
        }

        const nameEl = document.createElement('span');
        nameEl.className = 'mca-colour-name';
        nameEl.textContent = c.name;
        row.appendChild(nameEl);

        if (c.ofs) {
          const badge = document.createElement('span');
          badge.className = 'mca-ofs-badge';
          badge.textContent = 'OFS';
          row.appendChild(badge);
        }

        const inp = document.createElement('input');
        inp.type = 'number'; inp.min = '0'; inp.max = '9999';
        inp.value = c.ofs ? '0' : (prevQty[idx] || '0');
        inp.className = 'mca-qty';
        inp.dataset.idx = idx;
        if (c.ofs) inp.disabled = true;
        row.appendChild(inp);
        colourList.appendChild(row);
      });
      updateSummary();
    }

    if (!colours.length) {
      noColours.style.display = 'block';
      wrap.querySelector('#mca-controls').style.display = 'none';
      wrap.querySelector('#mca-summary').style.display  = 'none';
      mixBtn.style.display = 'none';
    } else {
      renderRows();
    }

    function updateSummary() {
      const qtys  = Array.from(colourList.querySelectorAll('.mca-qty:not(:disabled)'));
      const count = qtys.filter(i => (parseInt(i.value) || 0) > 0).length;
      const total = qtys.reduce((s, i) => s + (parseInt(i.value) || 0), 0);
      countEl.textContent = count;
      totalDisp.textContent = total;
      mixBtn.disabled = total === 0;
    }
    colourList.addEventListener('input', updateSummary);
    updateSummary();

    wrap.querySelector('#mca-split-btn').addEventListener('click', () => {
      const total = Math.max(1, parseInt(totalInp.value) || 10);
      const rows  = Array.from(colourList.querySelectorAll('.mca-qty:not(:disabled)'));
      if (!rows.length) return;
      const base = Math.floor(total / rows.length);
      const rem  = total % rows.length;
      const values = rows.map((_, i) => base + (i < rem ? 1 : 0));
      for (let i = values.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [values[i], values[j]] = [values[j], values[i]];
      }
      rows.forEach((inp, i) => { inp.value = values[i]; });
      updateSummary();
    });

    wrap.querySelector('#mca-clear-btn').addEventListener('click', () => {
      colourList.querySelectorAll('.mca-qty:not(:disabled)').forEach(i => { i.value = 0; });
      updateSummary();
    });

    mixBtn.addEventListener('click', async () => {
      const items = [];
      colourList.querySelectorAll('.mca-qty:not(:disabled)').forEach(inp => {
        const qty = parseInt(inp.value) || 0;
        if (qty > 0) items.push({ opt: colours[+inp.dataset.idx], qty });
      });
      if (!items.length) return;

      mixBtn.disabled = true;
      progress.classList.add('show');
      pBar.style.width = '0%';

      const results = [];
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        pMsg.textContent = `Adding ${it.qty}× ${it.opt.name}… (${i + 1}/${items.length})`;
        pBar.style.width = Math.round((i / items.length) * 100) + '%';
        const res = await addOne(it.opt, it.qty);
        if (res.live) it.opt.name = res.live; // upgrade to the site's real colour name
        results.push({ ...it, ...res });
      }

      pBar.style.width = '100%';
      const ok   = results.filter(r => r.ok).length;
      const fail = results.filter(r => !r.ok);
      if (fail.length) {
        pMsg.textContent = `✅ ${ok} added, ⚠️ ${fail.length} failed`;
        setTimeout(() => alert('Some items could not be added:\n\n' +
          fail.map(r => `• ${r.qty}× ${r.opt.name}: ${r.why}`).join('\n')), 400);
      } else {
        pMsg.textContent = `✅ All ${ok} colour variant${ok > 1 ? 's' : ''} added to cart!`;
      }
      mixBtn.disabled = false;
    });

    return true;
  }

  // ─────────────────────────────────────────────────────
  // SPA NAVIGATION HANDLING
  // ─────────────────────────────────────────────────────
  let lastPath = '';
  setInterval(() => {
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      document.getElementById('mca-wrap')?.remove();
    }
    if (!isProductPage()) return;
    if (!document.getElementById('mca-wrap')) buildWidget();
  }, SCAN_INTERVAL);

  // ─────────────────────────────────────────────────────
  // DEBUG: Ctrl+Shift+M logs what was detected
  // ─────────────────────────────────────────────────────
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.shiftKey && e.code === 'KeyM') {
      console.group('[MixCart debug]');
      console.log('isProductPage:', isProductPage());
      console.log('addToCartBtn:', findAddToCartBtn());
      console.log('qtyInput:', findQtyInput(findAddToCartBtn()));
      console.log('colour label:', findColourLabelEl());
      console.log('selected name:', currentSelectedColourName());
      console.log('colourOptions:', detectColourOptions());
      console.groupEnd();
    }
  });

})();
