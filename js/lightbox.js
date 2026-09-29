/* Full-screen image viewer shared by both pages.
   Lightbox.open(items, start) — items: [{ src, title, caption, alt }]
   Swipe, arrow keys, Esc and the on-screen buttons all work. */
(function (global) {
  var el, img, titleEl, capEl, countEl, prevBtn, nextBtn, closeBtn, items = [], i = 0, lastFocus = null, startX = null, startY = null;
  var NS = 'http://www.w3.org/2000/svg';

  function icon(d) {
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true');
    var p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d); p.setAttribute('fill', 'none'); p.setAttribute('stroke', 'currentColor');
    p.setAttribute('stroke-width', '2'); p.setAttribute('stroke-linecap', 'round'); p.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(p); return svg;
  }
  function button(cls, label, d) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'lb-btn ' + cls; b.setAttribute('aria-label', label);
    b.appendChild(icon(d)); return b;
  }

  function build() {
    el = document.createElement('div');
    el.className = 'lb'; el.hidden = true;
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Photo viewer');

    var top = document.createElement('div'); top.className = 'lb-top';
    countEl = document.createElement('span'); countEl.className = 'lb-count'; countEl.setAttribute('aria-live', 'polite');
    closeBtn = button('lb-close', 'Close viewer', 'M6 6l12 12M18 6L6 18');
    top.appendChild(countEl); top.appendChild(closeBtn);

    var stage = document.createElement('div'); stage.className = 'lb-stage';
    img = document.createElement('img'); img.className = 'lb-img'; img.alt = ''; img.decoding = 'async';
    stage.appendChild(img);

    prevBtn = button('lb-prev', 'Previous photo', 'M15 5l-7 7 7 7');
    nextBtn = button('lb-next', 'Next photo', 'M9 5l7 7-7 7');

    var cap = document.createElement('div'); cap.className = 'lb-cap';
    titleEl = document.createElement('strong'); titleEl.className = 'lb-title';
    capEl = document.createElement('span'); capEl.className = 'lb-caption';
    cap.appendChild(titleEl); cap.appendChild(capEl);

    [top, stage, prevBtn, nextBtn, cap].forEach(function (n) { el.appendChild(n); });
    document.body.appendChild(el);

    prevBtn.addEventListener('click', function () { go(-1); });
    nextBtn.addEventListener('click', function () { go(1); });
    closeBtn.addEventListener('click', close);
    stage.addEventListener('click', function (e) { if (e.target === stage) close(); });
    el.addEventListener('pointerdown', function (e) { startX = e.clientX; startY = e.clientY; });
    el.addEventListener('pointerup', function (e) {
      if (startX === null) return;
      var dx = e.clientX - startX, dy = e.clientY - startY; startX = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    });
    document.addEventListener('keydown', function (e) {
      if (el.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'Tab') {
        var f = [closeBtn, prevBtn, nextBtn].filter(function (b) { return !b.hidden; });
        var k = f.indexOf(document.activeElement);
        e.preventDefault();
        f[(k + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    });
  }

  function show() {
    var it = items[i];
    img.src = it.src; img.alt = it.alt || it.title || '';
    titleEl.textContent = it.title || '';
    capEl.textContent = it.caption || '';
    countEl.textContent = (i + 1) + ' / ' + items.length;
    var many = items.length > 1;
    prevBtn.hidden = !many; nextBtn.hidden = !many;
    [i + 1, i - 1].forEach(function (n) {
      var k = (n + items.length) % items.length;
      if (items[k]) { var p = new Image(); p.src = items[k].src; }
    });
  }
  function go(step) { if (items.length < 2) return; i = (i + step + items.length) % items.length; show(); }
  function open(list, start) {
    if (!el) build();
    items = list || []; if (!items.length) return;
    i = Math.max(0, Math.min(start || 0, items.length - 1));
    lastFocus = document.activeElement;
    el.hidden = false;
    document.documentElement.classList.add('lb-open');
    show();
    closeBtn.focus({ preventScroll: true });
  }
  function close() {
    el.hidden = true;
    document.documentElement.classList.remove('lb-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  global.Lightbox = { open: open, close: close };
})(window);
