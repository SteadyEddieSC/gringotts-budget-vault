import {
  account, category, dte, download, flow, getMonth, isPending,
  monthLabel, owner, reportAmount, txName, txs
} from '../v103/core.js';

const REQUIRED_SHEETS = ['Setup', 'Transactions', 'Annual Overview', 'Month Overview'];
const TEMPLATE_ROW_LIMIT = 10000;
let selectedTemplate = null;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function escapeXml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
  }[char]));
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function readU16(view, offset) { return view.getUint16(offset, true); }
function readU32(view, offset) { return view.getUint32(offset, true); }

async function inflateRaw(bytes) {
  if (typeof DecompressionStream !== 'function') {
    throw new Error('This browser cannot open compressed XLSX templates. Use a current Chrome, Edge, or Android browser.');
  }
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function unzip(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);
  let eocd = -1;
  const minimum = Math.max(0, bytes.length - 65557);
  for (let offset = bytes.length - 22; offset >= minimum; offset -= 1) {
    if (readU32(view, offset) === 0x06054b50) { eocd = offset; break; }
  }
  if (eocd < 0) throw new Error('The selected file is not a readable XLSX/ZIP workbook.');
  const entryCount = readU16(view, eocd + 10);
  let offset = readU32(view, eocd + 16);
  const files = new Map();
  for (let index = 0; index < entryCount; index += 1) {
    if (readU32(view, offset) !== 0x02014b50) throw new Error('The XLSX central directory is invalid.');
    const method = readU16(view, offset + 10);
    const compressedSize = readU32(view, offset + 20);
    const uncompressedSize = readU32(view, offset + 24);
    const nameLength = readU16(view, offset + 28);
    const extraLength = readU16(view, offset + 30);
    const commentLength = readU16(view, offset + 32);
    const localOffset = readU32(view, offset + 42);
    const name = decoder.decode(bytes.slice(offset + 46, offset + 46 + nameLength));
    if (readU32(view, localOffset) !== 0x04034b50) throw new Error('The XLSX contains an invalid local file entry.');
    const localNameLength = readU16(view, localOffset + 26);
    const localExtraLength = readU16(view, localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = bytes.slice(dataStart, dataStart + compressedSize);
    let data;
    if (method === 0) data = compressed;
    else if (method === 8) data = await inflateRaw(compressed);
    else throw new Error(`Unsupported XLSX compression method ${method}.`);
    if (uncompressedSize && data.length !== uncompressedSize) {
      throw new Error(`The XLSX entry ${name} did not decompress to its expected size.`);
    }
    files.set(name, data);
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return files;
}

function crcTable() {
  if (crcTable.value) return crcTable.value;
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  crcTable.value = table;
  return table;
}

function crc32(bytes) {
  let crc = 0xFFFFFFFF;
  const table = crcTable();
  for (let i = 0; i < bytes.length; i += 1) crc = table[(crc ^ bytes[i]) & 255] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function concat(parts) {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  parts.forEach((part) => { output.set(part, offset); offset += part.length; });
  return output;
}

const le16 = (value) => new Uint8Array([value & 255, (value >>> 8) & 255]);
const le32 = (value) => new Uint8Array([value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255]);

function dos(date) {
  const year = Math.max(1980, date.getFullYear());
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
  };
}

function zipStore(files) {
  const now = dos(new Date());
  const locals = [];
  const centrals = [];
  let offset = 0;
  files.forEach((data, fileName) => {
    const name = encoder.encode(fileName);
    const crc = crc32(data);
    const local = concat([
      le32(0x04034b50), le16(20), le16(0x0800), le16(0), le16(now.time), le16(now.date),
      le32(crc), le32(data.length), le32(data.length), le16(name.length), le16(0), name, data
    ]);
    locals.push(local);
    centrals.push(concat([
      le32(0x02014b50), le16(20), le16(20), le16(0x0800), le16(0), le16(now.time), le16(now.date),
      le32(crc), le32(data.length), le32(data.length), le16(name.length), le16(0), le16(0), le16(0),
      le16(0), le32(0), le32(offset), name
    ]));
    offset += local.length;
  });
  const central = concat(centrals);
  const end = concat([
    le32(0x06054b50), le16(0), le16(0), le16(files.size), le16(files.size),
    le32(central.length), le32(offset), le16(0)
  ]);
  return concat([...locals, central, end]);
}

function decodeFile(files, name) {
  const data = files.get(name);
  if (!data) throw new Error(`The tracker template is missing ${name}.`);
  return decoder.decode(data);
}

function encodeFile(files, name, text) { files.set(name, encoder.encode(text)); }

function sheetNames(files) {
  const workbook = decodeFile(files, 'xl/workbook.xml');
  return [...workbook.matchAll(/<sheet\b[^>]*\bname="([^"]+)"/g)].map((match) => match[1]);
}

function setCellInRow(rowXml, reference, value, kind = 'string') {
  const pattern = new RegExp(`<c\\b([^>]*\\br="${escapeRegex(reference)}"[^>]*?)(?:\\/\\>|>([\\s\\S]*?)<\\/c>)`);
  if (!pattern.test(rowXml)) return rowXml;
  return rowXml.replace(pattern, (_match, attributes) => {
    const cleanAttributes = attributes.replace(/\s+t="[^"]*"/g, '');
    if (value === '' || value === null || value === undefined) return `<c${cleanAttributes}></c>`;
    if (kind === 'number') return `<c${cleanAttributes}><v>${Number(value)}</v></c>`;
    return `<c${cleanAttributes} t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
  });
}

function setCell(xml, reference, value, kind = 'string') {
  const pattern = new RegExp(`<c\\b([^>]*\\br="${escapeRegex(reference)}"[^>]*?)(?:\\/\\>|>([\\s\\S]*?)<\\/c>)`);
  if (!pattern.test(xml)) throw new Error(`The tracker template is missing expected cell ${reference}.`);
  return xml.replace(pattern, (_match, attributes) => {
    const cleanAttributes = attributes.replace(/\s+t="[^"]*"/g, '');
    if (kind === 'number') return `<c${cleanAttributes}><v>${Number(value)}</v></c>`;
    return `<c${cleanAttributes} t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
  });
}

function clearFormulaCaches(xml) {
  return xml.replace(/<c\b([^>]*)>([\s\S]*?)<\/c>/g, (match, attributes, inner) => {
    if (!/<f\b/.test(inner)) return match;
    const withoutValues = inner.replace(/<v(?:\s[^>]*)?>[\s\S]*?<\/v>/g, '').replace(/<v\s*\/>/g, '');
    return `<c${attributes}>${withoutValues}</c>`;
  });
}

function excelSerial(dateText) {
  const parts = String(dateText).split('-').map(Number);
  if (parts.length !== 3 || parts.some((value) => !Number.isFinite(value))) return null;
  return Math.floor(Date.UTC(parts[0], parts[1] - 1, parts[2]) / 86400000) + 25569;
}

function cleanText(value) { return String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ').trim(); }

function templateRows() {
  const rows = txs()
    .filter((transaction) => /^\d{4}-\d{2}-\d{2}$/.test(dte(transaction)))
    .sort((a, b) => dte(a).localeCompare(dte(b)) || txName(a).localeCompare(txName(b)));
  return rows.length > TEMPLATE_ROW_LIMIT ? rows.slice(rows.length - TEMPLATE_ROW_LIMIT) : rows;
}

function templateType(transaction) { return flow(transaction) === 'Income' ? 'Income' : 'Expense'; }

function templateCategory(transaction) {
  const current = cleanText(category(transaction));
  return flow(transaction) === 'Transfer' && (!current || current === 'Other') ? 'Transfers' : (current || 'Other');
}

function templateDescription(transaction) {
  const base = cleanText(txName(transaction));
  const details = [];
  if (isPending(transaction)) details.push('Pending');
  const accountName = cleanText(account(transaction));
  const ownerName = cleanText(owner(transaction));
  if (accountName && !base.toLowerCase().includes(accountName.toLowerCase())) details.push(accountName);
  if (ownerName && ownerName !== 'Unassigned' && !details.includes(ownerName)) details.push(ownerName);
  return details.length ? `${base} (${details.join(' · ')})` : base;
}

function uniqueCategories(rows, type) {
  return [...new Set(rows.filter((transaction) => templateType(transaction) === type).map(templateCategory).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b)).slice(0, 50);
}

function patchSetup(xml, rows) {
  const income = uniqueCategories(rows, 'Income');
  const expense = uniqueCategories(rows, 'Expense');
  return xml.replace(/<row\b([^>]*\br="(\d+)"[^>]*)>[\s\S]*?<\/row>/g, (rowXml, _attributes, rowNumberText) => {
    const rowNumber = Number(rowNumberText);
    if (rowNumber < 7 || rowNumber > 56) return rowXml;
    const index = rowNumber - 7;
    let output = setCellInRow(rowXml, `D${rowNumber}`, income[index] || '');
    output = setCellInRow(output, `E${rowNumber}`, expense[index] || '');
    return output;
  });
}

function patchTransactions(xml, rows) {
  const output = xml.replace(/<row\b([^>]*\br="(\d+)"[^>]*)>[\s\S]*?<\/row>/g, (rowXml, _attributes, rowNumberText) => {
    const rowNumber = Number(rowNumberText);
    if (rowNumber < 6 || rowNumber > 10005) return rowXml;
    const transaction = rows[rowNumber - 6];
    let row = rowXml;
    if (!transaction) {
      ['B', 'C', 'D', 'F', 'G'].forEach((column) => { row = setCellInRow(row, `${column}${rowNumber}`, ''); });
      return row;
    }
    row = setCellInRow(row, `B${rowNumber}`, excelSerial(dte(transaction)), 'number');
    row = setCellInRow(row, `C${rowNumber}`, templateType(transaction));
    row = setCellInRow(row, `D${rowNumber}`, templateCategory(transaction));
    row = setCellInRow(row, `F${rowNumber}`, reportAmount(transaction), 'number');
    row = setCellInRow(row, `G${rowNumber}`, templateDescription(transaction));
    return row;
  });
  return clearFormulaCaches(output);
}

function patchWorkbookCalculation(xml) {
  let output = xml.replace(/<calcPr\b[^>]*\/>/g, '<calcPr calcId="191029" calcMode="auto" fullCalcOnLoad="1" forceFullCalc="1"/>');
  if (!/<calcPr\b/.test(output)) output = output.replace('</workbook>', '<calcPr calcId="191029" calcMode="auto" fullCalcOnLoad="1" forceFullCalc="1"/></workbook>');
  return output;
}

function sanitizePeople(files) {
  files.delete('xl/persons/person.xml');
  if (files.has('xl/_rels/workbook.xml.rels')) {
    let relationships = decodeFile(files, 'xl/_rels/workbook.xml.rels');
    relationships = relationships.replace(/<Relationship[^>]+Type="http:\/\/schemas\.microsoft\.com\/office\/2017\/10\/relationships\/person"[^>]*\/>/g, '');
    encodeFile(files, 'xl/_rels/workbook.xml.rels', relationships);
  }
  if (files.has('[Content_Types].xml')) {
    let contentTypes = decodeFile(files, '[Content_Types].xml');
    contentTypes = contentTypes.replace(/<Override[^>]+PartName="\/xl\/persons\/person\.xml"[^>]*\/>/g, '');
    encodeFile(files, '[Content_Types].xml', contentTypes);
  }
  if (files.has('xl/comments1.xml')) {
    let comments = decodeFile(files, 'xl/comments1.xml');
    comments = comments.replace('<authors><author></author></authors>', '<authors><author>Gringotts Budget Vault</author></authors>');
    encodeFile(files, 'xl/comments1.xml', comments);
  }
}

export function trackerTemplateSnapshot() {
  const rows = templateRows();
  return {
    valid: Boolean(selectedTemplate),
    fileName: selectedTemplate?.fileName || '',
    sheets: selectedTemplate?.sheets || [],
    transactions: rows.length,
    totalTransactions: txs().length,
    truncated: txs().filter((transaction) => /^\d{4}-\d{2}-\d{2}$/.test(dte(transaction))).length > TEMPLATE_ROW_LIMIT,
    selectedMonth: getMonth(),
    selectedMonthLabel: monthLabel(getMonth())
  };
}

export async function selectTrackerTemplate(file, notify = () => {}, rerender = () => {}) {
  selectedTemplate = null;
  if (!file) { rerender(); return; }
  try {
    const files = await unzip(await file.arrayBuffer());
    const sheets = sheetNames(files);
    const missing = REQUIRED_SHEETS.filter((sheet) => !sheets.includes(sheet));
    if (missing.length) throw new Error(`This is not the expected annual tracker template. Missing sheet${missing.length === 1 ? '' : 's'}: ${missing.join(', ')}.`);
    selectedTemplate = { fileName: file.name, files, sheets };
    notify('Annual tracker template is ready to fill locally');
  } catch (error) {
    selectedTemplate = null;
    notify(error?.message || 'The annual tracker template could not be read.');
  }
  rerender();
}

export async function exportFilledAnnualTracker(notify = () => {}) {
  if (!selectedTemplate) { notify('Choose the annual tracker template first'); return; }
  try {
    const files = new Map([...selectedTemplate.files.entries()].map(([name, data]) => [name, data.slice()]));
    const rows = templateRows();
    const selectedMonth = getMonth();
    const [year, month] = selectedMonth.split('-').map(Number);
    const selectedMonthName = new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'long' });

    encodeFile(files, 'xl/worksheets/sheet2.xml', patchSetup(decodeFile(files, 'xl/worksheets/sheet2.xml'), rows));
    encodeFile(files, 'xl/worksheets/sheet3.xml', patchTransactions(decodeFile(files, 'xl/worksheets/sheet3.xml'), rows));
    encodeFile(files, 'xl/worksheets/sheet4.xml', clearFormulaCaches(decodeFile(files, 'xl/worksheets/sheet4.xml')));

    let annual = decodeFile(files, 'xl/worksheets/sheet5.xml');
    annual = setCell(annual, 'D5', 'January');
    annual = setCell(annual, 'D6', year, 'number');
    encodeFile(files, 'xl/worksheets/sheet5.xml', clearFormulaCaches(annual));

    let monthOverview = decodeFile(files, 'xl/worksheets/sheet6.xml');
    monthOverview = setCell(monthOverview, 'D7', selectedMonthName);
    monthOverview = setCell(monthOverview, 'D8', year, 'number');
    encodeFile(files, 'xl/worksheets/sheet6.xml', clearFormulaCaches(monthOverview));

    encodeFile(files, 'xl/workbook.xml', patchWorkbookCalculation(decodeFile(files, 'xl/workbook.xml')));
    sanitizePeople(files);

    const blob = new Blob([zipStore(files)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    download(`Income_Expenses_Tracker_Annual_filled_${selectedMonth}.xlsx`, blob);
    notify(`Filled annual tracker downloaded with ${rows.length} transactions`);
  } catch (error) {
    notify(error?.message || 'The annual tracker could not be generated.');
  }
}
