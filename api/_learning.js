/* Learning Portal content: seed, sanitising, and the three views of it
   (public teaser, committee member, admin). Structure follows the AWI working paper:
   Know SEC -> Know Your Role -> Know How to Execute -> Know How to Lead,
   five levels. Every module is a deck of flashcards plus a multiple-choice quiz. */

const card = (front, back) => ({ front, back });
const mod = (id, title, objective) => ({
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
      {
        id: 'l1', title: 'SEC Core', audience: 'Every member',
        summary: 'How SEC operates. Short, required, and the same for everyone.',
        modules: [
          {
            id: 'l1-standard', title: 'The SEC standard',
            objective: 'Know what SEC expects from every member and what you should not expect from SEC.',
            status: 'published', owner: 'President / ExCo', reviewer: '', passMark: 75,
            cards: [
              card('What does SEC ask of every member?', 'High standards, not burnout.'),
              card('Ownership', 'If it is yours, you carry it to the end.'),
              card('Reliability', 'People can plan around what you said you would do.'),
              card('Quality', 'You check your own work before anyone else has to.'),
              card('Learning', 'You get better quickly and you use feedback.'),
              card('Communication', 'You raise problems early, while they can still be solved.'),
              card('Accountability', 'You can explain what happened and what you will do next.'),
              card('Can you expect constant instructions at SEC?', 'No. You own your work and act without being chased.'),
              card('Can you expect a title without responsibility?', 'No. Titles come with responsibility.'),
              card('Is a leadership position guaranteed?', 'No. It is earned through delivery.'),
              card('Are repeated deadline extensions normal?', 'No. Raise a problem early instead of asking for more time at the deadline.'),
              card('Is the standard lower because SEC is voluntary?', 'No. The standard is the same.'),
              card('You can see a deliverable will be late. What do you do?', 'Tell your lead early. Say what is blocked, propose a new date and ask for help on the part you cannot solve.'),
            ],
            questions: [
              { q: 'You own the sponsor deck for an event next week. A teammate who should supply the budget slide has gone quiet for three days, and your lead has not asked. What is the best first move?', options: ['Wait another few days, they will probably reply', 'Tell your lead now, say what is blocked and propose a plan', 'Build the budget slide yourself without telling anyone', 'Remove the budget slide from the deck'], answer: 1, why: 'Raising it early, with a proposal, is the standard. Silence and quiet workarounds both hide the problem.' },
              { q: 'Which of these should a member expect from SEC?', options: ['A leadership position after one term', 'Repeated deadline extensions when work is hard', 'Real responsibility with clear accountability', 'Constant instructions on what to do next'], answer: 2, why: 'SEC offers responsibility and accountability. It does not offer titles, extensions or constant direction.' },
              { q: 'SEC asks for high standards. What does it say it does not want?', options: ['Quality', 'Burnout', 'Learning', 'Communication'], answer: 1, why: 'High standards are the aim, not burnout.' },
              { q: 'Which standard is shown by telling your lead about a problem while it can still be fixed?', options: ['Communication', 'Learning', 'Quality', 'Reliability'], answer: 0, why: 'Raising problems early is the communication standard.' },
              { q: 'Which of these is one of the six SEC standards?', options: ['Popularity', 'Accountability', 'Seniority', 'Speed of reply'], answer: 1, why: 'The six are ownership, reliability, quality, learning, communication and accountability.' },
              { q: 'You promised a draft for Friday. On Wednesday you realise you cannot finish. What should you do?', options: ['Tell your lead on Wednesday with a new date and what help you need', 'Send what you have on Friday without comment', 'Ask for an extension on Friday', 'Say nothing and finish it over the weekend'], answer: 0, why: 'Early notice with a plan lets others adjust. Telling people on the deadline does not.' },
            ],
          },
          {
            id: 'l1-system', title: 'How SEC builds people',
            objective: 'Understand the path from selection to leadership and who owns each part of it.',
            status: 'published', owner: 'AWI', reviewer: '', passMark: 75,
            cards: [
              card('The six stages of the SEC talent lifecycle', 'Attract, Select, Train, Deploy, Evaluate, Promote.'),
              card('Recruitment controls…', 'who enters SEC.'),
              card('Learning controls…', 'how quickly new members become capable.'),
              card('Projects give members…', 'responsibility.'),
              card('Performance shows…', 'who delivers.'),
              card('Leadership development decides…', 'who should receive more authority.'),
              card('The four-step learning path', 'Know SEC, Know your role, Know how to execute, Know how to lead.'),
              card('Know SEC is for…', 'every member. It is required.'),
              card('Who owns the standards?', 'Leadership (President and ExCo).'),
              card('Who owns the knowledge?', 'Departments.'),
              card('Who owns the systems?', 'AWI.'),
              card('A guide is out of date. What do you do?', 'Tell the owner named on the module, so it is fixed for everyone.'),
              card('How is a module completed?', 'Study the cards, then pass the quiz.'),
            ],
            questions: [
              { q: 'Which line describes who owns what at SEC?', options: ['Leadership owns systems, AWI owns standards', 'Leadership owns standards, departments own knowledge, AWI owns systems', 'Departments own standards, AWI owns knowledge', 'Everyone owns everything equally'], answer: 1, why: 'Leadership owns standards, departments own knowledge, AWI owns systems.' },
              { q: 'What is the right response to an out-of-date guide?', options: ['Ignore it and follow what you heard in a meeting', 'Quietly rewrite it for yourself', 'Tell the owner shown on the module so it is fixed for everyone', 'Stop using the portal'], answer: 2, why: 'Knowledge is owned by departments, so the owner fixes it for the next member too.' },
              { q: 'What does completing a module require?', options: ['Reading every card once', 'Passing the quiz', 'Attending a meeting', 'Asking your lead to sign it off'], answer: 1, why: 'Passing the quiz is the completion record.' },
              { q: 'Which is the correct order of the learning path?', options: ['Know how to lead, Know SEC, Know your role, Know how to execute', 'Know SEC, Know your role, Know how to execute, Know how to lead', 'Know your role, Know SEC, Know how to lead, Know how to execute', 'Know how to execute, Know your role, Know SEC, Know how to lead'], answer: 1, why: 'Every member starts with SEC, then their role, then execution, then leading.' },
              { q: 'In the SEC talent lifecycle, what does learning control?', options: ['Who enters SEC', 'Who gets more authority', 'How quickly members become capable', 'Who delivers'], answer: 2, why: 'Learning controls how quickly they become capable.' },
            ],
          },
          mod('l1-vision', 'SEC vision and direction', 'Know where SEC is going and why the standards exist.'),
          mod('l1-structure', 'Structure, departments and projects', 'Know how SEC is organised and how projects are staffed.'),
          mod('l1-comms', 'Communication and weekly updates', 'Communicate in the way SEC expects.'),
          mod('l1-authority', 'Authority and escalation', 'Know what you can decide and when to escalate.'),
        ],
      },
      {
        id: 'l2', title: 'Department training', audience: 'Members of each department',
        summary: 'How your department works. Each department writes and owns its own content.',
        modules: [mod('l2-brand', 'Brand & Content (example department)', 'Work the way Brand & Content works.')],
      },
      {
        id: 'l3', title: 'Project training', audience: 'Members working on projects',
        summary: 'How SEC plans and delivers projects, start to finish.',
        modules: [
          mod('l3-lifecycle', 'Project lifecycle and timelines', 'Know every stage of a project and its timeline.'),
          mod('l3-budget', 'Budgeting and risk', 'Plan the money and the risks before they cost you.'),
          mod('l3-stakeholders', 'Stakeholder management', 'Work well with sponsors, partners and the university.'),
          mod('l3-review', 'Execution and post-event review', 'Deliver, then learn from it.'),
        ],
      },
      {
        id: 'l4', title: 'Project Lead training', audience: 'Project Leads',
        summary: 'Own the final outcome: coordinate people, remove blockers, decide.',
        modules: [
          mod('l4-delegate', 'Delegation and coordination', 'Share the work and keep it moving.'),
          mod('l4-decide', 'Decisions and managing delays', 'Decide with incomplete information and recover from delays.'),
          mod('l4-escalate', 'Escalation and alignment calls', 'Escalate well and run short alignment calls.'),
          mod('l4-accountable', 'Stakeholder communication and accountability', 'Be accountable for the result, in public.'),
        ],
      },
      {
        id: 'l5', title: 'Leadership training', audience: 'Future Heads of Department and ExCo',
        summary: 'For people being considered for more authority.',
        modules: [
          mod('l5-performance', 'Performance management and feedback', 'Set expectations and give feedback that changes behaviour.'),
          mod('l5-department', 'Delegation and department management', 'Run a department without doing all of its work.'),
          mod('l5-succession', 'Succession and organisational planning', 'Make sure knowledge survives the current committee.'),
          mod('l5-comms', 'Leadership communication', 'Communicate direction and standards clearly.'),
        ],
      },
    ],
    updatedAt: null, updatedBy: null,
  };
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
        return { q: str(q?.q, 400), options, answer, why: str(q?.why, 400) };
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
