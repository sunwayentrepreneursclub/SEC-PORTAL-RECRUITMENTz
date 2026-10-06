import { requireAdmin, loadApps, send, guardEnv } from './_lib.js';

export default async function handler(req, res) {
  if (!guardEnv(res)) return;
  if (!await requireAdmin(req, res)) return;
  const apps = await loadApps();
  const url = new URL(req.url, 'http://x');
  const posId = url.searchParams.get('pos');
  const onlyArchived = url.searchParams.get('onlyArchived') === '1';
  const rows = [['Position', 'Name', 'iMail', 'Submitted', 'Form matched', 'Status', 'Reviewer note',
                 'Q1', 'A1', 'Q2', 'A2', 'Q3', 'A3', 'Q4', 'A4', 'Q5', 'A5']];
  apps.filter(a => (onlyArchived ? !!a.archivedAt : !a.archivedAt) &&
    (!posId || posId === 'all' || a.pos === posId)).forEach(a => {
    const qa = [];
    for (let i = 0; i < 5; i++) { qa.push(a.questions?.[i] || ''); qa.push(a.answers?.[i] || ''); }
    rows.push([a.posTitle, a.name, a.imail, a.when, a.form ? 'yes' : 'no', a.status, a.note || '', ...qa]);
  });
  const cell = value => {
    const s = String(value ?? '');
    // Spreadsheet programs execute cells beginning with formula operators.
    const safe = /^[\s]*[=+\-@]/.test(s) ? `'${s}` : s;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const csv = rows.map(r => r.map(cell).join(',')).join('\n');
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Disposition', 'attachment; filename="sec-applications.csv"');
  res.end('\uFEFF' + csv);
}
