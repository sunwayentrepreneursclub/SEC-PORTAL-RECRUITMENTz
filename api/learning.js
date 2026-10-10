import { send, readBody, requireAdmin, identify, guardEnv, kvGet, kvSet, K_LEARN, K_PROGRESS, K_MEMBERS, K_JOIN } from './_lib.js';
import { seedLearning, cleanLearning, publicLearning, memberLevels, findModule, grade } from './_learning.js';

async function loadLearning() {
  let c = await kvGet(K_LEARN);
  if (!c) { c = seedLearning(); await kvSet(K_LEARN, c); }
  return c;
}

export default async function handler(req, res) {
  if (!guardEnv(res)) return;
  const who = await identify(req);
  const user = who?.id || null, role = who?.role || null;

  if (req.method === 'GET') {
    const c = await loadLearning();
    const pub = publicLearning(c);
    if (!user) return send(res, 200, { public: pub });
    const progress = (await kvGet(K_PROGRESS)) || {};
    const wantsAdmin = new URL(req.url, 'http://x').searchParams.get('admin') === '1';
    if (role === 'admin' && wantsAdmin) {
      const members = (await kvGet(K_MEMBERS)) || {};
      return send(res, 200, {
        public: pub, user: who.name, role, content: c, progressAll: progress,
        joinCode: ((await kvGet(K_JOIN)) || {}).code || '',
        members: Object.entries(members).map(([key, m]) => ({ id: 'm:' + key, name: m.name, imail: m.imail, createdAt: m.createdAt })),
      });
    }
    return send(res, 200, { public: pub, user: who.name, role, levels: memberLevels(c), progress: progress[user] || {} });
  }

  if (req.method === 'PUT') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const body = await readBody(req);
    if (typeof body.joinCode === 'string') {
      const code = body.joinCode.trim().slice(0, 60);
      if (code && code.length < 6) return send(res, 400, { error: 'Use a join code of at least 6 characters, or leave it empty to close sign-up.' });
      await kvSet(K_JOIN, { code, updatedAt: new Date().toISOString(), updatedBy: admin });
    }
    const next = { ...cleanLearning(body), updatedAt: new Date().toISOString(), updatedBy: admin };
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

  if (req.method === 'DELETE') { // admin removes a member: their login stops working at once
    if (!await requireAdmin(req, res)) return;
    const id = new URL(req.url, 'http://x').searchParams.get('member') || '';
    const key = id.startsWith('m:') ? id.slice(2) : '';
    const members = (await kvGet(K_MEMBERS)) || {};
    if (!key || !members[key]) return send(res, 404, { error: 'No such member.' });
    delete members[key];
    await kvSet(K_MEMBERS, members);
    const progress = (await kvGet(K_PROGRESS)) || {};
    delete progress[id];
    await kvSet(K_PROGRESS, progress);
    return send(res, 200, { ok: true });
  }

  return send(res, 405, { error: 'Method not allowed' });
}
