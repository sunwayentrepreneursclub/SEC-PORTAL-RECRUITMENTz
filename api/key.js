import { send, readBody, requireAdmin, kvSet, kvGet, K_KEY, guardEnv } from './_lib.js';

/* The key is written to server-side storage and never returned to any browser. */
export default async function handler(req, res) {
  if (!guardEnv(res)) return;
  if (!await requireAdmin(req, res)) return;

  if (req.method === 'GET') {
    return send(res, 200, { keySet: !!(process.env.GEMINI_API_KEY || await kvGet(K_KEY)) });
  }
  if (req.method === 'POST') {
    const { key } = await readBody(req);
    if (!key || String(key).trim().length < 20) return send(res, 400, { error: "That doesn't look like an API key." });
    await kvSet(K_KEY, String(key).trim());
    return send(res, 200, { keySet: true });
  }
  if (req.method === 'DELETE') {
    await kvSet(K_KEY, '');
    return send(res, 200, { keySet: !!process.env.GEMINI_API_KEY });
  }
  return send(res, 405, { error: 'Method not allowed' });
}
