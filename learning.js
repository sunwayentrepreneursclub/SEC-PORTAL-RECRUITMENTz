/* Learning Portal (ES module, loaded by the main script). Three layers share one data set (/api/learning):
     1. public recruitment page  -> #learnTeaser (read-only, text set by admin)
     2. committee Learning Portal -> #viewLearn   (sign-in required): flashcards, then a multiple-choice quiz
     3. SEC Admin                 -> #panelLearn  (admin sign-in; edits layers 1 and 2)
   Uses helpers from the main script: $, esc, api, showView, applyLock, loadState, uiConfirm. */

const { $, esc, api, showView, applyLock, loadState, uiConfirm } = window.SEC;
const LEVEL_COLORS = ['#9FC9F3', '#EFBE79', '#E2B0BE', '#C6B7E5', '#F19A91', '#E9D38D'];
const lpColor = i => LEVEL_COLORS[i % LEVEL_COLORS.length];

/* =====================================================================
   Layer 1: public teaser on the recruitment page
   ===================================================================== */
async function lpLoadTeaser() {
  const sec = $('#learnTeaser'); if (!sec) return;
  try {
    const d = (await api('/api/learning')).public;
    if (!d || d.enabled === false || !(d.steps || []).length) { sec.hidden = true; return; }
    $('#learnTeaserBody').innerHTML = `
      <div class="aband-head">
        <h2 class="aband-title">${esc(d.headline || 'Selected? Training starts straight away.')}</h2>
        ${d.intro ? `<p class="aband-lede">${esc(d.intro)}</p>` : ''}
      </div>
      <div class="lp-path">${d.steps.map((s, i) => `
        <div class="lp-step"><div class="n">${i + 1}</div><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div>`).join('')}</div>
      <button class="lp-teaser-link" id="teaserOpen" type="button">Committee member? Open the Learning Portal</button>`;
    $('#teaserOpen').addEventListener('click', openLearn);
    sec.hidden = false;
  } catch { sec.hidden = true; }
}

/* =====================================================================
   Layer 2: committee Learning Portal
   ===================================================================== */
const LP = { user: null, role: null, pub: null, levels: [], progress: {} };
const lpRoot = () => $('#lpMain');
const lpAllMods = () => LP.levels.flatMap((l, li) => l.modules.map(m => ({ ...m, level: l, li })));
const lpDone = id => !!LP.progress[id]?.passed;
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

function lpBar() {
  const signed = !!LP.user;
  $('#lpNav').innerHTML = `
    <button class="lp-link" id="lpToSite" type="button"><span class="lp-full">Recruitment site</span><span class="lp-short">Site</span></button>
    ${LP.role === 'admin' ? `<button class="lp-link" id="lpToAdmin" type="button">Admin</button>` : ''}
    ${signed ? `<button class="lp-link" id="lpSignOut" type="button"><span class="lp-full">Sign out</span><span class="lp-short">Out</span></button>` : ''}`;
  $('#lpToSite').onclick = () => { lpCloseStudy(); history.replaceState(null, '', location.pathname); showView('public'); };
  $('#lpToAdmin')?.addEventListener('click', async () => { lpCloseStudy(); await loadState(); showView('admin'); applyLock(); });
  $('#lpSignOut')?.addEventListener('click', async () => {
    lpCloseStudy();
    await api('/api/session', { method: 'DELETE' });
    Object.assign(LP, { user: null, role: null, levels: [], progress: {} });
    window.SEC.signedOutReset();
    await loadState();
    lpRender();
  });
}

async function lpLoad() {
  const d = await api('/api/learning');
  LP.pub = d.public || null;
  LP.user = d.user || null; LP.role = d.role || null;
  LP.levels = d.levels || []; LP.progress = d.progress || {};
}

async function openLearn() {
  window.SEC.dismissGate();
  showView('learn');
  if (location.hash !== '#learning') history.replaceState(null, '', '#learning');
  try { await lpLoad(); } catch { /* shows the sign-in screen */ }
  lpRender();
}

function lpRender() {
  lpBar();
  if (!LP.user) return lpRenderLocked();
  lpRenderHome();
}

/* ---------- sign in / create account ---------- */
function lpRenderLocked(err, mode = 'in') {
  const create = mode === 'up';
  lpRoot().innerHTML = `
    <div class="wrap"><div class="lp-lock"><div class="lp-lock-box">
      <h1>${create ? 'Join the portal.' : 'Learning Portal.'}</h1>
      <p class="lede">${create ? 'Create your account with the join code from the committee chat.' : 'For SEC committee members.'}</p>
      <div class="lp-switch" role="tablist">
        <button type="button" class="${create ? '' : 'is-on'}" data-mode="in">Sign in</button>
        <button type="button" class="${create ? 'is-on' : ''}" data-mode="up">Create account</button>
      </div>
      ${create ? `
        <div class="lp-field"><label for="lpName">Your name</label><input id="lpName" type="text" autocomplete="name"></div>
        <div class="lp-field"><label for="lpUser">Email</label><input id="lpUser" type="email" autocomplete="email" placeholder="Your Sunway iMail"></div>
        <div class="lp-field"><label for="lpPass">Password (8 or more characters)</label><input id="lpPass" type="password" autocomplete="new-password"></div>
        <div class="lp-field"><label for="lpCode">Join code</label><input id="lpCode" type="text" autocomplete="off"></div>`
      : `
        <div class="lp-field"><label for="lpUser">Email</label><input id="lpUser" type="text" autocomplete="username"></div>
        <div class="lp-field"><label for="lpPass">Password</label><input id="lpPass" type="password" autocomplete="current-password"></div>`}
      <div class="lp-lock-err" id="lpErr" ${err ? '' : 'hidden'}>${esc(err || '')}</div>
      <button class="lp-pill lp-pill-lg" id="lpLogin" type="button">${create ? 'Create account' : 'Sign in'}</button>
    </div></div></div>`;
  lpRoot().querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => lpRenderLocked('', b.dataset.mode)));
  const go = async () => {
    const btn = $('#lpLogin'); btn.disabled = true; btn.textContent = create ? 'Creating…' : 'Signing in…';
    try {
      if (create) {
        await api('/api/signup', { method: 'POST', body: JSON.stringify({
          name: $('#lpName').value, imail: $('#lpUser').value, password: $('#lpPass').value, code: $('#lpCode').value }) });
      } else {
        await api('/api/session', { method: 'POST', body: JSON.stringify({ username: $('#lpUser').value.trim(), password: $('#lpPass').value }) });
      }
      await lpLoad();
      if (LP.role === 'admin') await loadState(); // so the Admin button opens straight in
      lpRender();
    } catch (e) { lpRenderLocked(e.message, mode); }
  };
  $('#lpLogin').onclick = go;
  lpRoot().querySelectorAll('.lp-field input').forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') go(); }));
  setTimeout(() => $(create ? '#lpName' : '#lpUser')?.focus(), 30);
}

