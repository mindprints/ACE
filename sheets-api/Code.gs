// ACE — Assignments & Links API
// Paste this into Google Apps Script (script.google.com), bound to your spreadsheet.
// The spreadsheet needs two sheets named exactly: "Assignments" and "Links"
//
// Sheet columns:
//   Assignments: id | title | description | dueDate | createdAt
//   Links:       id | title | url | description | createdAt
//
// Run setup() once from the editor to create headers, then deploy as a Web App:
//   Deploy → New deployment → Web app
//   Execute as: Me
//   Who has access: Anyone
// Copy the Web App URL into your Vercel env var: VITE_SHEETS_API_URL

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheet(ss, 'Assignments', ['id', 'title', 'description', 'dueDate', 'createdAt']);
  ensureSheet(ss, 'Links',       ['id', 'title', 'url', 'description', 'createdAt']);
  SpreadsheetApp.getUi().alert('Sheets ready!');
}

function ensureSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) sheet.appendRow(headers);
}

// All reads and writes come in as GET requests to avoid the POST-redirect CORS issue.
function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const action = (e.parameter.action || 'list');

  if (action === 'list') {
    const assignments = getRows(ss.getSheetByName('Assignments'));
    const links       = getRows(ss.getSheetByName('Links'));
    return jsonResponse({ assignments, links });
  }

  if (action === 'add') {
    const type = e.parameter.type;
    const data = JSON.parse(decodeURIComponent(e.parameter.data));
    const sheet = ss.getSheetByName(type === 'assignments' ? 'Assignments' : 'Links');
    if (type === 'assignments') {
      sheet.appendRow([data.id, data.title, data.description, data.dueDate, data.createdAt]);
    } else {
      sheet.appendRow([data.id, data.title, data.url, data.description, data.createdAt]);
    }
    return jsonResponse({ ok: true });
  }

  if (action === 'delete') {
    const type = e.parameter.type;
    const id   = e.parameter.id;
    const sheet = ss.getSheetByName(type === 'assignments' ? 'Assignments' : 'Links');
    deleteRowById(sheet, id);
    return jsonResponse({ ok: true });
  }

  return jsonResponse({ error: 'Unknown action' });
}

function getRows(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  const [headers, ...rows] = sheet.getDataRange().getValues();
  return rows
    .map(row => Object.fromEntries(headers.map((h, i) => [h, row[i]])))
    .reverse(); // newest first
}

function deleteRowById(sheet, id) {
  const data = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return;
    }
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
