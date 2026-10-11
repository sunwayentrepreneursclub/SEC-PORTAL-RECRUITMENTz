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

test('sign-up is closed until an admin sets a join code', async () => {
  const r = await call(signup, 'POST', '/api/signup', join);
  assert.equal(r.status, 403);
  assert.match(r.data.error, /not open/i);
});

test('only admins can set the join code, and it must be at least six characters', async () => {
  assert.equal((await call(learning, 'PUT', '/api/learning', { joinCode: 'SEC-2026', levels: [] })).status, 401);
  assert.equal((await call(learning, 'PUT', '/api/learning', { joinCode: 'abc', levels: [] }, adminCookie)).status, 400);
  assert.equal((await call(learning, 'PUT', '/api/learning', { joinCode: 'SEC-2026', levels: [] }, adminCookie)).status, 200);
});

test('wrong code, short password and bad email are refused; the right code creates an account', async () => {
  assert.equal((await call(signup, 'POST', '/api/signup', { ...join, code: 'nope' })).status, 403);
  assert.equal((await call(signup, 'POST', '/api/signup', { ...join, password: 'short' })).status, 400);
  assert.equal((await call(signup, 'POST', '/api/signup', { ...join, imail: 'not-an-email' })).status, 400);
  const ok = await call(signup, 'POST', '/api/signup', { ...join, code: 'sec-2026' });
  assert.equal(ok.status, 200);
  assert.equal(ok.data.role, 'member');
  assert.ok(ok.cookie.startsWith('sec_session='));
  assert.equal((await call(signup, 'POST', '/api/signup', join)).status, 409);
});

test('passwords are stored hashed, never in plain text', () => {
  const stored = data.get('sec:learning_members');
  assert.ok(stored.includes('"hash"'));
  assert.ok(!stored.includes('long-enough-pw'));
});

test('members sign in with their email and see only learning content', async () => {
  const bad = await call(sessionApi, 'POST', '/api/session', { username: join.imail, password: 'wrong-password' });
  assert.equal(bad.status, 401);
  const ok = await call(sessionApi, 'POST', '/api/session', { username: 'AISHA@imail.sunway.edu.my', password: join.password });
  assert.equal(ok.status, 200);
  const cookie = ok.cookie;

  const me = await call(sessionApi, 'GET', '/api/session', null, cookie);
  assert.deepEqual([me.data.user, me.data.role], ['Aisha Rahman', 'member']);

  const l = await call(learning, 'GET', '/api/learning', null, cookie);
  assert.equal(l.data.role, 'member');
  assert.ok(Array.isArray(l.data.levels));
  assert.equal(JSON.stringify(l.data).includes('"answer"'), false, 'members must not receive correct answers');
  assert.equal(l.data.content, undefined);
  assert.equal(l.data.joinCode, undefined, 'members must not see the join code');
  const admin = await call(learning, 'GET', '/api/learning?admin=1', null, cookie);
  assert.equal(admin.data.content, undefined);
  assert.equal(admin.data.joinCode, undefined);
});

test('members cannot reach applicant data, admin state or admin writes', async () => {
  const cookie = (await call(sessionApi, 'POST', '/api/session', { username: join.imail, password: join.password })).cookie;
  const denied = r => assert.ok([401, 403].includes(r.status), `expected 401/403, got ${r.status}`);
  denied(await call(applications, 'GET', '/api/applications', null, cookie));
  const st = await call(stateApi, 'GET', '/api/state', null, cookie);
  assert.equal(st.data.admin, undefined);
  denied(await call(learning, 'PUT', '/api/learning', { levels: [] }, cookie));
  denied(await call(learning, 'DELETE', '/api/learning?member=m:' + join.imail.toLowerCase(), null, cookie));
});

