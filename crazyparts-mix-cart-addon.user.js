// ==UserScript==
// @name         Crazyparts Mix Cart Addon v3
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Add multiple colour variants of one product to cart in one click
// @author       You
// @match        *://www.crazyparts.com.au/*
// @grant        none
// ==/UserScript==
(function () {
  'use strict';

  const BASE          = 'https://www.crazyparts.com.au';
  const POLL_INTERVAL = 400;
  const POLL_MAX      = 30;

  // ─────────────────────────────────────────────────────
  // STYLES
  // ─────────────────────────────────────────────────────
  document.head.appendChild(Object.assign(document.createElement('style'), { textContent: `
  #mca-wrap {
    margin-top: 12px;
    border: 1.5px solid #1769c0;
    border-radius: 6px;
    overflow: hidden;
    font-family: -apple-system, 'Segoe UI', Arial, sans-serif;
    font-size: 13px;
    color: #1a2b3c;
    background: #fff;
  }
  #mca-hdr {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 12px;
    background: #1a3a6e;
    color: #fff;
    cursor: pointer;
    user-select: none;
  }
  #mca-hdr-label {
    flex: 1;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
  }
  #mca-toggle-arrow { font-size: 11px; transition: transform .2s; flex-shrink: 0; }
  #mca-toggle-arrow.open { transform: rotate(90deg); }
  #mca-body { display: none; padding: 12px; background: #f6f8fd; border-top: 2px solid #1769c0; }
  #mca-body.open { display: block; }

  #mca-controls {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
    flex-wrap: wrap;
  }
  #mca-controls label { font-size: 11.5px; font-weight: 700; color: #5a6a82; white-space: nowrap; }
  #mca-total-inp {
    width: 58px; border: 1px solid #cdd6ea; border-radius: 3px;
    padding: 4px 6px; font-size: 12px; font-family: inherit;
    text-align: center; background: #fff; color: #1a2b3c;
  }
  #mca-total-inp:focus { outline: none; border-color: #1769c0; }
  #mca-split-btn {
    padding: 5px 12px; background: #eef2f9; color: #1a3a6e;
    border: 1px solid #cdd6ea; border-radius: 3px; font-size: 11.5px;
    font-weight: 700; cursor: pointer; font-family: inherit;
    white-space: nowrap; transition: background .15s;
  }
  #mca-split-btn:hover { background: #dce6f5; }
  #mca-clear-btn {
    padding: 5px 10px; background: #fff; color: #5a6a82;
    border: 1px solid #cdd6ea; border-radius: 3px; font-size: 11.5px;
    font-weight: 600; cursor: pointer; font-family: inherit; transition: background .15s;
  }
  #mca-clear-btn:hover { background: #f0f0f0; }

  #mca-colour-list { display: flex; flex-direction: column; gap: 5px; margin-bottom: 12px; }

  .mca-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 10px;
    background: #fff;
    border: 1px solid #cdd6ea;
    border-radius: 4px;
    transition: border-color .15s;
  }
  .mca-row:focus-within { border-color: #1769c0; }
  .mca-row.ofs {
    background: #fafafa;
    border-color: #e0e0e0;
    opacity: .7;
  }

  .mca-colour-name {
    flex: 1;
    font-size: 12.5px;
    font-weight: 600;
    color: #1a3a6e;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .mca-ofs-badge {
    font-size: 9.5px;
    font-weight: 800;
    letter-spacing: .06em;
    text-transform: uppercase;
    color: #c0392b;
    background: #fde8e6;
    border: 1px solid #f5bfba;
    border-radius: 3px;
    padding: 2px 5px;
    flex-shrink: 0;
  }
  .mca-qty {
    width: 52px; border: 1px solid #cdd6ea; border-radius: 3px;
    padding: 3px 5px; font-size: 12px; font-family: inherit;
    text-align: center; background: #fff; color: #1a2b3c;
  }
  .mca-qty:focus { outline: none; border-color: #1769c0; }
  .mca-qty:disabled { background: #f0f0f0; color: #aaa; cursor: not-allowed; }

  #mca-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 7px 10px;
    background: #eef2f9;
    border: 1px solid #cdd6ea;
    border-radius: 4px;
    margin-bottom: 10px;
    font-size: 12px;
    color: #5a6a82;
  }
  #mca-summary strong { color: #1a3a6e; }

  #mca-add-btn {
    width: 100%; padding: 10px; background: #1769c0; color: #fff;
    border: none; border-radius: 4px; font-size: 13px; font-weight: 800;
    cursor: pointer; font-family: inherit; letter-spacing: .04em; transition: background .15s;
  }
  #mca-add-btn:hover { background: #1257a8; }
  #mca-add-btn:disabled { background: #9aafcc; cursor: not-allowed; }

  #mca-progress { display: none; margin-top: 10px; }
  #mca-progress.show { display: block; }
  #mca-progress-bar-wrap {
    height: 6px; background: #dce6f5;
    border-radius: 3px; overflow: hidden; margin-bottom: 6px;
  }
  #mca-progress-bar {
    height: 100%; background: #1769c0;
    border-radius: 3px; width: 0%; transition: width .3s;
  }
  #mca-progress-msg { font-size: 11.5px; color: #5a6a82; text-align: center; }
  #mca-no-colours { font-size: 12px; color: #c0392b; padding: 8px 0; text-align: center; display: none; }
  `}));

  // ─────────────────────────────────────────────────────
  // COLOUR + OFS DETECTION
  // ─────────────────────────────────────────────────────

  function parseCfgFromPage(html) {
    const src = html || document.documentElement.innerHTML;
    const m = src.match(/new\s+Product\.Config\s*\(\s*(\{[\s\S]+?\})\s*\)/);
    if (!m) return null;
    try { return JSON.parse(m[1]); } catch { return null; }
  }

  /**
   * Returns [{name, ofs}]
   * ofs = true when the colour is out of stock / not available
   */
  function detectColours() {
    const colours = [];
    const seen    = new Set();

    const cfg = parseCfgFromPage();

    // Build a set of OFS option IDs from Product.Config if available
    // Magento puts inStock map or marks options with no available childProducts
    const ofsIds = new Set();
    if (cfg?.attributes) {
      // Collect all child product IDs that are in-stock
      const inStockProducts = new Set();
      if (cfg.stock) {
        // Some themes put a flat stock map: { "productId": 1/0 }
        Object.entries(cfg.stock).forEach(([id, v]) => { if (v) inStockProducts.add(id); });
      }
      // Walk options: if an option's products array is empty (or all OFS), mark OFS
      for (const attrId in cfg.attributes) {
        const attr = cfg.attributes[attrId];
        if (!/^colo(u)?r$/i.test(attr.code || '')) continue;
        for (const opt of (attr.options || [])) {
          const prods = opt.products || [];
          // If stock map exists, check it; otherwise trust the presence of products
          if (cfg.stock) {
            const anyInStock = prods.some(pid => inStockProducts.has(String(pid)));
            if (!anyInStock && prods.length > 0) ofsIds.add(String(opt.id));
          } else if (prods.length === 0) {
            ofsIds.add(String(opt.id));
          }
        }
      }
    }

    // 1. Swatch list (most reliable for OFS — has 'not-available' class)
    document.querySelectorAll('.configurable-swatch-list li').forEach(li => {
      const name = (li.getAttribute('title') || '').trim();
      if (!name || seen.has(name.toLowerCase())) return;
      seen.add(name.toLowerCase());
      const optId = li.getAttribute('data-option-id') || li.id?.replace(/[^0-9]/g, '') || '';
      const domOfs = li.classList.contains('not-available') ||
                     li.classList.contains('out-of-stock') ||
                     li.classList.contains('disabled') ||
                     li.getAttribute('aria-disabled') === 'true';
      const cfgOfs = ofsIds.has(String(optId));
      colours.push({ name, ofs: domOfs || cfgOfs });
    });

    // 2. Swatch options (newer Magento themes)
    document.querySelectorAll('.swatch-option').forEach(el => {
      const name = (el.getAttribute('aria-label') || el.getAttribute('data-option-label') || el.getAttribute('title') || el.textContent || '').trim();
      if (!name || seen.has(name.toLowerCase())) return;
      seen.add(name.toLowerCase());
      const optId = el.getAttribute('data-option-id') || '';
      const domOfs = el.classList.contains('disabled') || el.classList.contains('out-of-stock');
      colours.push({ name, ofs: domOfs || ofsIds.has(String(optId)) });
    });

    // 3. <select> fallback
    document.querySelectorAll('select[name*="super_attribute"]').forEach(sel => {
      Array.from(sel.options).forEach(opt => {
        const name = opt.text.trim();
        if (!name || opt.value === '' || seen.has(name.toLowerCase())) return;
        seen.add(name.toLowerCase());
        colours.push({ name, ofs: opt.disabled || ofsIds.has(String(opt.value)) });
      });
    });

    return colours;
  }

  // ─────────────────────────────────────────────────────
  // AJAX CART
  // ─────────────────────────────────────────────────────
  function parseCfg(html) {
    const m = html.match(/new\s+Product\.Config\s*\(\s*(\{[\s\S]+?\})\s*\)/);
    if (!m) return null;
    try { return JSON.parse(m[1]); } catch { return null; }
  }

  function findColourAttr(cfg, colourName) {
    if (!cfg?.attributes) return null;
    for (const id in cfg.attributes) {
      const a = cfg.attributes[id];
      if (!/^colo(u)?r$/i.test(a.code || '')) continue;
      for (const o of (a.options || [])) {
        if (o.label.toLowerCase().trim() === colourName.toLowerCase())
          return { id, val: o.id };
      }
    }
    return null;
  }

  async function addOneToCart(pageUrl, colourName, qty) {
    try {
      const r1 = await fetch(pageUrl, { credentials: 'include' });
      if (!r1.ok) return { ok: false, why: 'Page load error ' + r1.status };
      const html = await r1.text();
      const dom  = new DOMParser().parseFromString(html, 'text/html');
      const form = dom.querySelector('#product_addtocart_form');
      if (!form) return { ok: false, why: 'No add-to-cart form found' };

      const fd = new FormData(form);
      fd.set('qty', String(qty));

      const cfg = parseCfg(html);
      const col = findColourAttr(cfg, colourName);
      if (col) {
        fd.set('super_attribute[' + col.id + ']', col.val);
      } else {
        dom.querySelectorAll('select[name*="super_attribute"]').forEach(sel => {
          Array.from(sel.options).forEach(opt => {
            if (opt.text.trim().toLowerCase() === colourName.toLowerCase())
              fd.set(sel.name, opt.value);
          });
        });
      }

      const action = form.getAttribute('action') || (BASE + '/checkout/cart/add/');
      const r2 = await fetch(action, { method: 'POST', body: fd, credentials: 'include', redirect: 'follow' });
      const h2 = await r2.text();
      const d2 = new DOMParser().parseFromString(h2, 'text/html');
      const err = d2.querySelector('.error-msg li, .message-error li');
      if (err) return { ok: false, why: err.textContent.trim().slice(0, 100) };
      return { ok: true };
    } catch (e) {
      return { ok: false, why: e.message };
    }
  }

  // ─────────────────────────────────────────────────────
  // WIDGET BUILD
  // ─────────────────────────────────────────────────────
  function buildWidget() {
    const colours = detectColours();

    const anchorEl = (
      document.querySelector('#product_addtocart_form .btn-cart') ||
      document.querySelector('button.btn-cart') ||
      document.querySelector('[id*="addtocart"]') ||
      document.querySelector('.add-to-cart-buttons') ||
      document.querySelector('#product_addtocart_form')
    );
    if (!anchorEl) return false;
    if (document.getElementById('mca-wrap')) return true;

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

    const insertAfter = anchorEl.closest('.add-to-cart, .product-type-data, .product-shop') || anchorEl;
    insertAfter.insertAdjacentElement('afterend', wrap);

    const hdr       = wrap.querySelector('#mca-hdr');
    const body      = wrap.querySelector('#mca-body');
    const arrow     = wrap.querySelector('#mca-toggle-arrow');
    const noColours = wrap.querySelector('#mca-no-colours');
    const colourList= wrap.querySelector('#mca-colour-list');
    const totalInp  = wrap.querySelector('#mca-total-inp');
    const splitBtn  = wrap.querySelector('#mca-split-btn');
    const clearBtn  = wrap.querySelector('#mca-clear-btn');
    const countEl   = wrap.querySelector('#mca-count');
    const totalDisp = wrap.querySelector('#mca-total-disp');
    const addBtn    = wrap.querySelector('#mca-add-btn');
    const progress  = wrap.querySelector('#mca-progress');
    const pBar      = wrap.querySelector('#mca-progress-bar');
    const pMsg      = wrap.querySelector('#mca-progress-msg');

    // Toggle open/close
    hdr.addEventListener('click', () => {
      const open = body.classList.toggle('open');
      arrow.classList.toggle('open', open);
    });

    if (!colours.length) {
      noColours.style.display = 'block';
      wrap.querySelector('#mca-controls').style.display = 'none';
      wrap.querySelector('#mca-summary').style.display  = 'none';
      addBtn.style.display = 'none';
    } else {
      colours.forEach(c => {
        const row = document.createElement('div');
        row.className = 'mca-row' + (c.ofs ? ' ofs' : '');

        const nameEl = document.createElement('span');
        nameEl.className = 'mca-colour-name';
        nameEl.textContent = c.name;

        const inp = document.createElement('input');
        inp.type = 'number';
        inp.min = '0';
        inp.max = '9999';
        inp.value = '0';
        inp.placeholder = '0';
        inp.className = 'mca-qty';
        inp.dataset.colour = c.name;
        inp.dataset.ofs = c.ofs ? '1' : '0';
        if (c.ofs) inp.disabled = true;

        row.appendChild(nameEl);

        if (c.ofs) {
          const badge = document.createElement('span');
          badge.className = 'mca-ofs-badge';
          badge.textContent = 'OFS';
          row.appendChild(badge);
        }

        row.appendChild(inp);
        colourList.appendChild(row);
      });
    }

    // Live summary
    function updateSummary() {
      const qtys  = Array.from(colourList.querySelectorAll('.mca-qty:not(:disabled)'));
      const count = qtys.filter(i => (parseInt(i.value) || 0) > 0).length;
      const total = qtys.reduce((s, i) => s + (parseInt(i.value) || 0), 0);
      countEl.textContent = count;
      totalDisp.textContent = total;
      addBtn.disabled = total === 0;
    }
    colourList.addEventListener('input', updateSummary);
    updateSummary();

    // Auto-split — only splits across IN-STOCK colours, remainder distributed randomly
    splitBtn.addEventListener('click', () => {
      const total = Math.max(1, parseInt(totalInp.value) || 10);
      const rows  = Array.from(colourList.querySelectorAll('.mca-qty:not(:disabled)'));
      if (!rows.length) return;
      const base = Math.floor(total / rows.length);
      const rem  = total % rows.length;
      // Build values array then shuffle so the +1s land on random rows each time
      const values = rows.map((_, i) => base + (i < rem ? 1 : 0));
      for (let i = values.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [values[i], values[j]] = [values[j], values[i]];
      }
      rows.forEach((inp, i) => { inp.value = values[i]; });
      updateSummary();
    });

    clearBtn.addEventListener('click', () => {
      colourList.querySelectorAll('.mca-qty:not(:disabled)').forEach(i => { i.value = 0; });
      updateSummary();
    });

    addBtn.addEventListener('click', async () => {
      const items = [];
      colourList.querySelectorAll('.mca-qty:not(:disabled)').forEach(inp => {
        const qty = parseInt(inp.value) || 0;
        if (qty > 0) items.push({ colour: inp.dataset.colour, qty });
      });
      if (!items.length) return;

      addBtn.disabled = true;
      progress.classList.add('show');
      pBar.style.width = '0%';

      const pageUrl = location.href;
      const results = [];

      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        pMsg.textContent = `Adding ${it.qty}× ${it.colour}… (${i + 1}/${items.length})`;
        pBar.style.width = Math.round((i / items.length) * 100) + '%';
        results.push({ ...it, ...await addOneToCart(pageUrl, it.colour, it.qty) });
        await new Promise(r => setTimeout(r, 600));
      }

      pBar.style.width = '100%';
      const ok   = results.filter(r => r.ok).length;
      const fail = results.filter(r => !r.ok);

      if (fail.length) {
        pMsg.textContent = `✅ ${ok} added, ⚠️ ${fail.length} failed`;
        setTimeout(() => alert('Some items could not be added:\n\n' +
          fail.map(r => `• ${r.qty}× ${r.colour}: ${r.why}`).join('\n')), 400);
      } else {
        pMsg.textContent = `✅ All ${ok} colour variant${ok > 1 ? 's' : ''} added to cart!`;
      }
      addBtn.disabled = false;
    });

    return true;
  }

  // ─────────────────────────────────────────────────────
  // WAIT FOR PAGE + INJECT
  // ─────────────────────────────────────────────────────
  function isProductPage() {
    return !!(
      document.querySelector('#product_addtocart_form') ||
      document.querySelector('.product-view') ||
      document.querySelector('[itemtype*="Product"]')
    );
  }

  let pollCount = 0;
  const poller  = setInterval(() => {
    if (++pollCount > POLL_MAX) { clearInterval(poller); return; }
    if (!isProductPage()) return;
    if (buildWidget()) clearInterval(poller);
  }, POLL_INTERVAL);

})();