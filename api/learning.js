import { send, readBody, requireAdmin, identify, guardEnv, kvGet, kvSet, kvUpdate, K_LEARN, K_PROGRESS, K_MEMBERS, K_JOIN, resolveAiKey } from './_lib.js';
import { seedLearning, migrateToCourses, cleanLearning, publicLearning, memberCourses, findCourse, grade } from './_learning.js';

const VERSION = 7;

async function loadLearning() {
  let c = await kvGet(K_LEARN);
  if (!c) {
    const seed = { ...seedLearning(), version: VERSION };
    c = await kvUpdate(K_LEARN, cur => cur || seed, 'system');
  } else if (c.version !== VERSION) {
    // one-time move from levels and modules to a flat list of courses (see migrateToCourses)
    let migrated = false;
    c = await kvUpdate(K_LEARN, cur => {
      if (cur.version === VERSION) return cur;
      migrated = true;
      return { ...migrateToCourses(cur), version: VERSION };
    }, 'system');
    if (migrated) { // quiz results for courses that no longer exist would only be clutter
      const keep = new Set((c.courses || []).map(x => x.id));
      await kvUpdate(K_PROGRESS, all => Object.fromEntries(Object.entries(all || {}).map(([u, p]) =>
        [u, Object.fromEntries(Object.entries(p).filter(([id]) => keep.has(id)))])), 'system');
    }
  }
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
        ...(await (async () => { const a = await resolveAiKey(); return { keySet: !!a, keyProvider: a?.provider || null }; })()),
        members: Object.entries(members).map(([key, m]) => ({ id: 'm:' + key, name: m.name, imail: m.imail, createdAt: m.createdAt })),
      });
    }
    return send(res, 200, { public: pub, user: who.name, role, courses: memberCourses(c), progress: progress[user] || {} });
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
    const next = { ...cleanLearning(body), version: VERSION, updatedAt: new Date().toISOString(), updatedBy: admin };
    await kvUpdate(K_LEARN, () => next, admin);
    return send(res, 200, { ok: true, updatedAt: next.updatedAt });
  }

  if (req.method === 'POST') {
    if (!user) return send(res, 401, { error: 'Not signed in.' });
    const { courseId, answers, check } = await readBody(req);
    const m = findCourse(await loadLearning(), String(courseId || ''));
    if (!m || m.status !== 'published') return send(res, 404, { error: 'That course is not available.' });
    if (check) { // instant feedback on one question while studying; completion still needs the final submit
      const q = (m.questions || [])[Number(check.i)];
      if (!q || !Number.isInteger(check.choice)) return send(res, 400, { error: 'Pick an answer.' });
      return send(res, 200, { correct: check.choice === q.answer, answer: q.answer, why: q.why });
    }
    const picked = Array.isArray(answers) ? answers.map(a => (Number.isInteger(a) ? a : -1)) : [];
    if (picked.length !== (m.questions || []).length) return send(res, 400, { error: 'Answer every question first.' });
    const result = grade(m, picked);
    let saved;
    await kvUpdate(K_PROGRESS, all => {
      all = all || {};
      const mine = all[user] || {};
      const prev = mine[m.id] || { attempts: 0, best: 0, passed: false };
      saved = {
        attempts: prev.attempts + 1,
        best: Math.max(prev.best, result.score),
        last: result.score,
        passed: prev.passed || result.passed,
        at: new Date().toISOString(),
      };
      return { ...all, [user]: { ...mine, [m.id]: saved } };
    }, user);
    return send(res, 200, { ...result, progress: saved });
  }

  if (req.method === 'DELETE') { // admin removes a member: their login stops working at once
    if (!await requireAdmin(req, res)) return;
    const id = new URL(req.url, 'http://x').searchParams.get('member') || '';
    const key = id.startsWith('m:') ? id.slice(2) : '';
    const exists = !!key && !!((await kvGet(K_MEMBERS)) || {})[key];
    const hasProgress = !!key && !!((await kvGet(K_PROGRESS)) || {})[id];
    if (!exists && !hasProgress) return send(res, 404, { error: 'No such member.' });
    await kvUpdate(K_MEMBERS, members => { const next = { ...(members || {}) }; delete next[key]; return next; }, 'admin');
    await kvUpdate(K_PROGRESS, all => { const next = { ...(all || {}) }; delete next[id]; return next; }, 'admin');
    return send(res, 200, { ok: true });
  }

  return send(res, 405, { error: 'Method not allowed' });
}
