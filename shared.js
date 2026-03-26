/* ============================================
   PDF Manager — shared.js
   Open Vision Engineering
   ============================================ */

const PDFMgr = (() => {
  const files = {};

  // ── File handling ──────────────────────────
  function dov(e, id) { e.preventDefault(); document.getElementById(id)?.classList.add('over'); }
  function dlv(id) { document.getElementById(id)?.classList.remove('over'); }

  function ddrop(e, slotId, dropId) {
    e.preventDefault(); dlv(dropId || slotId + '-drop');
    const f = e.dataTransfer.files[0];
    if (f) { files[slotId] = f; updateDrop(slotId, f); }
  }

  function fchange(slotId) {
    const el = document.getElementById(slotId + '-file');
    if (el?.files[0]) { files[slotId] = el.files[0]; updateDrop(slotId, el.files[0]); }
  }

  function updateDrop(slotId, f) {
    const drop = document.getElementById(slotId + '-drop');
    if (!drop) return;
    drop.classList.add('has-file');
    const fn = drop.querySelector('.fname'); if (fn) fn.textContent = f.name;
    const fm = drop.querySelector('.fmeta'); if (fm) fm.textContent = fmtSize(f.size);
  }

  function getFile(slotId) { return files[slotId] || null; }

  // ── Formatters ────────────────────────────
  function fmtSize(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(2) + ' MB';
  }

  function baseName(f) { return f.name.replace(/\.[^.]+$/, ''); }

  // ── UI helpers ────────────────────────────
  function showErr(id, msg) {
    const el = document.getElementById(id + '-err');
    if (!el) return;
    el.textContent = msg; el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 7000);
  }
  function hideErr(id) { document.getElementById(id + '-err')?.classList.remove('show'); }

  function setProgress(id, pct, label) {
    const pw = document.getElementById(id + '-prog');
    if (!pw) return;
    pw.classList.add('show');
    const pf = document.getElementById(id + '-fill');
    if (pf) pf.style.width = pct + '%';
    const pl = pw.querySelector('.prog-lbl');
    if (pl && label) pl.textContent = label;
  }
  function hideProgress(id) { document.getElementById(id + '-prog')?.classList.remove('show'); }

  function showResult(id, html) {
    const el = document.getElementById(id + '-result');
    if (el) { el.innerHTML = html; el.classList.add('show'); }
  }

  function dlCard(name, bytes, url, extra) {
    return `<div class="dl-card">
      <div class="dl-icon">&#128196;</div>
      <div class="dl-info">
        <div class="dl-name">${name}</div>
        <div class="dl-meta">${fmtSize(bytes)}${extra ? ' &bull; ' + extra : ''}</div>
      </div>
      <a class="btn-dl" href="${url}" download="${name}">Download</a>
    </div>`;
  }

  // ── File reading ──────────────────────────
  function readFile(f) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = e => res(e.target.result);
      r.onerror = rej;
      r.readAsArrayBuffer(f);
    });
  }

  function readFileAsDataURL(f) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = e => res(e.target.result);
      r.onerror = rej;
      r.readAsDataURL(f);
    });
  }

  function readFileAsText(f) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = e => res(e.target.result);
      r.onerror = rej;
      r.readAsText(f);
    });
  }

  function makeDlUrl(bytes, mime) {
    return URL.createObjectURL(new Blob([bytes], { type: mime }));
  }

  // ── Script loader ─────────────────────────
  const loadedScripts = {};
  function loadScript(src) {
    if (loadedScripts[src]) return Promise.resolve();
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src; s.onload = () => { loadedScripts[src] = true; res(); }; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  // ── Image loader ──────────────────────────
  function loadImg(src) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img); img.onerror = rej; img.src = src;
    });
  }

  // ── Page range parser ─────────────────────
  function parsePageRange(str, total) {
    const pages = new Set();
    str.split(',').forEach(part => {
      part = part.trim();
      if (part.includes('-')) {
        const [a, b] = part.split('-').map(Number);
        for (let i = a; i <= Math.min(b, total); i++) pages.add(i - 1);
      } else {
        const n = parseInt(part);
        if (!isNaN(n) && n >= 1 && n <= total) pages.add(n - 1);
      }
    });
    return [...pages].sort((a, b) => a - b);
  }

  // ── Settings ──────────────────────────────
  function getSetting(k, d) { return localStorage.getItem('pdfmgr_' + k) ?? d; }
  function setSetting(k, v) { localStorage.setItem('pdfmgr_' + k, v); }

  // ── Header/Footer builder ─────────────────
  function buildHeader(title, desc, backUrl) {
    const h = document.querySelector('.site-header');
    if (h) {
      h.innerHTML = `<div class="brand">PDF Manager <span>Open Vision</span></div>`;
    }
    const ph = document.querySelector('.panel-header');
    if (ph) {
      ph.innerHTML = `
        <a class="panel-back" href="${backUrl || 'index.html'}">&larr; Back</a>
        <div class="panel-titles">
          <div class="panel-title">${title}</div>
          ${desc ? `<div class="panel-desc">${desc}</div>` : ''}
        </div>`;
    }
  }

  function buildFooter() {
    const f = document.querySelector('.site-footer');
    if (f) {
      const y = new Date().getFullYear();
      f.innerHTML = `
        <div class="footer-brand">Open Vision</div>
        <div class="footer-tagline">OpenVision Engineering Accessibility. Empowering Innovation.</div>
        <div class="footer-copy">&copy; ${y} Open Vision. All rights reserved.</div>`;
    }
  }

  document.addEventListener('DOMContentLoaded', buildFooter);

  return {
    dov, dlv, ddrop, fchange, getFile, fmtSize, baseName,
    showErr, hideErr, setProgress, hideProgress, showResult, dlCard,
    readFile, readFileAsDataURL, readFileAsText, makeDlUrl,
    loadScript, loadImg, parsePageRange,
    getSetting, setSetting, buildHeader, buildFooter,
  };
})();