/* ---------- home: levels and modules as compact rows ---------- */
function lpRenderHome() {
  const mods = lpAllMods().filter(m => m.status === 'published');
  const done = mods.filter(m => lpDone(m.id)).length;
  const next = mods.find(m => !lpDone(m.id));
  lpRoot().innerHTML = `
    <div class="wrap lp-page">
      <header class="lp-head">
        <h1>Learn.</h1>
        <p class="lede">Go through the flashcards, then take a short quiz. Pass the quiz and the module is complete.</p>
        <div class="lp-head-row">
          <span class="lp-prog"><b>${done}</b> of ${mods.length} modules complete</span>
          ${next ? `<button class="lp-pill lp-pill-lg" id="lpContinue" type="button">${done ? 'Continue' : 'Start'}: ${esc(next.title)}</button>` : ''}
        </div>
      </header>
      ${LP.levels.map((l, i) => {
        const pub = l.modules.filter(m => m.status === 'published');
        const d = pub.filter(m => lpDone(m.id)).length;
        return `<section class="lp-sec" style="--lc:${lpColor(i)}">
          <div class="lp-sec-head"><h2><span class="lp-dot"></span>${esc(l.title)}</h2>
            <p>${esc([l.audience, pub.length ? `${d} of ${pub.length} complete` : 'Coming soon'].filter(Boolean).join(' · '))}</p></div>
          <div class="lp-rows">${l.modules.map(m => m.status === 'published' ? `
            <article class="lp-row">
              <div><h3>${esc(m.title)}</h3>
                <p>${esc([plural(m.cards.length, 'card'), plural(m.questions.length, 'question'), lpDone(m.id) ? `Complete · best ${LP.progress[m.id].best}%` : ''].filter(Boolean).join(' · '))}</p></div>
              <button class="lp-pill" type="button" data-mod="${esc(m.id)}">${lpDone(m.id) ? 'Review' : 'Study'}</button>
            </article>` : `
            <article class="lp-row is-soon">
              <div><h3>${esc(m.title)}</h3><p>Coming soon</p></div>
              <button class="lp-pill is-ghost" type="button" disabled>Soon</button>
            </article>`).join('')}</div>
        </section>`;
      }).join('')}
    </div>`;
  lpRoot().querySelectorAll('[data-mod]').forEach(b => b.addEventListener('click', () => lpOpenStudy(b.dataset.mod)));
  $('#lpContinue')?.addEventListener('click', () => next && lpOpenStudy(next.id));
}

/* =====================================================================
   Study mode: flashcards, then one multiple-choice question at a time
   ===================================================================== */
let S = null; // current study session

function lpOpenStudy(id) {
  const m = lpAllMods().find(x => x.id === id);
  if (!m || m.status !== 'published') return;
  S = { m, phase: m.cards.length ? 'cards' : 'quiz', deck: m.cards.map((_, i) => i), i: 0, flipped: false,
        got: new Set(), miss: new Set(), qi: 0, picked: [], fb: [], result: null, busy: false };
  let el = $('#lpStudy');
  if (!el) { el = document.createElement('div'); el.id = 'lpStudy'; el.className = 'lp-study'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); document.body.appendChild(el); }
  el.style.setProperty('--lc', lpColor(m.li));
  window.SEC.lockScroll('study'); // the page's own scroll lock, which also works on iPhone Safari
  document.addEventListener('keydown', lpKeys);
  history.pushState({ lp: 'study' }, '', '#learning'); // so the phone's back button closes the module instead of leaving the portal
  lpStudyRender();
}
function lpCloseStudy(fromBack = false) {
  const wasOpen = !!S;
  $('#lpStudy')?.remove();
  document.removeEventListener('keydown', lpKeys);
  window.SEC.unlockScroll('study');
  S = null;
  if (wasOpen && !fromBack && history.state?.lp === 'study') history.back(); // drop the entry we pushed
}
/* back button / swipe-back while studying: close the module and show the list */
window.addEventListener('popstate', () => {
  if (!S) return;
  lpCloseStudy(true);
  if (LP.user) lpRenderHome();
});

function lpKeys(e) {
  if (!S || e.target.closest?.('input,textarea')) return;
  if (e.key === 'Escape') { lpExit(); return; }
  if (S.phase === 'cards' && S.i < S.deck.length) {
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); lpFlip(); }
    else if (e.key === 'ArrowRight') lpGrade(true);
    else if (e.key === 'ArrowLeft') lpGrade(false);
  } else if (S.phase === 'quiz' && !S.result) {
    const q = S.m.questions[S.qi];
    if (S.fb[S.qi]) { if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); lpNextQ(); } }
    else if (q && /^[1-6]$/.test(e.key) && Number(e.key) <= q.options.length) lpPick(Number(e.key) - 1);
  }
}

