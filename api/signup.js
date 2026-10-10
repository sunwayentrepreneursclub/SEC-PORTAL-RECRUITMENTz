import crypto from 'crypto';
import { send, readBody, guardEnv, kvGet, kvSet, issueSession, hashPassword, memberKey, K_MEMBERS, K_JOIN } from './_lib.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sameCode(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

/* Committee members create their own Learning Portal account with the join code an admin
   shares in the committee chat. Members never get applicant data or admin access. */
export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  if (!guardEnv(res)) return;

  const body = await readBody(req);
  const name = String(body.name || '').trim().slice(0, 80);
  const email = memberKey(body.imail);
  const password = String(body.password || '');
  const code = String(body.code || '').trim();

  const joinCode = ((await kvGet(K_JOIN)) || {}).code;
  if (!joinCode) return send(res, 403, { error: 'Sign-up is not open yet. Ask a committee admin to set a join code.' });
  if (!code || !sameCode(code.toLowerCase(), joinCode.toLowerCase())) {
    await new Promise(r => setTimeout(r, 400));
    return send(res, 403, { error: 'That join code is not right. Check the committee chat.' });
  }
  if (name.length < 2) return send(res, 400, { error: 'Enter your name.' });
  if (!EMAIL.test(email) || email.length > 120) return send(res, 400, { error: 'Enter a valid email address.' });
  if (password.length < 8) return send(res, 400, { error: 'Use a password of at least 8 characters.' });

  const members = (await kvGet(K_MEMBERS)) || {};
  if (members[email]) return send(res, 409, { error: 'That email already has an account. Sign in instead.' });
  members[email] = { name, imail: email, hash: await hashPassword(password), createdAt: new Date().toISOString() };
  await kvSet(K_MEMBERS, members);

  issueSession(res, 'm:' + email);
  return send(res, 200, { user: name, role: 'member' });
}