test('quiz grading is server-side and completion is recorded per member', async () => {
  const cookie = (await call(sessionApi, 'POST', '/api/session', { username: join.imail, password: join.password })).cookie;
  await call(learning, 'PUT', '/api/learning', { joinCode: 'SEC-2026', public: { enabled: true, steps: [] }, levels: [{ id: 'a', title: 'A', modules: [
    { id: 'm1', title: 'M1', status: 'published', passMark: 50, questions: [
      { q: 'One?', options: ['x', 'y'], answer: 1 }, { q: 'Two?', options: ['x', 'y'], answer: 0 }] },
    { id: 'm2', title: 'Draft', status: 'draft', questions: [] }] }] }, adminCookie);

  const view = await call(learning, 'GET', '/api/learning', null, cookie);
  assert.equal(JSON.stringify(view.data).includes('"answer"'), false);
  assert.equal(view.data.levels[0].modules[1].status, 'draft');

  assert.equal((await call(learning, 'POST', '/api/learning', { moduleId: 'm1', answers: [1] }, cookie)).status, 400);
  assert.equal((await call(learning, 'POST', '/api/learning', { moduleId: 'm2', answers: [] }, cookie)).status, 404);
  assert.equal((await call(learning, 'POST', '/api/learning', { moduleId: 'm1', answers: [1, 0] })).status, 401);

  const fail = await call(learning, 'POST', '/api/learning', { moduleId: 'm1', answers: [0, 1] }, cookie);
  assert.equal(fail.data.score, 0);
  assert.equal(fail.data.passed, false);
  const pass = await call(learning, 'POST', '/api/learning', { moduleId: 'm1', answers: [1, 0] }, cookie);
  assert.equal(pass.data.passed, true);
  assert.equal(pass.data.progress.attempts, 2);

  const all = await call(learning, 'GET', '/api/learning?admin=1', null, adminCookie);
  assert.equal(all.data.progressAll['m:' + join.imail.toLowerCase()].m1.passed, true);
  assert.equal(all.data.members[0].name, 'Aisha Rahman');
});

test('flashcards are cleaned, and instant feedback only works for published modules', async () => {
  const cookie = (await call(sessionApi, 'POST', '/api/session', { username: join.imail, password: join.password })).cookie;
  await call(learning, 'PUT', '/api/learning', { joinCode: 'SEC-2026', public: { enabled: true, steps: [] }, levels: [{ id: 'a', title: 'A', modules: [
    { id: 'm1', title: 'M1', status: 'published', passMark: 50,
      cards: [{ front: ' Ownership ', back: 'Carry it to the end' }, { front: 'No back side', back: '' }, { front: '', back: 'No front' }],
      questions: [{ q: 'One?', options: ['x', 'y'], answer: 1, why: 'Because y' }] },
    { id: 'm2', title: 'Draft', status: 'draft', cards: [{ front: 'secret', back: 'draft card' }], questions: [{ q: 'Hidden?', options: ['a', 'b'], answer: 0 }] }] }] }, adminCookie);

  const before = await call(learning, 'GET', '/api/learning', null, cookie);
  const view = before.data;
  assert.deepEqual(view.levels[0].modules[0].cards, [{ front: 'Ownership', back: 'Carry it to the end' }]);
  assert.equal(JSON.stringify(view).includes('draft card'), false, 'draft cards must not reach members');
  assert.equal(JSON.stringify(view).includes('"answer"'), false);

  const right = await call(learning, 'POST', '/api/learning', { moduleId: 'm1', check: { i: 0, choice: 1 } }, cookie);
  assert.deepEqual([right.data.correct, right.data.answer, right.data.why], [true, 1, 'Because y']);
  const wrong = await call(learning, 'POST', '/api/learning', { moduleId: 'm1', check: { i: 0, choice: 0 } }, cookie);
  assert.equal(wrong.data.correct, false);
  assert.equal((await call(learning, 'POST', '/api/learning', { moduleId: 'm2', check: { i: 0, choice: 0 } }, cookie)).status, 404);
  assert.equal((await call(learning, 'POST', '/api/learning', { moduleId: 'm1', check: { i: 0, choice: 1 } })).status, 401);
  // checking an answer is feedback only: it never adds an attempt or changes completion
  const after = await call(learning, 'GET', '/api/learning', null, cookie);
  assert.equal(after.data.progress.m1.attempts, before.data.progress.m1.attempts);
});

test('new draft modules are added to saved content without overwriting admin edits', async () => {
  // simulate content saved by an admin before the drafts existed
  data.set('sec:learning', JSON.stringify({ version: 2, updatedBy: 'reviewer', public: { enabled: true, steps: [] }, levels: [
    { id: 'l3', title: 'My own level name', modules: [
      { id: 'l3-lifecycle', title: 'Renamed by admin', objective: 'Admin wording', status: 'draft', cards: [], questions: [] },
      { id: 'l3-budget', title: 'Budget', objective: '', status: 'published', passMark: 75,
        cards: [{ front: 'Admin card', back: 'Admin answer' }], questions: [{ q: 'Admin q?', options: ['a', 'b'], answer: 0 }] }] }] }));
  const all = (await call(learning, 'GET', '/api/learning?admin=1', null, adminCookie)).data.content;
  const [life, budget] = all.levels[0].modules;
  assert.equal(all.levels[0].title, 'My own level name');
  assert.equal(life.title, 'Renamed by admin');
  assert.equal(life.objective, 'Admin wording');
  assert.ok(life.cards.length >= 5 && life.questions.length >= 4, 'empty module is filled from the seed');
  assert.equal(life.status, 'draft', 'a module the admin set to draft stays a draft');
  assert.deepEqual(budget.cards, [{ front: 'Admin card', back: 'Admin answer' }], 'edited modules are left alone');
  assert.equal(all.version, 5);
});

