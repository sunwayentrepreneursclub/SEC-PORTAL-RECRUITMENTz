import test from 'node:test';
import assert from 'node:assert/strict';

process.env.KV_REST_API_URL = 'https://fake-redis.invalid';
process.env.KV_REST_API_TOKEN = 'test-token';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.ADMIN_USERS = 'reviewer:test-password';

const data = new Map();
const history = new Map();
globalThis.fetch = async (_url, opts) => {
  const args = JSON.parse(opts.body);
  const [command, ...rest] = args;
  let result;
  if (command === 'GET') {
    result = data.get(rest[0]) ?? null;
    if (rest[0] === 'sec:applications') await new Promise(resolve => setTimeout(resolve, 3));
  } else if (command === 'SET') {
    if (rest[2] !== 'NX' || !data.has(rest[0])) data.set(rest[0], rest[1]);
    result = 'OK';
  } else if (command === 'EVAL') {
    const [, , key, historyKey, expected, previous, next] = rest;
    if ((data.get(key) ?? '') !== expected) result = 0;
    else {
      if (data.has(key)) {
        const entries = history.get(historyKey) || [];
        entries.unshift(previous);
        history.set(historyKey, entries.slice(0, 50));
      }
      data.set(key, next);
      result = 1;
    }
  } else if (command === 'LRANGE') {
    result = (history.get(rest[0]) || []).slice(rest[1], rest[2] + 1);
  } else throw Error(`Unexpected Redis command: ${command}`);
  return { ok: true, json: async () => ({ result }) };
};

const { issueSession } = await import('../api/_lib.js');
const { default: stateHandler } = await import('../api/state.js');
const { default: appsHandler } = await import('../api/applications.js');
const { default: backupHandler } = await import('../api/backup.js');

const state = {
  settings: { deadline: '30 November 2026', timeline: [] },
  departments: [{ name: 'Digital', positions: [{ id: 'web', title: 'Web Developer',
    level: 'Officer', total: 2, filled: 0, qState: 'published',
    questions: ['One', 'Two', 'Three', 'Four', 'Five'] }] }],
};
const prior = [{ id: 123, pos: 'web', posTitle: 'Web Developer', dept: 'Digital',
  name: 'Existing applicant', imail: 'existing@imail.sunway.edu.my', status: 'new',
  form: false, note: '', questions: ['One', 'Two', 'Three', 'Four', 'Five'],
  answers: ['1', '2', '3', '4', '5'] }];
data.set('sec:state', JSON.stringify(state));
data.set('sec:applications', JSON.stringify(prior));

const session = { headers: {}, setHeader(k, v) { this.headers[k] = v; } };
issueSession(session, 'reviewer');
const cookie = session.headers['Set-Cookie'].split(';')[0];

async function call(handler, method, url, body, admin = false) {
  const req = { method, url, body: body ?? {}, headers: { cookie: admin ? cookie : '' } };
  const res = { statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; },
    end(raw) { this.raw = raw; } };
  await handler(req, res);
  return { status: res.statusCode, data: JSON.parse(res.raw), headers: res.headers };
}

test('existing state loads intact; stale editor cannot overwrite it', async () => {
  const current = await call(stateHandler, 'GET', '/api/state', null, true);
  assert.equal(current.data.departments[0].positions[0].id, 'web');
  const next = structuredClone(current.data.departments);
  next[0].positions[0].title = 'Website Developer';
  const saved = await call(stateHandler, 'PUT', '/api/state', {
    departments: next, settings: current.data.settings, revision: current.data.revision,
  }, true);
  assert.equal(saved.status, 200);
  const stale = await call(stateHandler, 'PUT', '/api/state', {
    departments: current.data.departments, settings: current.data.settings,
    revision: current.data.revision,
  }, true);
  assert.equal(stale.status, 409);
  assert.equal(JSON.parse(data.get('sec:state')).departments[0].positions[0].title, 'Website Developer');
  assert.equal(JSON.parse(history.get('sec:state:history')[0]).data.departments[0].positions[0].title, 'Web Developer');
  const previous = await call(backupHandler, 'GET', '/api/backup?history=state&index=0', null, true);
  assert.equal(previous.data.data.departments[0].positions[0].title, 'Web Developer');
});

test('accidental mass deletion is refused', async () => {
  const current = await call(stateHandler, 'GET', '/api/state', null, true);
  const result = await call(stateHandler, 'PUT', '/api/state', {
    departments: [], settings: current.data.settings, revision: current.data.revision,
  }, true);
  assert.equal(result.status, 409);
  assert.equal(JSON.parse(data.get('sec:state')).departments.length, 1);
});

test('concurrent applications and old numeric IDs are preserved', async () => {
  const submit = (name, imail) => call(appsHandler, 'POST', '/api/applications', {
    name, imail, positionId: 'web', answers: ['1', '2', '3', '4', '5'],
  });
  const [a, b] = await Promise.all([
    submit('Applicant One', 'one@imail.sunway.edu.my'),
    submit('Applicant Two', 'two@imail.sunway.edu.my'),
  ]);
  assert.equal(a.status, 201);
  assert.equal(b.status, 201);
  const apps = JSON.parse(data.get('sec:applications'));
  assert.equal(apps.length, 3);
  assert.equal(apps[0].id, 123);
  assert.equal(new Set(apps.map(x => x.id)).size, 3);
});

test('archive, restore and full backup never drop the original answers', async () => {
  const archived = await call(appsHandler, 'DELETE', '/api/applications?id=123', null, true);
  assert.equal(archived.status, 200);
  const active = await call(appsHandler, 'GET', '/api/applications', null, true);
  assert.equal(active.data.applications.length, 2);
  const backup = await call(backupHandler, 'GET', '/api/backup', null, true);
  assert.equal(backup.data.applications.length, 3);
  assert.deepEqual(backup.data.applications[0].answers, ['1', '2', '3', '4', '5']);
  assert.equal(backup.headers['Cache-Control'], 'no-store');
  const restored = await call(appsHandler, 'PATCH', '/api/applications', { id: 123, restore: true }, true);
  assert.equal(restored.status, 200);
  const after = JSON.parse(data.get('sec:applications'));
  assert.equal(after[0].archivedAt, undefined);
  assert.deepEqual(after[0].answers, ['1', '2', '3', '4', '5']);
});

test('duplicate submissions and stale reviewer notes are refused', async () => {
  const duplicate = await call(appsHandler, 'POST', '/api/applications', {
    name: 'Applicant One', imail: 'one@imail.sunway.edu.my', positionId: 'web',
    answers: ['1', '2', '3', '4', '5'],
  });
  assert.equal(duplicate.status, 409);
  const first = await call(appsHandler, 'PATCH', '/api/applications', {
    id: 123, note: 'First review', noteBaseAt: null,
  }, true);
  assert.equal(first.status, 200);
  const stale = await call(appsHandler, 'PATCH', '/api/applications', {
    id: 123, note: 'Overwriting review', noteBaseAt: null,
  }, true);
  assert.equal(stale.status, 409);
  assert.equal(JSON.parse(data.get('sec:applications'))[0].note, 'First review');
});

test('non-admin users cannot download backups', async () => {
  const response = await call(backupHandler, 'GET', '/api/backup');
  assert.equal(response.status, 401);
});

test('removing a reviewer revokes an existing session', async () => {
  process.env.ADMIN_USERS = 'someoneelse:other-password';
  const response = await call(backupHandler, 'GET', '/api/backup', null, true);
  assert.equal(response.status, 401);
  process.env.ADMIN_USERS = 'reviewer:test-password';
});
