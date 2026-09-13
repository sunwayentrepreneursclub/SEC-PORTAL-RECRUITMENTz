import { send, readBody, requireAdmin, loadState, kvSet, K_STATE, publicState,
         currentUser, guardEnv, kvGet, K_KEY } from './_lib.js';

export default async function handler(req, res) {
  if (!guardEnv(res)) return;
  const user = currentUser(req);

  if (req.method === 'GET') {
    const state = await loadState();
    if (!user) return send(res, 200, publicState(state));
    const keySet = !!(process.env.GEMINI_API_KEY || await kvGet(K_KEY));
    return send(res, 200, { ...state, admin: true, user, keySet });
  }

  if (req.method === 'PUT') {
    if (!await requireAdmin(req, res)) return;
    const body = await readBody(req);
    if (!Array.isArray(body.departments)) return send(res, 400, { error: 'departments must be an array' });
    const state = await loadState();
    const next = {
      settings: { ...state.settings, ...(body.settings || {}) },
      departments: body.departments,
      updatedAt: new Date().toISOString(),
      updatedBy: user,
    };
    await kvSet(K_STATE, next);
    return send(res, 200, { ok: true, updatedAt: next.updatedAt });
  }

  return send(res, 405, { error: 'Method not allowed' });
}
