/* Loads data/gub.json — the one source both pages (and /api/chat) read. */
(function (global) {
  var COLLECTIONS = {
    'front-end': { label: 'The Front End years', years: '1964 – 1974' },
    'jbrt': { label: 'Jimmibeetles Rock Theatre', years: '1994 – 2001' },
    'wildstarfires': { label: 'The Wildstarfires catalog', years: 'Released 2024 – 2026' },
    'billi': { label: 'Billi & the label', years: 'Across the years' }
  };
  var promise = null;

  function imgSrc(file) { return 'assets/img/' + file; }

  function load() {
    if (promise) return promise;
    promise = fetch('data/gub.json', { credentials: 'same-origin' })
      .then(function (r) { if (!r.ok) throw new Error('status ' + r.status); return r.json(); })
      .then(function (data) {
        var byId = {};
        data.entries.forEach(function (e) { byId[e.id] = e; });
        var linkSet = {}, hostSet = {};
        data.entries.forEach(function (e) { (e.links || []).forEach(function (l) {
          linkSet[l.url.replace(/\/$/, '')] = true;
          var m = l.url.match(/^https:\/\/(?:www\.)?([^\/]+)\/?$/);   // site home pages only
          if (m) hostSet[m[1].toLowerCase()] = l.url;
        }); });
        return {
          entries: data.entries,
          timeline: data.timeline || [],
          caption: function (file, fallback) { return (data.photos && data.photos[file]) || fallback || ''; },
          slides: function (e) { return [e.image].concat(e.images || []).filter(Boolean).map(function (f) { var c = (data.photos && data.photos[f]) || e.summary; return { src: imgSrc(f), title: e.title, caption: c, alt: c }; }); },
          byId: function (id) { return byId[id] || null; },
          knownLink: function (url) { return !!linkSet[String(url).replace(/\/$/, '')]; },
          siteFor: function (name) { return hostSet[String(name).toLowerCase().replace(/^www\./, '')] || null; },
          imgSrc: imgSrc,
          photosFor: function (e) { return [e.image].concat(e.images || []).filter(Boolean); },
          collections: COLLECTIONS
        };
      });
    return promise;
  }

  /* Opened straight from a folder (file://): browsers block reading the data file. Say so plainly. */
  function fileNotice(where) {
    var n = document.createElement('div');
    n.className = 'file-notice'; n.setAttribute('role', 'alert');
    var s = document.createElement('strong'); s.textContent = 'This page needs to be served, not double-clicked. ';
    n.appendChild(s);
    n.appendChild(document.createTextNode('Browsers block pages opened straight from a folder from reading the archive file. On Vercel it just works. On your computer, open a terminal in this folder, run "python3 -m http.server 8000", then visit http://localhost:8000.'));
    (where || document.body).insertBefore(n, (where || document.body).firstChild);
  }

  global.Archive = { load: load, imgSrc: imgSrc, collections: COLLECTIONS, fileNotice: fileNotice };
})(window);
