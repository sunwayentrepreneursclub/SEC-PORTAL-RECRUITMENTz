/* Learning Portal content: seed, sanitising, and the three views of it
   (public teaser, committee member, admin). Structure follows the AWI working paper:
   Know SEC -> Know Your Role -> Know How to Execute -> Know How to Lead,
   five levels. Every module is a deck of flashcards plus a multiple-choice quiz. */

const card = (front, back) => ({ front, back });

/* Every module is built only from the SEC Club Charter 2026-2027 or the AWI Working Paper, and each quiz answer
   cites its source clause. Nothing here is general advice. */
const draft = (id, title, objective, cards, questions) => ({
  id, title, objective, status: 'draft', owner: '', reviewer: '', passMark: 75,
  cards: cards.map(([f, b]) => card(f, b)),
  questions: questions.map(([q, options, answer, why]) => ({ q, options, answer, why })),
});

/* Modules written directly from the SEC Club Charter 2026-2027 (D-01). Charter clause numbers are in the "why". */
const fromPaper = (id, title, objective, owner, cards, questions) => ({
  ...draft(id, title, objective, cards, questions), status: 'published', owner,
});
const fromCharter = (id, title, objective, owner, cards, questions) => ({
  ...draft(id, title, objective, cards, questions), status: 'published', owner,
});

