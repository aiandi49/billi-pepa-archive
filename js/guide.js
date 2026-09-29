/* The guide: every section below the hero is rendered from data/gub.json. DOM calls only. */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function link(text, href, cls, external) {
    var a = el('a', cls, text); a.href = href;
    if (external) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    return a;
  }
  function askHref(entry) { return 'index.html?q=' + encodeURIComponent('Tell me about ' + entry.title); }

  var ROOMS = [
    { key: 'front-end', lead: 'the-front-end', text: 'The Starfires, The Wild Starfires, The Front End and Pepa.Beads.Kydd — Brooklyn, Roulette, Smash Records, Les Paul and a Stigwood single that never came out.' },
    { key: 'jbrt', lead: 'jbrt', text: 'The power trio Billi formed in 1994, The Story of Jimmibeetles, CBGB and Webster Hall — and the legend of a guitarist who vanished.' },
    { key: 'wildstarfires', lead: 'wildstarfires-catalog', text: 'The recordings you can hear today: Best of The Wildstarfires Vol. I, II, III and Live, on Bandcamp and Spotify.' }
  ];

  function start(A) {
    /* hero photo opens full screen */
    $('heroShot').addEventListener('click', function () {
      Lightbox.open(A.slides(A.byId('the-wild-starfires-1967')), 0);
    });

    /* rooms */
    var grid = $('roomsGrid');
    ROOMS.forEach(function (r) {
      var lead = A.byId(r.lead), meta = A.collections[r.key];
      var count = A.entries.filter(function (e) { return e.collection === r.key; }).length;
      var card = el('article', 'room');
      var fig = el('button', 'room-shot'); fig.type = 'button'; fig.setAttribute('aria-label', 'View photos: ' + meta.label);
      var im = el('img'); im.src = A.imgSrc(lead.image); im.alt = A.caption(lead.image, lead.title); im.loading = 'lazy'; im.width = 1000; im.height = 750;
      fig.appendChild(im);
      fig.addEventListener('click', function () {
        Lightbox.open(A.slides(lead), 0);
      });
      card.appendChild(fig);
      var body = el('div', 'room-body');
      body.appendChild(el('p', 'room-years', meta.years));
      body.appendChild(el('h3', null, meta.label));
      body.appendChild(el('p', 'room-text', r.text));
      var btn = el('button', 'room-link', 'Browse ' + count + ' entries'); btn.type = 'button';
      btn.addEventListener('click', function () { setFilter(r.key); $('directory').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); });
      body.appendChild(btn);
      card.appendChild(body);
      grid.appendChild(card);
    });

    /* timeline */
    var tl = $('timelineList');
    A.timeline.forEach(function (t) {
      var li = el('li');
      li.appendChild(el('span', 'tl-year', t.year));
      var p = el('p', 'tl-text', t.text + ' ');
      var e = A.byId(t.entry);
      if (e) p.appendChild(link('Read more', '#' + e.id, 'tl-more'));
      li.appendChild(p);
      tl.appendChild(li);
    });

    /* photo carousel: every picture, once */
    var seen = {}, photos = [];
    A.entries.forEach(function (e) {
      A.slides(e).forEach(function (sl, k) { var f = A.photosFor(e)[k]; if (!seen[f]) { seen[f] = true; photos.push(sl); } });
    });
    var track = $('photoTrack');
    photos.forEach(function (p, k) {
      var b = el('button', 'slide'); b.type = 'button'; b.setAttribute('aria-label', 'View full screen: ' + p.title);
      var im = el('img'); im.src = p.src; im.alt = ''; im.loading = 'lazy'; im.decoding = 'async'; im.width = 600; im.height = 450;
      b.appendChild(im); b.appendChild(el('span', 'slide-cap', p.caption));
      b.addEventListener('click', function () { Lightbox.open(photos, k); });
      track.appendChild(b);
    });
    function page(dir) { track.scrollBy({ left: dir * track.clientWidth * 0.9, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }
    $('carPrev').addEventListener('click', function () { page(-1); });
    $('carNext').addEventListener('click', function () { page(1); });

    /* live tracklist — becomes stacked label/value cards on small screens (CSS) */
    var live = A.byId('best-of-live'), tb = $('trackBody');
    (live.tracks || []).forEach(function (t) {
      var tr = el('tr');
      var n = el('td', 'n', String(t.n)); n.setAttribute('data-label', 'No.');
      var s = el('td', 'song'); s.setAttribute('data-label', 'Song');
      var art = el('img'); art.src = A.imgSrc(t.art); art.alt = ''; art.width = 64; art.height = 64; art.loading = 'lazy';
      s.appendChild(art); s.appendChild(el('span', null, t.title));
      var l = el('td', 'len', t.length); l.setAttribute('data-label', 'Length');
      var st = el('td', 'story'); st.setAttribute('data-label', 'Story');
      var rel = t.entry ? A.byId(t.entry) : null;
      if (rel) st.appendChild(link(rel.title, '#' + rel.id)); else st.textContent = 'On the album';
      [n, s, l, st].forEach(function (c) { tr.appendChild(c); });
      tb.appendChild(tr);
    });

    /* directory */
    var chips = $('dirChips');
    var FILTERS = [['all', 'Everything']].concat(Object.keys(A.collections).map(function (k) { return [k, A.collections[k].label]; }));
    FILTERS.forEach(function (f) {
      var b = el('button', 'chip', f[1]); b.type = 'button'; b.setAttribute('data-filter', f[0]); b.setAttribute('aria-pressed', String(f[0] === 'all'));
      b.addEventListener('click', function () { setFilter(f[0]); });
      chips.appendChild(b);
    });
    var entryGrid = $('entryGrid'), cards = [];
    A.entries.forEach(function (e) {
      var art = el('article', 'entry'); art.id = e.id;
      var shot = el('button', 'entry-shot'); shot.type = 'button'; shot.setAttribute('aria-label', 'View photos: ' + e.title);
      var im = el('img'); im.src = A.imgSrc(e.image); im.alt = A.caption(e.image, e.title); im.loading = 'lazy'; im.decoding = 'async'; im.width = 800; im.height = 600;
      shot.appendChild(im);
      shot.addEventListener('click', function () {
        Lightbox.open(A.slides(e), 0);
      });
      art.appendChild(shot);
      var body = el('div', 'entry-body');
      body.appendChild(el('p', 'entry-kind', e.kind + ' · ' + A.collections[e.collection].label));
      body.appendChild(el('h3', null, e.title));
      body.appendChild(el('p', 'entry-sum', e.summary));
      var more = el('details', 'entry-more');
      more.appendChild(el('summary', null, 'Read the story'));
      more.appendChild(el('p', 'entry-story', e.body));
      var dl = el('dl', 'entry-facts');
      Object.keys(e.details || {}).forEach(function (k) {
        var row = el('div'); row.appendChild(el('dt', null, k)); row.appendChild(el('dd', null, e.details[k])); dl.appendChild(row);
      });
      more.appendChild(dl);
      var links = el('ul', 'entry-links');
      (e.links || []).forEach(function (l) { var li = el('li'); li.appendChild(link(l.label, l.url, null, true)); links.appendChild(li); });
      var askLi = el('li'); askLi.appendChild(link('Ask the archive about this', askHref(e), 'ask')); links.appendChild(askLi);
      more.appendChild(links);
      body.appendChild(more);
      art.appendChild(body);
      entryGrid.appendChild(art);
      cards.push({ node: art, entry: e, hay: (e.title + ' ' + e.summary + ' ' + e.body + ' ' + (e.tags || []).join(' ') + ' ' + Object.values(e.details || {}).join(' ')).toLowerCase() });
    });

    var filter = 'all';
    function apply() {
      var q = $('dirSearch').value.trim().toLowerCase();
      var shown = 0;
      cards.forEach(function (c) {
        var ok = (filter === 'all' || c.entry.collection === filter) && (!q || q.split(/\s+/).every(function (w) { return c.hay.indexOf(w) !== -1; }));
        c.node.hidden = !ok; if (ok) shown++;
      });
      $('dirCount').textContent = shown === 0 ? 'Nothing matches that yet. Try a song title, a year or a place — or ask the archive.' : 'Showing ' + shown + ' of ' + cards.length;
    }
    function setFilter(key) {
      filter = key;
      chips.querySelectorAll('.chip').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-filter') === key)); });
      apply();
    }
    $('dirSearch').addEventListener('input', apply);
    apply();

    /* open an entry when arriving at #id */
    function openHash() {
      var id = decodeURIComponent(location.hash.slice(1));
      var e = id && A.byId(id);
      if (!e) return;
      var node = document.getElementById(id);
      if (node.hidden) { $('dirSearch').value = ''; setFilter('all'); }
      var d = node.querySelector('details'); if (d) d.open = true;
      node.scrollIntoView({ block: 'start' });
    }
    window.addEventListener('hashchange', openHash);
    openHash();

    /* where to listen */
    var ll = $('listenList');
    (A.byId('where-to-listen').links || []).forEach(function (l) {
      var li = el('li'); li.appendChild(link(l.label, l.url, 'listen-link', true));
      var host = l.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
      li.appendChild(el('span', 'listen-host', host));
      ll.appendChild(li);
    });
  }


  Archive.load().then(start).catch(function () { Archive.fileNotice(document.getElementById('main')); });
})();
