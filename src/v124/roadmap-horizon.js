export const ROADMAP_HORIZON = [
  {
    version: 'v124',
    status: 'current',
    title: 'Household Scenario Comparison',
    purpose: 'Compare debt, savings, purchase, income, recurring-cost, and flexibility choices without editing the real vault.',
    scope: [
      'Build temporary baseline-versus-scenario projections from current forecast settings and planning events.',
      'Model starting cash, monthly income, recurring savings, flexible spending, one-time expense, debt-payment, and goal-contribution assumptions.',
      'Compare ending cash, low point, buffer pressure, negative days, debt direction, goal timing, and monthly flexibility.',
      'Save bounded named assumption sets separately from transactions and existing planning records.',
      'Add scenario summaries to Guided Plan, reports, family meeting preparation, Markdown, and two workbook sheets.'
    ],
    dependencies: [
      'cash forecast and planning events from v110',
      'active goals, debt plan, and Guided Plan foundations',
      'recurring-cost decision context from v123'
    ],
    safeguards: [
      'No scenario changes transactions, budgets, forecast settings, debts, goals, or recurring decisions.',
      'No Apply Scenario control or automatic plan mutation exists.',
      'Debt direction excludes interest, fees, amortization, and minimum-payment recalculation.',
      'Every result shows the modeled horizon and explicit assumptions and is labeled as a discussion projection.'
    ],
    outcome: 'The household can compare visible trade-offs before deciding whether any separate real-world plan change is appropriate.'
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
    purpose: 'Turn reports, closes, decisions, goals, scenarios, and audit evidence into a repeatable household review rhythm without background automation.',
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
    outcome: 'The household gains a consistent review process connecting evidence, decisions, owners, assumptions, and follow-up.'
  },
  {
    version: 'v128',
    status: 'planned',
    title: 'Household Data Quality & Stewardship Review',
    purpose: 'Provide a periodic local review of stale metadata, orphaned decisions, backup readiness, and evidence gaps without automatically deleting or rewriting records.',
    scope: [
      'Inventory stale or orphaned planning metadata across account, recurring, scenario, close, and governance stores.',
      'Explain which records still connect to current evidence and which require household review.',
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
  },
  {
    version: 'v130',
    status: 'planned',
    title: 'Household Resilience & Contingency Planning',
    purpose: 'Translate established scenarios and review history into local contingency playbooks for income interruption, major expense, or cash-buffer stress.',
    scope: [
      'Create named contingency playbooks from reviewed scenario assumptions.',
      'Rank optional household responses by cash-buffer impact, timing, and reversibility.',
      'Identify prerequisite backups, account information, and family decisions without storing credentials.',
      'Generate local emergency-review checklists and printable discussion summaries.',
      'Keep contingency status visible in governance packs and Guided Plan.'
    ],
    dependencies: [
      'reviewed scenarios and outcome evidence from v124–v129',
      'governance packs and household review cadence',
      'stable local metadata portability and stewardship controls'
    ],
    safeguards: [
      'No automatic transfer, payment, cancellation, borrowing, or account connection.',
      'Playbooks are planning records rather than emergency guarantees or professional advice.',
      'Credentials, full account numbers, and transaction copies remain prohibited.',
      'Executing any financial action remains outside Gringotts and requires separate household confirmation.'
    ],
    outcome: 'The household gains a practical local playbook for discussing difficult financial conditions before an urgent decision is required.'
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
  if (entries[0]?.version !== 'v124' || entries[0]?.status !== 'current') {
    throw new Error('The first roadmap entry must identify v124 as the current release.');
  }
  return true;
}

validateRoadmapHorizon();
