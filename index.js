const { google } = require('googleapis');
let nodemailer = null;
try { nodemailer = require('nodemailer'); } catch (e) { /* email optional */ }

const SHEET_ID = process.env.SHEET_ID;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'SECADMIN';

const TAB_ROLES = 'Roles';
const TAB_ASSESS = 'Assessments';
const TAB_SETTINGS = 'Settings';

const ROLES_RANGE = `${TAB_ROLES}!A2:W`;
const ASSESS_RANGE = `${TAB_ASSESS}!A2:I`;
const SETTINGS_RANGE = `${TAB_SETTINGS}!A2:B`;

/* ---------------------------------------------------------------- auth --- */

function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
}

async function getSheets() {
  const auth = await getAuth();
  return google.sheets({ version: 'v4', auth });
}

/* ------------------------------------------------------------- helpers --- */

function parseList(str) {
  if (!str) return [];
  try {
    const v = JSON.parse(str);
    return Array.isArray(v) ? v : [];
  } catch (e) {
    return String(str).split('\n').map(s => s.trim()).filter(Boolean);
  }
}

function rowToRole(row) {
  row = row || [];
  return {
    id: row[0], code: row[1], title: row[2], department: row[3],
    identity: row[4], identityDesc: row[5], purpose: row[6],
    responsibilities: parseList(row[7]),
    authority: row[8], boundaries: row[9], reporting: row[10], commitment: row[11],
    good: row[12], poor: row[13],
    skills: parseList(row[14]), learns: parseList(row[15]),
    isOpen: row[16] === true || String(row[16]).toLowerCase() === 'true',
    openDate: row[17] ? String(row[17]) : '',
    closeDate: row[18] ? String(row[18]) : '',
    visible: row[19] !== false && String(row[19]).toLowerCase() !== 'false',
    createdAt: row[20], updatedAt: row[21],
    questions: parseList(row[22])
  };
}

function roleToRow(r) {
  return [
    r.id || '',
    r.code || '',
    r.title || '',
    r.department || '',
    r.identity || '',
    r.identityDesc || '',
    r.purpose || '',
    JSON.stringify(r.responsibilities || []),
    r.authority || '',
    r.boundaries || '',
    r.reporting || '',
    r.commitment || '',
    r.good || '',
    r.poor || '',
    JSON.stringify(r.skills || []),
    JSON.stringify(r.learns || []),
    r.isOpen ? 'TRUE' : 'FALSE',
    r.openDate || '',
    r.closeDate || '',
    r.visible === false ? 'FALSE' : 'TRUE',
    r.createdAt || new Date().toISOString(),
    r.updatedAt || new Date().toISOString(),
    JSON.stringify(r.questions || [])
  ];
}

function rowToAssessment(row) {
  row = row || [];
  return {
    timestamp: row[0] || '',
    roleId: row[1] || '',
    roleCode: row[2] || '',
    roleTitle: row[3] || '',
    name: row[4] || '',
    email: row[5] || '',
    questions: parseList(row[6]),
    answers: parseList(row[7]),
    status: row[8] || 'New'
  };
}

async function getSheetIdByName(sheets, name) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const found = (meta.data.sheets || []).find(
    s => s.properties && s.properties.title === name
  );
  if (!found) throw new Error(`Sheet tab "${name}" not found`);
  return found.properties.sheetId;
}

async function readRange(sheets, range) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range
  });
  return res.data.values || [];
}

async function deleteRowAt(sheets, tabName, rowIndexZeroBasedInData) {
  const sheetId = await getSheetIdByName(sheets, tabName);
  // +1 because data starts at row 2 (index 1 in the sheet, 0-based)
  const startIndex = rowIndexZeroBasedInData + 1;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex,
            endIndex: startIndex + 1
          }
        }
      }]
    }
  });
}

async function loadSettings(sheets) {
  const rows = await readRange(sheets, SETTINGS_RANGE);
  const out = {};
  rows.forEach(r => { if (r[0]) out[String(r[0])] = r[1] != null ? String(r[1]) : ''; });
  return out;
}

