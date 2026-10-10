import { readBody, send, issueSession, clearSession, identify, checkAnyLogin, guardEnv } from './_lib.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const who = await identify(req);
    return send(res, 200, { user: who?.name || null, role: who?.role || null });
  }
  if (req.method === 'DELETE') {
    clearSession(res);
    return send(res, 200, { ok: true });
  }
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  if (!guardEnv(res)) return;

  const { username, password } = await readBody(req);
  const found = await checkAnyLogin(String(username || ''), String(password || ''));
  if (!found) {
    await new Promise(r => setTimeout(r, 400)); // slow down guessing
    return send(res, 401, { error: 'Wrong username or password.' });
  }
  issueSession(res, found.id);
  return send(res, 200, { user: found.name, role: found.role });
}
