export const ROADMAP_HORIZON = [
  {
    version: 'v123',
    status: 'current',
    title: 'Recurring Cost Decisions & Subscription Review',
    purpose: 'Turn recurring-charge detection into an explainable household decision and follow-up workflow instead of a passive list.',
    scope: [
      'Group posted recurring expenses by normalized merchant and account while excluding pending charges and weak one-time evidence.',
      'Explain cadence, date coverage, amount stability, latest price changes, and simple annualized footprint assumptions.',
      'Track Keep, Cancel, Renegotiate, Investigate, and Completed decisions with owner, target date, status, and notes.',
      'Feed open Cancel, Renegotiate, and Investigate decisions into Guided Plan, reports, and family meeting preparation.',
      'Add Recurring Decisions and Recurring Decision History workbook sheets.'
    ],
    dependencies: [
      'existing recurring and amount-change detection',
      'Guided Plan and report presentation from v114 and v111',
      'account masking and cleanup-planning boundaries from v122'
    ],
    safeguards: [
      'No merchant cancellation, payment change, email, phone call, or external account connection.',
      'Pending transactions and unsupported one-time charges are excluded from the decision queue.',
      'Annual figures are cadence-based discussion estimates rather than guaranteed savings or forecasts.',
      'Decision metadata remains separate from transaction rows and is read-back verified with prior-value restoration.'
    ],
    outcome: 'The household gains an owned recurring-cost queue with visible evidence, estimated footprint, and practical follow-through while all financial actions remain outside Gringotts.'
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
      'Every comparison shows assumptions and date horizon.',
      'Applying a scenario requires a separate explicit confirmed workflow.'
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
      'Closed snapshots remain immutable.',
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
    purpose: 'Turn reports, closes, decisions, goals, and audit evidence into a repeatable household review rhythm without background automation.',
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
      'Assess backup recency and export coverage using explicit local evidence rather than background scanning.',
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
  },
  {
    version: 'v129',
    status: 'planned',
    title: 'Decision Outcome Review & Forecast Calibration',
    purpose: 'Compare completed household decisions with later posted evidence so assumptions and forecasts can be improved without claiming causation.',
    scope: [
      'Review whether completed recurring, scenario, debt, goal, and close decisions are reflected in later posted data.',
      'Compare estimated and observed changes with clearly labeled timing and attribution limits.',
      'Capture household explanations for partial, delayed, or unrelated outcomes.',
      'Suggest forecast-assumption updates for explicit review rather than applying them automatically.',
      'Add outcome-review summaries to governance packs and family meeting preparation.'
    ],
    dependencies: [
      'completed recurring decisions from v123',
      'scenario assumptions from v124',
      'close and governance history from v125–v128'
    ],
    safeguards: [
      'Observed changes are not automatically attributed to a prior decision.',
      'No forecast, transaction, budget, goal, debt, or decision record is silently rewritten.',
      'Sparse or delayed evidence produces an inconclusive result rather than a success or failure claim.',
      'Any calibration change requires explicit preview and confirmation.'
    ],
    outcome: 'The household can learn from completed decisions and improve future assumptions without turning correlation into a financial claim.'
  }
];

export function validateRoadmapHorizon(entries = ROADMAP_HORIZON) {
  if (!Array.isArray(entries) || entries.length < 7) {
    throw new Error('Roadmap horizon must contain at least seven releases.');
  }
  const versions = new Set();
  entries.forEach((entry, index) => {
    if (!/^v\d+$/.test(String(entry?.version || ''))) {
      throw new Error(`Roadmap entry ${index + 1} has an invalid version.`);
    }
    if (versions.has(entry.version)) throw new Error(`Roadmap version ${entry.version} is duplicated.`);
    versions.add(entry.version);
    if (!entry.title || !entry.purpose || !entry.outcome) {
      throw new Error(`Roadmap entry ${entry.version} is missing required narrative.`);
    }
    for (const field of ['scope', 'dependencies', 'safeguards']) {
      if (!Array.isArray(entry[field]) || entry[field].length < 3) {
        throw new Error(`Roadmap entry ${entry.version} needs detailed ${field}.`);
      }
    }
  });
  if (entries[0]?.version !== 'v123' || entries[0]?.status !== 'current') {
    throw new Error('The first roadmap entry must identify v123 as the current release.');
  }
  return true;
}

validateRoadmapHorizon();