async function lpExit() {
  const inProgress = S && !S.result && (S.phase === 'quiz' ? S.picked.some(v => v !== undefined) : S.got.size + S.miss.size > 0);
  if (inProgress && !await uiConfirm('Leave this module?', 'Your answers so far will not be saved.', 'Leave')) return;
  lpCloseStudy(); lpRenderHome();
}

function lpStudyShell(inner, label, pct) {
  $('#lpStudy').innerHTML = `
    <div class="lp-study-top">
      <button class="lp-x" id="lpX" type="button" aria-label="Close">&#10005;</button>
      <div class="lp-study-title">${esc(S.m.title)}</div>
      <div class="lp-study-step">${esc(label)}</div>
    </div>
    <div class="lp-study-bar"><i style="width:${Math.round(pct)}%"></i></div>
    <div class="lp-study-body">${inner}</div>`;
  $('#lpX').onclick = lpExit;
}

function lpStudyRender() {
  if (S.phase === 'cards') return S.i < S.deck.length ? lpRenderCard() : lpRenderCardsDone();
  if (S.result) return lpRenderResult();
  return lpRenderQuestion();
}

/* ---------- flashcards ---------- */
function lpRenderCard() {
  const c = S.m.cards[S.deck[S.i]];
  lpStudyShell(`
    <div class="lp-card-wrap">
      <button class="lp-flash ${S.flipped ? 'is-flipped' : ''}" id="lpFlash" type="button" aria-label="Flip card">
        <span class="lp-face front"><small>Question</small><span>${esc(c.front)}</span><em>Tap to flip</em></span>
        <span class="lp-face back"><small>Answer</small><span>${esc(c.back)}</span></span>
      </button>
      <div class="lp-card-actions">
        <button class="lp-pill is-ghost lp-pill-lg" id="lpMiss" type="button">Still learning</button>
        <button class="lp-pill lp-pill-lg" id="lpGot" type="button">Got it</button>
      </div>
      <p class="lp-hint"><span class="lp-kb">Space flips · ← still learning · → got it</span><span class="lp-touch">Tap the card to flip it</span></p>
    </div>`, `Card ${S.i + 1} of ${S.deck.length}`, (S.i / S.deck.length) * 100);
  $('#lpFlash').onclick = lpFlip;
  $('#lpGot').onclick = () => lpGrade(true);
  $('#lpMiss').onclick = () => lpGrade(false);
}
function lpFlip() { S.flipped = !S.flipped; $('#lpFlash')?.classList.toggle('is-flipped', S.flipped); }
function lpGrade(knew) {
  const idx = S.deck[S.i];
  if (knew) { S.got.add(idx); S.miss.delete(idx); } else { S.miss.add(idx); S.got.delete(idx); }
  S.i++; S.flipped = false;
  lpStudyRender();
}
function lpRenderCardsDone() {
  const total = S.m.cards.length, known = S.got.size, missed = [...S.miss];
  const hasQuiz = S.m.questions.length > 0;
  lpStudyShell(`
    <div class="lp-center">
      <p class="lp-big">${known}<span>/${total}</span></p>
      <h2>${missed.length ? `${plural(missed.length, 'card')} still to learn.` : 'You know every card.'}</h2>
      <p class="lede">${hasQuiz ? `Next is a quiz of ${plural(S.m.questions.length, 'question')}. You need ${S.m.passMark}% to complete the module.` : 'This module has no quiz yet.'}</p>
      <div class="lp-actions">
        ${missed.length ? `<button class="lp-pill is-ghost lp-pill-lg" id="lpRedo" type="button">Review ${missed.length} missed</button>` : ''}
        ${hasQuiz ? `<button class="lp-pill lp-pill-lg" id="lpToQuiz" type="button">Start the quiz</button>` : `<button class="lp-pill lp-pill-lg" id="lpBackHome" type="button">Back to modules</button>`}
      </div>
      <button class="lp-text-link" id="lpAgain" type="button">Go through all the cards again</button>
    </div>`, 'Cards done', 100);
  $('#lpRedo')?.addEventListener('click', () => { S.deck = missed; S.i = 0; S.flipped = false; S.miss = new Set(); lpStudyRender(); });
  $('#lpToQuiz')?.addEventListener('click', () => { S.phase = 'quiz'; S.qi = 0; S.picked = []; S.fb = []; lpStudyRender(); });
  $('#lpBackHome')?.addEventListener('click', () => { lpCloseStudy(); lpRenderHome(); });
  $('#lpAgain').onclick = () => { S.deck = S.m.cards.map((_, i) => i); S.i = 0; S.flipped = false; S.got = new Set(); S.miss = new Set(); lpStudyRender(); };
}

