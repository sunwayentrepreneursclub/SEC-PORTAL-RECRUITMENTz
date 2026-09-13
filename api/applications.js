import { send, readBody, requireAdmin, currentUser, loadState, loadApps,
         kvSet, K_APPS, guardEnv } from './_lib.js';

const IMAIL = /^[^@\s]+@imail\.sunway\.edu\.my$/;
const words = s => (s || '').trim() ? s.trim().split(/\s+/).length : 0;

function findPosition(state, id) {
  for (const d of state.departments || [])
    for (const p of d.positions || []) if (p.id === id) return { p, dept: d.name };
  return null;
}

export default async function handler(req, res) {
  if (!guardEnv(res)) return;

  /* ---- applicant submits (public) ---- */
  if (req.method === 'POST') {
    const body = await readBody(req);
    const name = String(body.name || '').trim();
    const imail = String(body.imail || '').trim().toLowerCase();
    const answers = Array.isArray(body.answers) ? body.answers.map(a => String(a || '').trim()) : [];

    if (name.length < 2) return send(res, 400, { error: 'Enter your full name.' });
    if (!IMAIL.test(imail)) return send(res, 400, { error: 'That is not a Sunway iMail address.' });

    const state = await loadState();
    const found = findPosition(state, String(body.positionId || ''));
    if (!found) return send(res, 404, { error: 'That position no longer exists.' });
    const { p, dept } = found;
    if (p.filled >= p.total) return send(res, 409, { error: 'That position has closed.' });
    if (p.qState !== 'published') return send(res, 409, { error: 'That position is not open for applications yet.' });
    if (answers.length !== 5 || answers.some(a => !a)) return send(res, 400, { error: 'All five questions need an answer.' });
    if (answers.some(a => words(a) > 150)) return send(res, 400, { error: 'One or more answers is over 150 words.' });

    const apps = await loadApps();
    if (apps.some(a => a.pos === p.id && a.imail === imail))
      return send(res, 409, { error: 'This iMail has already applied for this position.' });

    apps.push({
      id: Date.now() + Math.floor(Math.random() * 1000),
      pos: p.id, posTitle: p.title, dept,
      name, imail,
      when: new Date().toISOString(),
      answers, questions: p.questions.slice(),
      form: false, status: 'new', note: '', noteBy: '',
    });
    await kvSet(K_APPS, apps);
    return send(res, 201, { ok: true });
  }

  /* ---- everything below is admin ---- */
  if (!await requireAdmin(req, res)) return;
  const user = currentUser(req);
  const apps = await loadApps();

  if (req.method === 'GET') return send(res, 200, { applications: apps });

  if (req.method === 'PATCH') {
    const { id, status, note, form } = await readBody(req);
    const a = apps.find(x => String(x.id) === String(id));
    if (!a) return send(res, 404, { error: 'Application not found.' });
    if (status !== undefined) a.status = String(status);
    if (form !== undefined) a.form = !!form;
    if (note !== undefined) {
      a.note = String(note);
      a.noteBy = user;
      a.noteAt = new Date().toISOString();
    }
    await kvSet(K_APPS, apps);
    return send(res, 200, { ok: true });
  }

  if (req.method === 'DELETE') {
    const id = new URL(req.url, 'http://x').searchParams.get('id');
    const next = apps.filter(x => String(x.id) !== String(id));
    await kvSet(K_APPS, next);
    return send(res, 200, { ok: true, removed: apps.length - next.length });
  }

  return send(res, 405, { error: 'Method not allowed' });
}
