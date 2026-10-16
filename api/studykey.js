import { send, readBody, requireAdmin, kvSet, kvGet, K_STUDY_KEY, guardEnv, resolveAiKey } from './_lib.js';

/* The AI key used to turn uploaded files into courses. Separate from the recruiter's question-generator key.
   It is saved on the server and never returned to any browser; only whether one is set, and for which provider. */
export default async function handler(req, res) {
  if (!guardEnv(res)) return;
  if (!await requireAdmin(req, res)) return;
  const status = async () => { const a = await resolveAiKey(); return { keySet: !!a, provider: a?.provider || null, fromVercel: !!a?.fromEnv }; };

  if (req.method === 'GET') return send(res, 200, await status());
  if (req.method === 'POST') {
    const { key } = await readBody(req);
    const k = String(key || '').trim();
    if (k.length < 20 || /\s/.test(k)) return send(res, 400, { error: "That doesn't look like an API key." });
    await kvSet(K_STUDY_KEY, k);
    return send(res, 200, await status());
  }
  if (req.method === 'DELETE') { await kvSet(K_STUDY_KEY, ''); return send(res, 200, await status()); }
  return send(res, 405, { error: 'Method not allowed' });
}
