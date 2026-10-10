/* Learning Portal (ES module, loaded by the main script). Three layers share one data set (/api/learning):
     1. public recruitment page  -> #learnTeaser (read-only, text set by admin)
     2. committee Learning Portal -> #viewLearn   (sign-in required)
     3. SEC Admin                 -> #panelLearn  (admin sign-in; edits layers 1 and 2)
   Uses helpers from the main script: $, esc, api, showView, applyLock, loadState, ADMIN, DEPT_COLORS. */

const { $, esc, api, showView, applyLock, loadState, uiConfirm, DEPT_COLORS } = window.SEC;

/* ---------- small helpers ---------- */
function lpFmt(text) {
  let html = '', list = false;
  const close = () => { if (list) { html += '</ul>'; list = false; } };
  String(text || '').split('\n').forEach(line => {
    const t = line.trim();
    if (!t) { close(); return; }
    if (t.startsWith('## ')) { close(); html += `<h3>${esc(t.slice(3))}</h3>`; }
    else if (t.startsWith('- ')) { if (!list) { html += '<ul>'; list = true; } html += `<li>${esc(t.slice(2))}</li>`; }
    else { close(); html += `<p>${esc(t)}</p>`; }
  });
  close();
  return html;
}
function lpVideo(url) {
  if (!url) return '';
  let m, src = '';
  if ((m = url.match(/youtu\.be\/([\w-]{11})/) || url.match(/youtube\.com\/watch\?v=([\w-]{11})/))) src = `https://www.youtube.com/embed/${m[1]}`;
  else if ((m = url.match(/vimeo\.com\/(\d+)/))) src = `https://player.vimeo.com/video/${m[1]}`;
  if (src) return `<div class="lp-video"><iframe src="${src}" title="Module video" loading="lazy" allowfullscreen></iframe></div>`;
  return `<p style="margin-top:56px"><a class="hero-cta" href="${esc(url)}" target="_blank" rel="noopener">Watch the video</a></p>`;
}
const lpColor = i => DEPT_COLORS[i % DEPT_COLORS.length];

/* same scroll motion as the public page */
const lpReveal = (() => {
  if (!('IntersectionObserver' in window) || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return () => {};
  const seen = new Set(), running = new Map();
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) {
      if (e.intersectionRatio >= .12 && !seen.has(e.target)) {
        seen.add(e.target);
        const a = e.target.animate([{ opacity: .45, transform: 'translateY(16px)' }, { opacity: 1, transform: 'translateY(0)' }],
          { duration: 620, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
        running.set(e.target, a); a.finished.then(() => running.delete(e.target)).catch(() => {});
      }
    } else { seen.delete(e.target); running.get(e.target)?.cancel(); running.delete(e.target); }
  }), { threshold: [0, .12] });
  return root => root.querySelectorAll('[data-lp-reveal]').forEach(el => io.observe(el));
})();

/* =====================================================================
   Layer 1 — public teaser on the recruitment page
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
   Layer 2 — committee Learning Portal
   ===================================================================== */
const LP = { user: null, role: null, pub: null, levels: [], progress: {}, mod: null, result: null, picked: [] };
const lpRoot = () => $('#lpMain');
const lpAllMods = () => LP.levels.flatMap((l, li) => l.modules.map(m => ({ ...m, level: l, li })));
const lpDone = id => !!LP.progress[id]?.passed;

