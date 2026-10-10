/* Learning Portal content: seed, sanitising, and the three views of it
   (public teaser, committee member, admin). Structure follows the AWI working paper:
   Know SEC -> Know Your Role -> Know How to Execute -> Know How to Lead,
   five levels, every module = video + guide + good/bad + scenario + assessment. */

const mod = (id, title, objective, outline) => ({
  id, title, objective, status: 'draft', owner: '', reviewer: '', video: '',
  guide: outline ? `## Outline — to be written by the content owner\n${outline.map(t => `- ${t}`).join('\n')}` : '',
  good: '', bad: '', scenario: '', passMark: 75, questions: [],
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
            status: 'published', owner: 'President / ExCo', reviewer: '', video: '',
            guide: `## The six standards
SEC asks for high standards, not burnout. The standard is the same for every seat:
- Ownership: if it is yours, you carry it to the end.
- Reliability: people can plan around what you said you would do.
- Quality: you check your own work before anyone else has to.
- Learning: you get better quickly and use feedback.
- Communication: you raise problems early, while they can still be solved.
- Accountability: you can explain what happened and what you will do next.

## What you should not expect
- Constant instructions.
- A title without responsibility.
- A guaranteed leadership position.
- Repeated deadline extensions.
- No accountability.
- Lower standards because the club is voluntary.

## Why this matters
Members give SEC their time, so SEC owes them an organisation worth that time. A clear standard is how that is protected.`,
            good: 'You see that a deliverable will be late on Monday. You tell your lead on Monday, explain the blocker, propose a new date and ask for help on the one part you cannot solve alone.',
            bad: 'You say nothing and hope to catch up. On the deadline you ask for another extension, and nobody knew anything was wrong until then.',
            scenario: 'You own the sponsor deck for an event next week. A teammate who was meant to supply the budget slide has gone quiet for three days, and your lead has not asked about it.',
            passMark: 75,
            questions: [
              { q: 'In the scenario, what is the best first move?', options: ['Wait another few days, they will probably reply', 'Tell your lead now, say what is blocked and propose a plan', 'Build the budget slide yourself without telling anyone', 'Remove the budget slide from the deck'], answer: 1, why: 'Raising it early, with a proposal, is the standard. Silence and quiet workarounds both hide the problem.' },
              { q: 'Which of these should a member expect from SEC?', options: ['A leadership position after one term', 'Repeated deadline extensions when work is hard', 'Real responsibility with clear accountability', 'Constant instructions on what to do next'], answer: 2, why: 'SEC offers responsibility and accountability. It does not offer titles, extensions or constant direction.' },
              { q: 'SEC asks for high standards. What does it say it does not want?', options: ['Quality', 'Burnout', 'Learning', 'Communication'], answer: 1, why: 'High standards are the aim, not burnout.' },
              { q: 'Which standard is shown by telling your lead about a problem while it can still be fixed?', options: ['Communication', 'Learning', 'Quality', 'Reliability'], answer: 0, why: 'Raising problems early is the communication standard.' },
            ],
          },
          {
            id: 'l1-system', title: 'How SEC builds people',
            objective: 'Understand the path from selection to leadership and who owns each part of it.',
            status: 'published', owner: 'AWI', reviewer: '', video: '',
            guide: `## The talent lifecycle
Attract, Select, Train, Deploy, Evaluate, Promote. Recruitment controls who enters. Learning controls how quickly you become capable. Projects give you responsibility. Performance shows who delivers. Leadership development decides who is given more authority.

## Your learning path
- Know SEC: required for every member.
- Know your role: your department's own training.
- Know how to execute: project training.
- Know how to lead: Project Lead and Leadership training, for those heading that way.

## Who owns what
Leadership owns standards. Departments own knowledge. AWI owns systems. If something in a module is wrong or out of date, tell the owner shown on the module.

## How modules work
Every module is short: a video, a written guide, a good and a bad example, a scenario and a short assessment. Pass the assessment and the module is marked complete.`,
            good: 'You finish SEC Core in your first two weeks, then start your department training knowing who to ask when something is unclear.',
            bad: 'You skip the core modules because the work already seems obvious, then escalate to the wrong person when a project goes wrong.',
            scenario: 'A department guide you are reading is out of date: the approval step it describes no longer exists.',
            passMark: 75,
            questions: [
              { q: 'Which line describes who owns what at SEC?', options: ['Leadership owns systems, AWI owns standards', 'Leadership owns standards, departments own knowledge, AWI owns systems', 'Departments own standards, AWI owns knowledge', 'Everyone owns everything equally'], answer: 1, why: 'Leadership owns standards, departments own knowledge, AWI owns systems.' },
              { q: 'What is the right response to an out-of-date guide?', options: ['Ignore it and follow what you heard in a meeting', 'Quietly rewrite it for yourself', 'Tell the owner shown on the module so it is fixed for everyone', 'Stop using the portal'], answer: 2, why: 'Knowledge is owned by departments, so the owner fixes it for the next member too.' },
              { q: 'What does completing a module require?', options: ['Watching the video', 'Passing the short assessment', 'Attending a meeting', 'Asking your lead to sign it off'], answer: 1, why: 'Passing the assessment is the completion record.' },
            ],
          },
          mod('l1-vision', 'SEC vision and direction', 'Know where SEC is going and why the standards exist.', ['SEC vision', 'Why SEC is changing', 'What kind of people SEC wants']),
          mod('l1-structure', 'Structure, departments and projects', 'Know how SEC is organised and how projects are staffed.', ['Organisational structure', 'Departments and reporting lines', 'Project structure and the Project Lead model']),
          mod('l1-comms', 'Communication and weekly updates', 'Communicate in the way SEC expects.', ['Communication rules', 'Weekly updates', 'Internal tools']),
          mod('l1-authority', 'Authority and escalation', 'Know what you can decide and when to escalate.', ['Authority and boundaries', 'Escalation process', 'Cross-department work']),
        ],
      },
      {
        id: 'l2', title: 'Department training', audience: 'Members of each department',
        summary: 'How your department works. Each department writes and owns its own content.',
        modules: [
          mod('l2-brand', 'Brand & Content (example department)', 'Work the way Brand & Content works.', ['Brand standards', 'Content strategy', 'Workflow and approval process', 'Filming and editing', 'Asset management', 'Analytics']),
        ],
      },
      {
        id: 'l3', title: 'Project training', audience: 'Members working on projects',
        summary: 'How SEC plans and delivers projects, start to finish.',
        modules: [
          mod('l3-lifecycle', 'Project lifecycle and timelines', 'Know every stage of a project and its timeline.', ['Project lifecycle', 'Timelines', 'Project planning']),
          mod('l3-budget', 'Budgeting and risk', 'Plan the money and the risks before they cost you.', ['Budgeting', 'Risk']),
          mod('l3-stakeholders', 'Stakeholder management', 'Work well with sponsors, partners and the university.', ['Stakeholder management']),
          mod('l3-review', 'Execution and post-event review', 'Deliver, then learn from it.', ['Execution', 'Post-event review']),
        ],
      },
      {
        id: 'l4', title: 'Project Lead training', audience: 'Project Leads',
        summary: 'Own the final outcome: coordinate people, remove blockers, decide.',
        modules: [
          mod('l4-delegate', 'Delegation and coordination', 'Share the work and keep it moving.', ['Delegation', 'Coordination']),
          mod('l4-decide', 'Decisions and managing delays', 'Decide with incomplete information and recover from delays.', ['Decision-making', 'Managing delays']),
          mod('l4-escalate', 'Escalation and alignment calls', 'Escalate well and run short alignment calls.', ['Escalation', 'Leading short alignment calls']),
          mod('l4-accountable', 'Stakeholder communication and accountability', 'Be accountable for the result, in public.', ['Stakeholder communication', 'Accountability']),
        ],
      },
      {
        id: 'l5', title: 'Leadership training', audience: 'Future Heads of Department and ExCo',
        summary: 'For people being considered for more authority.',
        modules: [
          mod('l5-performance', 'Performance management and feedback', 'Set expectations and give feedback that changes behaviour.', ['Performance management', 'Feedback']),
          mod('l5-department', 'Delegation and department management', 'Run a department without doing all of its work.', ['Delegation', 'Department management']),
          mod('l5-succession', 'Succession and organisational planning', 'Make sure knowledge survives the current committee.', ['Succession', 'Organisational planning']),
          mod('l5-comms', 'Leadership communication', 'Communicate direction and standards clearly.', ['Leadership communication']),
        ],
      },
    ],
    updatedAt: null, updatedBy: null,
  };
}

