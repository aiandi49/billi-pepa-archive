/* The archive guide: chat, MATCH parsing and the three live cards.
   Everything shown is written with textContent / DOM calls — never HTML strings. */
(function () {
  var STORE_KEY = 'bpa-engine';
  var MAX_INPUT = 1500;
  var CIRC = 2 * Math.PI * 40;
  var $ = function (id) { return document.getElementById(id); };
  var messagesEl = $('messages'), input = $('chatInput'), sendBtn = $('sendBtn');

  var A = null;                 // archive helpers once loaded
  var conversation = [];        // [{role, content}] sent to /api/chat
  var lastMatches = [];         // [{entry, score, why, details}] — kept while the guide asks follow-ups
  var busy = false;

  /* ── small DOM helpers ── */
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function setStatus(state, label) { $('status').className = 'status' + (state ? ' ' + state : ''); $('statusLabel').textContent = label; }
  function save() {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify({ conversation: conversation, matches: lastMatches.map(function (m) { return { id: m.entry.id, score: m.score, why: m.why }; }) })); } catch (e) { /* storage off: session still works */ }
  }

  /* Links in replies: full URLs become clickable only if the archive already lists them;
     bare site names (like thewildstarfires.com) only if they are the home page of a site the archive links to. */
  function appendText(node, text) {
    var re = /https?:\/\/[^\s<>"')]+|\b(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|fr|net|org)\b/gi, last = 0, m;
    while ((m = re.exec(text))) {
      var token = m[0].replace(/[.,;:!?]+$/, '');
      var href = null;
      if (/^https?:\/\//i.test(token)) { if (A && A.knownLink(token)) href = token; }
      else if (A) href = A.siteFor(token);
      node.appendChild(document.createTextNode(text.slice(last, m.index)));
      if (href) {
        var a = el('a', null, token); a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer';
        node.appendChild(a);
      } else {
        node.appendChild(document.createTextNode(token));
      }
      last = m.index + token.length;
      re.lastIndex = last;
    }
    node.appendChild(document.createTextNode(text.slice(last)));
  }

  function lightboxItems(entries) {
    return entries.map(function (e) { return A.slides(e)[0]; });
  }

  function addMsg(role, text, extra, matched) {
    var d = el('div', 'msg ' + role + (extra ? ' ' + extra : ''));
    if (extra === 'thinking') { d.appendChild(el('span', 'spin')); d.appendChild(document.createTextNode(' Looking through the archive…')); }
    else if (role === 'assistant') appendText(d, text);
    else d.textContent = text;
    var list = (matched || []).map(function (m) { return m.entry; }).slice(0, 5);
    if (list.length) {
      var g = el('div', 'msg-thumbs');
      list.forEach(function (entry, k) {
        var b = el('button', 'msg-thumb'); b.type = 'button';
        b.setAttribute('aria-label', 'View full screen: ' + entry.title);
        var im = el('img'); im.src = A.imgSrc(entry.image); im.alt = ''; im.loading = 'lazy'; im.decoding = 'async'; im.width = 400; im.height = 300;
        b.appendChild(im); b.appendChild(el('span', null, entry.title));
        b.addEventListener('click', function () { showTop(matched[k]); Lightbox.open(lightboxItems(list), k); });
        g.appendChild(b);
      });
      d.appendChild(g);
    }
    messagesEl.appendChild(d);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return d;
  }

  function greet() {
    addMsg('assistant', "Hi — I'm the guide to Billi Pepa's archive. Ask me about a song like Hey Joe or Only Nina Knows, a band like The Front End, a year, a club like CBGB, or the legend of Jimmibeetles. I'll answer from the archive and pull up the photos.");
  }

  /* ── MATCH lines: strip every one from the visible text, parse what we can ── */
  function extractMatches(text) {
    var found = [];
    var clean = text.replace(/^[ \t]*MATCH:.*$/gim, function (line) {
      var json = line.replace(/^[ \t]*MATCH:[ \t]*/i, '');
      try {
        var o = JSON.parse(json);
        var entry = o && typeof o.id === 'string' ? A.byId(o.id.trim()) : null;
        if (entry && !found.some(function (f) { return f.entry.id === entry.id; })) {
          var score = Math.max(0, Math.min(100, Math.round(Number(o.score) || 0)));
          found.push({ entry: entry, score: score, why: typeof o.why === 'string' ? o.why.slice(0, 240) : '' });
        }
      } catch (e) { /* malformed line: removed from view, ignored */ }
      return '';
    }).replace(/\n{3,}/g, '\n\n').trim();
    found.sort(function (a, b) { return b.score - a.score; });
    return { clean: clean, matches: found };
  }

  /* ── cards: images, kinds, titles and details all come from gub.json ── */
  function setDonut(score, label) {
    $('arc').setAttribute('stroke-dashoffset', String(CIRC * (1 - score / 100)));
    $('arc').style.opacity = score > 0 ? '1' : '0';
    $('pct').textContent = score > 0 ? score + '%' : '—';
    $('pctLabel').textContent = label;
    $('donut').setAttribute('aria-label', score > 0 ? 'Top match score ' + score + ' out of 100' : 'No score yet');
  }

  function renderTerms(entry) {
    var dl = $('terms'); dl.textContent = '';
    var pairs = [['Room', A.collections[entry.collection] ? A.collections[entry.collection].label : '—'], ['Type', entry.kind]];
    Object.keys(entry.details || {}).slice(0, 5).forEach(function (k) { pairs.push([k, entry.details[k]]); });
    pairs.forEach(function (p) {
      var row = el('div', 'term'); row.appendChild(el('dt', null, p[0])); row.appendChild(el('dd', null, p[1])); dl.appendChild(row);
    });
  }

  function renderNext(entry, featured) {
    var box = $('nextBody'); box.textContent = '';
    if (featured) {
      box.appendChild(el('p', null, 'Ask about it in the chat, or name any song, band or year.'));
      return;
    }
    var first = (entry.links || [])[0];
    if (first) {
      var a = el('a', 'next-link', first.label); a.href = first.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
      box.appendChild(a);
    }
    var g = el('a', 'next-link', 'Read it in the guide'); g.href = 'guide.html#' + entry.id;
    box.appendChild(g);
    var rel = (entry.related || []).map(A.byId).filter(Boolean)[0];
    if (rel) {
      var b = el('button', 'next-ask', 'Ask about ' + rel.title); b.type = 'button';
      b.addEventListener('click', function () { send('Tell me about ' + rel.title); });
      box.appendChild(b);
    }
  }

  function showTop(m, featured) {
    var e = m.entry;
    var img = $('topImg'); img.src = A.imgSrc(e.image); img.alt = A.caption(e.image, e.title);
    $('topKind').textContent = featured ? 'Featured' : e.kind + ' · ' + (A.collections[e.collection] || {}).label;
    $('topTitle').textContent = e.title;
    $('topWhy').textContent = m.why || e.summary;
    $('topShot').onclick = function () {
      Lightbox.open(A.slides(e), 0);
    };
    renderTerms(e);
    renderNext(e, featured);
  }

  function renderShortlist(list, featured) {
    var ul = $('shortList'); ul.textContent = '';
    list.forEach(function (m, k) {
      var li = el('li');
      var b = el('button', 'short-item'); b.type = 'button';
      b.setAttribute('aria-pressed', String(k === 0));
      var im = el('img'); im.src = A.imgSrc(m.entry.image); im.alt = ''; im.loading = 'lazy'; im.width = 120; im.height = 90;
      var t = el('span', 'short-title', m.entry.title);
      var s = el('span', 'short-score', featured ? m.entry.kind : m.score + '%');
      b.appendChild(im); b.appendChild(t); b.appendChild(s);
      b.addEventListener('click', function () {
        ul.querySelectorAll('.short-item').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        showTop(m, featured);
      });
      li.appendChild(b); ul.appendChild(li);
    });
    if (featured) {
      $('shortCount').textContent = 'Start here';
      setDonut(0, 'ask to score');
      $('shortText').textContent = 'Every answer is scored for how well it fits your question. Pick one of these to begin.';
    } else {
      $('shortCount').textContent = list.length + (list.length === 1 ? ' match' : ' matches');
      setDonut(list[0].score, 'top score');
      $('shortText').textContent = 'Sorted by how well each one answers you. Tap one to see it.';
    }
  }

  function applyMatches(list) {
    if (!list.length) return;          // keep the last matches while the guide asks a follow-up
    lastMatches = list;
    showTop(list[0]); renderShortlist(list);
  }

  function renderFeatured() {
    var ids = ['best-of-live', 'hey-joe', 'the-front-end', 'jimmibeetles-legend'];
    var list = ids.map(A.byId).filter(Boolean).map(function (e) { return { entry: e, score: 0, why: '' }; });
    showTop(list[0], true); renderShortlist(list, true);
  }

  /* ── talking to /api/chat ── */
  async function send(text) {
    text = String(text || '').trim().slice(0, MAX_INPUT);
    if (!text || busy || !A) return;
    busy = true; sendBtn.disabled = true;
    input.value = ''; autosize();
    addMsg('user', text);
    conversation.push({ role: 'user', content: text }); save();
    var thinking = addMsg('assistant', '', 'thinking');
    setStatus('busy', 'Thinking');
    try {
      var resp = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: conversation.slice(-20) }) });
      var data = null;
      try { data = await resp.json(); } catch (e) { data = null; }
      thinking.remove();
      if (!resp.ok || !data || typeof data.text !== 'string') {
        conversation.pop(); save();
        var msg = data && typeof data.error === 'string' ? data.error : 'The guide isn\'t reachable yet. Once the site is live on Vercel with its key set, it will answer here.';
        addMsg('assistant', msg, 'error'); setStatus('error', 'Not answering');
      } else {
        var parsed = extractMatches(data.text);
        conversation.push({ role: 'assistant', content: data.text });
        addMsg('assistant', parsed.clean || 'Here is what the archive has.', null, parsed.matches);
        applyMatches(parsed.matches);
        setStatus('live', 'Live');
        save();
      }
    } catch (err) {
      thinking.remove(); conversation.pop(); save();
      addMsg('assistant', location.protocol === 'file:' ? 'The chat needs the site running on a server. Everything else on this page works from here.' : 'Can\'t reach the guide right now. Check your connection and try again.', 'error');
      setStatus('error', 'Offline');
    }
    busy = false; sendBtn.disabled = false; input.focus({ preventScroll: true });
  }

  function autosize() {
    input.style.height = 'auto';
    var need = input.scrollHeight + (input.offsetHeight - input.clientHeight);
    input.style.height = Math.min(Math.max(need, 44), 140) + 'px';
    input.style.overflowY = need > 140 ? 'auto' : 'hidden';
  }

  sendBtn.addEventListener('click', function () { send(input.value); });
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input.value); } });
  input.addEventListener('input', autosize);

  $('resetBtn').addEventListener('click', function () {
    conversation = []; lastMatches = [];
    try { sessionStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ }
    messagesEl.textContent = ''; greet(); renderFeatured(); setStatus('', 'Ready');
    input.focus({ preventScroll: true });
  });
  $('expandBtn').addEventListener('click', function () {
    var chat = $('chat'), on = !chat.classList.contains('expanded');
    chat.classList.toggle('expanded', on); document.body.classList.toggle('chat-open', on);
    this.setAttribute('aria-pressed', String(on));
    this.setAttribute('aria-label', on ? 'Close full screen chat' : 'Expand chat');
    messagesEl.scrollTop = messagesEl.scrollHeight;
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && $('chat').classList.contains('expanded') && !document.documentElement.classList.contains('lb-open')) $('expandBtn').click(); });

  /* ── start ── */
  sendBtn.disabled = true;
  Archive.load().then(function (archive) {
    A = archive;
    var saved = null;
    try { saved = JSON.parse(sessionStorage.getItem(STORE_KEY) || 'null'); } catch (e) { saved = null; }
    greet();
    if (saved && Array.isArray(saved.conversation) && saved.conversation.length) {
      conversation = saved.conversation.filter(function (m) { return m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'; });
      conversation.forEach(function (m) {
        if (m.role === 'user') addMsg('user', m.content);
        else { var p = extractMatches(m.content); addMsg('assistant', p.clean, null, p.matches); }
      });
      var restored = (saved.matches || []).map(function (m) { var e = A.byId(m.id); return e ? { entry: e, score: m.score | 0, why: String(m.why || '') } : null; }).filter(Boolean);
      if (restored.length) applyMatches(restored); else renderFeatured();
    } else {
      renderFeatured();
    }
    sendBtn.disabled = false;
    try {
      var q = new URLSearchParams(location.search).get('q');
      if (q) { input.value = q.slice(0, 300); autosize(); }
    } catch (e) { /* ignore */ }
  }).catch(function () {
    Archive.fileNotice(document.querySelector('main'));
    setStatus('error', 'Archive not loaded');
  });
})();
