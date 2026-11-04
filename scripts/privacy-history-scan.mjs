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

// This is an exception to the filename rule only, never to blob-content scanning.
const pathOnlyAllowed = new Set([
  'tests/fixtures/benchmark-001/spreadsheet-exit/transactions.csv'
]);

const allowedPaths = new Set([
  'tests/fixtures/synthetic-vault.json',
  'tests/fixtures/bank-import/synthetic-signed.csv',
  'tests/fixtures/bank-import/synthetic-debit-credit.csv',
  'tests/fixtures/bank-import/synthetic-card-activity.csv',
  'tests/fixtures/bank-import/synthetic-credit-union-ledger.csv',
  'tests/fixtures/bank-import/synthetic-digital-wallet.csv',
  'tests/fixtures/bank-import/synthetic.qfx'
]);

const pathLines = git(['log', '--all', '--name-only', '--pretty=format:'])
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

const uniquePaths = [...new Set(pathLines)];
const forbiddenPathHits = [];

for (const filePath of uniquePaths) {
  if (allowedPaths.has(filePath) || pathOnlyAllowed.has(filePath)) continue;
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

// Git's rev-list names each blob only once: an identical blob can be labelled
// with an older content-exempt path instead of this path-only-exempt fixture.
// Enumerate every historical version of the exact fixture explicitly so its
// content is still inspected even if the object has another Git path alias.
const pathOnlyHistory = [];
for (const filePath of pathOnlyAllowed) {
  const commits = git(['log', '--all', '--full-history', '--format=%H', '--', filePath])
    .split(/\r?\n/)
    .filter(Boolean);
  for (const commit of new Set(commits)) {
    const entry = git(['ls-tree', '-r', commit, '--', filePath]).trim();
    const details = entry.split(String.fromCharCode(9))[0].split(' ');
    const objectId = details[2];
    if (details[1] === 'blob' && /^[0-9a-f]{40,64}$/.test(objectId)) {
      pathOnlyHistory.push(`${objectId} ${filePath}`);
    }
  }
}

const objectLines = [
  ...git(['rev-list', '--objects', '--all']).split(/\r?\n/),
  ...pathOnlyHistory
]
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
