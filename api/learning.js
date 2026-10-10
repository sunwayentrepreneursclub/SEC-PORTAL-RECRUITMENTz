import { send, readBody, requireAdmin, currentUser, roleOf, guardEnv, kvGet, kvSet, K_LEARN, K_PROGRESS } from './_lib.js';
import { seedLearning, cleanLearning, publicLearning, memberLevels, findModule, grade } from './_learning.js';

async function loadLearning() {
  let c = await kvGet(K_LEARN);
  if (!c) { c = seedLearning(); await kvSet(K_LEARN, c); }
  return c;
}

export default async function handler(req, res) {
  if (!guardEnv(res)) return;
  const user = currentUser(req);
  const role = roleOf(user);

  if (req.method === 'GET') {
    const c = await loadLearning();
    const pub = publicLearning(c);
    if (!user) return send(res, 200, { public: pub });
    const progress = (await kvGet(K_PROGRESS)) || {};
    const wantsAdmin = new URL(req.url, 'http://x').searchParams.get('admin') === '1';
    if (role === 'admin' && wantsAdmin) {
      return send(res, 200, { public: pub, user, role, content: c, progressAll: progress });
    }
    return send(res, 200, { public: pub, user, role, levels: memberLevels(c), progress: progress[user] || {} });
  }

  if (req.method === 'PUT') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const next = { ...cleanLearning(await readBody(req)), updatedAt: new Date().toISOString(), updatedBy: admin };
    await kvSet(K_LEARN, next);
    return send(res, 200, { ok: true, updatedAt: next.updatedAt });
  }

  if (req.method === 'POST') {
    if (!user) return send(res, 401, { error: 'Not signed in.' });
    const { moduleId, answers } = await readBody(req);
    const m = findModule(await loadLearning(), String(moduleId || ''));
    if (!m || m.status !== 'published') return send(res, 404, { error: 'That module is not available.' });
    const picked = Array.isArray(answers) ? answers.map(a => (Number.isInteger(a) ? a : -1)) : [];
    if (picked.length !== (m.questions || []).length) return send(res, 400, { error: 'Answer every question first.' });
    const result = grade(m, picked);
    const all = (await kvGet(K_PROGRESS)) || {};
    const mine = all[user] || {};
    const prev = mine[m.id] || { attempts: 0, best: 0, passed: false };
    mine[m.id] = {
      attempts: prev.attempts + 1,
      best: Math.max(prev.best, result.score),
      passed: prev.passed || result.passed,
      at: new Date().toISOString(),
    };
    all[user] = mine;
    await kvSet(K_PROGRESS, all);
    return send(res, 200, { ...result, progress: mine[m.id] });
  }

  return send(res, 405, { error: 'Method not allowed' });
}
