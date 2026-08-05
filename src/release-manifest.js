const PERFORMANCE_BUDGETS = Object.freeze({
  routeReadyMs:750,
  enhancementMs:300,
  maxEnhancementPasses:3,
  maxObserverCallbacksPerRoute:12,
  maxRegisteredReleases:12,
  maxRegisteredActions:40,
  maxNetworkRequests:45,
  maxScriptBytes:500_000,
  maxWorkbookSheets:43,
  maxRuntimeObservers:1,
  maxPrimaryDestinations:6,
  maxSessionSamples:12
});

const ASSET_VERSIONS = Object.freeze({
  bootBase:'132base1',
  workflow:'132workflow1',
  decisionIntegration:'132decision1',
  diagnostics:'132diagnostics1',
  evaluator:'132evaluate1',
  shell:'132release1'
});

export const CURRENT_RELEASE = Object.freeze({
  version:'v132',
  number:132,
  packageVersion:'132.0.0',
  name:'Release & Test Infrastructure Simplification',
  featureFreeze:true,
  primaryDestinations:6,
  toolsSections:6,
  workbookSheets:43,
  previousRelease:'v131',
  runtimeEvidenceRelease:'v130',
  roadmapStart:127,
  roadmapEnd:136,
  bootPath:'src/boot-v132.js',
  bootSpecifier:'src/boot-v132.js?v=132release1',
  cacheBust:'132release1',
  runtimeLabel:'src/runtime-v111-reporting.js + v126 coordinator/dispatcher + v128 UX/typed foundation + lazy v129 workflow review + retained v130 runtime budgets + retained v131 decision gate + centralized v132 release manifest',
  budgets:PERFORMANCE_BUDGETS,
  assets:ASSET_VERSIONS
});

export const CURRENT_RELEASE_TITLE = `Gringotts Budget Vault ${CURRENT_RELEASE.version}`;

export function releaseNumber(value) {
  const number = Number(String(value || '').replace(/^v/, ''));
  return Number.isInteger(number) ? number : NaN;
}

export function roadmapStatus(version) {
  const number = releaseNumber(version);
  if (!Number.isInteger(number)) throw new Error(`Invalid roadmap release: ${version}`);
  if (number < CURRENT_RELEASE.number) return 'shipped';
  if (number === CURRENT_RELEASE.number) return 'current';
  return 'directional';
}

export function roadmapStatusLabel(status) {
  if (status === 'shipped') return 'Shipped';
  if (status === 'current') return 'Current release';
  if (status === 'directional') return 'Directional';
  throw new Error(`Invalid roadmap status: ${status}`);
}

export function validateCurrentReleaseManifest() {
  if (!/^v\d+$/.test(CURRENT_RELEASE.version)) throw new Error('Current release version must use the v<number> format.');
  if (releaseNumber(CURRENT_RELEASE.version) !== CURRENT_RELEASE.number) throw new Error('Current release number does not match its version.');
  if (CURRENT_RELEASE.packageVersion !== `${CURRENT_RELEASE.number}.0.0`) throw new Error('Package version must match the current release number.');
  if (CURRENT_RELEASE.bootPath !== `src/boot-${CURRENT_RELEASE.version}.js`) throw new Error('Current release boot path is inconsistent.');
  if (CURRENT_RELEASE.bootSpecifier !== `${CURRENT_RELEASE.bootPath}?v=${CURRENT_RELEASE.assets.shell}`) throw new Error('Current release boot specifier is inconsistent.');
  if (CURRENT_RELEASE.primaryDestinations !== 6) throw new Error('Current release must preserve six primary destinations.');
  if (CURRENT_RELEASE.workbookSheets !== 43) throw new Error('Current release must preserve the 43-sheet workbook cap.');
  if (CURRENT_RELEASE.budgets.maxRuntimeObservers !== 1) throw new Error('Current release must preserve one runtime observer.');
  if (CURRENT_RELEASE.budgets.maxPrimaryDestinations !== CURRENT_RELEASE.primaryDestinations) throw new Error('Primary destination budget does not match the release manifest.');
  if (CURRENT_RELEASE.budgets.maxWorkbookSheets !== CURRENT_RELEASE.workbookSheets) throw new Error('Workbook budget does not match the release manifest.');
  if (CURRENT_RELEASE.number < CURRENT_RELEASE.roadmapStart || CURRENT_RELEASE.number > CURRENT_RELEASE.roadmapEnd) throw new Error('Current release is outside the protected roadmap horizon.');
  return true;
}
