// Local preview: serves the static site and runs the real /api handlers against an
// in-memory store, so roles, sign-in and the Learning Portal all work with no database.
// Data resets whenever this restarts. Local test logins only:
//   admin / admin   (full access)      member / member   (Learning Portal only)
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { pathToFileURL } from 'node:url';

process.env.KV_REST_API_URL = 'http://kv.local';
process.env.KV_REST_API_TOKEN = 'dev';
process.env.SESSION_SECRET = 'local-dev-secret';
process.env.ADMIN_USERS = 'admin:admin';
process.env.COMMITTEE_USERS = 'member:member';

const store = new Map();
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, opts) => {
  if (String(url).startsWith('http://kv.local')) {
    const args = JSON.parse(opts.body), [op, key, value] = args;
    let result = null;
    if (op === 'GET') result = store.has(key) ? store.get(key) : null;
    else if (op === 'SET') { store.set(key, value); result = 'OK'; }
    else if (op === 'DEL') { result = store.delete(key) ? 1 : 0; }
    else if (op === 'EVAL') { // compare-and-swap write used by api/_lib.js (kvReplaceSafely)
      const [, , , k1, k2, expected, prev, next] = args;
      const old = store.has(k1) ? store.get(k1) : null;
      if ((old ?? '') !== expected) result = 0;
      else {
        if (old !== null) { const list = JSON.parse(store.get(k2) || '[]'); list.unshift(prev); store.set(k2, JSON.stringify(list.slice(0, 50))); }
        store.set(k1, next); result = 1;
      }
    }
    else if (op === 'LRANGE') { result = JSON.parse(store.get(key) || '[]').slice(Number(args[2]), Number(args[3]) + 1); }
    return new Response(JSON.stringify({ result }), { status: 200 });
  }
  return realFetch(url, opts);
};

const PORT = process.env.PORT || 3000;
const TYPES = { '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const handlers = {};

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname.startsWith('/api/')) {
    const name = url.pathname.slice(5).replace(/[^a-z]/g, '');
    try {
      handlers[name] ??= (await import(pathToFileURL(join(process.cwd(), 'api', `${name}.js`)).href)).default;
      return await handlers[name](req, res);
    } catch (e) {
      res.statusCode = e.code === 'ERR_MODULE_NOT_FOUND' ? 404 : 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: e.code === 'ERR_MODULE_NOT_FOUND' ? 'No such route' : e.message }));
    }
  }
  const rel = url.pathname === '/' ? 'index.html' : normalize(url.pathname).replace(/^(\.\.[/\\])+/, '');
  try {
    const body = await readFile(join(process.cwd(), rel));
    res.setHeader('Content-Type', TYPES[extname(rel)] || 'application/octet-stream');
    res.end(body);
  } catch { res.statusCode = 404; res.end('Not found'); }
}).listen(PORT, () => console.log(`Preview on http://localhost:${PORT}  (admin/admin, member/member)`));
