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

validateCurrentReleaseManifest();

const packageJson = JSON.parse(read('package.json'));
const packageLock = JSON.parse(read('package-lock.json'));
if (packageJson.version !== CURRENT_RELEASE.packageVersion) mismatch('package.json', 'version', CURRENT_RELEASE.packageVersion, packageJson.version);
if (packageLock.version !== CURRENT_RELEASE.packageVersion) mismatch('package-lock.json', 'version', CURRENT_RELEASE.packageVersion, packageLock.version);
if (packageLock.packages?.['']?.version !== CURRENT_RELEASE.packageVersion) mismatch('package-lock.json', 'packages[""].version', CURRENT_RELEASE.packageVersion, packageLock.packages?.['']?.version);

for (const file of ['index.html', 'app.html']) {
  const shell = read(file);
  requireContains(file, shell, `<title>Gringotts Budget Vault</title>`, 'versionless title');
  requireContains(file, shell, `src="${CURRENT_RELEASE.bootSpecifier}"`, 'active boot');
  requireAbsent(file, shell, /<title>[^<]*v\d+[^<]*<\/title>/i, 'hard-coded release title');
  requireAbsent(file, shell, /Loading[^<]*\bv\d+\b/i, 'hard-coded loading copy');
}

const bootFile = CURRENT_RELEASE.bootPath;
const boot = read(bootFile);
requireContains(bootFile, boot, "from './release-manifest.js'", 'manifest import');
requireContains(bootFile, boot, 'runtime.coordinator.registerRelease({ id:RELEASE.version', 'manifest-owned release registration');
requireContains(bootFile, boot, 'runtime:RELEASE.runtimeLabel', 'manifest-owned runtime label');
requireContains(bootFile, boot, 'cacheBust:RELEASE.cacheBust', 'manifest-owned cache bust');
requireContains(bootFile, boot, 'document.title !== CURRENT_RELEASE_TITLE', 'manifest-owned document title');
requireAbsent(bootFile, boot, /^import .*boot-v131\.js/gm, 'historical current-boot import');

const helper = read('tests/helpers/release.js');
requireContains('tests/helpers/release.js', helper, "from '../../src/release-manifest.js'", 'manifest import');
requireContains('tests/helpers/release.js', helper, 'export const currentVersion = CURRENT_RELEASE.version', 'shared current version');
requireContains('tests/helpers/release.js', helper, 'export const currentTitle = CURRENT_RELEASE_TITLE', 'shared current title');

const appHelper = read('tests/helpers/app.js');
requireContains('tests/helpers/app.js', appHelper, "from './release.js'", 'shared release helper import');
requireContains('tests/helpers/app.js', appHelper, 'currentVersion', 'shared current version use');
requireContains('tests/helpers/app.js', appHelper, 'window.GringottsV132', 'current release readiness');
requireAbsent('tests/helpers/app.js', appHelper, /\^v131|toHaveText\(['"]v131|build\.version[^\n]*v131/, 'stale current-release assertion');

const roadmap = read('ROADMAP.md');
requireContains('ROADMAP.md', roadmap, `### ${CURRENT_RELEASE.version} — ${CURRENT_RELEASE.name}`, 'current roadmap heading');
requireContains('ROADMAP.md', roadmap, `### ${CURRENT_RELEASE.version} — ${CURRENT_RELEASE.name} — Current`, 'roadmap current status');

const roadmapSource = read('src/v127/roadmap-horizon.js');
requireContains('src/v127/roadmap-horizon.js', roadmapSource, `version: '${CURRENT_RELEASE.version}'`, 'current roadmap entry');
requireContains('src/v127/roadmap-horizon.js', roadmapSource, `title: '${CURRENT_RELEASE.name}'`, 'current roadmap title');

const forbiddenCurrentAssertion = new RegExp(`(?:toHaveText|toContainText|toHaveTitle|\.version\)\.toBe|build\.version[^\\n]*toBe)\\([^\\n]*['\"]${CURRENT_RELEASE.version}['\"]`, 'i');
const testDirectories = ['tests', 'quality-tests'];
const allowed = new Set([
  'tests/helpers/release.js',
  'tests/v132-release-test-infrastructure.spec.js',
  'tests/repository-security.spec.js',
  'quality-tests/v132-accessibility.spec.js'
]);

function walk(directory) {
  const absolute = path.join(root, directory);
  for (const entry of fs.readdirSync(absolute, { withFileTypes:true })) {
    const relative = path.posix.join(directory, entry.name);
    if (entry.isDirectory()) walk(relative);
    else if (/\.(?:js|mjs)$/.test(entry.name) && !allowed.has(relative)) {
      const source = read(relative);
      const match = source.match(forbiddenCurrentAssertion);
      if (match) mismatch(relative, 'scattered current-release assertion', 'use tests/helpers/release.js', match[0]);
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