test('removing a member ends their session at once', async () => {
  const cookie = (await call(sessionApi, 'POST', '/api/session', { username: join.imail, password: join.password })).cookie;
  assert.equal((await call(sessionApi, 'GET', '/api/session', null, cookie)).data.role, 'member');
  const id = 'm:' + join.imail.toLowerCase();
  assert.equal((await call(learning, 'DELETE', '/api/learning?member=' + id, null, adminCookie)).status, 200);
  assert.equal((await call(sessionApi, 'GET', '/api/session', null, cookie)).data.user, null);
  assert.equal((await call(sessionApi, 'POST', '/api/session', { username: join.imail, password: join.password })).status, 401);
});

test('records survive signing out and back in', async () => {
  await call(learning, 'PUT', '/api/learning', { joinCode: 'SEC-2026', public: { enabled: true, steps: [] }, levels: [{ id: 'a', title: 'A', modules: [
    { id: 'keep', title: 'Keep', status: 'published', passMark: 50, cards: [], questions: [{ q: 'One?', options: ['x', 'y'], answer: 1 }] }] }] }, adminCookie);
  const first = await call(signup, 'POST', '/api/signup', { ...join, imail: 'keeper@x.com' });
  const pass = await call(learning, 'POST', '/api/learning', { moduleId: 'keep', answers: [1] }, first.cookie);
  assert.equal(pass.data.passed, true);

  await sessionApi({ method: 'DELETE', url: '/api/session', body: {}, headers: { cookie: first.cookie } }, { setHeader() {}, end() {} });
  assert.equal((await call(sessionApi, 'POST', '/api/session', { username: 'keeper@x.com', password: join.password })).status, 200);
  const back = (await call(sessionApi, 'POST', '/api/session', { username: 'KEEPER@x.com', password: join.password })).cookie;
  const view = (await call(learning, 'GET', '/api/learning', null, back)).data;
  assert.equal(view.progress.keep.passed, true, 'completion is still there after signing out and in');
  assert.equal(view.progress.keep.attempts, 1);
});

test('many members writing at the same moment never lose each other\'s records', async () => {
  const N = 15;
  const people = await Promise.all(Array.from({ length: N }, (_, i) =>
    call(signup, 'POST', '/api/signup', { ...join, name: `Person ${i}`, imail: `p${i}@x.com` })));
  assert.ok(people.every(r => r.status === 200), 'every sign-up succeeded');
  await Promise.all(people.map(r => call(learning, 'POST', '/api/learning', { moduleId: 'keep', answers: [1] }, r.cookie)));

  const admin = (await call(learning, 'GET', '/api/learning?admin=1', null, adminCookie)).data;
  const mine = admin.members.filter(m => /^p\d+@x\.com$/.test(m.imail));
  assert.equal(mine.length, N, 'all accounts were saved');
  const withProgress = mine.filter(m => admin.progressAll[m.id]?.keep?.passed);
  assert.equal(withProgress.length, N, 'all quiz completions were saved');
  assert.ok((history.get('sec:learning_progress:history') || []).length > 0, 'previous versions are kept for recovery');
});

test('members shown in the progress table can be removed, including leftover progress', async () => {
  const gone = await call(signup, 'POST', '/api/signup', { ...join, imail: 'gone@x.com' });
  await call(learning, 'POST', '/api/learning', { moduleId: 'keep', answers: [1] }, gone.cookie);
  const id = 'm:gone@x.com';
  assert.ok((await call(learning, 'GET', '/api/learning?admin=1', null, adminCookie)).data.progressAll[id]);
  assert.equal((await call(learning, 'DELETE', '/api/learning?member=' + encodeURIComponent(id), null, adminCookie)).status, 200);
  const after = (await call(learning, 'GET', '/api/learning?admin=1', null, adminCookie)).data;
  assert.equal(after.progressAll[id], undefined);
  assert.equal(after.members.some(m => m.id === id), false);
  assert.equal((await call(learning, 'DELETE', '/api/learning?member=' + encodeURIComponent(id), null, adminCookie)).status, 404);
  assert.equal((await call(sessionApi, 'GET', '/api/session', null, gone.cookie)).data.user, null, 'removed member is signed out');
});

test('clearing the join code closes sign-up again', async () => {
  await call(learning, 'PUT', '/api/learning', { joinCode: '', levels: [] }, adminCookie);
  assert.equal((await call(signup, 'POST', '/api/signup', { ...join, imail: 'new@x.com' })).status, 403);
});
