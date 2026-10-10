import test from 'node:test';
import assert from 'node:assert/strict';

process.env.KV_REST_API_URL = 'https://fake-redis.invalid';
process.env.KV_REST_API_TOKEN = 'test-token';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.ADMIN_USERS = 'reviewer:test-password';

const data = new Map();
globalThis.fetch = async (_url, opts) => {
  const [command, key, value] = JSON.parse(opts.body);
  let result = null;
  if (command === 'GET') result = data.get(key) ?? null;
  else if (command === 'SET') { data.set(key, value); result = 'OK'; }
  else throw Error(`Unexpected Redis command: ${command}`);
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

test('removing a member ends their session at once', async () => {
  const cookie = (await call(sessionApi, 'POST', '/api/session', { username: join.imail, password: join.password })).cookie;
  assert.equal((await call(sessionApi, 'GET', '/api/session', null, cookie)).data.role, 'member');
  const id = 'm:' + join.imail.toLowerCase();
  assert.equal((await call(learning, 'DELETE', '/api/learning?member=' + id, null, adminCookie)).status, 200);
  assert.equal((await call(sessionApi, 'GET', '/api/session', null, cookie)).data.user, null);
  assert.equal((await call(sessionApi, 'POST', '/api/session', { username: join.imail, password: join.password })).status, 401);
});

test('clearing the join code closes sign-up again', async () => {
  await call(learning, 'PUT', '/api/learning', { joinCode: '', levels: [] }, adminCookie);
  assert.equal((await call(signup, 'POST', '/api/signup', { ...join, imail: 'new@x.com' })).status, 403);
});
