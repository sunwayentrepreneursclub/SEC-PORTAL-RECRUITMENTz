import test from 'node:test';
import assert from 'node:assert/strict';

process.env.KV_REST_API_URL = 'https://fake-redis.invalid';
process.env.KV_REST_API_TOKEN = 'test-token';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.ADMIN_USERS = 'reviewer:test-password';

const data = new Map();
const history = new Map();
globalThis.fetch = async (_url, opts) => {
  const [command, ...rest] = JSON.parse(opts.body);
  let result = null;
  if (command === 'GET') result = data.get(rest[0]) ?? null;
  else if (command === 'SET') { if (rest[2] !== 'NX' || !data.has(rest[0])) data.set(rest[0], rest[1]); result = 'OK'; }
  else if (command === 'EVAL') { // compare-and-swap, as in api/_lib.js
    const [, , key, historyKey, expected, previous, next] = rest;
    await new Promise(r => setTimeout(r, Math.random() * 3)); // let requests interleave like a real network
    if ((data.get(key) ?? '') !== expected) result = 0;
    else {
      if (data.has(key)) history.set(historyKey, [previous, ...(history.get(historyKey) || [])].slice(0, 50));
      data.set(key, next); result = 1;
    }
  } else if (command === 'LRANGE') result = (history.get(rest[0]) || []).slice(rest[1], rest[2] + 1);
  else throw Error(`Unexpected Redis command: ${command}`);
  if (command === 'GET') await new Promise(r => setTimeout(r, Math.random() * 3));
  return { ok: true, json: async () => ({ result }) };
};

const { issueSession } = await import('../api/_lib.js');
const { default: learning } = await import('../api/learning.js');
const { default: signup } = await import('../api/signup.js');
const { default: sessionApi } = await import('../api/session.js');
const { default: applications } = await import('../api/applications.js');
const { default: stateApi } = await import('../api/state.js');

const adminSession = { headers: {}, setHeader(k, v) { this.headers[k] = v; } };
issueSession(adminSession, 'reviewer');
const adminCookie = adminSession.headers['Set-Cookie'].split(';')[0];

async function call(handler, method, url, body, cookie = '') {
  const req = { method, url, body: body ?? {}, headers: { cookie } };
  const res = { statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(raw) { this.raw = raw; } };
  await handler(req, res);
  return { status: res.statusCode, data: JSON.parse(res.raw), cookie: (res.headers['Set-Cookie'] || '').split(';')[0] };
}
const join = { name: 'Aisha Rahman', imail: 'Aisha@imail.sunway.edu.my', password: 'long-enough-pw', code: 'SEC-2026' };
const publicBits = { enabled: true, steps: [] };
const put = (courses, extra = {}) => call(learning, 'PUT', '/api/learning', { public: publicBits, courses, ...extra }, adminCookie);
const COURSE = { id: 'standards', title: 'The standards', status: 'published', passMark: 50,
  cards: [{ front: ' Who owns standards? ', back: 'Leadership' }, { front: 'No back', back: '' }],
  questions: [{ q: 'One?', options: ['x', 'y'], answer: 1, why: 'Because y', source: 'quote from the file' }, { q: 'Two?', options: ['x', 'y'], answer: 0 }] };
const DRAFT = { id: 'secret', title: 'Draft course', status: 'draft', cards: [{ front: 'secret', back: 'draft card' }], questions: [{ q: 'Hidden?', options: ['a', 'b'], answer: 0 }] };

test('a new site starts with no courses at all', async () => {
  const first = (await call(learning, 'GET', '/api/learning?admin=1', null, adminCookie)).data.content;
  assert.deepEqual(first.courses, []);
  assert.equal(first.levels, undefined, 'no levels or sub-modules exist any more');
});

test('sign-up is closed until an admin sets a join code (min 6 characters)', async () => {
  assert.equal((await call(signup, 'POST', '/api/signup', join)).status, 403);
  assert.equal((await call(learning, 'PUT', '/api/learning', { joinCode: 'SEC-2026', courses: [] })).status, 401);
  assert.equal((await put([], { joinCode: 'abc' })).status, 400);
  assert.equal((await put([], { joinCode: 'SEC-2026' })).status, 200);
});