export function seedLearning() {
  const c = {
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
          fromPaper('l1-standard', 'The SEC standard', 'Know what SEC expects from every member and what you should not expect from SEC.', 'President / ExCo', [
            ['What does SEC say it communicates to members?', 'High standards, not burnout.'],
            ['The six standards', 'Ownership, reliability, quality, learning, communication and accountability.'],
            ['What is SEC for?', 'People who want to build, take ownership and improve fast.'],
            ['What do you get at SEC that a normal student club does not offer?', 'Real projects, meaningful responsibilities, and capabilities you would not normally get from a normal student club.'],
            ['Who does SEC want to discourage?', 'People who only want titles, certificates, social activities or a low-effort committee experience.'],
            ['Should you expect constant instructions?', 'No.'],
            ['Should you expect a title without responsibility?', 'No.'],
            ['Should you expect a guaranteed leadership position?', 'No.'],
            ['Should you expect repeated deadline extensions?', 'No.'],
            ['Should you expect no accountability?', 'No.'],
            ['Is the standard lower because the club is voluntary?', 'No.'],
            ['SEC\'s closing line', 'Don\'t join for the title. Join to become capable.'],
            ['Every task must have...', 'A responsible owner, an accountable officer, a deadline and a visible status. Never "the team". (Charter 4.4.16)'],
            ['A task is blocked for more than 48 hours. What happens?', 'It is escalated to the relevant VP. (Charter 4.4.15)'],
          ], [
            ['SEC says it communicates which of these?', ['High standards, not burnout', 'Fun above everything', 'Certificates for everyone', 'Networking first'], 0, 'AWI Working Paper, section 7.'],
            ['Which of these is one of the six standards?', ['Accountability', 'Popularity', 'Seniority', 'Speed of reply'], 0, 'AWI Working Paper, section 7: ownership, reliability, quality, learning, communication, accountability.'],
            ['Which of these should a member expect from SEC?', ['Real project responsibilities', 'Constant instructions', 'A guaranteed leadership position', 'Repeated deadline extensions'], 0, 'AWI Working Paper, sections 4 and 7: members should not expect constant instructions, titles without responsibility, guaranteed leadership or repeated extensions.'],
            ['Who does SEC want to discourage from joining?', ['People who only want titles, certificates or a low-effort experience', 'People who want responsibility', 'People who want to build', 'People who want to learn quickly'], 0, 'AWI Working Paper, section 3.'],
            ['Is the standard lower because the club is voluntary?', ['No', 'Yes, always', 'Only for first years', 'Only in the first month'], 0, 'AWI Working Paper, section 7.'],
            ['A task has been blocked for more than 48 hours. What does the charter say?', ['Escalate it to the relevant VP', 'Let it wait', 'Cancel it', 'Hand it to the Auditor'], 0, 'Charter 4.4.15.'],
            ['Which line is SEC\'s closing message?', ['Don\'t join for the title. Join to become capable.', 'Join for the certificate.', 'Join to meet people.', 'Join for the fun.'], 0, 'AWI Working Paper, section 9.'],
          ]),
          fromPaper('l1-system', 'How SEC builds people', 'Understand the path from selection to leadership and who owns each part of it.', 'AWI', [
            ['The six stages of the SEC talent lifecycle', 'Attract, Select, Train, Deploy, Evaluate, Promote.'],
            ['Recruitment controls...', 'Who enters.'],
            ['Learning controls...', 'How quickly they become capable.'],
            ['Projects give...', 'Members responsibility.'],
            ['Performance shows...', 'Who delivers.'],
            ['Leadership development determines...', 'Who should receive more authority.'],
            ['The four-step learning path', 'Know SEC, Know your role, Know how to execute, Know how to lead.'],
            ['Who is Know SEC for?', 'Every member.'],
            ['Who owns the standards?', 'Leadership.'],
            ['Who owns the knowledge?', 'Departments.'],
            ['Who owns the systems?', 'AWI.'],
            ['Who updates the Department Execution Manual (D-03)?', 'The VPs (R-02 to R-05) and the HODs, refreshed each term. (Charter Appendix A2)'],
            ['How is a module on this portal completed?', 'Study the flashcards, then pass the quiz.'],
          ], [
            ['What are the stages of the SEC talent lifecycle, in order?', ['Attract, Select, Train, Deploy, Evaluate, Promote', 'Train, Attract, Promote, Select, Evaluate, Deploy', 'Select, Attract, Deploy, Train, Promote, Evaluate', 'Evaluate, Promote, Attract, Train, Select, Deploy'], 0, 'AWI Working Paper, section 1.'],
            ['Which line describes who owns what?', ['Leadership owns standards, departments own knowledge, AWI owns systems', 'AWI owns standards, leadership owns systems', 'Departments own standards, AWI owns knowledge', 'Everyone owns everything'], 0, 'AWI Working Paper, section 15.'],
            ['What does learning control, in the working paper\'s final mandate?', ['How quickly they become capable', 'Who enters', 'Who delivers', 'Who gets more authority'], 0, 'AWI Working Paper, section 23.'],
            ['What is the order of the learning path?', ['Know SEC, Know your role, Know how to execute, Know how to lead', 'Know how to lead first', 'Know your role, then Know SEC', 'There is no order'], 0, 'AWI Working Paper, section 12.'],
            ['Who updates the Department Execution Manual (D-03)?', ['The VPs and the HODs', 'Only the Secretary', 'Only the Auditor', 'Student LIFE'], 0, 'Charter Appendix A2: R-02 to R-05 and the HODs, refreshed each term.'],
            ['How do you complete a module on this portal?', ['Pass the quiz', 'Open the page', 'Ask a VP', 'Wait a week'], 0, 'This portal: a module is complete when you pass its quiz.'],
          ]),
          fromCharter('l1-vision', 'SEC vision and direction', 'Know where SEC is going, what it is for and what it is building.', 'President / ExCo', [
            ['SEC\'s vision', 'To be Sunway University\'s leading entrepreneurship ecosystem: a self-sustaining platform of digital authority, owned community and proven execution that produces operators, not just members, and strengthens with every committee handover rather than resetting to zero.'],
            ['SEC\'s mission', 'To build a community of aspiring entrepreneurs and innovators, fostering real-world skills, professional connections and opportunities beyond campus, to help members turn ideas into reality and become future business leaders.'],
            ['What does SEC want to produce?', 'Operators, not just members.'],
            ['What does "strengthens with every handover" mean?', 'Each incoming committee inherits a working system, not a blank slate.'],
            ['Objective: Develop Operators, Not Just Members', 'Equip students with practical skills, creative thinking and entrepreneurial values through training, mentorship and hands-on projects.'],
            ['Objective: Build Digital Authority', 'Make SEC\'s social presence a credibility platform that reaches strangers and sponsors, not just existing members. It is the entry point to the SEC flywheel.'],
            ['Objective: Build Owned Community Infrastructure', 'Grow Sunway Nexus by SEC into a warm, owned audience that reduces dependence on cold outreach for attendance and recruitment.'],
            ['Objective: Run an Activation Platform', 'Run events as a proof layer: documented, repeatable and content-producing, turning digital authority into physical credibility.'],
            ['Objective: Build Institutional Assets', 'Maintain the D-01 to D-07 documents and Notion so each incoming committee inherits a working system.'],
            ['Objective: Provide Real-World Pathways', 'Create internship, training and working-experience pathways through Sunway Education Group and industry partners.'],
            ['What is Sunway Nexus by SEC?', 'SEC\'s cross-campus community platform connecting entrepreneurs, mentors, sponsors, startups and partner clubs, run as a hybrid digital and physical ecosystem.'],
            ['SEC\'s three areas of activity', 'Programmes, digital infrastructure and member pathways.'],
            ['When is the term of office?', '1 March to the last day of February the following year.'],
          ], [
            ['What does SEC\'s vision say it wants to produce?', ['Operators, not just members', 'The largest membership', 'Certificates', 'Social events'], 0, 'Charter 1.2: a platform that produces operators, not just members.'],
            ['Which is one of SEC\'s six objectives?', ['Build Digital Authority', 'Maximise ticket sales', 'Replace Student LIFE', 'Hold weekly parties'], 0, 'Charter 1.4 lists Build Digital Authority among the six objectives.'],
            ['What does a "working system, not a blank slate" mean at handover?', ['Each new committee inherits documents and infrastructure that already work', 'Each new committee starts from nothing', 'Only the President hands over', 'Handover is optional'], 0, 'Charter 1.4, Build Institutional Assets, and the vision: strengthen with every handover rather than reset to zero.'],
            ['Sunway Nexus by SEC is...', ['A cross-campus community platform run digitally and physically', 'The SEC logo', 'A budget file', 'A student council'], 0, 'Charter Part 0: SEC\'s cross-campus community platform, a hybrid digital and physical ecosystem.'],
            ['Which of these is one of SEC\'s three areas of activity?', ['Member pathways', 'Property investment', 'Sports league', 'Student housing'], 0, 'Charter 2.1: programmes, digital infrastructure and member pathways.'],
            ['When does a committee\'s term of office start?', ['1 March', '1 January', '1 July', '1 September'], 0, 'Charter 4.1: 1 March to the last day of February.'],
          ]),
          fromCharter('l1-structure', 'Structure, departments and projects', 'Know how SEC is organised, who sits where, and how every task gets an owner.', 'President / ExCo', [
            ['What is ExCo?', 'The President (R-01) and four Vice Presidents (R-02 to R-05), the club\'s executive leadership.'],
            ['The four VP portfolios', 'Brand & Content, People & Operations, Partnerships & Growth, and Events.'],
            ['Who holds the Brand & Content portfolio?', 'The President, permanently (R-02).'],
            ['Control & Support Officers (six)', 'Secretary (R-06), Vice Secretary (R-07), Club Auditor (R-08), Treasurer (R-09), Vice Treasurer (R-10) and AWI Officer (R-11).'],
            ['Which roles stand alone, outside any VP portfolio?', 'Secretary (R-06), Club Auditor (R-08) and AWI Officer (R-11). They work under the strategic direction of the President.'],
            ['Where does the Treasurer Function sit?', 'Under the VP, Events (R-05).'],
            ['The standard department hierarchy', 'VP, then Head of Department (HOD), then Vice Head or Leader (vHOD), then Executives.'],
            ['The four departments', 'Brand & Content (DEP-01), Partnerships & Growth (DEP-02), People & Operations (DEP-03) and Events (DEP-04).'],
            ['Role codes vs role titles', 'Codes like R-01 are permanent. Titles can change each term.'],
            ['Principal Advisor (R-00)', 'The faculty member appointed by the University as SEC\'s primary institutional advisor.'],
            ['Every task must have...', 'A responsible owner, an accountable officer, a deadline and a visible status. Never "the team".'],
            ['RACI: Responsible', 'The person who does the work. Name the actual human.'],
            ['RACI: Accountable', 'The person who owns the outcome and answers for it, usually the relevant VP or HOD.'],
            ['RACI: Consulted', 'Someone whose input is needed before a decision. Consult only the relevant people.'],
            ['RACI: Informed', 'Someone who must be updated. Inform after the decision or action, unless input is needed first.'],
          ], [
            ['Who makes up ExCo?', ['The President and four Vice Presidents', 'All committee members', 'The President and the Treasurer', 'The Heads of Department'], 0, 'Charter Part 0: the President (R-01) and four VPs (R-02 to R-05).'],
            ['Which is the standard department hierarchy?', ['VP, HOD, vHOD or Leader, Executives', 'Executives, HOD, VP, President', 'HOD, VP, vHOD, Executives', 'President, Executives, HOD, VP'], 0, 'Charter 4.4.6.'],
            ['Which role does NOT sit under a VP portfolio?', ['Club Auditor', 'Treasurer', 'Vice Treasurer', 'Events HOD'], 0, 'The Secretary, Club Auditor and AWI Officer are standalone (Charter 4.4.5). The Treasurer sits under the VP, Events (Charter 4.4.1).'],
            ['A new project starts. Who should be named as its Responsible person?', ['The actual person doing the work', 'The whole team', 'Nobody until later', 'The President'], 0, 'Charter 4.4.16 and Appendix B: never assign to "the team".'],
            ['In RACI, the Accountable person is...', ['Usually the relevant VP or HOD, who owns the outcome', 'Anyone who attends the meeting', 'The person who does the work', 'The person told afterwards'], 0, 'Charter Appendix B.'],
            ['How many departments does SEC currently have?', ['Four', 'Two', 'Seven', 'Ten'], 0, 'Charter Appendix A1: DEP-01 to DEP-04.'],
          ]),
          fromCharter('l1-comms', 'Communication and weekly updates', 'Communicate the way SEC expects: on time, in the right place, and without leaking.', 'People & Operations / Secretary', [
            ['Who sets the weekly update format?', 'It is set in D-03, the Department Execution Manual.'],
            ['Who tracks whether departments keep their records?', 'The Secretary (R-06) tracks documentation completeness. Each department still keeps its own records.'],
            ['How often do VPs check in with their HODs?', 'At least once every two weeks.'],
            ['How often do HODs check in with vHODs and Leaders?', 'Weekly.'],
            ['No reply after 24 hours. What can you do?', 'If receipt was confirmed, you may proceed with the last agreed direction.'],
            ['When does the 24-hour rule NOT apply?', 'It never overrides financial controls, Student LIFE requirements or the no-self-approval rule.'],
            ['A task is blocked for more than 48 hours', 'Escalate it to the relevant VP.'],
            ['Two portfolios disagree and 48 hours pass', 'Escalate to the President (R-01).'],
            ['What counts as internal club information?', 'Internal discussions, minutes, club documents, financial records, member information, account credentials, strategy materials, partnership or sponsorship talks, and unresolved governance matters.'],
            ['Can you share screenshots of internal discussions with outsiders?', 'No. Do not disclose, forward, screenshot or share internal information with any unauthorised person.'],
            ['How should new account passwords be shared?', 'Never over personal messaging apps. They go in the official credential record kept by the Secretary (R-06).'],
            ['Who can speak for SEC externally?', 'The President (R-01) or someone the President or relevant VP has authorised. Do not claim authority beyond your role.'],
            ['Where are executives tracked?', 'In Notion. Executive lists change often and are not given role codes.'],
          ], [
            ['No reply came within 24 hours of confirmed receipt. What may you do?', ['Proceed with the last agreed direction', 'Cancel the task', 'Wait a week', 'Ask the President to decide'], 0, 'Charter 4.4.15, as long as financial controls, Student LIFE requirements and no-self-approval still hold.'],
            ['A task has been blocked for more than 48 hours. Who gets it?', ['The relevant VP', 'The Auditor', 'Nobody', 'All members'], 0, 'Charter 4.4.15: blocked more than 48 hours goes to the relevant VP.'],
            ['Which can you share outside the committee?', ['None of the internal documents, minutes or member information', 'Meeting minutes', 'Member lists', 'Account passwords'], 0, 'Charter 4.4.21: do not share internal information with any unauthorised person.'],
            ['How often should a HOD check in with their vHODs and Leaders?', ['Weekly', 'Once a term', 'Every two months', 'Only when there is a problem'], 0, 'Charter 4.5.'],
            ['Where must a new password be stored?', ['The official credential record kept by the Secretary', 'A personal chat', 'A sticky note', 'Email to the whole team'], 0, 'Charter 5.5: not over personal messaging, and recorded by R-06.'],
            ['Who keeps a department\'s records?', ['The department itself, with the Secretary tracking completeness', 'Only the Secretary', 'Only the President', 'Nobody'], 0, 'Charter 4.4.17: R-06 and R-07 do not remove the department\'s own duty.'],
          ]),
          fromCharter('l1-authority', 'Authority and escalation', 'Know what you can decide, who decides the rest, and when to escalate.', 'President / ExCo', [
            ['The golden rule of decisions', 'Decide at the lowest appropriate level, by the officer responsible for the matter.'],
            ['Who decides task-level execution?', 'The vHOD, Leader or assigned committee member.'],
            ['Who decides departmental execution?', 'The HOD.'],
            ['Who decides portfolio direction?', 'The relevant Vice President.'],
            ['Who decides cross-portfolio matters?', 'The relevant Vice Presidents jointly.'],
            ['Who approves financial matters?', 'The Treasurer (R-09) or VP, Events (R-05), under the no-self-approval rule.'],
            ['Who decides disputes, deadlocks and high-impact matters?', 'The President (R-01).'],
            ['Who handles external representation?', 'The President (R-01) or an authorised representative.'],
            ['Cross-portfolio alignment deadline', 'Aim for alignment within 48 hours. If not reached, escalate to the President.'],
            ['Name four reasons to escalate to the President', 'Two VPs disagree; a decision is unresolved after 48 hours; a conflict of interest; significant financial exposure.'],
            ['Is the President involved day to day?', 'No. The President is inactive by default and decisive only when escalation is triggered.'],
            ['The No-Self-Approval Rule', 'Nobody may approve an activity, budget, reimbursement, payment, proposal or decision they are directly involved in as executor or beneficiary.'],
            ['If you have a conflict of interest', 'Declare it to the President or relevant VP, recuse yourself, and let a neutral approver decide.'],
            ['The four financial control principles', 'No budget, no event. No proposal, no approval. No documentation, no reimbursement. No post-event report, no next event approval (unless ExCo waives it).'],
            ['Internal dispute that cannot be resolved', 'Escalate to the President. If still unresolved, refer to Student LIFE in writing.'],
          ], [
            ['A vHOD is blocked on a task for three days. What should happen?', ['It is escalated to the relevant VP', 'It waits for the next term', 'The Auditor decides', 'It is dropped'], 0, 'Charter 4.4.15: blocked more than 48 hours goes to the relevant VP.'],
            ['Two Vice Presidents cannot agree after 48 hours. Who decides?', ['The President', 'The Treasurer', 'The Secretary', 'A vote of all members'], 0, 'Charter 4.4.10 and 4.4.11.'],
            ['You are organising an event and want to approve your own event budget. What is the rule?', ['You cannot. Approval goes to the President or a neutral VP', 'You may approve it', 'Only the Auditor can approve', 'No approval is needed'], 0, 'Charter 4.4.13: no one approves what they are directly involved in.'],
            ['Which is a financial control principle at SEC?', ['No budget, no event', 'Spend first, report later', 'Approve verbally', 'Reimburse without receipts'], 0, 'Charter 4.4.14.'],
            ['How does the President normally act day to day?', ['Inactive by default, decisive only when escalation is triggered', 'Approves every decision', 'Manages every department', 'Chairs every meeting'], 0, 'Charter 4.4.12.'],
            ['Who decides departmental execution?', ['The HOD', 'The President', 'The Auditor', 'The Secretary'], 0, 'Charter 4.4.9 decision-making table.'],
            ['You have a personal relationship with a sponsor being considered. What do you do?', ['Declare it and step out of the decision', 'Keep quiet', 'Decide quickly', 'Ask the sponsor to decide'], 0, 'Charter 6.2: declare and recuse.'],
          ]),
        ],
      },
      {
        id: 'l2', title: 'Department training', audience: 'Members of each department',
        summary: 'Who is who in each department and what each level owns. Departments add their own how-we-work content.',
        modules: [
          fromCharter('l2-brand', 'Brand & Content: roles and reporting', 'Know who is who in Brand & Content and what each level owns.', 'Department head', [
            ['Brand & Content is...', 'Department DEP-01, led at executive level by the VP, Brand & Content (R-02), a portfolio the President holds permanently.'],
            ['Who leads the department day to day?', 'The Brand & Content HOD (R-12), who reports to R-02 / the President.'],
            ['Who sits under the HOD?', 'The Brand & Content vHOD (R-13), who owns a defined execution lane.'],
            ['Who do Brand & Content Executives report to?', 'The vHOD (R-13) or the HOD (R-12). Executives are tracked in Notion and change often.'],
            ['What does a HOD own?', 'Departmental outcomes: execution plans, coordinating members, timelines, deliverables, output quality and progress reports to the VP.'],
            ['What does a vHOD own?', 'A defined execution lane: recurring tasks, assigned workstreams, day-to-day continuity, and backing up the HOD where formally delegated.'],
            ['Where is the detailed way of working?', 'In D-03, the Department Execution Manual, owned by the VPs and HODs and refreshed each term.'],
          ], [
            ['Who does the Brand & Content HOD report to?', ['The VP, Brand & Content (R-02), held by the President', 'The Treasurer', 'The Auditor', 'The Events HOD'], 0, 'Charter Appendix A1: R-12 reports to R-02 / R-01.'],
            ['A vHOD is not a passive assistant. What do they own?', ['A defined execution lane', 'Nothing', 'Only the HOD\'s email', 'The budget'], 0, 'Charter 4.4.8.'],
            ['Where are Brand & Content Executives tracked?', ['Notion', 'The Charter', 'Student LIFE', 'The Member Register'], 0, 'Charter Appendix A1.'],
          ]),
          fromCharter('l2-partnerships', 'Partnerships & Growth: roles and reporting', 'Know the two leader lanes in Partnerships & Growth and who reports to whom.', 'Department head', [
            ['Partnerships & Growth is...', 'Department DEP-02, under the VP, Partnerships & Growth (R-04).'],
            ['Who is the department\'s HOD?', 'The Partnerships & Growth HOD (R-14), who reports to R-04.'],
            ['How is this department structured differently?', 'It uses a parallel leader structure: two leaders at the same level, each owning a distinct lane, under one HOD.'],
            ['External Partnership Leader (R-15)', 'Owns external partnerships and outreach. Reports to the HOD.'],
            ['Internal Partnership Leader (R-16)', 'Owns internal partnerships and cross-club work. Reports to the HOD.'],
            ['Who do Partnership Executives report to?', 'R-15 or R-16, by assignment. They are tracked in Notion.'],
            ['Who speaks for SEC to sponsors and partners?', 'The President is the primary contact where required. Others only with authorisation.'],
          ], [
            ['What is unusual about the Partnerships & Growth structure?', ['Two leaders at the same level own distinct lanes', 'It has no HOD', 'It has three VPs', 'It has no executives'], 0, 'Charter 4.4.6 and Appendix A1.'],
            ['Who owns external partnerships and outreach?', ['The External Partnership Leader (R-15)', 'The Treasurer', 'The Secretary', 'The Auditor'], 0, 'Charter Appendix A1.'],
            ['Who does the Partnerships & Growth HOD report to?', ['The VP, Partnerships & Growth (R-04)', 'The Secretary', 'The VP, Events', 'The Club Auditor'], 0, 'Charter Appendix A1.'],
          ]),
          fromCharter('l2-people', 'People & Operations: roles and reporting', 'Know the two lanes in People & Operations and what the department decides.', 'Department head', [
            ['People & Operations is...', 'Department DEP-03, under the VP, People & Operations (R-03).'],
            ['Who is the department\'s HOD?', 'The People & Operations HOD (R-17), who reports to R-03.'],
            ['Operations vHOD (R-18)', 'Owns the operations and systems lane. Reports to the HOD.'],
            ['People vHOD (R-19)', 'Owns the people, recruitment and onboarding lane. Reports to the HOD.'],
            ['Who do People & Operations Executives report to?', 'R-18 or R-19, by assignment. They are tracked in Notion.'],
            ['What does the VP, People & Operations decide on membership?', 'Terminating a Tier 2 membership, after written notice and at least seven days for the member to respond. The member can appeal once to the President.'],
            ['Who handles a former member\'s request to delete their data?', 'It goes through the VP, People & Operations (R-03).'],
          ], [
            ['Which lane owns recruitment and onboarding?', ['The People vHOD (R-19)', 'The Operations vHOD (R-18)', 'The Events HOD', 'The Treasurer'], 0, 'Charter Appendix A1: R-19 owns people, recruitment and onboarding.'],
            ['Who decides on terminating a Tier 2 membership?', ['The VP, People & Operations (R-03), after notice and a response period', 'Any committee member', 'The Auditor', 'A member vote'], 0, 'Charter 2.2: written notice, seven days to respond, decision by R-03, one appeal to R-01.'],
            ['Who does the People & Operations HOD report to?', ['The VP, People & Operations (R-03)', 'The Treasurer', 'The AWI Officer', 'The Secretary'], 0, 'Charter Appendix A1.'],
          ]),
          fromCharter('l2-events', 'Events: roles, reporting and event rules', 'Know who is who in Events and the money rules every event must follow.', 'Department head', [
            ['Events is...', 'Department DEP-04, under the VP, Events (R-05), who also holds the Treasurer Function.'],
            ['Who is the Events HOD?', 'R-20, who reports to R-05.'],
            ['Who is the Events vHOD?', 'R-21, who reports to R-20.'],
            ['Who handles event money?', 'The Treasurer (R-09), embedded under R-05 and coordinating with the Events HOD. The Vice Treasurer (R-10) assists.'],
            ['Who do Events Executives report to?', 'R-21 or R-20. They are tracked in Notion.'],
            ['No budget, no event', 'No event, activity or purchase goes ahead without financial review and approval.'],
            ['No proposal, no approval', 'An event needs a proposal and budget approval before it proceeds.'],
            ['No post-event report, no next event', 'A post-event report is required before the next event is approved, unless ExCo waives it.'],
            ['Can the person running an event approve its budget?', 'No. If the Treasurer or VP, Events is directly involved in execution, approval goes to the President or a neutral VP.'],
            ['Event formats and codes are kept in...', 'D-04, the Event Portfolio & Proposal Bank, owned by R-04 and R-05.'],
          ], [
            ['Who does the Events HOD report to?', ['The VP, Events (R-05)', 'The VP, Brand & Content', 'The Secretary', 'The Auditor'], 0, 'Charter Appendix A1.'],
            ['What must happen before an event goes ahead?', ['A proposal and budget approval', 'Nothing', 'A vote of all members', 'Approval from the event\'s own organiser'], 0, 'Charter 4.4.14 and 4.4.20: no proposal, no approval; no budget, no event.'],
            ['What is needed before the next event can be approved?', ['A post-event report, unless ExCo waives it', 'A new logo', 'A bigger budget', 'Nothing'], 0, 'Charter 4.4.14.'],
            ['The Treasurer sits under which VP?', ['VP, Events (R-05)', 'VP, Brand & Content', 'VP, People & Operations', 'VP, Partnerships & Growth'], 0, 'Charter 4.4.1 and Appendix A1.'],
          ]),
        ],
      },
      {
        id: 'l3', title: 'Project training', audience: 'Members working on projects',
        summary: 'The approval, money and reporting rules every SEC project follows.',
        modules: [
          fromCharter('l3-lifecycle', 'Project lifecycle and timelines', 'Know the steps an SEC project or event must pass, from owner to report.', 'Events / VP, Events', [
            ['No project without an owner', 'Every task, project, event, partnership or content item needs a responsible owner, an accountable officer, a deadline and a visible status.'],
            ['Who is Responsible, and who is Accountable?', 'Responsible does the work. Accountable owns the outcome and answers for it, usually the VP or HOD.'],
            ['Before an event goes ahead', 'It needs a proposal and budget approval. An event without them is a governance failure.'],
            ['Where are event formats and proposals kept?', 'In D-04, the Event Portfolio & Proposal Bank, owned by the VP, Partnerships & Growth (R-04) and the VP, Events (R-05).'],
            ['Event with physical activity', 'It needs a Student LIFE-endorsed liability waiver in place before the event.'],
            ['Liability forms and disclaimers', 'They only take effect once Student LIFE has endorsed them.'],
            ['After the event', 'No post-event report, no next event approval, unless ExCo waives it.'],
            ['Who tracks the KPIs and Notion review?', 'D-05, the KPI Dashboard & Notion Review System, owned by the President, the Secretary and the VPs.'],
          ], [
            ['What must every task have before work starts?', ['A named owner, accountable officer, deadline and visible status', 'Only a deadline', 'A team name', 'Nothing'], 0, 'Charter 4.4.16.'],
            ['What does an event need before it goes ahead?', ['A proposal and budget approval', 'A poster', 'A sponsor', 'Nothing'], 0, 'Charter 4.4.20 (an event without them is a governance failure) and 4.4.14.'],
            ['An event includes physical activity. What must be in place?', ['A Student LIFE-endorsed liability waiver', 'A verbal agreement', 'A note from the HOD', 'Nothing'], 0, 'Charter 6.1.'],
            ['What do you need before the next event can be approved?', ['A post-event report, unless ExCo waives it', 'A new logo', 'A bigger budget', 'Nothing'], 0, 'Charter 4.4.14.'],
            ['Where are SEC\'s event formats and proposal banks kept?', ['D-04, the Event Portfolio & Proposal Bank', 'D-01, the Charter', 'The Member Register', 'WhatsApp'], 0, 'Charter Part 2.1 and Appendix A2.'],
          ]),
          fromCharter('l3-budget', 'Budgeting and risk', 'Know SEC\'s money rules: who approves, what is recorded and what is never allowed.', 'Treasurer / VP, Events', [
            ['Who holds budget approval for all club funds?', 'The Treasurer (R-09) / the VP, Events (R-05).'],
            ['No budget, no event', 'No event, activity, purchase, reimbursement, sponsorship commitment or financial obligation proceeds without financial review and approval.'],
            ['No proposal, no approval', 'Nothing is approved without a proposal.'],
            ['No documentation, no reimbursement', 'Keep supporting documents for everything you claim.'],
            ['Can a commitment be financially confirmed before approval?', 'No. No event or commitment may be confirmed without prior approval of the Treasurer / VP, Events.'],
            ['How are membership fees collected?', 'By bank transfer or QR code, with proof of payment kept. All payments are receipted and recorded by the Treasurer (R-09).'],
            ['Who should benefit from club transactions?', 'The club, not individuals within it.'],
            ['Where do club funds come from?', 'Tier 2 membership fees, club ventures and events, sponsorship and in-kind contributions, Student LIFE subsidies, and other sources that follow University rules.'],
            ['How often are financial statements sent to Student LIFE?', 'Monthly.'],
            ['Who reviews financial records for accuracy and compliance?', 'The Club Auditor (R-08), who reviews and reports but does not approve payments or manage funds.'],
            ['Who is personally liable for the club\'s liabilities?', 'No individual committee member. Any loss of funds or assets is accepted as a non-recoverable loss.'],
          ], [
            ['Who holds budget approval authority for club funds?', ['The Treasurer (R-09) / VP, Events (R-05)', 'The Secretary', 'Any HOD', 'The Auditor'], 0, 'Charter 4.4.14.'],
            ['Which is one of SEC\'s financial control principles?', ['No documentation, no reimbursement', 'Reimburse first, document later', 'Approve verbally', 'Spend by consensus'], 0, 'Charter 4.4.14.'],
            ['How must membership fees be collected?', ['Bank transfer or QR code with proof of payment', 'Cash in an envelope', 'Any way', 'Only on campus'], 0, 'Charter 2.2 and 5.3.'],
            ['How often are financial statements submitted to Student LIFE?', ['Monthly', 'Yearly', 'Weekly', 'Never'], 0, 'Charter 5.3.'],
            ['What is the Club Auditor\'s role with the money?', ['Review and report, not approve payments or manage funds', 'Approve budgets', 'Pay suppliers', 'Hold the cash'], 0, 'Charter 4.4.5.3.'],
          ]),
          fromCharter('l3-stakeholders', 'Stakeholder management', 'Know how SEC deals with Student LIFE, advisors, the University and outside parties.', 'President / ExCo', [
            ['Who is the primary contact for Student LIFE, advisors, sponsors and external parties?', 'The President (R-01), where required.'],
            ['Who may represent the club externally?', 'The President or an authorised representative. Nobody may claim authority beyond their role.'],
            ['Student LIFE', 'The Sunway University student affairs office that recognises and oversees student clubs.'],
            ['SUSC/SCC', 'The Sunway University Student Council / Student Consultative Committee.'],
            ['What can the Principal Advisor (R-00) do?', 'Offer guidance and contribute to decisions, but cannot decide on behalf of the club without the committee\'s consent.'],
            ['Second Party', 'Any University or College staff, faculty or administrator acting in an official capacity with the club. They may be partially involved in decisions.'],
            ['Third Party', 'Any external person or organisation not affiliated with Sunway Education Group. They must not be involved in the club\'s decision-making.'],
            ['Personal link to a sponsor or partner', 'Declare it to the President or relevant VP and step out of the decision.'],
            ['Where must a vote-related notice be sent?', 'Through the official club email.'],
          ], [
            ['Who is the club\'s primary contact for Student LIFE and sponsors?', ['The President (R-01)', 'The Treasurer', 'Any member', 'The Secretary'], 0, 'Charter 4.4.3.'],
            ['Can a Third Party be involved in the club\'s decision-making?', ['No', 'Yes, always', 'Only for events', 'Only if sponsors'], 0, 'Charter 6.5.'],
            ['Can an Advisor decide for the club on their own?', ['No, not without the committee\'s consent', 'Yes', 'Only the Principal Advisor', 'Only on money'], 0, 'Charter 6.3.'],
            ['You have a personal relationship with a sponsor under consideration. What do you do?', ['Declare it and step out of the decision', 'Keep quiet', 'Decide quickly', 'Leave it to the sponsor'], 0, 'Charter 6.2.'],
            ['Who may represent SEC externally?', ['The President or an authorised representative', 'Any committee member', 'Any member', 'Anyone with the logo'], 0, 'Charter 4.4.9 and 4.4.21.'],
          ]),
          fromCharter('l3-review', 'Execution and post-event review', 'Know what SEC requires after an event, and what gets handed on.', 'Events / Secretary', [
            ['No post-event report, no next event', 'The next event is not approved without a post-event report, unless ExCo waives it.'],
            ['Are event documents club assets?', 'Yes. All event documentation and review reports are club assets and are handed to the incoming committee.'],
            ['When is D-04 updated?', 'Each term and after major events.'],
            ['Who tracks whether departments keep their records?', 'The Secretary (R-06). Each department still keeps its own records.'],
            ['A repeated failure to submit required reports is...', 'A governance failure.'],
            ['Meeting minutes', 'Kept by the Secretary (R-06) and Vice Secretary (R-07). AGM minutes go to Student LIFE and SUSC/SCC.'],
          ], [
            ['What is needed before the next event can be approved?', ['A post-event report, unless ExCo waives it', 'Nothing', 'A new sponsor', 'A larger team'], 0, 'Charter 4.4.14.'],
            ['Who tracks whether departments keep their records?', ['The Secretary (R-06)', 'The President', 'The Treasurer', 'Student LIFE'], 0, 'Charter 4.4.17.'],
            ['Are event documentation and review reports club assets?', ['Yes', 'No', 'Only for big events', 'Only if sponsored'], 0, 'Charter 5.4.'],
            ['A repeated failure to submit required reports is treated as...', ['A governance failure', 'A normal delay', 'A compliment', 'A new policy'], 0, 'Charter 4.4.20.'],
          ]),
        ],
      },
      {
        id: 'l4', title: 'Project Lead training', audience: 'Project Leads',
        summary: 'How decisions, delegation and escalation work at SEC.',
        modules: [
          fromCharter('l4-delegate', 'Delegation and coordination', 'Know who is responsible, who steps in, and how work is formally handed over.', 'President / ExCo', [
            ['Responsible vs Accountable', 'Responsible does the work. Accountable owns the outcome. Both must be named for every major task.'],
            ['Never assign work to...', 'The team in general. Name a specific owner.'],
            ['What does a vHOD or Leader own?', 'A defined execution lane. They are not passive assistants.'],
            ['When can a vHOD take over operational responsibility?', 'Temporarily, within their lane, where formally delegated.'],
            ['If an assigned owner is unavailable', 'The next designated role temporarily takes responsibility.'],
            ['If a vHOD or Leader fails to perform', 'The HOD temporarily takes responsibility.'],
            ['If a HOD fails to perform', 'The relevant VP temporarily takes responsibility and may recommend a replacement.'],
            ['Consulted and Informed', 'Consult only the relevant people. Inform after the decision or action, unless input is needed first.'],
          ], [
            ['Who is usually Accountable in SEC\'s RACI?', ['The relevant VP or HOD', 'Everyone', 'The newest member', 'The Auditor'], 0, 'Charter Appendix B.'],
            ['A task is assigned to "the team". What does the charter say?', ['A specific owner must be named', 'That is fine', 'Wait a week', 'Ask the Auditor'], 0, 'Charter 4.4.16.'],
            ['If a HOD fails to perform, who steps in?', ['The relevant VP', 'The Treasurer', 'The Secretary', 'A member vote'], 0, 'Charter 4.4.19.'],
            ['An assigned owner is unavailable. What happens?', ['The next designated role temporarily takes over', 'The task is dropped', 'It waits', 'The Auditor does it'], 0, 'Charter 4.4.15.'],
            ['When may a vHOD assume operational responsibility?', ['Within their lane, where formally delegated', 'Whenever they like', 'Never', 'Only in the Events department'], 0, 'Charter 4.4.8.'],
          ]),
          fromCharter('l4-decide', 'Decisions and managing delays', 'Know the default-to-action rules and who decides at each level.', 'President / ExCo', [
            ['Where should decisions be made?', 'At the lowest appropriate level, by the officer responsible for the matter.'],
            ['Vice Presidents and their portfolios', 'Each VP decides independently within their own domain.'],
            ['No reply within 24 hours of confirmed receipt', 'The responsible officer may proceed with the last agreed direction.'],
            ['Limits on the 24-hour rule', 'It never overrides financial controls, Student LIFE requirements or the no-self-approval rule.'],
            ['Cross-portfolio alignment not reached in 48 hours', 'Escalate to the President (R-01).'],
            ['A task is blocked for more than 48 hours', 'Escalate it to the relevant VP.'],
            ['An assigned owner is unavailable', 'The next designated role temporarily assumes responsibility.'],
            ['Can the President override a VP\'s domain decision?', 'Only if an escalation condition is triggered.'],
            ['Can a decision be made on a matter you are part of?', 'No. See the no-self-approval rule.'],
          ], [
            ['No reply came within 24 hours of confirmed receipt. What may you do?', ['Proceed with the last agreed direction', 'Cancel it', 'Wait a week', 'Ask the Auditor'], 0, 'Charter 4.4.15.'],
            ['Which rule can the 24-hour default NOT override?', ['The no-self-approval rule', 'A meeting time', 'A formatting choice', 'A poster colour'], 0, 'Charter 4.4.15.'],
            ['Two portfolios cannot align within 48 hours. Who decides?', ['The President', 'The Treasurer', 'The Secretary', 'A coin toss'], 0, 'Charter 4.4.10.'],
            ['A task has been blocked for 3 days. What is the rule?', ['Escalate it to the relevant VP', 'Keep waiting', 'Cancel it', 'Hide it'], 0, 'Charter 4.4.15.'],
            ['Where are decisions made?', ['At the lowest appropriate level', 'Always by the President', 'Always by ExCo', 'By member vote'], 0, 'Charter 4.4.2 and 4.4.9.'],
          ]),
          fromCharter('l4-escalate', 'Escalation and alignment calls', 'Know exactly when a matter must go to the President, and what happens next.', 'President / ExCo', [
            ['Escalate to the President when...', 'Two or more VPs disagree, a decision is unresolved for more than 48 hours, or the existing authority structure cannot resolve it.'],
            ['More escalation triggers', 'A conflict of interest, someone must approve their own work or budget, or the matter involves significant financial exposure.'],
            ['Even more triggers', 'External reputational risk, or the matter affects Student LIFE, advisors, sponsors, external stakeholders or the club as a whole.'],
            ['What does the President do on escalation?', 'Takes temporary decision authority and may approve one option, reject proposals, require amendments or define a final course of action.'],
            ['Is the President\'s escalated decision final?', 'Yes, final and binding within the club.'],
            ['Alignment between VPs', 'Seek alignment before implementing. It should be reached within 48 hours.'],
            ['Dispute that cannot be settled inside the club', 'Refer it to Student LIFE in writing. Student LIFE\'s decision is final and binding.'],
            ['What the President must not do', 'Intervene in routine portfolio decisions, override a VP without a trigger, manage departments, or use a veto for personal preference.'],
          ], [
            ['Which of these triggers escalation to the President?', ['Two Vice Presidents disagree', 'A change of poster colour', 'A meeting reschedule', 'A new member joining'], 0, 'Charter 4.4.11.'],
            ['After escalation, how binding is the President\'s decision?', ['Final and binding', 'Only advice', 'Needs a member vote', 'Optional'], 0, 'Charter 4.4.11.'],
            ['Where does a dispute go if it cannot be resolved inside the club?', ['Student LIFE, in writing', 'Social media', 'The sponsor', 'Nowhere'], 0, 'Charter 4.7.'],
            ['Within how long should cross-portfolio alignment be reached?', ['48 hours', '7 days', '1 month', 'No limit'], 0, 'Charter 4.4.10.'],
            ['Can the President override a VP without an escalation trigger?', ['No', 'Yes', 'Only on Mondays', 'Only on money'], 0, 'Charter 4.4.12.'],
          ]),
          fromCharter('l4-accountable', 'Stakeholder communication and accountability', 'Know what counts as a governance failure and how SEC expects owners to be accountable.', 'President / ExCo', [
            ['Accountable', 'The person who owns the outcome and answers for it.'],
            ['A project proceeding without a named owner is...', 'A governance failure.'],
            ['A person approving their own work is...', 'A governance failure.'],
            ['A department operating without records is...', 'A governance failure.'],
            ['An event without proposal and budget approval is...', 'A governance failure.'],
            ['Withholding information needed for governance, finance or compliance is...', 'A governance failure.'],
            ['Misusing AI tools with confidential, financial, personal or external-party information is...', 'A governance failure.'],
            ['What can governance failures lead to?', 'Review, reassignment, suspension of approval or replacement.'],
            ['Can you claim authority beyond your role?', 'No. Only with authorisation from the President or the relevant VP.'],
          ], [
            ['Which of these is a governance failure?', ['A project proceeding without a named owner', 'A project finishing early', 'A well-run meeting', 'A tidy folder'], 0, 'Charter 4.4.20.'],
            ['Is approving your own work allowed?', ['No, it is a governance failure', 'Yes', 'Only for small items', 'Only on weekdays'], 0, 'Charter 4.4.13 and 4.4.20.'],
            ['What can a governance failure lead to?', ['Review, reassignment, suspension of approval or replacement', 'A prize', 'Nothing', 'A longer term'], 0, 'Charter 4.4.20.'],
            ['Who answers for the outcome of a task?', ['The Accountable officer', 'Everyone equally', 'Nobody', 'The newest member'], 0, 'Charter Appendix B.'],
          ]),
        ],
      },
      {
        id: 'l5', title: 'Leadership training', audience: 'Future Heads of Department and ExCo',
        summary: 'What SEC expects of leaders: direction, support, documentation and succession.',
        modules: [
          fromCharter('l5-performance', 'Performance management and feedback', 'Know SEC\'s rules for supporting, evaluating and correcting committee members.', 'President / People & Operations', [
            ['ExCo\'s duty to develop people', 'Each ExCo member is responsible for the empowerment, guidance and development of the members under their oversight.'],
            ['Is it acceptable to point to a subordinate\'s failure without support?', 'No. Direction, tools and support must come first.'],
            ['At the start of a role or project', 'Set clear expectations and give direction before demanding results.'],
            ['How often do VPs check in with HODs?', 'At least once every two weeks.'],
            ['How often do HODs check in with vHODs and Leaders?', 'Weekly.'],
            ['Before a formal complaint or replacement request', 'A VP needs a documented record of prior guidance attempts.'],
            ['Steps when someone still underperforms', 'The VP documents the pattern, raises it with the President, a structured discussion follows, a formal improvement plan with a deadline is issued, and only then may the VP recommend removal, subject to the President\'s review.'],
            ['Where are the 30/60/90-day evaluation criteria?', 'In D-06, the SEC Culture & People Standard, owned by the President and the VP, People & Operations.'],
            ['Mid-term review', 'The President formally reviews all VPs at the halfway point of the term and shares the findings with the Principal Advisor.'],
            ['End-of-term debrief', 'Held for all ExCo members, with findings kept and handed to the successor committee.'],
          ], [
            ['How often must a VP check in with their HODs?', ['At least once every two weeks', 'Once a term', 'Daily', 'Never'], 0, 'Charter 4.5.'],
            ['What must a VP have before a formal complaint about a subordinate?', ['A documented record of prior guidance attempts', 'A group vote', 'Nothing', 'A letter from the member'], 0, 'Charter 4.5.'],
            ['Which comes first when someone underperforms?', ['Direction, tools and support', 'Removal', 'Public criticism', 'A vote'], 0, 'Charter 4.5.'],
            ['Where are the 30/60/90-day evaluation criteria kept?', ['D-06, the SEC Culture & People Standard', 'D-01, the Charter', 'D-04', 'Notion only'], 0, 'Charter 4.5 and Appendix A2.'],
            ['When does the President review all VPs formally?', ['At the halfway point of the term', 'At the AGM only', 'Never', 'Daily'], 0, 'Charter 4.6.'],
          ]),
          fromCharter('l5-department', 'Delegation and department management', 'Know what a HOD owns and how to onboard and support the people in their lane structure.', 'Heads of Department / VPs', [
            ['What does a HOD own?', 'Departmental outcomes, execution plans, coordinating members, timelines and deliverables, output quality, progress reports to the VP, and departmental records.'],
            ['A HOD turns...', 'The VP\'s direction into executable plans.'],
            ['What does a vHOD or Parallel Leader own?', 'A defined execution lane, with clear ownership of specific execution areas.'],
            ['Parallel leader structure', 'Two or more leaders at the same level own distinct lanes under one HOD. The VP approves it at the start of term.'],
            ['Onboarding a vHOD or Leader', 'The HOD onboards them clearly into their lane when they are appointed.'],
            ['HOD check-ins', 'Weekly with vHODs and Leaders. Flag concerns to the VP before they escalate.'],
            ['Where are department execution standards kept?', 'In D-03, the Department Execution Manual.'],
            ['Can new departments be added?', 'Yes, with ExCo approval, and they get the next DEP-## code.'],
          ], [
            ['Who onboards a new vHOD into their lane?', ['The HOD', 'The Auditor', 'The Treasurer', 'Nobody'], 0, 'Charter 4.5.'],
            ['What does a HOD report to the VP?', ['Progress on departmental outcomes', 'The weather', 'Nothing', 'Only finances'], 0, 'Charter 4.4.7.'],
            ['Who approves a parallel leader structure?', ['The relevant VP, at the start of term', 'The Auditor', 'A member vote', 'Student LIFE'], 0, 'Charter 4.4.6.'],
            ['Where are detailed execution lane standards kept?', ['D-03, the Department Execution Manual', 'D-01', 'D-06', 'The Member Register'], 0, 'Charter 4.4.8.'],
          ]),
          fromCharter('l5-succession', 'Succession and organisational planning', 'Know how SEC keeps knowledge alive across committees.', 'President / Secretary', [
            ['SEC\'s "train your replacement" culture', 'Every Head develops their Vice, and the President develops the Vice Presidents, so any role can be stepped into without loss of continuity.'],
            ['Replacing a role that is failing', 'Make a replacement within 14 days where the failure materially affects club operations.'],
            ['Does a vacancy dissolve the club?', 'No. Dissolution is a last resort.'],
            ['If ExCo falls below three active members', 'The Principal Advisor and Student LIFE may approve a temporary custodianship for continuity.'],
            ['What is handed over at the end of the term?', 'Funds, assets and all operating documents (D-01 to D-07), in a formal handover at the AGM.'],
            ['Who enforces removal of access when someone leaves?', 'The Secretary (R-06). Access is revoked within 48 hours.'],
            ['Official account passwords', 'Changed within 14 days of each new term, recorded in the credential record kept by the Secretary, and handed over at the AGM.'],
            ['Incoming ExCo members', 'Complete a structured onboarding and sign an acknowledgement of the Charter within 14 days of appointment.'],
            ['Replacement after a vote of no confidence', 'The newly elected member gets a documented handover within 7 days.'],
          ], [
            ['What does "train your replacement" mean at SEC?', ['Every Head develops their Vice so any role can be stepped into', 'Heads keep knowledge private', 'Replacements are hired externally', 'Only the President trains'], 0, 'Charter 4.4.19.'],
            ['Within how long must account access be revoked when someone leaves?', ['48 hours', '14 days', 'One term', 'One year'], 0, 'Charter 5.5.'],
            ['Within how many days must a failing role be replaced when operations are affected?', ['14 days', '60 days', '1 year', 'No limit'], 0, 'Charter 4.4.19.'],
            ['What is formally handed over at the AGM?', ['Finances, assets and the operating documents D-01 to D-07', 'Only the logo', 'Only the budget', 'Nothing'], 0, 'Charter 3.1.'],
            ['Within how many days must incoming ExCo sign the Charter acknowledgement?', ['14 days', '1 day', '6 months', 'They do not'], 0, 'Charter 4.6.'],
          ]),
          fromCharter('l5-comms', 'Leadership communication', 'Know what SEC expects from leaders when they communicate, correct and represent the club.', 'President / ExCo', [
            ['Set expectations', 'Every ExCo member sets clear expectations at the start of each role or project.'],
            ['Provide direction before demanding results', 'Pointing to a subordinate\'s failure without direction, tools and support is not acceptable at any level.'],
            ['Formal notices', 'A formal notice, such as one that starts a vote of no confidence, goes through the official club email with documented evidence.'],
            ['No campaigning', 'No one may campaign for or against a vote of no confidence through official club channels.'],
            ['Representing the club', 'Only the President, or someone authorised by the President or relevant VP, may represent the club externally.'],
            ['Keep internal information internal', 'Do not disclose, forward, screenshot or share internal information with unauthorised people.'],
            ['Account passwords', 'Never share new passwords over personal messaging apps.'],
          ], [
            ['What must an ExCo member do before demanding results?', ['Set clear expectations and give direction', 'Nothing', 'Send a warning', 'Call a vote'], 0, 'Charter 4.5.'],
            ['How is a formal notice for a vote of no confidence sent?', ['Through the official club email, with evidence', 'In a group chat', 'By word of mouth', 'On Instagram'], 0, 'Charter 4.6, Step 1.'],
            ['May a leader campaign about a vote of no confidence in official club channels?', ['No', 'Yes', 'Only the President', 'Only before voting'], 0, 'Charter 4.6, Conduct During the Process.'],
            ['Who may represent SEC externally?', ['The President or someone authorised', 'Any committee member', 'Any member', 'Anyone'], 0, 'Charter 4.4.21.'],
          ]),
        ],
      },
    ],
    updatedAt: null, updatedBy: null,
  };
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
