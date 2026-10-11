/* Learning Portal content: seed, sanitising, and the three views of it
   (public teaser, committee member, admin). Structure follows the AWI working paper:
   Know SEC -> Know Your Role -> Know How to Execute -> Know How to Lead,
   five levels. Every module is a deck of flashcards plus a multiple-choice quiz.
   The modules start empty: departments write their own cards and questions in Admin. */

const shell = (id, title, objective = '') => ({
  id, title, objective, status: 'draft', owner: '', reviewer: '', passMark: 75, cards: [], questions: [],
});

export function seedLearning() {
  return {
    public: {
      enabled: true,
      headline: 'Selected? Training starts straight away.',
      intro: 'SEC does not hand you a title and leave you to guess. Once you are in, the Learning Portal teaches what you need to perform: how SEC works, what you own, and how to deliver without being chased.',
      steps: [
        { title: 'Know SEC', text: 'How SEC runs, who decides what, and how we communicate.' },
        { title: 'Know your role', text: 'What your department does and what good looks like in your seat.' },
        { title: 'Know how to execute', text: 'Plan, deliver and review real projects.' },
        { title: 'Know how to lead', text: 'Delegate, decide and be accountable for the outcome.' },
      ],
    },
    levels: [
      { id: 'l1', title: 'SEC Core', audience: 'Every member', summary: 'How SEC operates. Short, required, and the same for everyone.', modules: [
        shell('l1-standard', 'The SEC standard'),
        shell('l1-system', 'How SEC builds people'),
        shell('l1-vision', 'SEC vision and direction'),
        shell('l1-structure', 'Structure, departments and projects'),
        shell('l1-comms', 'Communication and weekly updates'),
        shell('l1-authority', 'Authority and escalation'),
      ] },
      { id: 'l2', title: 'Department training', audience: 'Members of each department', summary: 'How each department works. Each department writes its own.', modules: [
        shell('l2-brand', 'Department training'),
      ] },
      { id: 'l3', title: 'Project training', audience: 'Members working on projects', summary: 'How SEC plans and delivers projects, start to finish.', modules: [
        shell('l3-lifecycle', 'Project lifecycle and timelines'),
        shell('l3-budget', 'Budgeting and risk'),
        shell('l3-stakeholders', 'Stakeholder management'),
        shell('l3-review', 'Execution and post-event review'),
      ] },
      { id: 'l4', title: 'Project Lead training', audience: 'Project Leads', summary: 'Own the final outcome: coordinate people, remove blockers, decide.', modules: [
        shell('l4-delegate', 'Delegation and coordination'),
        shell('l4-decide', 'Decisions and managing delays'),
        shell('l4-escalate', 'Escalation and alignment calls'),
        shell('l4-accountable', 'Stakeholder communication and accountability'),
      ] },
      { id: 'l5', title: 'Leadership training', audience: 'Future Heads of Department and ExCo', summary: 'For people being considered for more authority.', modules: [
        shell('l5-performance', 'Performance management and feedback'),
        shell('l5-department', 'Delegation and department management'),
        shell('l5-succession', 'Succession and organisational planning'),
        shell('l5-comms', 'Leadership communication'),
      ] },
    ],
    updatedAt: null, updatedBy: null,
  };
}

/* One-time clean-out of content that came from the wrong source document. It empties every module's flashcards
   and questions, unpublishes them, and removes the department modules that were generated from that document.
   Levels, module titles, the public teaser text and everything an admin writes afterwards are untouched,
   because this only runs when the saved version is older than WIPE_VERSION. */
const GENERATED_DEPARTMENT_MODULES = new Set(['l2-partnerships', 'l2-people', 'l2-events']);
export function wipeGeneratedContent(c) {
  for (const l of c.levels || []) {
    l.modules = (l.modules || []).filter(m => !GENERATED_DEPARTMENT_MODULES.has(m.id));
    for (const m of l.modules) {
      m.cards = []; m.questions = []; m.status = 'draft'; m.owner = ''; m.reviewer = '';
      if (m.id === 'l2-brand') { m.title = 'Department training'; m.objective = ''; }
    }
  }
  return c;
}