/* ---------- quiz ---------- */
function lpRenderQuestion() {
  const qs = S.m.questions, q = qs[S.qi], fb = S.fb[S.qi], picked = S.picked[S.qi];
  const last = S.qi === qs.length - 1;
  lpStudyShell(`
    <div class="lp-quiz">
      <h2 class="lp-q">${esc(q.q)}</h2>
      <div class="lp-opts" role="group" aria-label="Answers">${q.options.map((o, j) => {
        const cls = fb ? (j === fb.answer ? 'is-right' : (j === picked ? 'is-wrong' : 'is-dim')) : '';
        return `<button type="button" class="lp-opt ${cls}" data-o="${j}" ${fb ? 'disabled' : ''}><span class="k">${String.fromCharCode(65 + j)}</span><span>${esc(o)}</span></button>`;
      }).join('')}</div>
      ${fb ? `<div class="lp-feedback ${fb.correct ? 'ok' : 'no'}"><b>${fb.correct ? 'Correct.' : 'Not quite.'}</b> ${esc(fb.why || (fb.correct ? '' : 'The answer is: ' + q.options[fb.answer]))}</div>
        <button class="lp-pill lp-pill-lg" id="lpNextQ" type="button">${last ? 'See result' : 'Next question'}</button>` : `<p class="lp-hint lp-kb">Press 1 to ${q.options.length} to answer</p>`}
      <p class="lp-err" id="lpQErr" hidden></p>
    </div>`, `Question ${S.qi + 1} of ${qs.length}`, ((S.qi + (fb ? 1 : 0)) / qs.length) * 100);
  document.querySelectorAll('#lpStudy .lp-opt').forEach(b => b.addEventListener('click', () => lpPick(Number(b.dataset.o))));
  $('#lpNextQ')?.addEventListener('click', lpNextQ);
}
async function lpPick(j) {
  if (S.busy || S.fb[S.qi]) return;
  S.busy = true; S.picked[S.qi] = j;
  try {
    S.fb[S.qi] = await api('/api/learning', { method: 'POST', body: JSON.stringify({ moduleId: S.m.id, check: { i: S.qi, choice: j } }) });
    lpRenderQuestion();
  } catch (e) { const el = $('#lpQErr'); if (el) { el.textContent = e.message; el.hidden = false; } S.picked[S.qi] = undefined; }
  S.busy = false;
}
async function lpNextQ() {
  if (S.qi < S.m.questions.length - 1) { S.qi++; lpRenderQuestion(); return; }
  try {
    const res = await api('/api/learning', { method: 'POST', body: JSON.stringify({ moduleId: S.m.id, answers: S.picked }) });
    S.result = res; LP.progress[S.m.id] = res.progress;
    lpRenderResult();
  } catch (e) { const el = $('#lpQErr'); if (el) { el.textContent = e.message; el.hidden = false; } }
}
function lpRenderResult() {
  const r = S.result, qs = S.m.questions;
  const wrong = qs.map((q, i) => ({ q, i })).filter(({ i }) => !r.results[i].correct);
  lpStudyShell(`
    <div class="lp-center">
      <p class="lp-big">${r.score}<span>%</span></p>
      <h2>${r.passed ? 'Module complete.' : 'Not yet.'}</h2>
      <p class="lede">${r.passed ? `You passed with ${r.score}%.${wrong.length ? ' Review what you missed below.' : ''}` : `You need ${S.m.passMark}% to complete this module. Go back through the cards and try again.`}</p>
      <div class="lp-actions">
        <button class="lp-pill lp-pill-lg" id="lpDone" type="button">Back to modules</button>
        ${r.passed ? '' : `<button class="lp-pill is-ghost lp-pill-lg" id="lpRetry" type="button">Retake the quiz</button>`}
        <button class="lp-pill is-ghost lp-pill-lg" id="lpRestudy" type="button">Study the cards</button>
      </div>
      ${wrong.length ? `<div class="lp-review"><h3>What you missed</h3>${wrong.map(({ q, i }) => `
        <div class="lp-review-item"><p><b>${esc(q.q)}</b></p>
          <p class="you">You said: ${esc(q.options[S.picked[i]] ?? '')}</p>
          <p class="right">Answer: ${esc(q.options[r.results[i].answer])}</p>
          ${r.results[i].why ? `<p class="why">${esc(r.results[i].why)}</p>` : ''}</div>`).join('')}</div>` : ''}
    </div>`, 'Result', 100);
  $('#lpDone').onclick = () => { lpCloseStudy(); lpRenderHome(); };
  $('#lpRetry')?.addEventListener('click', () => { S.result = null; S.qi = 0; S.picked = []; S.fb = []; S.phase = 'quiz'; lpStudyRender(); });
  $('#lpRestudy').onclick = () => { S.result = null; S.phase = 'cards'; S.deck = S.m.cards.map((_, i) => i); S.i = 0; S.flipped = false; S.got = new Set(); S.miss = new Set(); lpStudyRender(); };
}

/* =====================================================================
   Layer 3: SEC Admin, Learning portal settings
   ===================================================================== */
const LC = { data: null, progressAll: {}, members: [], joinCode: '', open: new Set(), timer: null, sort: 'progress' };

async function loadAdminLearn() {
  const el = $('#panelLearn'); if (!el) return;
  if (!LC.data) el.innerHTML = '<div class="empty">Loading…</div>';
  try {
    const d = await api('/api/learning?admin=1');
    LC.data = { public: d.content.public, levels: d.content.levels };
    LC.progressAll = d.progressAll || {};
    LC.members = d.members || [];
    LC.joinCode = d.joinCode || '';
    renderAdminLearn();
  } catch (e) { el.innerHTML = `<div class="empty">Could not load the Learning Portal settings: ${esc(e.message)}</div>`; }
}

