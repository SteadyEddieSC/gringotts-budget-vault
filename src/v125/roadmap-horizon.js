export const ROADMAP_HORIZON = [
  {
    version: 'v125', status: 'current', title: 'Close History & Trend Explainability',
    purpose: 'Turn immutable month-close history and posted open-month evidence into an understandable, transfer-neutral household trend review.',
    scope: ['Immutable close-snapshot comparisons', 'Income, recurring-expense, and variable-expense drivers', 'Coverage and confidence warnings', 'Two aggregate workbook sheets'],
    dependencies: ['v124 scenario comparison', 'Existing close and reopen history', 'Single active local transaction engine'],
    safeguards: ['No transaction copies in exports', 'Pending rows excluded', 'Transfers neutral', 'No automatic plan or close mutation', 'Correlation is not labeled as causation'],
    outcome: 'The household can explain why a month improved or declined without mistaking transfers, later row edits, or incomplete data for closed-month evidence.'
  },
  {
    version: 'v126', status: 'planned', title: 'Runtime Consolidation & Reliability',
    purpose: 'Freeze feature growth and replace implicit release-layer timing with one explicit route, readiness, action-ownership, and disposal lifecycle.',
    scope: ['Authoritative route lifecycle', 'MutationObserver reduction', 'One action and download dispatcher', 'Consolidated release registry', 'Idempotent rendering and stability tests'],
    dependencies: ['Observed v115–v125 lifecycle failures', 'Existing protected browser matrix', 'Stable v105 rescue'],
    safeguards: ['No second runtime', 'No new primary destination', 'No timeout-based lifecycle masking', 'Current workbook count becomes the cap'],
    outcome: 'Navigation, rendering, downloads, and lazy enhancements become predictable and easier to maintain.'
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
    purpose: 'Inventory and version every browser-local metadata domain and provide bounded migration, corruption recovery, rollback, and domain-specific reset behavior.',
    scope: ['Storage schema registry', 'Bounded-store documentation', 'Migration previews', 'Read-back verification and rollback', 'One-domain recovery without clearing the vault'],
    dependencies: ['v126 release registry', 'Existing backup-first broad writes', 'Stable restore destination'],
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
    scope: ['Performance budgets', 'Historical layer consolidation', 'Workbook restraint', 'Dependency and supply-chain review', 'Recovery drills'],
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
  if (ROADMAP_HORIZON.length !== 7) throw new Error('v125 roadmap horizon must contain exactly seven releases.');
  ROADMAP_HORIZON.forEach((entry, index) => {
    const expected = `v${125 + index}`;
    if (entry.version !== expected) throw new Error(`Roadmap version order mismatch: expected ${expected}.`);
    for (const field of ['title', 'purpose', 'scope', 'dependencies', 'safeguards', 'outcome']) {
      if (!entry[field] || (Array.isArray(entry[field]) && entry[field].length < 1)) throw new Error(`Roadmap entry ${entry.version} is missing ${field}.`);
    }
  });
  if (ROADMAP_HORIZON[1].title !== 'Runtime Consolidation & Reliability') throw new Error('v126 must remain the reliability release.');
  return true;
}
