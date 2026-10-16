/* Learning Portal content: a flat list of courses. One course = a title, one source file, a deck of
   flashcards and a multiple-choice quiz. There are no levels or sub-modules. Admins add and edit courses
   in Admin > Learning portal; members study the published ones. */

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
    courses: [],
    updatedAt: null, updatedBy: null,
  };
}

/* One-time move from the old levels-and-modules layout to a flat list of courses. Empty placeholder modules are
   dropped; any module that already has flashcards or questions becomes a course, so nothing written is lost. */
export function migrateToCourses(c) {
  const courses = Array.isArray(c.courses) ? c.courses : [];
  for (const l of c.levels || []) for (const m of l.modules || []) {
    if (!(m.cards || []).length && !(m.questions || []).length) continue;
    courses.push({
      id: m.id, title: m.title, status: m.status === 'published' ? 'published' : 'draft', passMark: m.passMark || 75,
      sourceName: m.sourceName || '', generatedAt: m.generatedAt || '', aiGenerated: m.aiGenerated === true,
      cards: m.cards || [], questions: m.questions || [],
    });
  }
  const { levels, ...rest } = c;
  return { ...rest, courses };
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
    courses: [],
  };
  const seen = new Set();
  (Array.isArray(body?.courses) ? body.courses : []).slice(0, 100).forEach((m, i) => {
    let id = slug(m?.id, `course-${i + 1}`); while (seen.has(id)) id += '-x'; seen.add(id);
    const cards = (Array.isArray(m?.cards) ? m.cards : []).slice(0, 60)
      .map(c => ({ front: str(c?.front, 240), back: str(c?.back, 500) })).filter(c => c.front && c.back);
    const questions = (Array.isArray(m?.questions) ? m.questions : []).slice(0, 40).map(q => {
      const options = (Array.isArray(q?.options) ? q.options : []).slice(0, 6).map(o => str(o, 200)).filter(Boolean);
      const answer = Number.isInteger(q?.answer) && q.answer >= 0 && q.answer < options.length ? q.answer : 0;
      return { q: str(q?.q, 400), options, answer, why: str(q?.why, 400), source: str(q?.source, 160) };
    }).filter(q => q.q && q.options.length >= 2);
    out.courses.push({
      id, title: str(m?.title, 120) || 'Untitled course',
      status: m?.status === 'published' ? 'published' : 'draft',
      passMark: Math.min(100, Math.max(1, parseInt(m?.passMark, 10) || 75)),
      sourceName: str(m?.sourceName, 160), generatedAt: str(m?.generatedAt, 40), aiGenerated: m?.aiGenerated === true,
      cards, questions,
    });
  });
  return out;
}

/* ---------- views ---------- */
export function publicLearning(c) {
  const p = c.public || {};
  if (p.enabled === false) return { enabled: false };
  return { enabled: true, headline: p.headline, intro: p.intro, steps: p.steps || [] };
}

/* Members only see published courses, and never the correct answers before they attempt them. */
export function memberCourses(c) {
  return (c.courses || []).filter(m => m.status === 'published').map(m => ({
    id: m.id, title: m.title, status: 'published', passMark: m.passMark,
    cards: m.cards || [],
    questions: (m.questions || []).map(q => ({ q: q.q, options: q.options })),
  }));
}

export function findCourse(c, id) {
  return (c.courses || []).find(m => m.id === id) || null;
}

export function grade(m, answers) {
  const qs = m.questions || [];
  const results = qs.map((q, i) => ({ correct: answers[i] === q.answer, answer: q.answer, why: q.why }));
  const right = results.filter(r => r.correct).length;
  const score = qs.length ? Math.round((right / qs.length) * 100) : 100;
  return { score, passed: score >= (m.passMark || 75), results };
}
