import { execFileSync } from 'node:child_process';

function git(args, options = {}) {
  return execFileSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options
  });
}

const forbiddenPathRules = [
  {
    label: 'bank or transaction JSON export',
    pattern: /(?:^|\/)(?:Gringotts_NavyFederal_.*|.*(?:history_pack|transaction_pack|active_window|sync_watch).*)\.json$/i
  },
  {
    label: 'vault backup or generated vault export',
    pattern: /(?:^|\/)(?:.*backup.*|Gringotts_Budget_Vault_export_.*)\.json$/i
  },
  {
    label: 'transaction or ledger CSV export',
    pattern: /(?:^|\/).*(?:transactions|ledger).*\.csv$/i
  },
  {
    label: 'financial or filled office document',
    pattern: /\.(?:qfx|ofx|qbo|xlsx|xls|docx|pdf)$/i
  }
];

const allowedPaths = new Set([
  'tests/fixtures/synthetic-vault.json'
]);

const pathLines = git(['log', '--all', '--name-only', '--pretty=format:'])
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

const uniquePaths = [...new Set(pathLines)];
const forbiddenPathHits = [];

for (const filePath of uniquePaths) {
  if (allowedPaths.has(filePath)) continue;
  for (const rule of forbiddenPathRules) {
    if (rule.pattern.test(filePath)) {
      forbiddenPathHits.push({ filePath, label: rule.label });
      break;
    }
  }
}

const textExtensions = new Set([
  '.cjs', '.css', '.csv', '.html', '.js', '.json', '.jsx', '.md', '.mjs',
  '.sh', '.text', '.toml', '.ts', '.tsx', '.txt', '.xml', '.yaml', '.yml'
]);

const sensitiveContentRules = [
  {
    label: 'SSN-formatted value',
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g
  },
  {
    label: 'routing or ABA number next to a label',
    pattern: /\b(?:routing(?:\s+number)?|aba)\b[^0-9\n]{0,32}\d{9}\b/gi
  },
  {
    label: 'account number next to a label',
    pattern: /\baccount(?:\s+number|\s*#)?\b[^0-9\n]{0,32}\d{6,17}\b/gi
  },
  {
    label: 'full payment-card number next to a label',
    pattern: /\b(?:card(?:\s+number|\s*#)?|credit\s+card)\b[^0-9\n]{0,32}(?:\d[ -]?){13,19}\b/gi
  }
];

const objectLines = git(['rev-list', '--objects', '--all'])
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

const inspectedBlobs = new Set();
const sensitiveContentHits = [];

for (const line of objectLines) {
  const firstSpace = line.indexOf(' ');
  if (firstSpace < 0) continue;
  const objectId = line.slice(0, firstSpace);
  const filePath = line.slice(firstSpace + 1);
  if (!filePath || allowedPaths.has(filePath) || inspectedBlobs.has(objectId)) continue;

  const extensionIndex = filePath.lastIndexOf('.');
  const extension = extensionIndex >= 0 ? filePath.slice(extensionIndex).toLowerCase() : '';
  if (!textExtensions.has(extension)) continue;

  let objectType;
  try {
    objectType = git(['cat-file', '-t', objectId]).trim();
  } catch {
    continue;
  }
  if (objectType !== 'blob') continue;

  inspectedBlobs.add(objectId);
  let content;
  try {
    content = git(['cat-file', '-p', objectId]);
  } catch {
    continue;
  }

  for (const rule of sensitiveContentRules) {
    rule.pattern.lastIndex = 0;
    const match = rule.pattern.exec(content);
    if (match) {
      sensitiveContentHits.push({
        filePath,
        objectId,
        label: rule.label,
        sample: match[0].replace(/\s+/g, ' ').slice(0, 80)
      });
    }
  }
}

if (forbiddenPathHits.length || sensitiveContentHits.length) {
  console.error('\nPublic-repository privacy history scan failed.\n');

  if (forbiddenPathHits.length) {
    console.error('Forbidden or high-risk file paths found in Git history:');
    for (const hit of forbiddenPathHits) {
      console.error(`- ${hit.filePath} (${hit.label})`);
    }
    console.error('');
  }

  if (sensitiveContentHits.length) {
    console.error('High-confidence financial or personal identifier patterns found in Git history:');
    for (const hit of sensitiveContentHits) {
      console.error(`- ${hit.filePath} @ ${hit.objectId.slice(0, 12)} (${hit.label}): ${hit.sample}`);
    }
    console.error('');
  }

  console.error('Remove the affected objects from Git history before treating the repository as privacy-clean.');
  process.exit(1);
}

console.log(`Privacy history scan passed: ${uniquePaths.length} historical paths and ${inspectedBlobs.size} text blobs inspected.`);
