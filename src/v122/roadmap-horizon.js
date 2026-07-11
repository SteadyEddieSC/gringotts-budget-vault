export const ROADMAP_HORIZON = [
  {
    version: 'v122',
    status: 'current',
    title: 'Account Cleanup & Merge Planning',
    purpose: 'Help households understand duplicate or inconsistent account labels and make explicit cleanup decisions without silently combining transaction histories.',
    scope: [
      'Inventory masked account labels, transaction counts, pending counts, date ranges, owner counts, and downstream references.',
      'Detect label drift, spelling differences, possible renames, and possible duplicates with explainable evidence and confidence.',
      'Preview effects across transactions, recurring items, rules, budgets, bills, goals, planning metadata, and reports.',
      'Save a bounded metadata-only decision for every cleanup candidate and export a sanitized cleanup plan.',
      'Add Account Inventory and Account Cleanup Plan workbook sheets.'
    ],
    dependencies: [
      'v121 receipt integrity and destination continuity evidence',
      'stable account-label behavior from the current transaction and reporting models',
      'synthetic multi-account fixtures covering overlap, renames, spelling drift, and distinct accounts'
    ],
    safeguards: [
      'No automatic account rename, merge, deletion, or transaction rewrite.',
      'Similarity evidence never authorizes a write and overlapping date ranges remain an explicit caution.',
      'Plan storage contains candidate identifiers and decisions only, not transaction rows, balances, merchants, or full identifiers.',
      'Any future cleanup execution must be a separate backup-first, previewed, acknowledged, confirmed, and read-back-verified workflow.'
    ],
    outcome: 'The household gains a clear account inventory and a complete decision plan while all transaction history remains unchanged.'
  },
  {
    version: 'v123',
    status: 'planned',
    title: 'Recurring Cost Decisions & Subscription Review',
    purpose: 'Turn recurring-charge detection into an explainable household decision workflow instead of a passive list.',
    scope: [
      'Group recurring merchants by cadence, amount stability, account, and recent price changes.',
      'Track Keep, Cancel, Renegotiate, Investigate, and Completed decisions.',
      'Estimate annualized impact while clearly labeling assumptions and incomplete evidence.',
      'Assign owner, target date, status, and follow-up without contacting merchants.',
      'Feed selected actions into Guided Plan, reports, and family meeting preparation.'
    ],
    dependencies: [
      'existing recurring and amount-change detection',
      'Guided Plan state and reporting',
      'account inventory and label decisions from v122'
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
    purpose: 'Strengthen recovery, migration, and maintainability after import and planning workflows stabilize through real use.',
    scope: [
      'Define versioned exports for non-transaction planning metadata where safe and useful.',
      'Add migration previews for older vault structures and browser-local metadata stores.',
      'Consolidate stable release-layer code without creating a second runtime.',
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
      'Keep review-cadence settings separate from transactions and financial calculations.'
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
    outcome: 'The household gains a consistent review process connecting evidence, decisions, owners, and follow-up without creating another financial-data source.'
  },
  {
    version: 'v128',
    status: 'planned',
    title: 'Household Data Quality & Stewardship Review',
    purpose: 'Provide a periodic local review of stale metadata, orphaned decisions, backup readiness, and evidence gaps without automatically deleting or rewriting records.',
    scope: [
      'Inventory stale or orphaned planning metadata across account, recurring, scenario, close, and governance stores.',
      'Explain which records still connect to current transactions and which require household review.',
      'Assess backup recency and export coverage using user-supplied local evidence rather than background scanning.',
      'Generate a stewardship checklist for retain, archive, migrate, or investigate decisions.',
      'Add privacy-safe maintenance summaries to the workbook and governance pack.'
    ],
    dependencies: [
      'versioned metadata portability from v126',
      'review cadence and governance packs from v127',
      'stable orphan-detection rules across v122–v127 metadata stores'
    ],
    safeguards: [
      'No automatic deletion, compaction, archive, or migration.',
      'Backup age is reported only from explicit local evidence and never inferred from remote storage.',
      'Orphan labels are review prompts, not proof that data is unnecessary.',
      'Any cleanup write requires a separate backup-first confirmed workflow.'
    ],
    outcome: 'The household can maintain a trustworthy local vault over time with visible ownership of every retention or cleanup decision.'
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
  if (entries[0]?.version !== 'v122' || entries[0]?.status !== 'current') {
    throw new Error('The first roadmap entry must identify v122 as the current release.');
  }
  return true;
}

validateRoadmapHorizon();
