import { send, readBody, requireAdmin, loadState, kvGet, K_KEY, COMMIT_Q, guardEnv } from './_lib.js';

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

export default async function handler(req, res) {
  if (!guardEnv(res)) return;
  if (!await requireAdmin(req, res)) return;
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });

  const key = process.env.GEMINI_API_KEY || await kvGet(K_KEY);
  if (!key) return send(res, 400, { error: 'NO_KEY' });

  const { positionId } = await readBody(req);
  const state = await loadState();
  let pos = null, dept = '';
  for (const d of state.departments || [])
    for (const p of d.positions || []) if (p.id === positionId) { pos = p; dept = d.name; }
  if (!pos) return send(res, 404, { error: 'Position not found.' });

  const prompt = `You are helping a university student club shortlist applicants for a committee position.

Position: ${pos.title}
Department: ${dept}
Purpose: ${pos.purpose || '(not stated)'}
Duties:
${(pos.duties || []).map(d => `- ${d}`).join('\n') || '- (not stated)'}
Out of scope for this role:
${(pos.not || []).map(d => `- ${d}`).join('\n') || '- (not stated)'}

Write exactly 4 application questions. Requirements:
- Ask about specific past behaviour or concrete judgement calls, grounded in the duties above.
- Reward specificity: a strong answer should name a real event, a real number, or a real constraint.
- Avoid questions answerable from the job title alone, and avoid "why do you want to join".
- Avoid anything that invites a generic motivational essay.
- Each question is one or two sentences, plain English, addressed to "you".
- No numbering, no preamble, no commentary.

Return ONLY a JSON array of 4 strings. No markdown, no code fences.`;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`,
      { method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.9, responseMimeType: 'application/json' },
        }) });

    const j = await r.json();
    if (!r.ok) {
      const msg = j?.error?.message || `Gemini returned ${r.status}`;
      return send(res, 502, { error: msg });
    }
    const text = j?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
    let arr;
    try { arr = JSON.parse(text.replace(/```json|```/g, '').trim()); }
    catch { return send(res, 502, { error: 'Gemini returned something that was not valid JSON.' }); }
    if (!Array.isArray(arr) || arr.length < 4)
      return send(res, 502, { error: 'Gemini did not return four questions.' });

    // The commitment question is always the fifth. Availability is the best predictor
    // of whether someone lasts a term, so it is not left to the model.
    const questions = arr.slice(0, 4).map(String).concat(COMMIT_Q);
    return send(res, 200, { questions });
  } catch (e) {
    return send(res, 502, { error: `Could not reach Gemini: ${e.message}` });
  }
}