function lcPayload() {
  return {
    public: LC.data.public,
    joinCode: LC.joinCode,
    levels: LC.data.levels.map(l => ({ ...l, modules: l.modules.map(m => ({ ...m,
      questions: m.questions.map(q => {
        const keep = q.options.map((o, i) => [o, i]).filter(([o]) => String(o).trim());
        return { ...q, options: keep.map(k => k[0]), answer: Math.max(0, keep.findIndex(k => k[1] === q.answer)) };
      }) })) })),
  };
}
function lcSave() {
  $('#saveState').textContent = 'Saving…';
  clearTimeout(LC.timer);
  LC.timer = setTimeout(async () => {
    try {
      await api('/api/learning', { method: 'PUT', body: JSON.stringify(lcPayload()) });
      $('#saveState').textContent = 'Saved';
      setTimeout(() => { if ($('#saveState').textContent === 'Saved') $('#saveState').textContent = ''; }, 1800);
    } catch (e) { $('#saveState').textContent = 'Not saved: ' + e.message; }
  }, 700);
}
const lcSet = (path, val) => {
  const keys = path.split('.'); let o = LC.data;
  keys.slice(0, -1).forEach(k => { o = o[k]; });
  o[keys[keys.length - 1]] = val;
};
const lcId = () => 'm' + Math.random().toString(36).slice(2, 8);
/* flashcards are edited as plain lines: "front | back" */
const cardsToText = cards => (cards || []).map(c => `${c.front} | ${c.back}`).join('\n');
const textToCards = text => String(text).split('\n').map(line => {
  const i = line.indexOf('|');
  return i < 0 ? null : { front: line.slice(0, i).trim(), back: line.slice(i + 1).trim() };
}).filter(c => c && c.front && c.back);

/* ---------- committee progress ---------- */
function lcProgress() {
  const levels = LC.data.levels;
  const mods = levels.flatMap((l, li) => l.modules.filter(m => m.status === 'published' && m.questions.length).map(m => ({ ...m, li })));
  const known = new Map(LC.members.map(m => [m.id, m]));
  // everyone who joined, plus any admin who has studied
  const ids = [...new Set([...LC.members.map(m => m.id), ...Object.keys(LC.progressAll)])];
  const people = ids.map(id => {
    const prog = LC.progressAll[id] || {};
    const mine = mods.map(m => ({ m, p: prog[m.id] }));
    const done = mine.filter(x => x.p?.passed).length;
    const tried = mine.filter(x => x.p);
    const best = mine.filter(x => x.p).map(x => x.p.best);
    const last = tried.map(x => x.p.at).filter(Boolean).sort().pop() || '';
    return {
      id, name: known.get(id)?.name || id, email: known.get(id)?.imail || (id.startsWith('m:') ? id.slice(2) : 'Admin'),
      done, total: mods.length, pct: mods.length ? Math.round(done / mods.length * 100) : 0,
      avg: best.length ? Math.round(best.reduce((a, b) => a + b, 0) / best.length) : null, last,
      byLevel: levels.map((l, li) => ({ title: l.title, done: mine.filter(x => x.m.li === li && x.p?.passed).length, total: mine.filter(x => x.m.li === li).length })).filter(x => x.total),
      mine,
    };
  });
  return { mods, people };
}
const lcAgo = iso => {
  if (!iso) return 'Not started';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return days <= 0 ? 'Today' : days === 1 ? 'Yesterday' : days < 30 ? `${days} days ago` : new Date(iso).toISOString().slice(0, 10);
};
function lcProgressBlock() {
  const { mods, people } = lcProgress();
  if (!people.length) return `<div class="setblock"><h3>Committee progress</h3><p class="lead" style="margin:0">Nobody has joined yet. Share the join code (below) in the committee chat and everyone who signs up appears here.</p></div>`;
  const sorted = [...people].sort(LC.sort === 'name' ? (a, b) => a.name.localeCompare(b.name)
    : LC.sort === 'recent' ? (a, b) => (b.last || '').localeCompare(a.last || '')
    : (a, b) => b.pct - a.pct || a.name.localeCompare(b.name));
  const finished = people.filter(x => x.total && x.done === x.total).length;
  const notStarted = people.filter(x => !x.last).length;
  const avgPct = Math.round(people.reduce((a, x) => a + x.pct, 0) / people.length);
  const stat = (n, l) => `<div class="stat"><div class="n">${n}</div><div class="l">${l}</div></div>`;
  const moduleRows = mods.map(m => {
    const passed = people.filter(x => x.mine.find(y => y.m.id === m.id)?.p?.passed).length;
    const scores = people.map(x => x.mine.find(y => y.m.id === m.id)?.p?.best).filter(v => v != null);
    return `<tr><td>${esc(m.title)}</td><td><span class="lc-bar"><i style="width:${Math.round(passed / people.length * 100)}%"></i></span> ${passed} of ${people.length}</td>
      <td>${scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) + '%' : '—'}</td></tr>`;
  }).join('');
  return `<div class="setblock">
    <h3>Committee progress</h3>
    <p class="lead">How far each member has got. A module counts as complete when they pass its quiz. ${mods.length} modules are open for completion.</p>
    <div class="stats" style="margin-bottom:22px">${stat(people.length, 'Members')}${stat(avgPct + '%', 'Average complete')}${stat(finished, 'Finished everything')}${stat(notStarted, 'Not started')}</div>
    <div class="lc-row" style="margin:0 0 12px;align-items:center">
      <label for="lcSort" style="margin:0">Sort by</label>
      <select id="lcSort" style="width:auto"><option value="progress" ${LC.sort === 'progress' ? 'selected' : ''}>Most complete</option><option value="name" ${LC.sort === 'name' ? 'selected' : ''}>Name</option><option value="recent" ${LC.sort === 'recent' ? 'selected' : ''}>Last active</option></select>
      <span style="flex:1"></span><button class="mini" type="button" data-act="csv">Export CSV</button>
    </div>
    <div class="lc-scroll"><table class="lc-table lc-prog"><thead><tr><th>Member</th><th style="min-width:210px">Progress</th><th>Avg score</th><th>Last active</th><th>By level</th></tr></thead><tbody>
      ${sorted.map(x => `<tr>
        <td class="lc-who"><div><b>${esc(x.name)}</b><br><span class="small" style="color:var(--muted)">${esc(x.email)}</span></div>
          ${x.id.startsWith('m:') ? `<button class="lc-x" type="button" data-act="delmember" data-id="${esc(x.id)}" aria-label="Remove ${esc(x.name)}" title="Remove ${esc(x.name)}">&#10005;</button>` : ''}</td>
        <td data-label="Progress"><span class="lc-bar"><i style="width:${x.pct}%"></i></span> <b>${x.done}</b> of ${x.total} · ${x.pct}%</td>
        <td data-label="Avg score">${x.avg == null ? '—' : x.avg + '%'}</td>
        <td data-label="Last active">${esc(lcAgo(x.last))}</td>
        <td data-label="By level" class="lc-levels">${x.byLevel.map(l => `<span class="lc-chip ${l.done === l.total ? 'is-full' : ''}" title="${esc(l.title)}">${esc(l.title.replace(/ training$/i, ''))} ${l.done}/${l.total}</span>`).join(' ')}</td>
      </tr>`).join('')}
    </tbody></table></div>
    <details class="lc-mod" style="margin-top:18px"><summary><span class="lc-sum">Which modules are hardest, and who is stuck</span></summary><div class="lc-body">
      <h3 style="margin-top:16px">By module</h3>
      <div class="lc-scroll"><table class="lc-table"><thead><tr><th>Module</th><th>Completed</th><th>Average best score</th></tr></thead><tbody>${moduleRows}</tbody></table></div>
      <h3 style="margin-top:22px">Tried but not passed yet</h3>
      ${(() => { const rows = people.flatMap(x => x.mine.filter(y => y.p && !y.p.passed).map(y => `<tr><td><b>${esc(x.name)}</b></td><td>${esc(y.m.title)}</td><td>${y.p.best}% best · ${y.p.attempts} ${y.p.attempts === 1 ? 'try' : 'tries'}</td></tr>`)); return rows.length ? `<div class="lc-scroll"><table class="lc-table"><thead><tr><th>Member</th><th>Module</th><th>Result</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>` : '<p class="hint" style="margin:0">Nobody is stuck right now.</p>'; })()}
    </div></details>
  </div>`;
}
function lcCsv() {
  const { mods, people } = lcProgress();
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [['Name', 'Email', 'Modules passed', 'Modules open', 'Percent complete', 'Average best score', 'Last active', ...mods.map(m => m.title)]];
  people.forEach(x => rows.push([x.name, x.email, x.done, x.total, x.pct, x.avg ?? '', x.last ? x.last.slice(0, 10) : '', ...x.mine.map(y => y.p ? (y.p.passed ? `Passed ${y.p.best}%` : `${y.p.best}% (not passed)`) : '')]));
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([rows.map(r => r.map(q).join(',')).join('\n')], { type: 'text/csv' }));
  a.download = 'sec-learning-progress.csv'; a.click(); URL.revokeObjectURL(a.href);
}

