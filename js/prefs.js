/* Theme toggle, text size and the phone menu — shared by both pages.
   The small inline script in <head> restores the saved choices before first paint;
   this file wires up the buttons. Keys: pref-theme (light|dark), pref-font-size (sm|md|lg|xl). */
(function () {
  var root = document.documentElement;
  var SIZES = ['sm', 'md', 'lg', 'xl'];
  var SIZE_NAMES = { sm: 'Small', md: 'Normal', lg: 'Large', xl: 'Largest' };

  function store(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* private mode: still works for this visit */ } }

  function paintTheme() {
    var dark = root.getAttribute('data-theme') === 'dark';
    document.querySelectorAll('.js-theme').forEach(function (b) {
      b.setAttribute('aria-pressed', String(dark));
      b.setAttribute('aria-label', dark ? 'Dark theme on. Switch to light theme' : 'Light theme on. Switch to dark theme');
      var label = b.querySelector('.js-theme-label');
      if (label) label.textContent = dark ? 'Light theme' : 'Dark theme';
    });
  }
  function paintSize() {
    var cur = root.getAttribute('data-font-size') || 'md';
    document.querySelectorAll('.js-size').forEach(function (b) {
      var on = b.getAttribute('data-size') === cur;
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', 'Text size ' + SIZE_NAMES[b.getAttribute('data-size')] + (on ? ' (selected)' : ''));
    });
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('.js-theme') : null;
    if (t) {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next); store('pref-theme', next); paintTheme(); return;
    }
    var s = e.target.closest ? e.target.closest('.js-size') : null;
    if (s) {
      var size = s.getAttribute('data-size');
      if (SIZES.indexOf(size) === -1) return;
      root.setAttribute('data-font-size', size); store('pref-font-size', size); paintSize(); return;
    }
    var burger = e.target.closest ? e.target.closest('.js-burger') : null;
    var menu = document.getElementById('menu');
    if (burger && menu) {
      var open = !menu.classList.contains('open');
      menu.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      return;
    }
    if (menu && menu.classList.contains('open') && e.target.closest && e.target.closest('#menu a')) {
      menu.classList.remove('open');
      var b = document.querySelector('.js-burger');
      if (b) { b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-label', 'Open menu'); }
    }
  });

  paintTheme();
  paintSize();
})();
