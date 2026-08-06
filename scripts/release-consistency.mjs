import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CURRENT_RELEASE,
  CURRENT_RELEASE_TITLE,
  validateCurrentReleaseManifest
} from '../src/release-manifest.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const failures = [];

function mismatch(file, field, expected, actual) {
  failures.push({ file, field, expected, actual });
}

function requireContains(file, source, value, field = 'content') {
  if (!source.includes(value)) mismatch(file, field, value, 'missing');
}

function requireAbsent(file, source, pattern, field = 'content') {
  const match = source.match(pattern);
  if (match) mismatch(file, field, 'absent', match[0]);
}

function withoutBlockComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

validateCurrentReleaseManifest();

const packageJson = JSON.parse(read('package.json'));
const packageLock = JSON.parse(read('package-lock.json'));
if (packageJson.version !== CURRENT_RELEASE.packageVersion) mismatch('package.json', 'version', CURRENT_RELEASE.packageVersion, packageJson.version);
if (packageLock.version !== CURRENT_RELEASE.packageVersion) mismatch('package-lock.json', 'version', CURRENT_RELEASE.packageVersion, packageLock.version);
if (packageLock.packages?.['']?.version !== CURRENT_RELEASE.packageVersion) mismatch('package-lock.json', 'packages[""].version', CURRENT_RELEASE.packageVersion, packageLock.packages?.['']?.version);
requireContains('package.json', JSON.stringify(packageJson), 'tests/v134-reporting-export-contracts.spec.js', 'v134 browser test discovery');

const compatibilityBootFile = `src/boot-v${CURRENT_RELEASE.number}.js`;
for (const file of ['index.html', 'app.html']) {
  const shell = read(file);
  requireContains(file, shell, '<title>Gringotts Budget Vault</title>', 'versionless title');
  requireContains(file, shell, `src="${CURRENT_RELEASE.bootSpecifier}"`, 'active manifest entry');
  requireAbsent(file, shell, /<title>[^<]*v\d+[^<]*<\/title>/i, 'hard-coded release title');
  requireAbsent(file, shell, /Loading[^<]*\bv\d+\b/i, 'hard-coded loading copy');
  requireAbsent(file, shell, new RegExp(`src=["']${escapeRegExp(compatibilityBootFile)}`, 'i'), 'compatibility boot loaded by shell');
}

const bootFile = CURRENT_RELEASE.bootPath;
const boot = read(bootFile);
requireContains(bootFile, boot, 'export const CURRENT_RELEASE=', 'authoritative manifest export');
requireContains(bootFile, boot, "if(typeof window!=='undefined'&&typeof document!=='undefined')", 'Node-safe browser guard');
requireContains(bootFile, boot, 'runtime.coordinator.registerRelease({id:R.version', 'manifest-owned release registration');
requireContains(bootFile, boot, 'runtime:R.runtimeLabel', 'manifest-owned runtime label');
requireContains(bootFile, boot, 'cacheBust:R.cacheBust', 'manifest-owned cache bust');
requireContains(bootFile, boot, 'document.title!==CURRENT_RELEASE_TITLE', 'manifest-owned document title');
requireContains(bootFile, boot, "await import(`./boot-v128.js?v=${A.bootBase}`)", 'retained base boot import');
requireContains(bootFile, boot, "import(`./v133/longevity-drills.js?v=${A.longevity}`)", 'lazy retained v133 drill import');
requireContains(bootFile, boot, 'window.GringottsV133', 'retained v133 runtime registry');
requireContains(bootFile, boot, 'window.GringottsV134', 'v134 runtime registry');
requireContains(bootFile, boot, 'retainedOutputCount:16', 'v134 retained output count');
requireContains(bootFile, boot, 'workbookSheets:R.workbookSheets', 'v134 workbook cap registry');
requireAbsent(bootFile, boot, /^import .*v133\/longevity-drills\.js/gm, 'eager v133 drill import');
requireAbsent(bootFile, boot, /^import .*v134\/(?:export-contracts|local-export)\.js/gm, 'eager v134 export import');
requireAbsent(bootFile, boot, /^import .*boot-v131\.js/gm, 'historical current-boot import');

