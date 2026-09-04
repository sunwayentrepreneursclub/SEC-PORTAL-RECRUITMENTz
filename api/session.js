import { readBody, send, issueSession, clearSession, currentUser, checkLogin, guardEnv } from './_lib.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return send(res, 200, { user: currentUser(req) });
  }
  if (req.method === 'DELETE') {
    clearSession(res);
    return send(res, 200, { ok: true });
  }
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  if (!guardEnv(res)) return;

  const { username, password } = await readBody(req);
  const user = checkLogin(String(username || ''), String(password || ''));
  if (!user) {
    await new Promise(r => setTimeout(r, 400)); // slow down guessing
    return send(res, 401, { error: 'Wrong username or password.' });
  }
  issueSession(res, user);
  return send(res, 200, { user });
}
