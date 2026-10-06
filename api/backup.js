import { send, requireAdmin, loadStateRecord, loadAppsRecord, kvHistory,
         K_STATE_HISTORY, K_APPS_HISTORY, guardEnv } from './_lib.js';

/* Full-fidelity, admin-only export. Never includes the Gemini key or credentials.
   Keep downloaded files in club-controlled encrypted storage: they contain PII. */
export default async function handler(req, res) {
  if (!guardEnv(res)) return;
  if (!await requireAdmin(req, res)) return;
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });

  const url = new URL(req.url, 'http://x');
  const history = url.searchParams.get('history');
  const index = Number(url.searchParams.get('index') || 0);
  let payload;

  if (history) {
    if (!['state', 'applications'].includes(history) || !Number.isSafeInteger(index) || index < 0 || index > 49)
      return send(res, 400, { error: 'Invalid backup selection.' });
    const entries = await kvHistory(history === 'state' ? K_STATE_HISTORY : K_APPS_HISTORY, index, index);
    if (!entries.length) return send(res, 404, { error: 'That backup is no longer available.' });
    payload = { kind: history, ...entries[0] };
  } else {
    const [{ state }, { apps }] = await Promise.all([loadStateRecord(), loadAppsRecord()]);
    payload = { kind: 'full', exportedAt: new Date().toISOString(), state, applications: apps };
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Disposition', `attachment; filename="sec-recruitment-backup-${new Date().toISOString().slice(0, 10)}.json"`);
  return send(res, 200, payload);
}
