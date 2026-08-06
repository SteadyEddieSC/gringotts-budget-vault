export const ROADMAP_HORIZON = Object.freeze([
  {
    version: 'v127', status: 'shipped', title: 'UX Polish & Simplification',
    purpose: 'Reduce visible complexity and make every action, state, and advanced control easier to understand across desktop, keyboard, phone, and tablet use.',
    scope: ['Consistent action intent and hierarchy', 'Loading, empty, partial, failure, and success feedback', 'Progressive disclosure', 'Mobile and keyboard polish', 'Focus restoration and accessible dialogs'],
    dependencies: ['v126 lifecycle and dispatcher contracts', 'Cross-browser interaction evidence'],
    safeguards: ['No new primary destination', 'Planning actions never resemble financial execution', 'Critical safety boundaries remain visible', '43-sheet workbook cap'],
    outcome: 'The application feels calmer, clearer, and more responsive without adding household-finance features.'
  },
  {
    version: 'v128', status: 'shipped', title: 'TypeScript & Portable Vault Foundation',
    purpose: 'Establish strict typed contracts and a provider-neutral, integrity-checked portable vault foundation without changing the static local-first deployment.',
    scope: ['Strict TypeScript contracts', 'Deterministic JSON canonicalization', 'SHA-256 integrity', 'Portable package round-trip', 'Corruption and authority-boundary rejection'],
    dependencies: ['v126 storage inventory', 'v127 interaction policy', 'Existing backup-first safeguards'],
    safeguards: ['Preserve gringottsBudgetVault.latest', 'No automatic migration or restore', 'No cloud adapter', 'No empty-vault overwrite'],
    outcome: 'The application gains a typed portability foundation while runtime and household-finance behavior remain unchanged.'
  },
  {
    version: 'v129', status: 'shipped', title: 'Household Workflow Evidence Review',
    purpose: 'Review real household use and identify repeated confusion, abandoned surfaces, slow paths, and unmet needs before approving more product scope.',
    scope: ['Workflow-friction review', 'Feature-use evidence', 'Support and failure patterns', 'Consolidation candidates'],
    dependencies: ['v126–v128 stabilized runtime, UX, and portability foundation'],
    safeguards: ['No analytics endpoint', 'No private financial data in repository evidence', 'No feature approved from roadmap momentum alone'],
    outcome: 'Future work is based on observed household needs instead of a longer feature list.'
  },
  {
    version: 'v130', status: 'shipped', title: 'Performance & Maintenance Hardening',
    purpose: 'Protect boot, route, enhancement, report, workbook, observer, byte, and network budgets while reducing historical maintenance cost.',
    scope: ['Performance-budget enforcement', 'Historical layer consolidation', 'Workbook restraint', 'Dependency and supply-chain review', 'Recovery timing'],
    dependencies: ['v126 lifecycle metrics', 'v129 workflow evidence'],
    safeguards: ['No eager historical loading', 'No service worker without separate review', 'No new sheet without consolidation'],
    outcome: 'The application stays fast, supportable, and recoverable over time.'
  },
  {
    version: 'v131', status: 'shipped', title: 'Observed Needs Decision Gate',
    purpose: 'Require complete household workflow evidence and healthy runtime evidence before even writing a future product-scope proposal.',
    scope: ['Unmet-needs evidence', 'Consolidate-or-remove review', 'Safety and privacy impact', 'Release-size and maintenance-cost estimate'],
    dependencies: ['v126–v130 evidence and protected quality gates'],
    safeguards: ['Feature freeze remains the default', 'No automatic financial action', 'No new store without schema, cap, migration, recovery, and privacy contracts'],
    outcome: 'New features resume only when a clear household need outweighs added complexity.'
  },
  {
    version: 'v132', status: 'shipped', title: 'Release & Test Infrastructure Simplification',
    purpose: 'Make current-release identity authoritative in one browser-compatible manifest and detect metadata drift before browser installation or promotion.',
    scope: ['Shared release metadata', 'Centralized version assertions', 'Exact consistency diagnostics', 'Faster failure evidence', 'Protected-gate documentation'],
    dependencies: ['v130 maintenance evidence', 'Stable protected workflow history'],
    safeguards: ['No weaker gate coverage', 'No hidden retry-only success', 'No production promotion before exact-head validation'],
    outcome: 'Releases remain rigorous but become easier to understand, repair, and audit.'
  },
  {
    version: 'v133', status: 'shipped', title: 'Local Data Longevity Drills',
    purpose: 'Exercise upgrade, corruption, rollback, orphan, capacity, and stale-schema scenarios against synthetic long-lived household data.',
    scope: ['Migration rehearsal fixtures', 'Corruption rejection tests', 'Capacity and cap checks', 'Orphan metadata handling', 'Rollback verification'],
    dependencies: ['v128 schema and recovery contracts', 'v132 release-test simplification'],
    safeguards: ['Synthetic data only', 'No automatic destructive cleanup', 'Authoritative vault remains non-resettable'],
    outcome: 'Long-lived local data remains understandable and recoverable across future releases.'
  },
  {
    version: 'v134', status: 'current', title: 'Reporting & Export Contract Consolidation',
    purpose: 'Reduce duplicated report assembly and filename logic while preserving every tested household output and the 43-sheet workbook cap.',
    scope: ['Shared export metadata', 'Consistent filenames and labels', 'Aggregate-only privacy checks', 'Workbook ownership map', 'Failure and cancellation behavior'],
    dependencies: ['v130 performance evidence', 'v133 data-longevity fixtures'],
    safeguards: ['No new report destination', 'No added workbook sheet', 'No transaction detail in aggregate-only outputs'],
    outcome: 'Reports and exports become more consistent and less expensive to maintain.'
  },
  {
    version: 'v135', status: 'directional', title: 'Cross-Device & Low-Resource Resilience',
    purpose: 'Verify complete household workflows on small screens, reduced-memory devices, slower CPUs, keyboard-only input, touch, and reduced-motion settings.',
    scope: ['Low-resource test profiles', 'Touch and keyboard completion', 'Responsive overflow review', 'Reduced-motion verification', 'Large-vault interaction budgets'],
    dependencies: ['v127 UX contracts', 'v130 performance budgets', 'v134 export consolidation'],
    safeguards: ['No device-specific fork', 'No reduced safety messaging', 'No persistent cache or service worker'],
    outcome: 'Core workflows remain usable and predictable across supported devices and input modes.'
  },
  {
    version: 'v136', status: 'directional', title: 'Architecture Baseline & Next-Horizon Decision',
    purpose: 'Document the maintained architecture after the reliability horizon and decide whether to continue consolidation, hold steady, or approve a narrowly evidenced capability.',
    scope: ['Architecture ownership map', 'Retirement candidates', 'Maintenance-cost review', 'Privacy and threat-boundary review', 'Next-horizon decision record'],
    dependencies: ['v127–v135 evidence', 'Observed household needs', 'Protected release history'],
    safeguards: ['One live runtime', 'Local-first data boundary', 'Stable rescue retained', 'No feature approval without a full safety and recovery contract'],
    outcome: 'The following roadmap begins from evidence and an explicit maintained baseline rather than accumulated release layers.'
  }
]);

export function validateRoadmapHorizon() {
  if (ROADMAP_HORIZON.length !== 10) throw new Error('The reliability horizon must contain exactly ten releases.');
  ROADMAP_HORIZON.forEach((entry, index) => {
    const expected = `v${127 + index}`;
    if (entry.version !== expected) throw new Error(`Roadmap version order mismatch: expected ${expected}.`);
    for (const field of ['title', 'purpose', 'scope', 'dependencies', 'safeguards', 'outcome']) {
      if (!entry[field] || (Array.isArray(entry[field]) && entry[field].length < 1)) {
        throw new Error(`Roadmap entry ${entry.version} is missing ${field}.`);
      }
    }
  });
  const current = ROADMAP_HORIZON.filter((entry) => entry.status === 'current');
  if (current.length !== 1 || current[0]?.version !== 'v134') throw new Error('v134 must be the only current roadmap release.');
  if (ROADMAP_HORIZON.slice(0, 7).some((entry) => entry.status !== 'shipped')) throw new Error('v127 through v133 must remain shipped.');
  if (ROADMAP_HORIZON.slice(8).some((entry) => entry.status !== 'directional')) throw new Error('v135 through v136 must remain directional.');
  return true;
}
