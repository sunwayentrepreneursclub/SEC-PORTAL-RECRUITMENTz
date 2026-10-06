// Local preview: serves the static site and answers GET /api/state with the
// repo's own seed data (no database needed). Other /api routes return 503.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { seedState, publicState } from './api/_lib.js';

const PORT = process.env.PORT || 3000;
const TYPES = { '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');
    if (url.pathname === '/api/state' && req.method === 'GET') return res.end(JSON.stringify(publicState(seedState())));
    res.statusCode = 503;
    return res.end(JSON.stringify({ error: 'Not available in local preview' }));
  }
  const rel = url.pathname === '/' ? 'index.html' : normalize(url.pathname).replace(/^(\.\.[/\\])+/, '');
  try {
    const body = await readFile(join(process.cwd(), rel));
    res.setHeader('Content-Type', TYPES[extname(rel)] || 'application/octet-stream');
    res.end(body);
  } catch { res.statusCode = 404; res.end('Not found'); }
}).listen(PORT, () => console.log(`Preview on http://localhost:${PORT}`));