test('join code, password and email are checked; the right code creates an account', async () => {
  assert.equal((await call(signup, 'POST', '/api/signup', { ...join, code: 'nope' })).status, 403);
  assert.equal((await call(signup, 'POST', '/api/signup', { ...join, password: 'short' })).status, 400);
  assert.equal((await call(signup, 'POST', '/api/signup', { ...join, imail: 'not-an-email' })).status, 400);
  const ok = await call(signup, 'POST', '/api/signup', { ...join, code: 'sec-2026' });
  assert.deepEqual([ok.status, ok.data.role], [200, 'member']);
  assert.equal((await call(signup, 'POST', '/api/signup', join)).status, 409);
  assert.ok(!data.get('sec:learning_members').includes('long-enough-pw'), 'passwords are stored hashed');
});

test('members see only published courses, no answers, and no admin data', async () => {
  await put([COURSE, DRAFT], { joinCode: 'SEC-2026' });
  const cookie = (await call(sessionApi, 'POST', '/api/session', { username: 'AISHA@imail.sunway.edu.my', password: join.password })).cookie;
  const view = (await call(learning, 'GET', '/api/learning', null, cookie)).data;
  assert.deepEqual(view.courses.map(c => c.id), ['standards'], 'drafts are hidden from members');
  assert.deepEqual(view.courses[0].cards, [{ front: 'Who owns standards?', back: 'Leadership' }], 'cards are trimmed and half-empty ones dropped');
  assert.equal(JSON.stringify(view).includes('"answer"'), false, 'correct answers never reach members');
  assert.equal(JSON.stringify(view).includes('draft card'), false);
  assert.equal(JSON.stringify(view).includes('quote from the file'), false, 'source quotes are admin only');
  assert.equal(view.content, undefined); assert.equal(view.joinCode, undefined);
  assert.equal((await call(learning, 'GET', '/api/learning?admin=1', null, cookie)).data.content, undefined);
  const denied = r => assert.ok([401, 403].includes(r.status));
  denied(await call(applications, 'GET', '/api/applications', null, cookie));
  denied(await call(learning, 'PUT', '/api/learning', { courses: [] }, cookie));
  assert.equal((await call(stateApi, 'GET', '/api/state', null, cookie)).data.admin, undefined);
});

test('instant feedback and final grading happen on the server', async () => {
  const cookie = (await call(sessionApi, 'POST', '/api/session', { username: join.imail, password: join.password })).cookie;
  const before = (await call(learning, 'GET', '/api/learning', null, cookie)).data;
  const ok = await call(learning, 'POST', '/api/learning', { courseId: 'standards', check: { i: 0, choice: 1 } }, cookie);
  assert.deepEqual([ok.data.correct, ok.data.answer, ok.data.why], [true, 1, 'Because y']);
  assert.equal((await call(learning, 'POST', '/api/learning', { courseId: 'standards', check: { i: 0, choice: 0 } }, cookie)).data.correct, false);
  assert.equal((await call(learning, 'POST', '/api/learning', { courseId: 'secret', check: { i: 0, choice: 0 } }, cookie)).status, 404, 'draft courses cannot be probed');
  assert.equal((await call(learning, 'POST', '/api/learning', { courseId: 'standards', check: { i: 0, choice: 1 } })).status, 401);
  assert.equal((await call(learning, 'GET', '/api/learning', null, cookie)).data.progress.standards, before.progress.standards, 'checking never changes progress');

  assert.equal((await call(learning, 'POST', '/api/learning', { courseId: 'standards', answers: [1] }, cookie)).status, 400);
  const fail = await call(learning, 'POST', '/api/learning', { courseId: 'standards', answers: [0, 1] }, cookie);
  assert.deepEqual([fail.data.score, fail.data.passed], [0, false]);
  const pass = await call(learning, 'POST', '/api/learning', { courseId: 'standards', answers: [1, 0] }, cookie);
  assert.equal(pass.data.passed, true);
  assert.equal(pass.data.progress.attempts, 2);
  assert.deepEqual([fail.data.progress.last, pass.data.progress.last, pass.data.progress.best], [0, 100, 100], 'the latest score is remembered, not only the best');
});

test('records survive signing out and back in', async () => {
  const first = await call(sessionApi, 'POST', '/api/session', { username: join.imail, password: join.password });
  await sessionApi({ method: 'DELETE', url: '/api/session', body: {}, headers: { cookie: first.cookie } }, { setHeader() {}, end() {} });
  const back = (await call(sessionApi, 'POST', '/api/session', { username: 'aisha@imail.sunway.edu.my', password: join.password })).cookie;
  const view = (await call(learning, 'GET', '/api/learning', null, back)).data;
  assert.equal(view.progress.standards.passed, true);
  assert.equal(view.progress.standards.attempts, 2);
});