function renderAdminLearn() {
  const el = $('#panelLearn'); if (!el || !LC.data) return;
  const { public: pub, levels } = LC.data;

  const inp = (path, val, ph = '', extra = '') => `<input type="text" data-p="${path}" value="${esc(val ?? '')}" placeholder="${esc(ph)}" ${extra}>`;
  const area = (path, val, cls = '', ph = '') => `<textarea class="${cls}" data-p="${path}" placeholder="${esc(ph)}">${esc(val ?? '')}</textarea>`;

  const modBlock = (m, li, mi, nMods) => {
    const base = `levels.${li}.modules.${mi}`;
    return `<details class="lc-mod" data-mid="${esc(m.id)}" ${LC.open.has(m.id) ? 'open' : ''}>
      <summary><span class="lc-sum">${esc(m.title || 'Untitled module')}</span>
        <span class="small" style="font-weight:400;color:var(--muted)">${m.cards.length} cards · ${m.questions.length} questions</span>
        <span class="pill ${m.status === 'published' ? 'ok' : 'no'}">${m.status === 'published' ? 'Published' : 'Draft'}</span></summary>
      <div class="lc-body">
        <div class="setgrid" style="margin-top:16px">
          <div style="grid-column:1/-1"><label>Title</label>${inp(base + '.title', m.title)}</div>
          <div style="grid-column:1/-1"><label>What the member will be able to do</label>${inp(base + '.objective', m.objective)}</div>
          <div><label>Status</label><select data-p="${base}.status"><option value="draft" ${m.status !== 'published' ? 'selected' : ''}>Draft (members see "Coming soon")</option><option value="published" ${m.status === 'published' ? 'selected' : ''}>Published</option></select></div>
          <div><label>Content owner</label>${inp(base + '.owner', m.owner, 'e.g. President / ExCo')}</div>
          <div><label>Reviewer</label>${inp(base + '.reviewer', m.reviewer)}</div>
          <div><label>Pass mark (%)</label>${inp(base + '.passMark', m.passMark, '75', 'inputmode="numeric"')}</div>
        </div>
        <label>Flashcards</label>
        <p class="hint" style="margin-top:0">One card per line, written as <b>question | answer</b>. Keep each side short: one idea per card.</p>
        <textarea class="lc-tall" data-cards="${base}" placeholder="Ownership | If it is yours, you carry it to the end.">${esc(cardsToText(m.cards))}</textarea>
        <label style="margin-top:14px">Quiz questions (multiple choice)</label>
        ${m.questions.map((q, qi) => `<div class="lc-q">
          <input type="text" data-p="${base}.questions.${qi}.q" value="${esc(q.q)}" placeholder="Question ${qi + 1}">
          <div style="margin-top:10px">${[0, 1, 2, 3].map(oi => `<div class="lc-opt">
            <input type="radio" name="ans-${esc(m.id)}-${qi}" data-ans="${base}.questions.${qi}.answer" value="${oi}" ${q.answer === oi ? 'checked' : ''} title="Correct answer">
            <input type="text" data-p="${base}.questions.${qi}.options.${oi}" value="${esc(q.options[oi] || '')}" placeholder="Option ${oi + 1}${oi < 2 ? '' : ' (optional)'}"></div>`).join('')}</div>
          <input type="text" data-p="${base}.questions.${qi}.why" value="${esc(q.why || '')}" placeholder="Why that answer is right (shown right after they answer)">
          <input type="text" data-p="${base}.questions.${qi}.source" value="${esc(q.source || '')}" placeholder="Source, e.g. Charter 4.4.15 (admin only, members never see this)" style="margin-top:8px">
          <div class="lc-row"><button class="mini danger" type="button" data-act="delq" data-li="${li}" data-mi="${mi}" data-qi="${qi}">Remove question</button></div>
        </div>`).join('') || `<p class="hint">No questions yet. A module with no questions cannot be completed.</p>`}
        <div class="lc-row">
          <button class="mini" type="button" data-act="addq" data-li="${li}" data-mi="${mi}">Add question</button>
          <span style="flex:1"></span>
          <button class="mini" type="button" data-act="mup" data-li="${li}" data-mi="${mi}" ${mi === 0 ? 'disabled' : ''}>Move up</button>
          <button class="mini" type="button" data-act="mdown" data-li="${li}" data-mi="${mi}" ${mi === nMods - 1 ? 'disabled' : ''}>Move down</button>
          <button class="mini danger" type="button" data-act="delm" data-li="${li}" data-mi="${mi}">Delete module</button>
        </div>
      </div></details>`;
  };

  el.innerHTML = `
  ${lcProgressBlock()}
  <div class="setblock">
    <h3>Public recruitment page</h3>
    <p class="lead">Shown to applicants on the public page. It tells them what happens after they are selected. Switch it off to hide the whole section.</p>
    <label style="display:flex;gap:10px;align-items:center;margin-bottom:18px"><input type="checkbox" data-bool="public.enabled" ${pub.enabled !== false ? 'checked' : ''} style="width:auto"> Show this section on the public page</label>
    <div class="setgrid">
      <div style="grid-column:1/-1"><label>Headline</label>${inp('public.headline', pub.headline)}</div>
      <div style="grid-column:1/-1"><label>Intro</label>${area('public.intro', pub.intro)}</div>
    </div>
    <label>Learning path (also shown on the Learning Portal)</label>
    ${(pub.steps || []).map((s, i) => `<div class="qrow">
      <input type="text" data-p="public.steps.${i}.title" value="${esc(s.title)}" placeholder="Step" style="flex:1">
      <input type="text" data-p="public.steps.${i}.text" value="${esc(s.text)}" placeholder="One line" style="flex:2.4">
      <button class="mini danger" type="button" data-act="delstep" data-i="${i}" aria-label="Remove step">&#10005;</button></div>`).join('')}
    <button class="mini" type="button" data-act="addstep" ${(pub.steps || []).length >= 6 ? 'disabled' : ''}>Add step</button>
  </div>

  ${levels.map((l, li) => `<div class="setblock">
    <h3>Level ${li + 1}: ${esc(l.title)}</h3>
    <div class="setgrid">
      <div><label>Level name</label>${inp(`levels.${li}.title`, l.title)}</div>
      <div><label>Who it is for</label>${inp(`levels.${li}.audience`, l.audience)}</div>
      <div style="grid-column:1/-1"><label>One-line summary</label>${inp(`levels.${li}.summary`, l.summary)}</div>
    </div>
    ${l.modules.map((m, mi) => modBlock(m, li, mi, l.modules.length)).join('') || '<p class="hint">No modules yet.</p>'}
    <div class="lc-row">
      <button class="mini" type="button" data-act="addm" data-li="${li}">Add module</button>
      <span style="flex:1"></span>
      <button class="mini" type="button" data-act="lup" data-li="${li}" ${li === 0 ? 'disabled' : ''}>Move level up</button>
      <button class="mini" type="button" data-act="ldown" data-li="${li}" ${li === levels.length - 1 ? 'disabled' : ''}>Move level down</button>
      <button class="mini danger" type="button" data-act="dell" data-li="${li}">Delete level</button>
    </div>
  </div>`).join('')}
  <button class="mini" type="button" data-act="addl" style="margin-bottom:22px">Add level</button>

  <div class="setblock">
    <h3>Committee sign-up</h3>
    <p class="lead">Committee members create their own Learning Portal account, so you do not add anyone by hand. Share this join code in the committee chat. Anyone with the code can sign up, so change it when people leave. Clear it to close sign-up. Members never see applicants or this admin area.</p>
    <div class="setgrid"><div style="grid-column:1/-1"><label for="lcJoin">Join code</label>
      <input type="text" id="lcJoin" value="${esc(LC.joinCode)}" placeholder="No code set, so sign-up is closed" autocomplete="off"></div></div>
    <div class="lc-row" style="margin-top:0"><button class="mini" type="button" data-act="gencode">Generate a new code</button></div>
    <h3 style="margin-top:26px">Members (${LC.members.length})</h3>
    ${LC.members.length ? `<div class="lc-scroll"><table class="lc-table"><thead><tr><th>Name</th><th>Email</th><th>Joined</th><th></th></tr></thead><tbody>
      ${LC.members.map(m => `<tr><td><b>${esc(m.name)}</b></td><td>${esc(m.imail)}</td><td>${esc((m.createdAt || '').slice(0, 10))}</td>
        <td><button class="mini danger" type="button" data-act="delmember" data-id="${esc(m.id)}">Remove</button></td></tr>`).join('')}
    </tbody></table></div>` : '<p class="hint" style="margin:0">Nobody has joined yet.</p>'}
  </div>`;
}

/* one delegated set of listeners for the whole editor */
(function wireAdminLearn() {
  const el = $('#panelLearn'); if (!el) return;
  el.addEventListener('input', e => {
    if (e.target.id === 'lcJoin') { LC.joinCode = e.target.value.trim(); lcSave(); return; }
    if (e.target.dataset.cards && LC.data) { // flashcards: parse the lines back into cards
      lcSet(e.target.dataset.cards + '.cards', textToCards(e.target.value));
      const sum = e.target.closest('details.lc-mod')?.querySelector('summary .small');
      if (sum) { const m = e.target.dataset.cards.split('.'); const mod = LC.data.levels[m[1]].modules[m[3]]; sum.textContent = `${mod.cards.length} cards · ${mod.questions.length} questions`; }
      lcSave(); return;
    }
    const p = e.target.dataset.p; if (!p || !LC.data) return;
    let v = e.target.value;
    if (p.endsWith('.passMark')) v = parseInt(v, 10) || 0;
    lcSet(p, v);
    if (/\.title$/.test(p) && e.target.closest('summary, .lc-body')) {
      const d = e.target.closest('details.lc-mod'); if (d) d.querySelector('.lc-sum').textContent = v || 'Untitled module';
    }
    lcSave();
  });
  el.addEventListener('change', e => {
    if (!LC.data) return;
    if (e.target.id === 'lcSort') { LC.sort = e.target.value; renderAdminLearn(); return; }
    if (e.target.dataset.bool) { lcSet(e.target.dataset.bool, e.target.checked); lcSave(); }
    else if (e.target.dataset.ans) { lcSet(e.target.dataset.ans, Number(e.target.value)); lcSave(); }
    else if (e.target.tagName === 'SELECT' && e.target.dataset.p) {
      lcSet(e.target.dataset.p, e.target.value); lcSave();
      const d = e.target.closest('details.lc-mod');
      if (d) { const pill = d.querySelector('summary .pill'); pill.textContent = e.target.value === 'published' ? 'Published' : 'Draft'; pill.className = 'pill ' + (e.target.value === 'published' ? 'ok' : 'no'); }
    }
  });
  el.addEventListener('toggle', e => {
    const d = e.target; if (!d.matches?.('details.lc-mod')) return;
    d.open ? LC.open.add(d.dataset.mid) : LC.open.delete(d.dataset.mid);
  }, true);
  el.addEventListener('click', async e => {
    const b = e.target.closest('[data-act]'); if (!b || !LC.data) return;
    const { act } = b.dataset, li = Number(b.dataset.li), mi = Number(b.dataset.mi), qi = Number(b.dataset.qi), L = LC.data.levels;
    if (act === 'csv') { lcCsv(); return; }
    if (act === 'gencode') {
      const a = new Uint8Array(6); crypto.getRandomValues(a);
      LC.joinCode = 'SEC-' + [...a].map(n => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[n % 32]).join('');
      renderAdminLearn(); lcSave(); return;
    }
    if (act === 'delmember') {
      if (!await uiConfirm('Remove this member?', 'They are signed out straight away and all their progress is deleted. They can sign up again with the join code.', 'Remove')) return;
      try { await api('/api/learning?member=' + encodeURIComponent(b.dataset.id), { method: 'DELETE' }); LC.members = LC.members.filter(m => m.id !== b.dataset.id); delete LC.progressAll[b.dataset.id]; renderAdminLearn(); }
      catch (ex) { $('#saveState').textContent = 'Not removed: ' + ex.message; }
      return;
    }
    const swap = (arr, i, j) => { if (j >= 0 && j < arr.length) [arr[i], arr[j]] = [arr[j], arr[i]]; };
    if (act === 'addstep') LC.data.public.steps.push({ title: '', text: '' });
    else if (act === 'delstep') LC.data.public.steps.splice(Number(b.dataset.i), 1);
    else if (act === 'addl') L.push({ id: 'l' + lcId(), title: 'New level', audience: '', summary: '', modules: [] });
    else if (act === 'dell') { if (!await uiConfirm('Delete this level?', 'Every module in it goes too. Members’ completion records for those modules stop showing.', 'Delete')) return; L.splice(li, 1); }
    else if (act === 'lup') swap(L, li, li - 1);
    else if (act === 'ldown') swap(L, li, li + 1);
    else if (act === 'addm') { const id = lcId(); L[li].modules.push({ id, title: 'New module', objective: '', status: 'draft', owner: '', reviewer: '', passMark: 75, cards: [], questions: [] }); LC.open.add(id); }
    else if (act === 'delm') { if (!await uiConfirm('Delete this module?', L[li].modules[mi].title || 'Untitled module', 'Delete')) return; L[li].modules.splice(mi, 1); }
    else if (act === 'mup') swap(L[li].modules, mi, mi - 1);
    else if (act === 'mdown') swap(L[li].modules, mi, mi + 1);
    else if (act === 'addq') { L[li].modules[mi].questions.push({ q: '', options: ['', '', '', ''], answer: 0, why: '' }); LC.open.add(L[li].modules[mi].id); }
    else if (act === 'delq') L[li].modules[mi].questions.splice(qi, 1);
    else return;
    renderAdminLearn(); lcSave();
  });
})();
window.SEC.loadAdminLearn = loadAdminLearn;

/* =====================================================================
   wiring
   ===================================================================== */
$('#footerLearn')?.addEventListener('click', e => { e.preventDefault(); openLearn(); });
$('#btnToLearn')?.addEventListener('click', () => openLearn());
lpLoadTeaser();
if (location.hash === '#learning') openLearn();
