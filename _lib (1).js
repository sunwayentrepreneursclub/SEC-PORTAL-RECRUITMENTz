import crypto from 'crypto';

/* ---------------- storage (Upstash Redis REST) ---------------- */
const KV_URL   = process.env.KV_REST_API_URL   || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

export function storageConfigured() { return !!(KV_URL && KV_TOKEN); }

async function cmd(args) {
  if (!storageConfigured()) throw new Error('STORAGE_NOT_CONFIGURED');
  const r = await fetch(KV_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  if (!r.ok) throw new Error(`storage ${r.status}: ${await r.text()}`);
  const j = await r.json();
  return j.result;
}

export async function kvGet(key) {
  const v = await cmd(['GET', key]);
  if (v === null || v === undefined) return null;
  try { return JSON.parse(v); } catch { return v; }
}
export async function kvSet(key, value) {
  return cmd(['SET', key, JSON.stringify(value)]);
}

export const K_STATE = 'sec:state';
export const K_APPS  = 'sec:applications';
export const K_KEY   = 'sec:gemini_key';

/* ---------------- sessions ---------------- */
const SECRET = process.env.SESSION_SECRET || '';
const COOKIE = 'sec_session';
const TTL_MS = 12 * 60 * 60 * 1000;

function sign(payload) {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
}

export function issueSession(res, username) {
  const payload = `${Buffer.from(username).toString('base64url')}.${Date.now() + TTL_MS}`;
  const token = `${payload}.${sign(payload)}`;
  res.setHeader('Set-Cookie',
    `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${TTL_MS / 1000}`);
}

export function clearSession(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`);
}

export function currentUser(req) {
  if (!SECRET) return null;
  const raw = (req.headers.cookie || '')
    .split(';').map(s => s.trim()).find(s => s.startsWith(`${COOKIE}=`));
  if (!raw) return null;
  const token = raw.slice(COOKIE.length + 1);
  const i = token.lastIndexOf('.');
  if (i < 0) return null;
  const payload = token.slice(0, i), mac = token.slice(i + 1);
  const expected = sign(payload);
  if (mac.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  const [u, exp] = payload.split('.');
  if (Number(exp) < Date.now()) return null;
  return Buffer.from(u, 'base64url').toString();
}

/* ADMIN_USERS = "amadeus:password1,angelene:password2" — one login per reviewer. */
export function checkLogin(username, password) {
  const list = (process.env.ADMIN_USERS || '').split(',').map(s => s.trim()).filter(Boolean);
  for (const entry of list) {
    const idx = entry.indexOf(':');
    if (idx < 0) continue;
    const u = entry.slice(0, idx), p = entry.slice(idx + 1);
    if (u !== username) continue;
    const a = Buffer.from(p), b = Buffer.from(password);
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) return u;
  }
  return null;
}

/* ---------------- request helpers ---------------- */
export async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const s = Buffer.concat(chunks).toString();
  try { return s ? JSON.parse(s) : {}; } catch { return {}; }
}

export function send(res, code, data) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

export async function requireAdmin(req, res) {
  const u = currentUser(req);
  if (!u) { send(res, 401, { error: 'Not signed in.' }); return null; }
  return u;
}

export function guardEnv(res) {
  const missing = [];
  if (!storageConfigured()) missing.push('KV_REST_API_URL / KV_REST_API_TOKEN');
  if (!SECRET) missing.push('SESSION_SECRET');
  if (!process.env.ADMIN_USERS) missing.push('ADMIN_USERS');
  if (missing.length) {
    send(res, 500, { error: `Server not configured. Missing: ${missing.join(', ')}. See README.` });
    return false;
  }
  return true;
}

/* ---------------- seed ---------------- */
export const COMMIT_Q =
  'Realistically, how many hours a week can you give SEC, and what are your two heaviest commitment periods this term?';

export function seedState() {
  return {
    settings: {
      qrTarget: '',
      deadline: '',
      publicNote: '',
    },
    departments: [
      { name: 'Executive Committee', note: null, positions: [
        { id: 'pres',  title: 'President',      level: 'Exco', depth: 0, total: 1, filled: 1 },
        { id: 'vp',    title: 'Vice President', level: 'Exco', depth: 0, total: 2, filled: 2 },
        { id: 'sec',   title: 'Secretary',      level: 'Exco', depth: 0, total: 1, filled: 1 },
        { id: 'vsec',  title: 'Vice Secretary', level: 'Exco', depth: 1, total: 1, filled: 0,
          purpose: "To support the Secretary in maintaining SEC's official records and correspondence, and to ensure those records survive handover.",
          duties: [
            "To attend SEC meetings and, in the Secretary's absence, record and compile the minutes.",
            'To assist in compiling and circulating minutes, and in recording attendance and absences.',
            "To maintain the club's document filing so records are findable by a successor.",
            'To assist in drafting correspondence for events, including reminders and certificates.',
            'To track action items arising from meetings and follow up on their status.'],
          not: ["Represent SEC externally without the Secretary's or President's instruction.",
                'Alter approved minutes after circulation, except by documented correction at the next meeting.'],
          hours: 'About 2–4 hours a week, with peaks around meeting cycles and Student LIFE deadlines.',
          qState: 'published',
          questions: [
            'From a messy 90-minute meeting, what do you record in the minutes and what do you leave out?',
            'Describe the system you would use to track who owes what after a meeting, and how the next person would pick it up from you.',
            'Write a five-line email to Student LIFE requesting a facility booking. Invented details are fine — we are reading the writing, not the booking.',
            'A decision gets made in a WhatsApp group rather than a meeting. Should it be recorded, and if so, how?',
            COMMIT_Q] },
        { id: 'tres',  title: 'Treasurer',      level: 'Exco', depth: 0, total: 1, filled: 1 },
        { id: 'vtres', title: 'Vice Treasurer', level: 'Exco', depth: 1, total: 1, filled: 0,
          purpose: 'To support the Treasurer in keeping accurate, auditable financial records, and to provide continuity in financial administration.',
          duties: [
            'To assist in recording all club income and expenditure, with supporting documentation for every transaction.',
            'To collect, check, and file receipts and reimbursement claims.',
            'To assist in preparing event budgets and tracking actual spending against them.',
            'To assist in reconciling club accounts on a regular schedule.',
            'To flag any transaction that lacks documentation, exceeds budget, or looks irregular.'],
          not: ['Approve any expenditure or reimbursement.',
                'Act as sole signatory or sole holder of access to club funds.',
                'Process a claim in which the holder has any personal interest.'],
          hours: 'About 2–4 hours a week, higher around event settlement and reporting deadlines.',
          qState: 'published',
          questions: [
            'How would you keep the record of an RM600 event budget so that someone could audit it a year after you have left?',
            'A committee member pays RM120 out of pocket and sends you a photo of a receipt. Walk through exactly what happens next.',
            'The President asks you to process a reimbursement to the President. What do you do?',
            'Describe a time you found an error in numbers someone else had prepared. What did you do about it?',
            COMMIT_Q] }] },

      { name: 'Events', note: null, positions: [
        { id: 'ehod',  title: 'Head of Department',      level: 'Head',      depth: 0, total: 1, filled: 1 },
        { id: 'evhod', title: 'Vice Head of Department', level: 'Vice head', depth: 1, total: 1, filled: 1 },
        { id: 'eexec', title: 'Events Executive',        level: 'Executive', depth: 2, total: 3, filled: 0,
          purpose: 'To support the planning and delivery of SEC events, from proposal through to the post-event report.',
          duties: [
            'To assist in the detailed planning of SEC events, workshops, and activities.',
            'To assist in coordinating logistics: venue booking, equipment, materials, vendor liaison.',
            'To carry out assigned tasks on event days — setup, registration, running activities, clean-up.',
            'To assist in liaising with Facilities, Student LIFE, and other campus departments.',
            'To keep the master event timeline updated and help gather attendance and feedback.'],
          not: ['Confirm bookings, sign vendor arrangements, or commit club funds.',
                'Submit proposals to Student LIFE independently of the Head of Department.'],
          hours: 'About 4–6 hours a week, much higher in the two weeks before an event.',
          qState: 'published',
          questions: [
            'Name one SEC event from the past year you attended or heard about, and one specific thing that would have made it better.',
            'It is 48 hours before an event and the venue booking falls through. What are your first three actions, in order, and who do you contact?',
            'Describe an event or project you helped run. State your specific task, one thing that went wrong, and how it was handled.',
            'Your event needs 80 attendees. Five days out, 20 have signed up. What do you actually do?',
            COMMIT_Q] }] },

      { name: 'Recruitment', note: null, positions: [
        { id: 'rhod',  title: 'Head of Department',      level: 'Head',      depth: 0, total: 1, filled: 1 },
        { id: 'rvhod', title: 'Vice Head of Department', level: 'Vice head', depth: 1, total: 1, filled: 1 },
        { id: 'rexec', title: 'Recruitment Executive',   level: 'Executive', depth: 2, total: 3, filled: 2,
          purpose: 'To help bring the right people into SEC, and keep them engaged once they are in.',
          duties: [
            'To assist in running committee and volunteer recruitment: shortlisting, scheduling interviews, communicating outcomes.',
            'To maintain accurate member and committee records, including subscriptions and attendance.',
            'To assist in planning internal bonding, orientation, and engagement activities.',
            'To handle administrative work including booth duty arrangements and campus correspondence.',
            'To escalate interpersonal issues and welfare concerns to the Head of Department promptly.'],
          not: ['Make final selection decisions on committee appointments.',
                'Hold or circulate member personal data outside club-approved systems.'],
          hours: 'About 3–5 hours a week, higher during recruitment periods.',
          qState: 'published',
          questions: [
            'Describe a time you were responsible for getting a group of people to do something by a deadline. What did you actually do when someone did not deliver?',
            'SEC receives 60 applications for 6 seats. Propose a shortlisting method two people could run in three days. What would you deliberately not look at?',
            'A committee member has stopped replying and has missed two events. What are your first three actions, in order?',
            'Name one thing about how SEC currently recruits or onboards people that you would change, and what made you pick that one.',
            COMMIT_Q] }] },

      { name: 'Partnership & Growth', note: null, positions: [
        { id: 'phod',  title: 'Head of Department',              level: 'Head',      depth: 0, total: 1, filled: 1 },
        { id: 'pvhod', title: 'Vice Head of Department',         level: 'Vice head', depth: 1, total: 1, filled: 1 },
        { id: 'pexec', title: 'Partnership & Growth Executive',  level: 'Executive', depth: 2, total: 2, filled: 1,
          purpose: 'To help SEC build and keep relationships with external organisations, sponsors, and partners.',
          duties: [
            'To assist in identifying and approaching partners and sponsors relevant to SEC activities.',
            'To assist in preparing sponsorship proposals and partnership materials.',
            'To maintain follow-up correspondence so relationships continue beyond a single event.',
            'To track agreed sponsorship deliverables and ensure they are met.',
            'To keep partner contacts recorded in club-owned systems, so they survive handover.'],
          not: ['Commit SEC to any agreement, financial or otherwise.',
                'Negotiate or accept sponsorship terms without Head of Department and Exco approval.',
                "Make public statements of the club's position without authorisation."],
          hours: 'About 3–5 hours a week, higher during sponsorship cycles.',
          qState: 'published',
          questions: [
            "Name one specific company you would approach for an SEC partnership, and state what SEC offers them that they couldn't get by advertising on campus themselves.",
            'Write the first outreach message you would send them. Maximum 120 words.',
            "A potential partner offers RM2,000 in exchange for access to SEC members' contact details. What do you do, and why?",
            'Describe a time you asked someone with no obligation to help you for something, and got a yes. What did you actually say?',
            COMMIT_Q] }] },

      { name: 'Media', note: null, positions: [
        { id: 'mhod',  title: 'Head of Department',      level: 'Head',      depth: 0, total: 1, filled: 1 },
        { id: 'mvhod', title: 'Vice Head of Department', level: 'Vice head', depth: 1, total: 1, filled: 1 },
        { id: 'mexec', title: 'Media Executive',         level: 'Executive', depth: 2, total: 1, filled: 1 }] },
    ],
  };
}

/* Strip anything the public must not see: draft questions, and questions for closed roles. */
export function publicState(state) {
  return {
    settings: { qrTarget: state.settings?.qrTarget || '', deadline: state.settings?.deadline || '' },
    departments: (state.departments || []).map(d => ({
      name: d.name, note: d.note,
      positions: (d.positions || []).map(p => {
        const open = p.filled < p.total;
        const ready = p.qState === 'published' && Array.isArray(p.questions) && p.questions.length === 5;
        return {
          id: p.id, title: p.title, level: p.level, depth: p.depth,
          total: p.total, filled: p.filled, ready,
          purpose: p.purpose || '', duties: p.duties || [], not: p.not || [], hours: p.hours || '',
          questions: open && ready ? p.questions : null,
        };
      }),
    })),
  };
}

export async function loadState() {
  let s = await kvGet(K_STATE);
  if (!s) { s = seedState(); await kvSet(K_STATE, s); }
  return s;
}
export async function loadApps() {
  return (await kvGet(K_APPS)) || [];
}