test('many members writing at the same moment never lose each other\'s records', async () => {
  const N = 15;
  const people = await Promise.all(Array.from({ length: N }, (_, i) =>
    call(signup, 'POST', '/api/signup', { ...join, name: `Person ${i}`, imail: `p${i}@x.com` })));
  assert.ok(people.every(r => r.status === 200));
  await Promise.all(people.map(r => call(learning, 'POST', '/api/learning', { courseId: 'standards', answers: [1, 0] }, r.cookie)));
  const admin = (await call(learning, 'GET', '/api/learning?admin=1', null, adminCookie)).data;
  const mine = admin.members.filter(m => /^p\d+@x\.com$/.test(m.imail));
  assert.equal(mine.length, N);
  assert.equal(mine.filter(m => admin.progressAll[m.id]?.standards?.passed).length, N);
  assert.ok((history.get('sec:learning_progress:history') || []).length > 0, 'previous versions are kept for recovery');
});

test('members can be removed with their progress, and are signed out at once', async () => {
  const gone = await call(signup, 'POST', '/api/signup', { ...join, imail: 'gone@x.com' });
  await call(learning, 'POST', '/api/learning', { courseId: 'standards', answers: [1, 0] }, gone.cookie);
  const id = 'm:gone@x.com';
  assert.ok((await call(learning, 'GET', '/api/learning?admin=1', null, adminCookie)).data.progressAll[id]);
  assert.equal((await call(learning, 'DELETE', '/api/learning?member=' + encodeURIComponent(id), null, adminCookie)).status, 200);
  const after = (await call(learning, 'GET', '/api/learning?admin=1', null, adminCookie)).data;
  assert.equal(after.progressAll[id], undefined);
  assert.equal(after.members.some(m => m.id === id), false);
  assert.equal((await call(sessionApi, 'GET', '/api/session', null, gone.cookie)).data.user, null);
  assert.equal((await call(learning, 'DELETE', '/api/learning?member=' + encodeURIComponent(id), null, adminCookie)).status, 404);
});

test('old levels-and-modules content becomes flat courses without losing real content', async () => {
  const memberId = 'm:' + join.imail.toLowerCase();
  data.set('sec:learning', JSON.stringify({ version: 6, updatedBy: 'reviewer', public: { enabled: true, headline: 'My headline', steps: [] }, levels: [
    { id: 'l1', title: 'Level 1', modules: [
      { id: 'empty-shell', title: 'Placeholder', status: 'draft', cards: [], questions: [] },
      { id: 'made-from-file', title: 'Made from a file', status: 'published', passMark: 60, sourceName: 'rules.pdf', aiGenerated: true,
        cards: [{ front: 'a', back: 'b' }], questions: [{ q: 'q?', options: ['a', 'b'], answer: 1 }] }] },
    { id: 'l2', title: 'Level 2', modules: [
      { id: 'second', title: 'Second', status: 'draft', cards: [{ front: 'c', back: 'd' }], questions: [] }] }] }));
  data.set('sec:learning_progress', JSON.stringify({ [memberId]: { 'made-from-file': { passed: true, best: 90, attempts: 1 }, 'empty-shell': { passed: true, best: 100, attempts: 1 } } }));

  const c = (await call(learning, 'GET', '/api/learning?admin=1', null, adminCookie)).data;
  assert.equal(c.content.version, 7);
  assert.equal(c.content.levels, undefined);
  assert.deepEqual(c.content.courses.map(x => x.id), ['made-from-file', 'second'], 'empty placeholders dropped, real content kept');
  assert.equal(c.content.courses[0].sourceName, 'rules.pdf');
  assert.equal(c.content.public.headline, 'My headline');
  assert.deepEqual(Object.keys(c.progressAll[memberId]), ['made-from-file'], 'results for removed placeholders are cleared, the rest kept');
  assert.ok(c.members.some(m => m.id === memberId), 'accounts are kept');
  // a second load changes nothing
  assert.deepEqual((await call(learning, 'GET', '/api/learning?admin=1', null, adminCookie)).data.content.courses.map(x => x.id), ['made-from-file', 'second']);
});

test('clearing the join code closes sign-up again', async () => {
  await put([], { joinCode: '' });
  assert.equal((await call(signup, 'POST', '/api/signup', { ...join, imail: 'new@x.com' })).status, 403);
});