/* --------------------------------------------------------------- email --- */

async function sendAck(name, email, roleTitle) {
  if (!nodemailer) return;
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;
  if (!user || !pass || !email) return;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });

  await transporter.sendMail({
    from: `"Sunway Entrepreneurs Club" <${user}>`,
    to: email,
    subject: 'Application received — Sunway Entrepreneurs Club',
    text:
      `Hi ${name}, thank you for applying for ${roleTitle} at SEC. ` +
      `We have received your answers and will be in touch. ` +
      `Please do not follow up — we will contact you. ` +
      `— Sunway Entrepreneurs Club`,
    html:
      `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1a1a1a;line-height:1.6">` +
      `<p>Hi ${name},</p>` +
      `<p>Thank you for applying for <strong>${roleTitle}</strong> at SEC.</p>` +
      `<p>We have received your answers and will be in touch. Please do not follow up — we will contact you.</p>` +
      `<p style="color:#6b7280">— Sunway Entrepreneurs Club</p>` +
      `</div>`
  });
}

/* ------------------------------------------------------------- handler --- */

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  const action = body.action;
  const isAdminAction = ![
    'loadPublicData', 'submitAssessment'
  ].includes(action);

  try {
    if (!SHEET_ID) throw new Error('SHEET_ID environment variable is not set');
    if (!process.env.GOOGLE_CREDENTIALS) {
      throw new Error('GOOGLE_CREDENTIALS environment variable is not set');
    }

    if (isAdminAction && body.adminKey !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorised' });
    }

    const sheets = await getSheets();

    /* ---------------------------------------------------- loadPublicData */
    if (action === 'loadPublicData') {
      const [roleRows, settings] = await Promise.all([
        readRange(sheets, ROLES_RANGE),
        loadSettings(sheets)
      ]);
      const roles = roleRows
        .filter(r => r && r[0])
        .map(rowToRole)
        .filter(r => r.visible);
      return res.status(200).json({ roles, settings });
    }

    /* --------------------------------------------------- submitAssessment */
    if (action === 'submitAssessment') {
      const {
        roleId, roleCode, roleTitle,
        name, email, questions, answers
      } = body;

      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
      }

      const timestamp = new Date().toISOString();
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${TAB_ASSESS}!A:I`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [[
            timestamp,
            roleId || '',
            roleCode || '',
            roleTitle || '',
            name,
            email,
            JSON.stringify(questions || []),
            JSON.stringify(answers || []),
            'New'
          ]]
        }
      });

      try {
        await sendAck(name, email, roleTitle || 'a role');
      } catch (e) {
        console.error('Email send failed:', e.message);
      }

      return res.status(200).json({ ok: true, timestamp });
    }

    /* ----------------------------------------------------- loadDashboard */
    if (action === 'loadDashboard') {
      const [roleRows, assessRows, settings] = await Promise.all([
        readRange(sheets, ROLES_RANGE),
        readRange(sheets, ASSESS_RANGE),
        loadSettings(sheets)
      ]);
      return res.status(200).json({
        roles: roleRows.filter(r => r && r[0]).map(rowToRole),
        assessments: assessRows.filter(r => r && r[0]).map(rowToAssessment).reverse(),
        settings
      });
    }

    /* ---------------------------------------------------------- saveRole */
    if (action === 'saveRole') {
      const role = body.role || {};
      const rows = await readRange(sheets, ROLES_RANGE);
      const idx = rows.findIndex(r => r && String(r[0]) === String(role.id));

      if (idx >= 0) {
        const existing = rowToRole(rows[idx]);
        role.createdAt = existing.createdAt || new Date().toISOString();
        role.updatedAt = new Date().toISOString();
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `${TAB_ROLES}!A${idx + 2}:W${idx + 2}`,
          valueInputOption: 'RAW',
          requestBody: { values: [roleToRow(role)] }
        });
      } else {
        role.id = role.id || ('role_' + Date.now());
        role.createdAt = new Date().toISOString();
        role.updatedAt = role.createdAt;
        await sheets.spreadsheets.values.append({
          spreadsheetId: SHEET_ID,
          range: `${TAB_ROLES}!A:W`,
          valueInputOption: 'RAW',
          insertDataOption: 'INSERT_ROWS',
          requestBody: { values: [roleToRow(role)] }
        });
      }
      return res.status(200).json({ ok: true, id: role.id });
    }

    /* -------------------------------------------------------- deleteRole */
    if (action === 'deleteRole') {
      const rows = await readRange(sheets, ROLES_RANGE);
      const idx = rows.findIndex(r => r && String(r[0]) === String(body.id));
      if (idx < 0) return res.status(404).json({ error: 'Role not found' });
      await deleteRowAt(sheets, TAB_ROLES, idx);
      return res.status(200).json({ ok: true });
    }

    /* ---------------------------------------- toggleRoleOpen / Visible */
    if (action === 'toggleRoleOpen' || action === 'toggleRoleVisible') {
      const rows = await readRange(sheets, ROLES_RANGE);
      const idx = rows.findIndex(r => r && String(r[0]) === String(body.id));
      if (idx < 0) return res.status(404).json({ error: 'Role not found' });

      const col = action === 'toggleRoleOpen' ? 'Q' : 'T'; // Q=is_open, T=visible
      const val = body.value ? 'TRUE' : 'FALSE';

      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${TAB_ROLES}!${col}${idx + 2}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[val]] }
      });
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${TAB_ROLES}!V${idx + 2}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[new Date().toISOString()]] }
      });
      return res.status(200).json({ ok: true });
    }

    /* -------------------------------------------------- deleteAssessment */
    if (action === 'deleteAssessment') {
      const rows = await readRange(sheets, ASSESS_RANGE);
      const idx = rows.findIndex(r =>
        r && String(r[0]) === String(body.timestamp) &&
        String(r[5] || '') === String(body.email || '')
      );
      if (idx < 0) return res.status(404).json({ error: 'Application not found' });
      await deleteRowAt(sheets, TAB_ASSESS, idx);
      return res.status(200).json({ ok: true });
    }

    /* -------------------------------------------- updateAssessmentStatus */
    if (action === 'updateAssessmentStatus') {
      const rows = await readRange(sheets, ASSESS_RANGE);
      const idx = rows.findIndex(r =>
        r && String(r[0]) === String(body.timestamp) &&
        String(r[5] || '') === String(body.email || '')
      );
      if (idx < 0) return res.status(404).json({ error: 'Application not found' });
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${TAB_ASSESS}!I${idx + 2}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[body.status || 'New']] }
      });
      return res.status(200).json({ ok: true });
    }

    /* ---------------------------------------------------- saveAllSettings */
    if (action === 'saveAllSettings') {
      const settings = body.settings || {};
      const rows = await readRange(sheets, SETTINGS_RANGE);
      const keys = rows.map(r => String(r[0] || ''));

      const updates = [];
      const appends = [];

      Object.keys(settings).forEach(k => {
        const i = keys.indexOf(k);
        if (i >= 0) {
          updates.push({
            range: `${TAB_SETTINGS}!B${i + 2}`,
            values: [[settings[k]]]
          });
        } else {
          appends.push([k, settings[k]]);
        }
      });

      if (updates.length) {
        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: SHEET_ID,
          requestBody: { valueInputOption: 'RAW', data: updates }
        });
      }
      if (appends.length) {
        await sheets.spreadsheets.values.append({
          spreadsheetId: SHEET_ID,
          range: `${TAB_SETTINGS}!A:B`,
          valueInputOption: 'RAW',
          insertDataOption: 'INSERT_ROWS',
          requestBody: { values: appends }
        });
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Unknown action: ' + action });

  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
};
