export const ROADMAP_HORIZON = [
  {
    version: 'v121',
    status: 'current',
    title: 'Receipt Integrity & Import Batch Reconciliation',
    purpose: 'Turn retained import receipts into a filterable batch timeline and preserve a verified metadata-only link from an explicit dry run to the resulting receipt.',
    scope: [
      'Derive per-destination receipt sequence and before/after-count continuity.',
      'Identify duplicated receipt identities, repeated source use, legacy counts, untracked increases, and count decreases.',
      'Filter by integrity, result, lineage, dry-run state, destination family, and local search.',
      'Add privacy-safe selected-batch and full-timeline downloads plus workbook integrity sheets.',
      'Retain bounded verified dry-run links under gringottsImportBatchIndex.v1.'
    ],
    dependencies: [
      'v120 receipt auditing and manual rollback guidance',
      'v119 metadata-only dry-run model',
      'v115 verified receipt history and guarded writer'
    ],
    safeguards: [
      'Existing receipts remain authoritative and are never rewritten, repaired, or deleted.',
      'Dry-run links require format, schema, normalized-row, insert, and skip reconciliation.',
      'The batch index excludes rows, filenames, fingerprints, mappings, destination keys, identifiers, merchants, balances, credentials, and vault contents.',
      'No automatic rollback, receipt repair, or transaction change.'
    ],
    outcome: 'A household can follow sequential imports, distinguish normal activity from continuity gaps, and verify which receipts were preceded by a matching dry run.'
  },
  {
    version: 'v122',
    status: 'planned',
    title: 'Account Cleanup & Merge Planning',
    purpose: 'Help households resolve duplicate or inconsistent account labels without silently combining transaction histories.',
    scope: [
      'Inventory account labels, masked identifiers, transaction counts, and date ranges.',
      'Detect likely duplicates, spelling drift, and renamed accounts with explainable evidence.',
      'Preview rename or merge effects on transactions, reports, recurring items, rules, budgets, and planning references.',
      'Generate a backup-first cleanup plan with an explicit decision for every candidate account.'
    ],
    dependencies: [
      'v121 batch continuity and destination-family evidence',
      'stable account-label behavior from v117–v121',
      'synthetic multi-account fixtures and real household validation'
    ],
    safeguards: [
      'No automatic merge based on similar names alone.',
      'Every write remains backup-first, previewed, acknowledged, confirmed, and read-back verified.',
      'Full source account identifiers remain masked or excluded.',
      'Cleanup cannot silently rewrite rules, goals, budgets, or recurring decisions.'
    ],
    outcome: 'Account lists become easier to understand while every transaction-history change remains explicit, reviewable, and recoverable.'
  },
  {
    version: 'v123',
    status: 'planned',
    title: 'Recurring Cost Decisions & Subscription Review',
    purpose: 'Turn recurring-charge detection into an explainable household decision workflow instead of a passive list.',
    scope: [
      'Group recurring merchants by cadence, amount stability, and recent price changes.',
      'Track Keep, Cancel, Renegotiate, Investigate, and Completed decisions.',
      'Estimate annualized impact while visibly labeling assumptions.',
      'Assign owner, target date, notes, and follow-up status.',
      'Feed selected actions into Guided Plan, reports, and the family meeting pack.'
    ],
    dependencies: [
      'existing recurring and amount-change detection',
      'Guided Plan state and reporting',
      'account cleanup and labeling improvements from v122'
    ],
    safeguards: [
      'No merchant cancellation, payment change, email, or external account connection.',
      'Savings estimates remain assumptions rather than guarantees.',
      'Pending and one-time charges are not promoted as subscriptions without evidence.',
      'Decision history remains separate from transaction rows.'
    ],
    outcome: 'The household receives a manageable recurring-cost queue with owners, estimated impact, and visible follow-through.'
  },
  {
    version: 'v124',
    status: 'planned',
    title: 'Household Scenario Comparison',
    purpose: 'Compare debt, savings, purchase, income, or recurring-cost choices without editing the real vault.',
    scope: [
      'Create temporary what-if scenarios from current forecast settings.',
      'Compare cash-buffer pressure, goal timing, debt direction, and monthly flexibility.',
      'Save named scenario assumptions separately from transactions.',
      'Show side-by-side baselines, changed assumptions, and projected outcomes.',
      'Produce concise family-discussion summaries and Guided Plan suggestions.'
    ],
    dependencies: [
      'forecast, debt, goals, and Guided Plan models',
      'recurring-cost decisions from v123',
      'clear assumption, horizon, and uncertainty labels'
    ],
    safeguards: [
      'Scenarios never overwrite transactions, budgets, goals, debt records, or forecast settings.',
      'Results are projections, not financial guarantees.',
      'Every comparison shows its assumptions and date horizon.',
      'Applying a scenario would require a separate explicit confirmed workflow.'
    ],
    outcome: 'Household choices can be discussed with visible trade-offs before changing real payments, plans, or spending.'
  },
  {
    version: 'v125',
    status: 'planned',
    title: 'Close History & Trend Explainability',
    purpose: 'Use immutable month-close history to explain how the household plan changed and where repeated drift occurs.',
    scope: [
      'Compare closed months across spending, income, review readiness, recurring changes, forecast pressure, and goal progress.',
      'Explain reopen events and differences between original and revised closes.',
      'Surface repeated categories or accounts driving close drift.',
      'Distinguish one-time disruptions from recurring patterns.',
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
      'Sparse history produces cautious language rather than false certainty.',
      'Reopen events remain explicit and separately recorded.'
    ],
    outcome: 'The household can see not only what changed month to month, but why the plan repeatedly missed, drifted, or improved.'
  },
  {
    version: 'v126',
    status: 'planned',
    title: 'Data Portability & Long-Term Maintenance',
    purpose: 'Strengthen recovery, migration, and maintainability after the import and planning workflows have stabilized through real use.',
    scope: [
      'Define versioned exports for non-transaction planning metadata where safe and useful.',
      'Add migration previews for older vault structures and browser-local metadata stores.',
      'Consolidate stable release-layer code without stacking another runtime.',
      'Expand deterministic migration and recovery fixtures.',
      'Evaluate additional bank formats only against representative validated exports.'
    ],
    dependencies: [
      'field experience from v121–v125',
      'stable data-boundary contracts and migration fixtures',
      'separate validation for CAMT, MT940, institution JSON, or guarded XLSX'
    ],
    safeguards: [
      'No migration write without backup, preview, acknowledgement, confirmation, and read-back verification.',
      'PDF and OCR remain outside normal transaction import.',
      'Real household exports remain prohibited from the public repository and CI artifacts.',
      'One live runtime, stable rescue, and local-first operation remain non-negotiable.'
    ],
    outcome: 'The tool remains recoverable and maintainable as browser-local data evolves without sacrificing the single-runtime architecture.'
  },
  {
    version: 'v127',
    status: 'planned',
    title: 'Family Review Cadence & Governance Packs',
    purpose: 'Turn existing reports, closes, decisions, goals, and audit evidence into a repeatable household review rhythm without background automation.',
    scope: [
      'Create monthly, quarterly, and annual review checklists from existing local evidence.',
      'Track which household questions were reviewed, deferred, or assigned.',
      'Assemble local governance packs containing selected reports, decisions, assumptions, and follow-ups.',
      'Show stale decisions, overdue review items, and unresolved evidence gaps.',
      'Keep review cadence settings separate from transactions and financial calculations.'
    ],
    dependencies: [
      'recurring decisions from v123',
      'scenario comparisons from v124',
      'close-history explanations from v125',
      'stable metadata portability from v126'
    ],
    safeguards: [
      'No background notifications, email delivery, or external calendar connection.',
      'Review completion never changes transactions, balances, or historical closes.',
      'Governance packs are generated locally and include only user-selected sections.',
      'Overdue labels remain workflow prompts, not claims of financial risk.'
    ],
    outcome: 'The household gains a consistent review process that connects evidence, decisions, owners, and follow-up without creating another financial-data source.'
  }
];

export function validateRoadmapHorizon(entries = ROADMAP_HORIZON) {
  if (!Array.isArray(entries) || entries.length < 7) throw new Error('Roadmap horizon must contain at least seven releases.');
  const versions = new Set();
  entries.forEach((entry, index) => {
    if (!/^v\d+$/.test(String(entry?.version || ''))) throw new Error(`Roadmap entry ${index + 1} has an invalid version.`);
    if (versions.has(entry.version)) throw new Error(`Roadmap version ${entry.version} is duplicated.`);
    versions.add(entry.version);
    if (!entry.title || !entry.purpose || !entry.outcome) throw new Error(`Roadmap entry ${entry.version} is missing required narrative.`);
    for (const field of ['scope', 'dependencies', 'safeguards']) {
      if (!Array.isArray(entry[field]) || entry[field].length < 3) throw new Error(`Roadmap entry ${entry.version} needs detailed ${field}.`);
    }
  });
  if (entries[0]?.version !== 'v121' || entries[0]?.status !== 'current') {
    throw new Error('The first roadmap entry must identify v121 as the current release.');
  }
  return true;
}

validateRoadmapHorizon();
