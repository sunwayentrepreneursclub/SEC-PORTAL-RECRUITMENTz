import crypto from 'node:crypto';
import { send, readBody, requireAdmin, loadStateRecord, kvReplaceSafely,
         K_STATE, K_STATE_HISTORY, publicState, currentUser, isAdminUser, guardEnv,
         kvGet, K_KEY, WEBSITE_LEVELS, PRESIDENTIAL_DEPARTMENT } from './_lib.js';

const revisionOf = raw => crypto.createHash('sha256').update(raw).digest('hex');

function validateDepartments(departments) {
  if (!Array.isArray(departments)) return 'Departments must be a list.';
  const ids = new Set();
  for (const dept of departments) {
    if (!dept || typeof dept.name !== 'string' || !dept.name.trim() || !Array.isArray(dept.positions))
      return 'Every department needs a name and a positions list.';
    for (const p of dept.positions) {
      if (!p || typeof p.id !== 'string' || !p.id || ids.has(p.id) ||
          typeof p.title !== 'string' || !p.title.trim() ||
          (p.availability !== undefined && !['hiring', 'filled'].includes(p.availability)) ||
          !Number.isSafeInteger(p.total) || p.total < 1 || p.total > 500 ||
          !Number.isSafeInteger(p.filled) || p.filled < 0 || p.filled > p.total)
        return 'A position has a missing or duplicate ID, invalid name, or invalid seat count.';
      ids.add(p.id);
    }
  }
  return null;
}

function validateLevelChanges(departments, previousDepartments) {
  const previous = new Map((previousDepartments || []).flatMap(d =>
    (d.positions || []).map(p => [p.id, p.level])));
  for (const p of departments.flatMap(d => d.positions)) {
    // Existing free-text levels stay valid until that role is re-levelled.
    if ((!previous.has(p.id) || p.level !== previous.get(p.id)) && !WEBSITE_LEVELS.includes(p.level))
      return 'Choose one of the standard levels for new or changed roles.';
  }
  return null;
}

function validateDepartmentNames(departments, previousDepartments) {
  const known = new Set((previousDepartments || []).map(d => d.name));
  if (!known.size) return null;
  for (const dept of departments) {
    if (!known.has(dept.name) && dept.name !== PRESIDENTIAL_DEPARTMENT)
      return 'Choose an existing department or Office of the President for each role.';
  }
  return null;
}

export default async function handler(req, res) {
  if (!guardEnv(res)) return;
  const user = currentUser(req);

  if (req.method === 'GET') {
    const { state, raw } = await loadStateRecord();
    if (!isAdminUser(user)) return send(res, 200, publicState(state));
    const keySet = !!(process.env.GEMINI_API_KEY || await kvGet(K_KEY));
    return send(res, 200, { ...state, admin: true, user, keySet, revision: revisionOf(raw) });
  }

  if (req.method === 'PUT') {
    if (!await requireAdmin(req, res)) return;
    const body = await readBody(req);
    const invalid = validateDepartments(body.departments);
    if (invalid) return send(res, 400, { error: invalid });
    if (!body.settings || typeof body.settings !== 'object' || Array.isArray(body.settings) ||
        (body.settings.timeline !== undefined && !Array.isArray(body.settings.timeline)))
      return send(res, 400, { error: 'Settings are invalid.' });
    if (typeof body.revision !== 'string')
      return send(res, 428, { error: 'This editor is out of date. Reload it before saving.' });
    const { state, raw } = await loadStateRecord();
    if (revisionOf(raw) !== body.revision)
      return send(res, 409, { error: 'Another editor saved changes. Download your draft before reloading.' });
    const invalidLevel = validateLevelChanges(body.departments, state.departments);
    if (invalidLevel) return send(res, 400, { error: invalidLevel });
    const invalidDepartment = validateDepartmentNames(body.departments, state.departments);
    if (invalidDepartment) return send(res, 400, { error: invalidDepartment });
    const previousIds = (state.departments || []).flatMap(d => (d.positions || []).map(p => p.id));
    const nextIds = new Set(body.departments.flatMap(d => d.positions.map(p => p.id)));
    const removedIds = previousIds.filter(id => !nextIds.has(id));
    if (removedIds.length && (!Array.isArray(body.confirmRemovedIds) ||
        removedIds.some(id => !body.confirmRemovedIds.includes(id))))
      return send(res, 409, { error: 'A position was removed without confirmation. No changes were saved.' });
    if (state.departments?.length && !body.departments.length)
      return send(res, 400, { error: 'Refusing to clear every department.' });
    const next = {
      ...state,
      settings: { ...state.settings, ...(body.settings || {}) },
      departments: body.departments,
      updatedAt: new Date().toISOString(),
      updatedBy: user,
    };
    if (!await kvReplaceSafely(K_STATE, K_STATE_HISTORY, raw, next, user))
      return send(res, 409, { error: 'Another editor saved first. Download your draft before reloading.' });
    return send(res, 200, { ok: true, updatedAt: next.updatedAt, revision: revisionOf(JSON.stringify(next)) });
  }

  return send(res, 405, { error: 'Method not allowed' });
}