const compatibilityBoot = read(compatibilityBootFile);
requireContains(compatibilityBootFile, compatibilityBoot, "export * from './release-manifest.js'", 'compatibility manifest re-export');
const compatibilityExecutable = withoutBlockComments(compatibilityBoot);
if (compatibilityExecutable !== "export * from './release-manifest.js';") {
  mismatch(compatibilityBootFile, 'executable compatibility boot', "export * from './release-manifest.js';", compatibilityExecutable);
}

const longevityJs = read('src/v133/longevity-drills.js');
const longevityTs = read('src/v133/longevity-drills.ts');
for (const [file, source] of [['src/v133/longevity-drills.js', longevityJs], ['src/v133/longevity-drills.ts', longevityTs]]) {
  requireContains(file, source, 'LONGEVITY_SCENARIOS', 'six longevity scenarios');
  requireContains(file, source, 'automaticCleanup', 'no automatic cleanup declaration');
  requireContains(file, source, 'authoritativeVaultWrite', 'authoritative vault write declaration');
  requireAbsent(file, source, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource/, 'network implementation');
  requireAbsent(file, source, /localStorage|sessionStorage|indexedDB|document\.cookie/, 'browser persistence');
  requireAbsent(file, source, /new MutationObserver|serviceWorker\.register/, 'runtime expansion');
}

