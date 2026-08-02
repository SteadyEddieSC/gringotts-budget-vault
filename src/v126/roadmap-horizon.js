export const ROADMAP_HORIZON = [
  {
    version: 'v126', status: 'current', title: 'Runtime Consolidation & Reliability',
    purpose: 'Freeze feature growth and replace implicit release-layer timing with one explicit route, readiness, action-ownership, recovery, and performance lifecycle.',
    scope: ['Authoritative route lifecycle events', 'Single owned enhancement observer', 'Single specialist action and download dispatcher', 'Consolidated release registry', 'Storage and recovery inventory', 'Render and enhancement budgets'],
    dependencies: ['v125 household capabilities', 'Existing protected browser matrix', 'Stable v105 rescue', 'Single v111 transaction runtime'],
    safeguards: ['No second runtime', 'No new primary destination', 'No financial automation', 'No timeout-based readiness masking', '43-sheet workbook cap'],
    outcome: 'Navigation, lazy enhancement, recovery, and downloads have one inspectable owner and deterministic readiness contract.'
  },
  {
    version: 'v127', status: 'planned', title: 'UX Polish & Simplification',
    purpose: 'Reduce visible complexity and make every action, state, and advanced control easier to understand across desktop, keyboard, phone, and tablet use.',
    scope: ['Consistent action language', 'Loading, empty, partial, failure, and success states', 'Progressive disclosure', 'Mobile and keyboard polish', 'Focus restoration and accessible dialogs'],
    dependencies: ['v126 lifecycle and dispatcher contracts', 'Cross-browser interaction evidence'],
    safeguards: ['No new primary destination', 'Planning actions never resemble financial execution', 'Critical safety boundaries remain visible'],
    outcome: 'The application feels calmer, clearer, and more responsive without adding features.'
  },
  {
    version: 'v128', status: 'planned', title: 'Data Portability & Recovery',
    purpose: 'Version every browser-local metadata domain and provide bounded migration, corruption recovery, rollback, and domain-specific reset behavior.',
    scope: ['Storage schema registry', 'Bounded-store documentation', 'Migration previews', 'Read-back verification and rollback', 'One-domain recovery without clearing the vault'],
    dependencies: ['v126 release registry and storage inventory', 'Existing backup-first broad writes', 'Stable restore destination'],
    safeguards: ['Never clear all local storage', 'Preserve gringottsBudgetVault.latest', 'No empty-vault overwrite', 'No migration without explicit review'],
    outcome: 'Upgrades and recovery become safer even as long-lived local data evolves.'
  },
  {
    version: 'v129', status: 'directional', title: 'Household Workflow Evidence Review',
    purpose: 'Observe real household use and identify repeated confusion, abandoned surfaces, slow paths, and unmet needs before approving more product scope.',
    scope: ['Workflow friction review', 'Feature-use evidence', 'Support and failure pattern review', 'Consolidation candidates'],
    dependencies: ['v126–v128 stabilized runtime, UX, and recovery'],
    safeguards: ['No analytics endpoint', 'No private financial data in repository evidence', 'No feature approved from roadmap momentum alone'],
    outcome: 'Future work is based on observed needs instead of a longer feature list.'
  },
  {
    version: 'v130', status: 'directional', title: 'Performance & Maintenance Hardening',
    purpose: 'Protect boot, route, report, export, observer, byte, and network budgets while reducing historical release-layer maintenance cost.',
    scope: ['Performance budget enforcement', 'Historical layer consolidation', 'Workbook restraint', 'Dependency and supply-chain review', 'Recovery drills'],
    dependencies: ['v126 lifecycle metrics', 'v129 workflow evidence'],
    safeguards: ['No eager loading of historical release layers', 'No service worker without separate review', 'No new sheet without consolidation'],
    outcome: 'The application stays fast, supportable, and recoverable over time.'
  },
  {
    version: 'v131', status: 'directional', title: 'Observed Needs Decision Gate',
    purpose: 'Decide whether any new household-finance capability is justified after reliability, simplicity, portability, and maintenance goals are met.',
    scope: ['Unmet-needs evidence', 'Consolidate-or-remove review', 'Safety and privacy impact', 'Release-size and maintenance-cost estimate'],
    dependencies: ['v126–v130 evidence and protected quality gates'],
    safeguards: ['Feature freeze remains the default', 'No automatic financial action', 'No new metadata store without schema, cap, migration, recovery, and privacy contracts'],
    outcome: 'New features resume only when a clear household need outweighs added complexity.'
  }
];

export function validateRoadmapHorizon() {
  if (ROADMAP_HORIZON.length !== 6) throw new Error('v126 roadmap horizon must contain exactly six releases.');
  ROADMAP_HORIZON.forEach((entry, index) => {
    const expected = `v${126 + index}`;
    if (entry.version !== expected) throw new Error(`Roadmap version order mismatch: expected ${expected}.`);
    for (const field of ['title', 'purpose', 'scope', 'dependencies', 'safeguards', 'outcome']) {
      if (!entry[field] || (Array.isArray(entry[field]) && entry[field].length < 1)) throw new Error(`Roadmap entry ${entry.version} is missing ${field}.`);
    }
  });
  if (ROADMAP_HORIZON[0].status !== 'current') throw new Error('v126 must be the current release.');
  if (ROADMAP_HORIZON[0].title !== 'Runtime Consolidation & Reliability') throw new Error('v126 must remain the reliability release.');
  return true;
}
