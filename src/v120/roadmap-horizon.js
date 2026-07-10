export const ROADMAP_HORIZON = [
  {
    version: 'v120',
    status: 'current',
    title: 'Import Receipt Audit & Rollback Guidance',
    purpose: 'Turn existing metadata-only import receipts into a practical local audit trail without adding destructive recovery automation.',
    scope: [
      'Reconcile incoming, inserted, skipped, destination-before, and destination-after counts.',
      'Explain verification status, retained source coverage, warning counts, and current destination-count differences.',
      'Show whether a pre-import backup was expected and the filename pattern the user should locate.',
      'Download a sanitized receipt-audit package and provide a copyable manual rollback checklist.'
    ],
    dependencies: [
      'v115 guarded writer and metadata-only receipts',
      'v116 separated Import and Restore tasks',
      'v119 dry-run and profile revision safeguards'
    ],
    safeguards: [
      'No automatic rollback, deletion, or transaction rewrite.',
      'No backup-directory scanning or hidden file access.',
      'Downloaded audits exclude rows, filenames, fingerprints, destination keys, account identifiers, merchants, and vault contents.'
    ],
    outcome: 'A household can understand what an import changed, identify the expected backup, and follow a verified manual restore path when rollback is genuinely necessary.'
  },
  {
    version: 'v121',
    status: 'planned',
    title: 'Receipt Integrity & Import Batch Reconciliation',
    purpose: 'Make it easier to confirm that every completed import has a coherent receipt and that later audits can distinguish sequential batches.',
    scope: [
      'Add metadata-only batch lineage and receipt timeline filters.',
      'Identify missing, duplicated, or internally inconsistent receipt metadata.',
      'Relate dry-run readiness metadata to the resulting receipt without copying transaction rows.',
      'Expand the workbook receipt sheet with integrity status and batch-level explanations.'
    ],
    dependencies: [
      'v120 receipt-audit checks',
      'v119 dry-run diagnostic signatures',
      'real household feedback on multi-batch import review'
    ],
    safeguards: [
      'No automatic receipt repair or inferred transaction changes.',
      'No row-level transaction history duplicated into receipt storage.',
      'Legacy receipts remain readable and clearly labeled when fields are unavailable.'
    ],
    outcome: 'A user can follow multiple imports over time and quickly see which receipt records are complete, legacy, or need manual review.'
  },
  {
    version: 'v122',
    status: 'planned',
    title: 'Account Cleanup & Merge Planning',
    purpose: 'Help households resolve duplicate or inconsistent account labels without silently merging transaction histories.',
    scope: [
      'Inventory account labels, masked identifiers, transaction counts, and date ranges.',
      'Detect likely duplicates and naming drift with explainable evidence.',
      'Preview merge or rename effects before any write.',
      'Generate a backup-first cleanup plan with explicit per-account decisions.'
    ],
    dependencies: [
      'v121 batch and receipt integrity',
      'stable account-label behavior from v117–v119',
      'synthetic multi-account fixtures and real-use validation'
    ],
    safeguards: [
      'No automatic account merge based on similar names alone.',
      'Every rename or merge remains backup-first, previewed, confirmed, and read-back verified.',
      'Full source account identifiers remain masked or excluded.'
    ],
    outcome: 'Account lists become easier to understand while preserving transaction history and requiring explicit household decisions.'
  },
  {
    version: 'v123',
    status: 'planned',
    title: 'Recurring Cost Decisions & Subscription Review',
    purpose: 'Turn recurring-charge detection into an explainable decision workflow rather than a passive list.',
    scope: [
      'Group recurring merchants by cadence, amount stability, and recent price changes.',
      'Track keep, cancel, renegotiate, investigate, and completed decisions.',
      'Estimate annualized impact without claiming guaranteed savings.',
      'Feed selected actions into the Guided Household Plan and family meeting pack.'
    ],
    dependencies: [
      'existing recurring and amount-change detection',
      'Guided Plan state and reporting',
      'account cleanup improvements from v122'
    ],
    safeguards: [
      'No merchant cancellation, payment change, or external account connection.',
      'Savings estimates remain labeled assumptions.',
      'Pending and one-time charges are not promoted as subscriptions without evidence.'
    ],
    outcome: 'The household receives a manageable recurring-cost decision queue with owners, expected impact, and follow-through.'
  },
  {
    version: 'v124',
    status: 'planned',
    title: 'Household Scenario Comparison',
    purpose: 'Compare financial choices such as debt payments, savings contributions, purchases, or income changes without editing the real vault.',
    scope: [
      'Create temporary what-if scenarios from current forecast settings.',
      'Compare cash-buffer pressure, goal timing, debt payoff direction, and monthly flexibility.',
      'Save named scenario assumptions separately from transactions.',
      'Produce side-by-side family discussion summaries.'
    ],
    dependencies: [
      'forecast, debt, goals, and Guided Plan models',
      'recurring-cost decisions from v123',
      'clear scenario assumption and uncertainty labels'
    ],
    safeguards: [
      'Scenarios never overwrite transactions, budgets, goals, debt records, or forecast settings unless separately applied through a future confirmed workflow.',
      'Results are projections, not financial guarantees.',
      'Every comparison shows its assumptions and date horizon.'
    ],
    outcome: 'Household decisions can be discussed with visible trade-offs before changing real plans or spending.'
  },
  {
    version: 'v125',
    status: 'planned',
    title: 'Close History & Trend Explainability',
    purpose: 'Use immutable month-close history to explain how the household plan changed and where repeated drift occurs.',
    scope: [
      'Compare closed months across spending, income, review readiness, recurring changes, and forecast pressure.',
      'Explain reopen events and differences between original and revised closes.',
      'Surface repeated categories or accounts driving close drift.',
      'Add close-history narratives to reports and family meeting preparation.'
    ],
    dependencies: [
      'immutable close revisions from v110',
      'insight evidence rules from v113',
      'scenario and recurring-decision context from v123–v124'
    ],
    safeguards: [
      'Closed snapshots remain immutable; explanations do not rewrite history.',
      'Trend claims show comparison periods and evidence.',
      'Sparse history produces cautious language rather than false certainty.'
    ],
    outcome: 'The household can see not only what changed month to month, but why the plan repeatedly missed or improved.'
  },
  {
    version: 'v126',
    status: 'planned',
    title: 'Data Portability & Long-Term Maintenance',
    purpose: 'Strengthen recovery, migration, and maintainability after the import and planning workflows have stabilized through real use.',
    scope: [
      'Define versioned exports for non-transaction planning metadata where safe and useful.',
      'Add migration previews for older vault structures and local metadata stores.',
      'Consolidate release-layer code where behavior is stable without stacking runtimes.',
      'Evaluate additional bank formats only against representative validated exports.'
    ],
    dependencies: [
      'field experience from v120–v125',
      'stable data-boundary contracts and migration fixtures',
      'separate validation for CAMT, MT940, institution JSON, or guarded XLSX'
    ],
    safeguards: [
      'No migration writes without backup, preview, acknowledgement, confirmation, and read-back verification.',
      'PDF/OCR remains outside normal transaction import.',
      'Real household exports remain prohibited from the public repository and CI artifacts.'
    ],
    outcome: 'The tool remains recoverable and maintainable as its browser-local data evolves, without sacrificing the single-runtime or local-first architecture.'
  }
];

export function validateRoadmapHorizon(entries = ROADMAP_HORIZON) {
  if (!Array.isArray(entries) || entries.length < 6) throw new Error('Roadmap horizon must contain at least six releases.');
  const versions = new Set();
  entries.forEach((entry, index) => {
    if (!/^v\d+$/.test(String(entry?.version || ''))) throw new Error(`Roadmap entry ${index + 1} has an invalid version.`);
    if (versions.has(entry.version)) throw new Error(`Roadmap version ${entry.version} is duplicated.`);
    versions.add(entry.version);
    if (!entry.title || !entry.purpose || !entry.outcome) throw new Error(`Roadmap entry ${entry.version} is missing required narrative.`);
    for (const field of ['scope', 'dependencies', 'safeguards']) {
      if (!Array.isArray(entry[field]) || entry[field].length < 2) throw new Error(`Roadmap entry ${entry.version} needs detailed ${field}.`);
    }
  });
  if (entries[0]?.status !== 'current') throw new Error('The first roadmap entry must identify the current release.');
  return true;
}

validateRoadmapHorizon();
