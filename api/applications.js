import crypto from 'node:crypto';
import { send, readBody, requireAdmin, currentUser, loadState, loadApps,
         loadAppsRecord, kvReplaceSafely, K_APPS, K_APPS_HISTORY, guardEnv } from './_lib.js';

const IMAIL = /^[^@\s]+@imail\.sunway\.edu\.my$/;
const words = s => (s || '').trim() ? s.trim().split(/\s+/).length : 0;
const STATUSES = new Set(['new', 'shortlisted', 'rejected', 'offered']);

async function changeApps(actor, update) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const { raw, apps } = await loadAppsRecord();
    const result = update(apps);
    if (result?.error) return result;
    if (await kvReplaceSafely(K_APPS, K_APPS_HISTORY, raw, apps, actor))
      return { ok: true, ...result };
  }
  return { code: 409, error: 'The application list changed while saving. Try again.' };
}

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

    const result = await changeApps('applicant', apps => {
      if (apps.some(a => !a.archivedAt && a.pos === p.id && a.imail === imail))
        return { code: 409, error: 'This iMail has already applied for this position.' };
      apps.push({
        id: crypto.randomUUID(),
        pos: p.id, posTitle: p.title, dept,
        name, imail,
        when: new Date().toISOString(),
        answers, questions: p.questions.slice(),
        form: false, status: 'new', note: '', noteBy: '',
      });
      return {};
    });
    return send(res, result.error ? result.code : 201, result);
  }

  /* ---- applicant checks their own status (public, keyed by exact iMail) ---- */
  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://x');
    const lookupMail = (url.searchParams.get('imail') || '').trim().toLowerCase();
    if (lookupMail) {
      if (!IMAIL.test(lookupMail)) return send(res, 400, { error: 'That is not a Sunway iMail address.' });
      const apps = await loadApps();
      const mine = apps
        .filter(a => !a.archivedAt && a.imail === lookupMail)
        .map(a => ({ posTitle: a.posTitle, dept: a.dept, status: a.status, when: a.when }));
      return send(res, 200, { applications: mine });
    }
  }

  /* ---- everything below is admin ---- */
  if (!await requireAdmin(req, res)) return;
  const user = currentUser(req);

  if (req.method === 'GET') {
    const includeArchived = new URL(req.url, 'http://x').searchParams.get('includeArchived') === '1';
    const apps = await loadApps();
    return send(res, 200, { applications: includeArchived ? apps : apps.filter(a => !a.archivedAt) });
  }

  if (req.method === 'PATCH') {
    const { id, status, statusBase, note, noteBaseAt, form, formBase, restore } = await readBody(req);
    if (status !== undefined && !STATUSES.has(status)) return send(res, 400, { error: 'Invalid decision.' });
    if (note !== undefined && (typeof note !== 'string' || note.length > 5000))
      return send(res, 400, { error: 'Reviewer note must be under 5,000 characters.' });
    if (form !== undefined && typeof form !== 'boolean') return send(res, 400, { error: 'Invalid form flag.' });
    if (restore !== undefined && restore !== true) return send(res, 400, { error: 'Invalid restore request.' });
    if (status === undefined && note === undefined && form === undefined && !restore)
      return send(res, 400, { error: 'No change requested.' });
    const result = await changeApps(user, apps => {
      const a = apps.find(x => String(x.id) === String(id));
      if (!a) return { code: 404, error: 'Application not found.' };
      if (a.archivedAt && !restore) return { code: 409, error: 'Restore this application before editing it.' };
      if (status !== undefined && statusBase !== undefined && a.status !== statusBase)
        return { code: 409, error: 'The decision changed since you opened this application. Reload before editing.' };
      if (form !== undefined && formBase !== undefined && a.form !== formBase)
        return { code: 409, error: 'The form flag changed since you opened this application. Reload before editing.' };
      if (note !== undefined && noteBaseAt !== undefined && (a.noteAt || null) !== noteBaseAt)
        return { code: 409, error: 'The reviewer note changed since you opened this application. Copy your text before reloading.' };
      if (restore) { delete a.archivedAt; delete a.archivedBy; }
      if (status !== undefined) a.status = status;
      if (form !== undefined) a.form = form;
      if (note !== undefined) {
        a.note = note;
        a.noteBy = user;
        a.noteAt = new Date().toISOString();
      }
      return { noteAt: a.noteAt || null };
    });
    return send(res, result.error ? result.code : 200, result);
  }

  if (req.method === 'DELETE') {
    const id = new URL(req.url, 'http://x').searchParams.get('id');
    const result = await changeApps(user, apps => {
      const a = apps.find(x => String(x.id) === String(id));
      if (!a) return { code: 404, error: 'Application not found.' };
      if (a.archivedAt) return { code: 409, error: 'Application is already archived.' };
      a.archivedAt = new Date().toISOString();
      a.archivedBy = user;
      return {};
    });
    return send(res, result.error ? result.code : 200, result);
  }

  return send(res, 405, { error: 'Method not allowed' });
}