/* ---------- sanitising (admin writes) ---------- */
const str = (v, n) => String(v ?? '').slice(0, n).trim();
const strKeep = (v, n) => String(v ?? '').slice(0, n); // keeps inner newlines
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
      const video = str(m?.video, 400);
      const questions = (Array.isArray(m?.questions) ? m.questions : []).slice(0, 12).map(q => {
        const options = (Array.isArray(q?.options) ? q.options : []).slice(0, 6).map(o => str(o, 200)).filter(Boolean);
        const answer = Number.isInteger(q?.answer) && q.answer >= 0 && q.answer < options.length ? q.answer : 0;
        return { q: str(q?.q, 300), options, answer, why: str(q?.why, 400) };
      }).filter(q => q.q && q.options.length >= 2);
      level.modules.push({
        id: mid, title: str(m?.title, 120) || 'Untitled module', objective: str(m?.objective, 300),
        status: m?.status === 'published' ? 'published' : 'draft',
        owner: str(m?.owner, 80), reviewer: str(m?.reviewer, 80),
        video: /^https:\/\//i.test(video) ? video : '',
        guide: strKeep(m?.guide, 12000), good: strKeep(m?.good, 2000), bad: strKeep(m?.bad, 2000),
        scenario: strKeep(m?.scenario, 2000),
        passMark: Math.min(100, Math.max(1, parseInt(m?.passMark, 10) || 75)),
        questions,
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
      id: m.id, title: m.title, objective: m.objective, status: 'published', owner: m.owner,
      video: m.video, guide: m.guide, good: m.good, bad: m.bad, scenario: m.scenario, passMark: m.passMark,
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
