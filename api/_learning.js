/* Learning Portal content: seed, sanitising, and the three views of it
   (public teaser, committee member, admin). Structure follows the AWI working paper:
   Know SEC -> Know Your Role -> Know How to Execute -> Know How to Lead,
   five levels. Every module is a deck of flashcards plus a multiple-choice quiz. */

const card = (front, back) => ({ front, back });
const mod = (id, title, objective) => ({
  id, title, objective, status: 'draft', owner: '', reviewer: '', passMark: 75, cards: [], questions: [],
});

/* Drafts written from general good practice for the topics the working paper lists. They carry no SEC-specific
   rules, stay hidden from members until an owner reviews them and publishes, and the working paper requires a
   human review of every module before it goes live. */
const draft = (id, title, objective, cards, questions) => ({
  id, title, objective, status: 'draft', owner: '', reviewer: '', passMark: 75,
  cards: cards.map(([f, b]) => card(f, b)),
  questions: questions.map(([q, options, answer, why]) => ({ q, options, answer, why })),
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
          draft('l3-lifecycle', 'Project lifecycle and timelines', 'Know every stage of a project and build a timeline you can keep to.', [
            ['The five stages of a project', 'Define, plan, run, adjust, review.'],
            ['Define: what must be settled first?', 'The goal in one sentence, how you will know it worked, what is in scope, and who owns it.'],
            ['Scope', 'What the project will and will not deliver. Anything outside it is a new decision.'],
            ['Plan: how do you build a timeline?', 'Start from the fixed date and work backwards. List the tasks and give each one an owner and a date.'],
            ['Milestone', 'A checkpoint that shows real progress, such as "venue confirmed".'],
            ['Dependency', 'A task that cannot start until another one finishes. A delay in one moves the others.'],
            ['Why add buffer time?', 'Things take longer than planned. Buffer protects the fixed date.'],
            ['Run and adjust', 'Check progress against milestones often. Fix slips early instead of hoping to catch up.'],
            ['Review', 'Close the project by recording what worked, what did not and what to change next time.'],
          ], [
            ['Your event is on 20 March. Where should the timeline start?', ['From today, adding tasks as they come up', 'From 20 March, working backwards', 'From the budget', 'From the first meeting'], 1, 'Start from the fixed date and work backwards so every task has a deadline that protects it.'],
            ['Which of these is a dependency?', ['Printing posters can only start once the design is approved', 'The event has a budget', 'The team has five people', 'The venue is on campus'], 0, 'A dependency is a task that must wait for another to finish.'],
            ['What does scope mean?', ['The project budget', 'What the project will and will not deliver', 'The team list', 'The event date'], 1, 'Scope is the boundary of what the project delivers.'],
            ['A milestone should show...', ['How busy the team is', 'Real progress', 'How many meetings were held', 'Who is in charge'], 1, 'A milestone is a checkpoint for real progress.'],
            ['A task slips by two days. What is the best response?', ['Wait and see if it fixes itself', 'Tell the team now and re-check the timeline and dependencies', 'Delete the task', 'Quietly move the project date'], 1, 'Surface slips early and re-check what depends on the late task.'],
          ]),
          draft('l3-budget', 'Budgeting and risk', 'Plan the money and the risks before they cost you.', [
            ['Where does a budget start?', 'With a list of every cost, each backed by a quote or a reasonable estimate.'],
            ['Contingency', 'A small reserve for costs you could not foresee. Keep it separate and use it only with approval.'],
            ['Actual vs budget', 'Record what you really spend and compare it to the plan as you go, not at the end.'],
            ['Before you spend', 'Check you have approval and that the item is in the budget.'],
            ['What is a risk?', 'Something that might go wrong and hurt the project. It has not happened yet.'],
            ['How do you rank a risk?', 'By how likely it is and how much damage it would do.'],
            ['A simple risk list', 'Risk, likelihood, impact, who owns it and what you will do about it.'],
            ['Four ways to respond to a risk', 'Avoid it, reduce it, hand it to someone else, or accept it knowingly.'],
            ['Early warning sign', 'A signal that a risk is becoming real, such as a sponsor not replying. Watch for these.'],
          ], [
            ['Why keep a contingency in the budget?', ['To spend on extras', 'To cover costs you could not foresee', 'To make the budget look bigger', 'To pay the team'], 1, 'Contingency covers surprises, and it should be used only with approval.'],
            ['When should you compare actual spending to the budget?', ['Only after the project ends', 'As you go', 'Never, if the total looks fine', 'Only when asked'], 1, 'Tracking as you go lets you correct before you overspend.'],
            ['Which best describes a risk?', ['A problem that has already happened', 'Something that might go wrong', 'A task on the timeline', 'A cost in the budget'], 1, 'A risk is a possible future problem. Once it happens it is an issue.'],
            ['A key sponsor has not replied for two weeks. This is...', ['Nothing to worry about', 'An early warning sign to act on', 'A budget line', 'A milestone'], 1, 'Silence from a key party is a warning sign. Follow up and prepare a fallback.'],
            ['Which is NOT one of the four ways to respond to a risk?', ['Avoid it', 'Reduce it', 'Ignore it without telling anyone', 'Accept it knowingly'], 2, 'Accepting a risk is fine if it is a conscious decision. Ignoring it is not.'],
          ]),
          draft('l3-stakeholders', 'Stakeholder management', 'Work well with sponsors, partners and the university.', [
            ['Stakeholder', 'Anyone who is affected by the project or can affect it, such as sponsors, the university, partners and attendees.'],
            ['First step', 'List your stakeholders and write down what each one needs from the project.'],
            ['One point of contact', 'Give each outside party one named person at SEC, so they never get mixed messages.'],
            ['Set expectations early', 'Say what you will deliver, by when, and what you need from them.'],
            ['Confirm in writing', 'After a call, send a short message with what was agreed, so nothing is misremembered.'],
            ['Update regularly', 'Share short progress updates before they have to ask.'],
            ['Bad news', 'Tell them early, with what you are doing about it. They will trust you more, not less.'],
            ['After the project', 'Thank them and share the results. It keeps the door open for next time.'],
          ], [
            ['Why give each outside party one point of contact?', ['To make the team smaller', 'To avoid mixed messages', 'To save money', 'Because it is a university rule'], 1, 'A single contact keeps the message consistent.'],
            ['After a phone call with a sponsor, what should you do?', ['Nothing, you both heard it', 'Send a short written summary of what was agreed', 'Wait for them to write', 'Tell the team later'], 1, 'A written follow-up prevents misunderstandings.'],
            ['You find out a deliverable will be late. What is best for the stakeholder?', ['Tell them early with a plan', 'Wait until the deadline', 'Say nothing and hope', 'Blame another team'], 0, 'Early honesty with a plan keeps trust.'],
            ['Who counts as a stakeholder?', ['Only the sponsors', 'Only the team', 'Anyone affected by the project or able to affect it', 'Only the university'], 2, 'Stakeholders include anyone affected by or able to affect the project.'],
          ]),
          draft('l3-review', 'Execution and post-event review', 'Deliver the event well, then learn from it.', [
            ['Run sheet', 'A minute-by-minute plan for the day, with an owner for every item.'],
            ['Before the day', 'Check every task has an owner, confirm suppliers and speakers, and brief the team.'],
            ['On the day', 'Keep one person in charge of decisions, and use one place for updates.'],
            ['Decisions log', 'A short record of what was decided, by whom and why.'],
            ['Post-event review', 'A short meeting soon after the event while memory is fresh.'],
            ['Four questions for a review', 'What went well? What did not? Why? What will we change?'],
            ['Blameless review', 'Look at what happened and the process, not who to blame. People then tell the truth.'],
            ['Hand over', 'Write the lessons and the documents down where the next team can find them.'],
          ], [
            ['What is a run sheet?', ['A budget', 'A minute-by-minute plan with owners', 'A guest list', 'A sponsor list'], 1, 'A run sheet lists what happens when, and who is responsible.'],
            ['When should the post-event review happen?', ['Months later', 'Soon after the event', 'Never, if it went well', 'Only if something went wrong'], 1, 'Soon after, while everyone remembers.'],
            ['What is the point of a blameless review?', ['To avoid learning', 'So people say what really happened', 'To protect the leader', 'To skip the meeting'], 1, 'People are honest when the goal is learning, not blame.'],
            ['Which is one of the four review questions?', ['Who was at fault?', 'What will we change?', 'Who was late?', 'Who spent the most?'], 1, 'The review ends with what to change.'],
            ['Why write the lessons down?', ['For the next team to use', 'To fill a folder', 'Because someone asked', 'To keep them private'], 0, 'Written lessons survive the current team.'],
          ]),
        ],
      },
      {
        id: 'l4', title: 'Project Lead training', audience: 'Project Leads',
        summary: 'Own the final outcome: coordinate people, remove blockers, decide.',
        modules: [
          draft('l4-delegate', 'Delegation and coordination', 'Share the work and keep it moving. A Project Lead takes responsibility for the final outcome and coordinates others.', [
            ['What does a Project Lead own?', 'The final outcome, even when others do the tasks.'],
            ['Delegate the outcome, not just the task', 'Say what result you need, not only what to do.'],
            ['A good brief has...', 'The outcome, the deadline, any limits, what the person can decide, and when you will check in.'],
            ['Match the task to the person', 'Think about their skills, their time and what they need to learn.'],
            ['Check in at agreed points', 'Short, planned check-ins catch problems early without hovering.'],
            ['Micromanaging', 'Checking every step. It slows people down and shows you do not trust them.'],
            ['Doing everything yourself', 'It does not scale. The project then depends on one tired person.'],
            ['Coordinate', 'Keep everyone aware of who is doing what and how their work fits together.'],
            ['Give credit', 'Name the people who did the work. It builds the team you will need next time.'],
          ], [
            ['You delegate a task. What should the brief include?', ['Only the task name', 'The outcome, deadline, limits, what they can decide and when you will check in', 'Only the deadline', 'Nothing, they will figure it out'], 1, 'A clear brief lets people work without being chased or micromanaged.'],
            ['Who is responsible for the final outcome when tasks are delegated?', ['Whoever did the last task', 'The Project Lead', 'The sponsor', 'Nobody in particular'], 1, 'Delegating tasks does not delegate responsibility for the outcome.'],
            ['Which is micromanaging?', ['Agreed weekly check-ins', 'Asking to see every small step before it is done', 'Giving a clear brief', 'Naming who owns what'], 1, 'Checking every step slows people down.'],
            ['Why is doing everything yourself a problem?', ['It is too cheap', 'The project depends on one person', 'It is against the rules', 'It makes the team too big'], 1, 'It does not scale and creates a single point of failure.'],
          ]),
          draft('l4-decide', 'Decisions and managing delays', 'Decide with incomplete information and recover from delays.', [
            ['Do you need all the information to decide?', 'No. Decide with enough information, then adjust if you learn more.'],
            ['Easy to undo vs hard to undo', 'Decide quickly on things you can undo. Take more care over things you cannot.'],
            ['Set a decision deadline', 'Say when a decision will be made, so the team is not left waiting.'],
            ['Consult, then decide', 'Hear the people affected, then make the call and say who decided.'],
            ['Record the decision', 'Write down what was decided and why, so it is not reopened by mistake.'],
            ['Spotting a delay', 'Compare progress to the milestones often. A small slip is easier to fix than a big one.'],
            ['Options when you are late', 'Reduce the scope, add help, move the date, or change the approach.'],
            ['Delays and stakeholders', 'Tell them early with your plan to recover. Do not wait until the deadline.'],
            ['After a delay', 'Re-plan the timeline and tell everyone the new dates.'],
          ], [
            ['You have 80% of the information and a decision is due. What should you do?', ['Wait for the other 20%', 'Decide, and adjust if you learn more', 'Ask someone else to decide', 'Cancel the project'], 1, 'Waiting for perfect information is itself a cost.'],
            ['Which decision deserves the most care?', ['One you can easily undo', 'One that cannot be undone', 'A small formatting choice', 'A meeting time'], 1, 'Take more care where a mistake is hard to reverse.'],
            ['Which is an option when the project is running late?', ['Reduce the scope', 'Hide the delay', 'Blame the team', 'Stop updating the plan'], 0, 'Cut scope, add help, move the date or change approach.'],
            ['When should stakeholders hear about a delay?', ['At the deadline', 'Early, with a recovery plan', 'Only if they ask', 'After it is fixed'], 1, 'Early notice with a plan keeps trust.'],
            ['Why record a decision?', ['To avoid reopening it by mistake', 'To fill a document', 'To blame someone later', 'It is not needed'], 0, 'A record keeps the team aligned on what was decided and why.'],
          ]),
          draft('l4-escalate', 'Escalation and alignment calls', 'Escalate well and run short alignment calls.', [
            ['When should you escalate?', 'As soon as you cannot solve it within your authority or in time. Early, not at the deadline.'],
            ['What to bring when you escalate', 'The problem, its impact, what you already tried, your recommendation and the date a decision is needed.'],
            ['Escalate with a recommendation', 'Do not only bring a problem. Say what you think should happen.'],
            ['Escalating is not failing', 'Hiding a problem is the failure. Raising it early is the standard.'],
            ['Alignment call', 'A short call to make sure everyone knows the priorities, who does what and what is blocked.'],
            ['Keep it short', 'Have an agenda and finish when the decisions are made.'],
            ['Who speaks', 'Each owner gives a quick update: done, next, blocked.'],
            ['End of the call', 'Repeat who does what by when. Send it in writing afterwards.'],
          ], [
            ['What should you bring when you escalate a problem?', ['Only the problem', 'The problem, impact, what you tried, a recommendation and a decision date', 'A complaint about the team', 'Nothing yet'], 1, 'A clear package lets the decision-maker act quickly.'],
            ['When is the right time to escalate?', ['As late as possible', 'Early, once it is beyond your authority or time', 'Never', 'After the deadline'], 1, 'Early escalation leaves time to solve the problem.'],
            ['An alignment call should...', ['Last as long as needed for everyone to talk', 'Be short, with an agenda and clear actions', 'Have no agenda', 'Replace all written updates'], 1, 'Short, focused and ending with actions.'],
            ['Each person\'s quick update in an alignment call covers...', ['Done, next, blocked', 'Everything about their week', 'Only good news', 'Only problems'], 0, 'Done, next and blocked keeps it fast and useful.'],
          ]),
          draft('l4-accountable', 'Stakeholder communication and accountability', 'Be accountable for the result, in public.', [
            ['What does accountability mean for a Project Lead?', 'You answer for the outcome: what happened, why and what you will do next.'],
            ['Do not wait to be chased', 'Send updates and raise problems before anyone has to ask.'],
            ['A good stakeholder update', 'What is done, what is next, the risks, and what you need from them.'],
            ['No surprises', 'People should never first hear about a problem from someone else.'],
            ['When you make a mistake', 'Say so, say what you are doing to fix it, and move on. Do not hide it or blame others.'],
            ['Blame vs ownership', 'Blame looks backwards at who. Ownership looks forwards at what happens next.'],
            ['Close the loop', 'When something is done, tell the people who were waiting for it.'],
            ['Communicate problems early', 'Early notice gives others time to help.'],
          ], [
            ['What should a stakeholder update include?', ['Only good news', 'Done, next, risks and what you need', 'Only the budget', 'Only the date'], 1, 'Done, next, risks and needs gives a complete picture.'],
            ['You made a mistake that affects a sponsor. What is best?', ['Hope they do not notice', 'Tell them, explain the fix and move on', 'Blame a teammate', 'Wait until they ask'], 1, 'Own it early and say what you are doing about it.'],
            ['What does "no surprises" mean?', ['Never change the plan', 'People never first hear about a problem from someone else', 'Only share good news', 'Avoid meetings'], 1, 'Share problems yourself and early.'],
            ['Which shows ownership rather than blame?', ['"It was their fault"', '"Here is what happened and what I will do next"', '"Nobody told me"', '"It is out of my hands"'], 1, 'Ownership looks forward to the fix.'],
          ]),
        ],
      },
      {
        id: 'l5', title: 'Leadership training', audience: 'Future Heads of Department and ExCo',
        summary: 'For people being considered for more authority.',
        modules: [
          draft('l5-performance', 'Performance management and feedback', 'Set expectations and give feedback that changes behaviour.', [
            ['Where does good performance start?', 'With clear expectations: what is expected, by when and what good looks like.'],
            ['Measure outputs, not hours', 'Judge the work delivered, not how long someone looked busy.'],
            ['Regular one-to-ones', 'Short, scheduled conversations catch problems early and show you care.'],
            ['Deal with issues early', 'A small problem raised now is easier than a big one raised later.'],
            ['Good feedback is...', 'Specific, timely and about behaviour and its effect, not about the person.'],
            ['A simple feedback pattern', 'Situation, what they did, and the effect it had.'],
            ['Recognise good work', 'Say what was good and why. People repeat what is noticed.'],
            ['Be fair', 'Apply the same standard to everyone and explain your reasons.'],
          ], [
            ['What is the best basis for judging performance?', ['Hours worked', 'Work delivered against clear expectations', 'Who is most visible', 'Who talks most'], 1, 'Outputs against clear expectations are fair and measurable.'],
            ['Which feedback is most useful?', ['"You are careless"', '"In Tuesday\'s meeting the figures were wrong, which confused the sponsor"', '"Try harder"', '"Everyone noticed"'], 1, 'Specific, timely and about the effect.'],
            ['When should you raise a performance issue?', ['Early', 'At the end of the term', 'Never', 'In front of the whole team'], 0, 'Early is easier to fix and fairer.'],
            ['Why recognise good work?', ['People repeat what is noticed', 'It is a formality', 'To avoid feedback', 'To compare people'], 0, 'Specific recognition reinforces good behaviour.'],
          ]),
          draft('l5-department', 'Delegation and department management', 'Run a department without doing all of its work.', [
            ['What is a department head\'s job?', 'To make the department deliver, not to do all the work personally.'],
            ['Be clear about roles', 'Everyone should know what they own and what they can decide.'],
            ['Set priorities', 'Say what matters most this term so people can say no to the rest.'],
            ['Balance the workload', 'Check who is overloaded and who has capacity before assigning work.'],
            ['Onboard new members', 'Give them the role, the standards, the tools and someone to ask.'],
            ['Meeting rhythm', 'A regular short meeting beats many ad hoc ones.'],
            ['Develop people', 'Give members stretch tasks and feedback so they can take on more.'],
            ['When to escalate', 'When it is beyond your authority or affects other departments.'],
          ], [
            ['What is the head of department\'s main job?', ['Do all the work personally', 'Make the department deliver through its people', 'Attend every meeting', 'Approve every message'], 1, 'The head makes the department deliver, mostly through others.'],
            ['Why set clear priorities?', ['So people know what to leave undone', 'To make the list longer', 'To impress the ExCo', 'To avoid meetings'], 0, 'Priorities let people say no to lower-value work.'],
            ['Before giving someone more work, you should check...', ['Their workload and capacity', 'Their year of study', 'Their social media', 'Nothing'], 0, 'Overloaded people deliver less and burn out.'],
            ['What helps a new member become useful quickly?', ['Being left to guess', 'A clear role, the standards, the tools and a person to ask', 'A long lecture', 'Nothing special'], 1, 'Clear onboarding speeds up independence.'],
          ]),
          draft('l5-succession', 'Succession and organisational planning', 'Make sure knowledge survives the current committee.', [
            ['Why plan succession?', 'So the department keeps working when people leave, instead of starting again each term.'],
            ['Write it down', 'Process, templates, contacts and lessons should live in shared documents, not in someone\'s head.'],
            ['Handover document', 'What the role does, what is in progress, who to contact and what to watch for.'],
            ['Shadowing', 'Let the likely successor work alongside you before they take over.'],
            ['Overlap period', 'A short period when the old and new holder are both around to answer questions.'],
            ['Spot successors early', 'Notice who delivers and show them what the next role involves.'],
            ['Record decisions', 'Keep the reason behind decisions so the next team does not repeat old debates.'],
            ['Keep knowledge in one place', 'Use the shared tools SEC provides so everyone can find it.'],
          ], [
            ['Why write processes and contacts down?', ['So they survive when people leave', 'To make a longer folder', 'To check on members', 'Because it is fun'], 0, 'Written knowledge outlives the current committee.'],
            ['What does a good handover document include?', ['Only a thank-you', 'What the role does, what is in progress, who to contact and what to watch for', 'Only the budget', 'Only the contacts'], 1, 'It lets the successor start without guessing.'],
            ['What is the benefit of an overlap period?', ['The successor can ask the previous holder questions', 'It doubles the cost', 'It slows everything', 'It removes the need for notes'], 0, 'Overlap transfers knowledge that is hard to write down.'],
            ['How do you find future leaders?', ['Notice who delivers and prepare them early', 'Pick whoever is loudest', 'Pick at random', 'Wait until someone leaves'], 0, 'Reliable delivery is the best signal, and early preparation helps.'],
          ]),
          draft('l5-comms', 'Leadership communication', 'Communicate direction and standards clearly.', [
            ['Explain why', 'People follow a decision more willingly when they understand the reason.'],
            ['Keep it short and clear', 'One main message, in plain words, said more than once.'],
            ['One message for everyone', 'Give the same information to everyone, so the story does not change between people.'],
            ['Say what you expect', 'State the standard and what good looks like, not only the deadline.'],
            ['Listen first', 'Ask questions and listen before you decide. You will often learn something that changes the plan.'],
            ['Bad news', 'Say it directly and early, with what happens next.'],
            ['Follow up in writing', 'After a meeting, send what was decided and who does what.'],
            ['Be consistent', 'Your actions should match your message. People believe what you do.'],
          ], [
            ['Why explain the reason behind a decision?', ['It slows things down', 'People follow decisions more willingly when they understand them', 'It is a formality', 'To avoid questions'], 1, 'Understanding builds commitment.'],
            ['How should bad news be given?', ['Directly and early, with what happens next', 'Late and vaguely', 'Through someone else', 'Not at all'], 0, 'Directness and a next step build trust.'],
            ['Why follow up in writing?', ['It records what was decided and who does what', 'To look busy', 'To replace meetings', 'To avoid talking'], 0, 'Written follow-ups prevent misremembering.'],
            ['What makes a leader\'s message believable?', ['Fancy words', 'Actions that match it', 'Repeating it loudly', 'Long speeches'], 1, 'People believe what you do.'],
          ]),
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
