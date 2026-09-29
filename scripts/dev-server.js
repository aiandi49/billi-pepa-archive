// Local preview that behaves like Vercel: serves the files, applies the headers
// from vercel.json (including the Content-Security-Policy) and runs api/chat.js.
// No installs needed. Run:  node scripts/dev-server.js   then open http://localhost:3000
// For a working chat locally, put ANTHROPIC_API_KEY=... in a .env.local file (never commit it).

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = parseInt(process.env.PORT || '3000', 10);

// load .env.local into process.env (simple KEY=VALUE lines)
try {
  fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').split(/\r?\n/).forEach(function (line) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  });
} catch (e) { /* no .env.local: chat will answer with the setup message */ }

const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
const HEADERS = (config.headers || [])[0] ? config.headers[0].headers : [];
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };
const chat = require(path.join(ROOT, 'api', 'chat.js'));

function vercelish(res) {
  res.status = function (code) { res.statusCode = code; return res; };
  res.json = function (obj) { res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(obj)); return res; };
  return res;
}

http.createServer(function (req, res) {
  HEADERS.forEach(function (h) { if (h.key !== 'Strict-Transport-Security') res.setHeader(h.key, h.value); });
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/chat') {
    let raw = '';
    req.on('data', function (c) { raw += c; if (raw.length > 64 * 1024) req.destroy(); });
    req.on('end', function () {
      if (/^application\/json/i.test(req.headers['content-type'] || '') && raw) { try { req.body = JSON.parse(raw); } catch (e) { req.body = raw; } } else { req.body = raw; }
      Promise.resolve(chat(req, vercelish(res))).catch(function () { res.statusCode = 500; res.end(); });
    });
    return;
  }
  let file = path.normalize(path.join(ROOT, decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname)));
  if (!file.startsWith(ROOT) || /[\\/](\.|api[\\/]|scripts[\\/])/.test(file.slice(ROOT.length))) { res.statusCode = 404; return res.end('Not found'); }
  fs.readFile(file, function (err, data) {
    if (err) { res.statusCode = 404; return res.end('Not found'); }
    res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  });
}).listen(PORT, function () { console.log('Billi Pepa Archive running at http://localhost:' + PORT); });