/* ---------- sanitising (admin writes) ---------- */
const str = (v, n) => String(v ?? '').slice(0, n).trim();
const slug = (v, fallback) => (str(v, 60).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')) || fallback;

export function cleanLearning(body) {
  const pub = body?.public || {};
  const out = {
    public: {
      enabled: pub.enabled !== false,
      headline: str(pub.headline, 140),
      intro: str(pub.intro, 600),
      steps: (Array.isArray(pub.steps) ? pub.steps : []).slice(0, 6)
        .map(s => ({ title: str(s?.title, 60), text: str(s?.text, 200) })).filter(s => s.title),
    },
    levels: [],
  };
  const seenL = new Set(), seenM = new Set();
  (Array.isArray(body?.levels) ? body.levels : []).slice(0, 12).forEach((l, li) => {
    let lid = slug(l?.id, `l${li + 1}`); while (seenL.has(lid)) lid += '-x'; seenL.add(lid);
    const level = { id: lid, title: str(l?.title, 80) || 'Untitled level', audience: str(l?.audience, 80), summary: str(l?.summary, 240), modules: [] };
    (Array.isArray(l?.modules) ? l.modules : []).slice(0, 40).forEach((m, mi) => {
      let mid = slug(m?.id, `${lid}-m${mi + 1}`); while (seenM.has(mid)) mid += '-x'; seenM.add(mid);
      const cards = (Array.isArray(m?.cards) ? m.cards : []).slice(0, 80)
        .map(c => ({ front: str(c?.front, 240), back: str(c?.back, 500) })).filter(c => c.front && c.back);
      const questions = (Array.isArray(m?.questions) ? m.questions : []).slice(0, 30).map(q => {
        const options = (Array.isArray(q?.options) ? q.options : []).slice(0, 6).map(o => str(o, 200)).filter(Boolean);
        const answer = Number.isInteger(q?.answer) && q.answer >= 0 && q.answer < options.length ? q.answer : 0;
        return { q: str(q?.q, 400), options, answer, why: str(q?.why, 400), source: str(q?.source, 160) };
      }).filter(q => q.q && q.options.length >= 2);
      level.modules.push({
        id: mid, title: str(m?.title, 120) || 'Untitled module', objective: str(m?.objective, 300),
        status: m?.status === 'published' ? 'published' : 'draft',
        owner: str(m?.owner, 80), reviewer: str(m?.reviewer, 80),
        passMark: Math.min(100, Math.max(1, parseInt(m?.passMark, 10) || 75)),
        cards, questions,
      });
    });
    out.levels.push(level);
  });
  return out;
}

/* ---------- views ---------- */
export function publicLearning(c) {
  const p = c.public || {};
  if (p.enabled === false) return { enabled: false };
  return { enabled: true, headline: p.headline, intro: p.intro, steps: p.steps || [] };
}

/* Members never receive correct answers or draft content before they attempt a module. */
export function memberLevels(c) {
  return (c.levels || []).map(l => ({
    id: l.id, title: l.title, audience: l.audience, summary: l.summary,
    modules: (l.modules || []).map(m => m.status === 'published' ? {
      id: m.id, title: m.title, objective: m.objective, status: 'published', owner: m.owner, passMark: m.passMark,
      cards: m.cards || [],
      questions: (m.questions || []).map(q => ({ q: q.q, options: q.options })),
    } : { id: m.id, title: m.title, objective: m.objective, status: 'draft' }),
  }));
}

export function findModule(c, id) {
  for (const l of c.levels || []) for (const m of l.modules || []) if (m.id === id) return m;
  return null;
}

export function grade(m, answers) {
  const qs = m.questions || [];
  const results = qs.map((q, i) => ({ correct: answers[i] === q.answer, answer: q.answer, why: q.why }));
  const right = results.filter(r => r.correct).length;
  const score = qs.length ? Math.round((right / qs.length) * 100) : 100;
  return { score, passed: score >= (m.passMark || 75), results };
}