function lpBar() {
  const signed = !!LP.user;
  $('#lpNav').innerHTML = `
    <button class="lp-link" id="lpToSite" type="button">Recruitment site</button>
    ${LP.role === 'admin' ? `<button class="lp-link" id="lpToAdmin" type="button">Admin</button>` : ''}
    ${signed ? `<button class="lp-link" id="lpSignOut" type="button">Sign out</button>` : ''}`;
  $('#lpToSite').onclick = () => { history.replaceState(null, '', location.pathname); showView('public'); };
  $('#lpToAdmin')?.addEventListener('click', async () => { await loadState(); showView('admin'); applyLock(); });
  $('#lpSignOut')?.addEventListener('click', async () => {
    await api('/api/session', { method: 'DELETE' });
    Object.assign(LP, { user: null, role: null, levels: [], progress: {}, mod: null });
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
  try { await lpLoad(); } catch { /* shows the locked screen */ }
  LP.mod = null;
  lpRender();
}

function lpRender() {
  lpBar();
  if (!LP.user) return lpRenderLocked();
  if (LP.mod) return lpRenderModule();
  lpRenderHome();
}

function lpRenderLocked(err) {
  lpRoot().innerHTML = `
    <div class="wrap"><div class="lp-lock"><div class="lp-lock-box">
      <h1>Learning Portal.</h1>
      <p class="lede">For SEC committee members. Sign in with the login the committee gave you.</p>
      <div class="lp-field"><label for="lpUser">Username</label><input id="lpUser" type="text" autocomplete="username"></div>
      <div class="lp-field"><label for="lpPass">Password</label><input id="lpPass" type="password" autocomplete="current-password"></div>
      <div class="lp-lock-err" id="lpErr" ${err ? '' : 'hidden'}>${esc(err || '')}</div>
      <button class="hero-cta" id="lpLogin" type="button">Sign in</button>
    </div></div></div>`;
  const go = async () => {
    const btn = $('#lpLogin'); btn.disabled = true; btn.textContent = 'Signing in…';
    try {
      await api('/api/session', { method: 'POST', body: JSON.stringify({ username: $('#lpUser').value.trim(), password: $('#lpPass').value }) });
      await lpLoad();
      if (LP.role === 'admin') await loadState(); // so the Admin button opens straight in
      lpRender();
    } catch (e) { lpRenderLocked(e.message); }
  };
  $('#lpLogin').onclick = go;
  $('#lpPass').addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  setTimeout(() => $('#lpUser')?.focus(), 30);
}

function lpRenderHome() {
  const mods = lpAllMods().filter(m => m.status === 'published');
  const done = mods.filter(m => lpDone(m.id)).length;
  const next = mods.find(m => !lpDone(m.id));
  const pct = mods.length ? Math.round(done / mods.length * 100) : 0;
  const steps = LP.pub?.steps || [];
  lpRoot().innerHTML = `
    <div class="wrap">
      <header class="lp-hero">
        <h1 class="lp-h1">Become<br><em>capable.</em></h1>
        <p class="lede">Short modules on how SEC works, what you own and how to deliver. Pass the check at the end of each one.</p>
        <div class="lp-hero-actions">
          ${next ? `<button class="hero-cta" id="lpContinue" type="button">${done ? 'Continue learning' : 'Start learning'}</button>`
                 : (mods.length ? `<span class="lede" style="margin:0">Everything published is complete.</span>` : '')}
        </div>
        <div class="lp-progress">
          <div class="lp-progress-n">${done}<span style="color:var(--muted)">/${mods.length}</span></div>
          <div class="lp-progress-l">modules complete</div>
          <div class="lp-bar-track"><div class="lp-bar-fill" style="width:${pct}%"></div></div>
        </div>
      </header>

      ${steps.length ? `<section class="lp-section" data-lp-reveal>
        <h2 class="lp-h2">The path.</h2>
        <div class="lp-path">${steps.map((s, i) => `<div class="lp-step" data-lp-reveal><div class="n">${i + 1}</div><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div>`).join('')}</div>
      </section>` : ''}

      <section class="lp-light">
        <h2 class="lp-h2" data-lp-reveal>Levels.</h2>
        <div class="lp-levels">${LP.levels.map((l, i) => {
          const pub = l.modules.filter(m => m.status === 'published');
          const d = pub.filter(m => lpDone(m.id)).length;
          return `<article class="lp-level" style="--lc:${lpColor(i)}" data-lp-reveal>
            <div class="lp-level-top"><span class="lp-pill">${esc(l.audience || 'Level ' + (i + 1))}</span><span class="lp-count">${pub.length ? `${d} of ${pub.length} complete` : 'Coming soon'}</span></div>
            <h3>${esc(l.title)}</h3>
            ${l.summary ? `<p>${esc(l.summary)}</p>` : ''}
            <ul class="lp-mods">${l.modules.map(m => m.status === 'published'
              ? `<li class="lp-mod"><button type="button" data-mod="${esc(m.id)}"><span>${esc(m.title)}</span><span class="lp-state ${lpDone(m.id) ? 'is-done' : ''}">${lpDone(m.id) ? 'Complete' : 'Start'}</span></button></li>`
              : `<li class="lp-mod"><button type="button" disabled><span>${esc(m.title)}</span><span class="lp-state is-soon">Coming soon</span></button></li>`).join('')}</ul>
          </article>`;
        }).join('')}</div>
      </section>
    </div>`;
  lpRoot().querySelectorAll('[data-mod]').forEach(b => b.addEventListener('click', () => lpOpenModule(b.dataset.mod)));
  $('#lpContinue')?.addEventListener('click', () => next && lpOpenModule(next.id));
  lpReveal(lpRoot());
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function lpOpenModule(id) {
  LP.mod = id; LP.result = null; LP.picked = [];
  lpRender();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function lpRenderModule() {
  const m = lpAllMods().find(x => x.id === LP.mod);
  if (!m || m.status !== 'published') { LP.mod = null; return lpRenderHome(); }
  const mine = LP.progress[m.id];
  const pub = lpAllMods().filter(x => x.status === 'published');
  const nextMod = pub[pub.findIndex(x => x.id === m.id) + 1];
  const r = LP.result;

  const questions = m.questions.map((q, i) => `
    <fieldset class="lp-q"><legend>${i + 1}. ${esc(q.q)}</legend>
      ${q.options.map((o, j) => {
        const cls = r ? (j === r.results[i].answer ? 'is-right' : (LP.picked[i] === j ? 'is-wrong' : '')) : (LP.picked[i] === j ? 'is-picked' : '');
        return `<label class="lp-opt ${cls}"><input type="radio" name="q${i}" value="${j}" ${LP.picked[i] === j ? 'checked' : ''} ${r ? 'disabled' : ''}><span>${esc(o)}</span></label>`;
      }).join('')}
      ${r && r.results[i].why ? `<p class="lp-why">${esc(r.results[i].why)}</p>` : ''}
    </fieldset>`).join('');

  lpRoot().innerHTML = `
    <div class="lp-light" style="padding-top:72px;margin-bottom:0"><div class="wrap lp-module">
      <button class="lp-back" id="lpBack" type="button">← All modules</button>
      <h1 data-lp-reveal>${esc(m.title)}</h1>
      <p class="lede">${esc(m.objective)}</p>
      <div class="lp-meta"><span class="lp-pill">${esc(m.level.title)}</span>${m.owner ? `<span class="lp-pill" style="background:transparent;color:#181C20;border:1.5px solid rgba(24,28,32,.4)">Owner: ${esc(m.owner)}</span>` : ''}</div>
      ${mine?.passed ? `<div class="lp-done-banner">Complete · best score ${mine.best}%</div>` : ''}
      ${lpVideo(m.video)}

      ${m.guide ? `<section class="lp-block" data-lp-reveal><h2>The guide.</h2><div class="lp-guide">${lpFmt(m.guide)}</div></section>` : ''}

      ${(m.good || m.bad) ? `<section class="lp-block" data-lp-reveal><h2>Good and bad.</h2><div class="lp-gb">
        ${m.good ? `<div class="lp-card good"><h3>Good</h3><p>${esc(m.good)}</p></div>` : ''}
        ${m.bad ? `<div class="lp-card bad"><h3>Bad</h3><p>${esc(m.bad)}</p></div>` : ''}
      </div></section>` : ''}

      ${m.scenario ? `<section class="lp-block" data-lp-reveal><h2>Scenario.</h2><div class="lp-card scenario"><p>${esc(m.scenario)}</p></div></section>` : ''}

      ${m.questions.length ? `<section class="lp-block" data-lp-reveal><h2>Check yourself.</h2>
        <form id="lpQuiz" novalidate>${questions}
          <p class="lp-err" id="lpQErr" hidden></p>
          ${r ? '' : `<button class="hero-cta" type="submit">Submit answers</button>`}
        </form>
        ${r ? `<div class="lp-result"><b>${r.score}%</b><p>${r.passed ? 'Passed. This module is marked complete.' : `Not yet. You need ${m.passMark}% to complete this module. Read the guide again and retake.`}</p>
          ${r.passed ? '' : `<button class="hero-cta" id="lpRetake" type="button">Retake</button>`}</div>` : ''}
      </section>` : ''}

      <div class="lp-next">
        <button class="hero-cta" id="lpAll" type="button">All modules</button>
        ${nextMod ? `<button class="hero-cta" id="lpNextMod" type="button">Next: ${esc(nextMod.title)}</button>` : ''}
      </div>
    </div></div>`;

  $('#lpBack').onclick = $('#lpAll').onclick = () => { LP.mod = null; lpRender(); };
  $('#lpNextMod')?.addEventListener('click', () => lpOpenModule(nextMod.id));
  $('#lpRetake')?.addEventListener('click', () => { LP.result = null; LP.picked = []; lpRenderModule(); document.getElementById('lpQuiz')?.scrollIntoView(); });
  lpRoot().querySelectorAll('.lp-opt input').forEach(inp => inp.addEventListener('change', () => {
    const i = Number(inp.name.slice(1)); LP.picked[i] = Number(inp.value);
    inp.closest('fieldset').querySelectorAll('.lp-opt').forEach(l => l.classList.toggle('is-picked', l.contains(inp) && inp.checked));
  }));
  $('#lpQuiz')?.addEventListener('submit', async e => {
    e.preventDefault();
    const err = $('#lpQErr');
    if (m.questions.some((_, i) => LP.picked[i] === undefined)) { err.textContent = 'Answer every question first.'; err.hidden = false; return; }
    const btn = e.target.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Checking…';
    try {
      const res = await api('/api/learning', { method: 'POST', body: JSON.stringify({ moduleId: m.id, answers: LP.picked }) });
      LP.result = res; LP.progress[m.id] = res.progress;
      lpRenderModule();
      document.querySelector('#lpQuiz')?.scrollIntoView();
    } catch (ex) { err.textContent = ex.message; err.hidden = false; btn.disabled = false; btn.textContent = 'Submit answers'; }
  });
  lpReveal(lpRoot());
}

/* =====================================================================
   Layer 3 — SEC Admin: Learning portal settings
   ===================================================================== */
const LC = { data: null, progressAll: {}, open: new Set(), timer: null };

async function loadAdminLearn() {
  const el = $('#panelLearn'); if (!el) return;
  if (!LC.data) el.innerHTML = '<div class="empty">Loading…</div>';
  try {
    const d = await api('/api/learning?admin=1');
    LC.data = { public: d.content.public, levels: d.content.levels };
    LC.progressAll = d.progressAll || {};
    renderAdminLearn();
  } catch (e) { el.innerHTML = `<div class="empty">Could not load the Learning Portal settings: ${esc(e.message)}</div>`; }
}

function lcPayload() {
  return {
    public: LC.data.public,
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

function renderAdminLearn() {
  const el = $('#panelLearn'); if (!el || !LC.data) return;
  const { public: pub, levels } = LC.data;
  const published = levels.flatMap(l => l.modules.filter(m => m.status === 'published'));
  const members = Object.keys(LC.progressAll);

  const inp = (path, val, ph = '', extra = '') => `<input type="text" data-p="${path}" value="${esc(val ?? '')}" placeholder="${esc(ph)}" ${extra}>`;
  const area = (path, val, cls = '', ph = '') => `<textarea class="${cls}" data-p="${path}" placeholder="${esc(ph)}">${esc(val ?? '')}</textarea>`;

  const modBlock = (m, li, mi, nMods) => {
    const base = `levels.${li}.modules.${mi}`;
    return `<details class="lc-mod" data-mid="${esc(m.id)}" ${LC.open.has(m.id) ? 'open' : ''}>
      <summary><span class="lc-sum">${esc(m.title || 'Untitled module')}</span>
        <span class="pill ${m.status === 'published' ? 'ok' : 'no'}">${m.status === 'published' ? 'Published' : 'Draft'}</span></summary>
      <div class="lc-body">
        <div class="setgrid" style="margin-top:16px">
          <div style="grid-column:1/-1"><label>Title</label>${inp(base + '.title', m.title)}</div>
          <div style="grid-column:1/-1"><label>What the member will be able to do</label>${inp(base + '.objective', m.objective)}</div>
          <div><label>Status</label><select data-p="${base}.status"><option value="draft" ${m.status !== 'published' ? 'selected' : ''}>Draft (members see "Coming soon")</option><option value="published" ${m.status === 'published' ? 'selected' : ''}>Published</option></select></div>
          <div><label>Content owner</label>${inp(base + '.owner', m.owner, 'e.g. President / ExCo')}</div>
          <div><label>Reviewer</label>${inp(base + '.reviewer', m.reviewer)}</div>
          <div><label>Pass mark (%)</label>${inp(base + '.passMark', m.passMark, '75', 'inputmode="numeric"')}</div>
          <div style="grid-column:1/-1"><label>Video link (YouTube, Vimeo or any https link)</label>${inp(base + '.video', m.video, 'https://')}</div>
        </div>
        <label>Written guide</label>
        <p class="hint" style="margin-top:0">Start a line with <b>## </b> for a heading and <b>- </b> for a bullet. Key information only.</p>
        ${area(base + '.guide', m.guide, 'lc-tall')}
        <div class="setgrid" style="margin-top:14px">
          <div><label>Good example</label>${area(base + '.good', m.good)}</div>
          <div><label>Bad example</label>${area(base + '.bad', m.bad)}</div>
          <div style="grid-column:1/-1"><label>Scenario</label>${area(base + '.scenario', m.scenario)}</div>
        </div>
        <label>Assessment questions</label>
        ${m.questions.map((q, qi) => `<div class="lc-q">
          <input type="text" data-p="${base}.questions.${qi}.q" value="${esc(q.q)}" placeholder="Question ${qi + 1}">
          <div style="margin-top:10px">${[0, 1, 2, 3].map(oi => `<div class="lc-opt">
            <input type="radio" name="ans-${esc(m.id)}-${qi}" data-ans="${base}.questions.${qi}.answer" value="${oi}" ${q.answer === oi ? 'checked' : ''} title="Correct answer">
            <input type="text" data-p="${base}.questions.${qi}.options.${oi}" value="${esc(q.options[oi] || '')}" placeholder="Option ${oi + 1}${oi < 2 ? '' : ' (optional)'}"></div>`).join('')}</div>
          <input type="text" data-p="${base}.questions.${qi}.why" value="${esc(q.why || '')}" placeholder="Why that answer is right (shown after they submit)">
          <div class="lc-row"><button class="mini danger" type="button" data-act="delq" data-li="${li}" data-mi="${mi}" data-qi="${qi}">Remove question</button></div>
        </div>`).join('') || `<p class="hint">No questions yet. A module with no questions has no completion check.</p>`}
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
  <div class="setblock">
    <h3>Public recruitment page</h3>
    <p class="lead">Shown to applicants on the public page, under "How it works". It tells them what happens after they are selected. Switch it off to hide the whole section.</p>
    <label style="display:flex;gap:10px;align-items:center;margin-bottom:18px"><input type="checkbox" data-bool="public.enabled" ${pub.enabled !== false ? 'checked' : ''} style="width:auto"> Show this section on the public page</label>
    <div class="setgrid">
      <div style="grid-column:1/-1"><label>Headline</label>${inp('public.headline', pub.headline)}</div>
      <div style="grid-column:1/-1"><label>Intro</label>${area('public.intro', pub.intro)}</div>
    </div>
    <label>Learning path (also shown on the Learning Portal home)</label>
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
    <h3>Completion</h3>
    <p class="lead">Who has passed what. A member appears here after submitting their first assessment. Only published modules with questions can be completed.</p>
    ${members.length && published.length ? `<div class="lc-scroll"><table class="lc-table"><thead><tr><th>Member</th>${published.map(m => `<th>${esc(m.title)}</th>`).join('')}</tr></thead><tbody>
      ${members.map(u => `<tr><td><b>${esc(u)}</b></td>${published.map(m => { const p = LC.progressAll[u]?.[m.id]; return `<td>${p ? (p.passed ? `Passed (${p.best}%)` : `${p.best}% · ${p.attempts} tr${p.attempts === 1 ? 'y' : 'ies'}`) : '—'}</td>`; }).join('')}</tr>`).join('')}
    </tbody></table></div>` : '<p class="hint" style="margin:0">Nobody has submitted an assessment yet.</p>'}
  </div>
  <div class="setblock">
    <h3>Committee logins</h3>
    <p class="lead">Committee members sign in to the Learning Portal with logins from the <b>COMMITTEE_USERS</b> environment variable, written as <b>name:password,name:password</b>. They cannot see applicants or this admin area. Give each person their own login so completion is recorded against their name. Add or remove logins in Vercel → Settings → Environment Variables, then redeploy.</p>
  </div>`;
}

/* one delegated set of listeners for the whole editor */
(function wireAdminLearn() {
  const el = $('#panelLearn'); if (!el) return;
  el.addEventListener('input', e => {
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
    const swap = (arr, i, j) => { if (j >= 0 && j < arr.length) [arr[i], arr[j]] = [arr[j], arr[i]]; };
    if (act === 'addstep') LC.data.public.steps.push({ title: '', text: '' });
    else if (act === 'delstep') LC.data.public.steps.splice(Number(b.dataset.i), 1);
    else if (act === 'addl') L.push({ id: 'l' + lcId(), title: 'New level', audience: '', summary: '', modules: [] });
    else if (act === 'dell') { if (!await uiConfirm('Delete this level?', 'Every module in it goes too. Members’ completion records for those modules stop showing.', 'Delete')) return; L.splice(li, 1); }
    else if (act === 'lup') swap(L, li, li - 1);
    else if (act === 'ldown') swap(L, li, li + 1);
    else if (act === 'addm') { const id = lcId(); L[li].modules.push({ id, title: 'New module', objective: '', status: 'draft', owner: '', reviewer: '', video: '', guide: '', good: '', bad: '', scenario: '', passMark: 75, questions: [] }); LC.open.add(id); }
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