for (const file of [
  'src/v134/export-contracts.js', 'src/v134/export-contracts.ts',
  'src/v134/local-export.js', 'src/v134/local-export.ts'
]) {
  const source = read(file);
  requireAbsent(file, source, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource/, 'network implementation');
  requireAbsent(file, source, /localStorage|sessionStorage|indexedDB|document\.cookie/, 'browser persistence');
  requireAbsent(file, source, /new MutationObserver|serviceWorker\.register/, 'runtime expansion');
  requireAbsent(file, source, /setInterval\s*\(|\bretry\s*\(/, 'automatic retry');
}
const exportContracts = read('src/v134/export-contracts.js');
const exportExecutor = read('src/v134/local-export.js');
requireContains('src/v134/export-contracts.js', exportContracts, "EXPORT_CONTRACT_RELEASE = 'v134'", 'v134 contract release');
requireContains('src/v134/export-contracts.js', exportContracts, 'WORKBOOK_SHEET_CAP = 43', '43-sheet cap');
requireContains('src/v134/export-contracts.js', exportContracts, "id:'workflow-review'", 'Workflow Review export contract');
requireContains('src/v134/export-contracts.js', exportContracts, "id:'decision-record'", 'Decision Gate export contract');
requireContains('src/v134/export-contracts.js', exportContracts, 'validateWorkbookOwnership', 'workbook ownership validation');
requireContains('src/v134/local-export.js', exportExecutor, 'executeLocalExport', 'shared local executor');
requireContains('src/v134/local-export.js', exportExecutor, "status:'cancelled'", 'explicit cancellation result');
requireContains('src/v134/local-export.js', exportExecutor, "status:'dispatched'", 'explicit dispatch result');

const workflowReview = read('src/v129/workflow-review.js');
const decisionGate = read('src/v131/decision-gate-ui.js');
requireContains('src/v129/workflow-review.js', workflowReview, "from '../v134/local-export.js?v=134export1'", 'shared Workflow Review executor');
requireContains('src/v129/workflow-review.js', workflowReview, "id:'workflow-review'", 'Workflow Review contract id');
requireContains('src/v131/decision-gate-ui.js', decisionGate, "from '../v134/local-export.js?v=134export1'", 'shared Decision Gate executor');
requireContains('src/v131/decision-gate-ui.js', decisionGate, "id:'decision-record'", 'Decision Gate contract id');

const helper = read('tests/helpers/release.js');
requireContains('tests/helpers/release.js', helper, "from '../../src/release-manifest.js'", 'manifest import');
requireContains('tests/helpers/release.js', helper, 'export const currentVersion = CURRENT_RELEASE.version', 'shared current version');
requireContains('tests/helpers/release.js', helper, 'export const currentTitle = CURRENT_RELEASE_TITLE', 'shared current title');

const appHelper = read('tests/helpers/app.js');
requireContains('tests/helpers/app.js', appHelper, "from './release.js'", 'shared release helper import');
requireContains('tests/helpers/app.js', appHelper, 'currentVersion', 'shared current version use');
requireContains('tests/helpers/app.js', appHelper, 'window.GringottsV132', 'retained release infrastructure readiness');
requireContains('tests/helpers/app.js', appHelper, 'window.GringottsV133', 'retained longevity registry readiness');
requireContains('tests/helpers/app.js', appHelper, 'window.GringottsV134', 'current export registry readiness');
requireAbsent('tests/helpers/app.js', appHelper, /\^v133|toHaveText\(['"]v133|build\.version[^\n]*v133/, 'stale current-release assertion');

const roadmap = read('ROADMAP.md');
requireContains('ROADMAP.md', roadmap, `### ${CURRENT_RELEASE.version} — ${CURRENT_RELEASE.name}`, 'current roadmap heading');
requireContains('ROADMAP.md', roadmap, `### ${CURRENT_RELEASE.version} — ${CURRENT_RELEASE.name} — Current`, 'roadmap current status');

const roadmapSource = read('src/v127/roadmap-horizon.js');
requireContains('src/v127/roadmap-horizon.js', roadmapSource, `version: '${CURRENT_RELEASE.version}'`, 'current roadmap entry');
requireContains('src/v127/roadmap-horizon.js', roadmapSource, `title: '${CURRENT_RELEASE.name}'`, 'current roadmap title');
requireContains('src/v127/roadmap-horizon.js', roadmapSource, `version: '${CURRENT_RELEASE.version}', status: 'current'`, 'current roadmap source status');

const assertionMarkers = ['toHaveText(', 'toContainText(', 'toHaveTitle(', 'toBe('];
const testDirectories = ['tests', 'quality-tests'];
const allowed = new Set([
  'tests/helpers/release.js',
  'tests/v132-release-test-infrastructure.spec.js',
  'tests/v133-local-data-longevity.spec.js',
  'tests/v134-reporting-export-contracts.spec.js',
  'tests/repository-security.spec.js',
  'quality-tests/v132-accessibility.spec.js'
]);

function scatteredCurrentAssertion(source) {
  return source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.includes(CURRENT_RELEASE.version) && assertionMarkers.some((marker) => line.includes(marker))) || null;
}

function walk(directory) {
  const absolute = path.join(root, directory);
  for (const entry of fs.readdirSync(absolute, { withFileTypes:true })) {
    const relative = path.posix.join(directory, entry.name);
    if (entry.isDirectory()) walk(relative);
    else if (/\.(?:js|mjs)$/.test(entry.name) && !allowed.has(relative)) {
      const match = scatteredCurrentAssertion(read(relative));
      if (match) mismatch(relative, 'scattered current-release assertion', 'use tests/helpers/release.js', match);
    }
  }
}

testDirectories.forEach(walk);

const report = {
  release:CURRENT_RELEASE.version,
  name:CURRENT_RELEASE.name,
  title:CURRENT_RELEASE_TITLE,
  bootSpecifier:CURRENT_RELEASE.bootSpecifier,
  packageVersion:CURRENT_RELEASE.packageVersion,
  checkedAt:new Date().toISOString(),
  failures
};

if (failures.length) {
  console.error('Release consistency check failed.');
  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ ...report, status:'consistent' }, null, 2));
}
