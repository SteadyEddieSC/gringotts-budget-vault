export const EXPORT_CONTRACT_RELEASE = 'v134';
export const WORKBOOK_SHEET_CAP = 43;

const CONTRACTS = [
  { id:'vault-workbook', label:'Vault Workbook', owner:'v115 reporting + v121–v125 sheet extensions', format:'xlsx', extension:'.xlsx', mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', privacyMode:'transaction-detail', startupPath:true, automatic:false, filenamePolicy:'Gringotts_Budget_Vault_v115_<start>_to_<end>_<timestamp>.xlsx', successMessage:'43-sheet Vault Workbook downloaded', failureBehavior:'throw-without-substitution', cancellationBehavior:'abort-before-dispatch', retryBehavior:'none' },
  { id:'family-meeting-pack', label:'Family Meeting Pack', owner:'v115 reporting', format:'markdown', extension:'.md', mimeType:'text/markdown', privacyMode:'household-summary', startupPath:true, automatic:false, filenamePolicy:'Gringotts_Family_Meeting_Pack_v115_<start>_to_<end>_<timestamp>.md', successMessage:'Family meeting pack downloaded', failureBehavior:'throw-without-substitution', cancellationBehavior:'abort-before-dispatch', retryBehavior:'none' },
  { id:'guided-household-plan', label:'Guided Household Plan', owner:'v115 reporting', format:'markdown', extension:'.md', mimeType:'text/markdown', privacyMode:'household-summary', startupPath:true, automatic:false, filenamePolicy:'Gringotts_Guided_Household_Plan_v115_<month>_<timestamp>.md', successMessage:'Guided household plan downloaded', failureBehavior:'throw-without-substitution', cancellationBehavior:'abort-before-dispatch', retryBehavior:'none' },
  { id:'full-vault-backup', label:'Full Vault Backup', owner:'v115 reporting', format:'json', extension:'.json', mimeType:'application/json', privacyMode:'full-vault', startupPath:true, automatic:false, filenamePolicy:'Gringotts_v115_backup_<transaction-count>_<timestamp>.json', successMessage:'Current vault backup downloaded', failureBehavior:'throw-without-substitution', cancellationBehavior:'abort-before-dispatch', retryBehavior:'none' },
  { id:'rules-review', label:'Rules Review', owner:'v115 reporting', format:'json', extension:'.json', mimeType:'application/json', privacyMode:'configuration-only', startupPath:true, automatic:false, filenamePolicy:'Gringotts_v115_rules_review_<timestamp>.json', successMessage:'Rules review downloaded', failureBehavior:'throw-without-substitution', cancellationBehavior:'abort-before-dispatch', retryBehavior:'none' },
  { id:'calendar', label:'Household Calendar', owner:'v115 reporting', format:'ics', extension:'.ics', mimeType:'text/calendar', privacyMode:'household-summary', startupPath:true, automatic:false, filenamePolicy:'Gringotts_v115_calendar_<timestamp>.ics', successMessage:'Household calendar downloaded', failureBehavior:'throw-without-substitution', cancellationBehavior:'abort-before-dispatch', retryBehavior:'none' },
  { id:'diagnostics', label:'Local Diagnostics', owner:'v115 reporting', format:'json', extension:'.json', mimeType:'application/json', privacyMode:'diagnostics-only', startupPath:true, automatic:false, filenamePolicy:'Gringotts_v115_diagnostics_<timestamp>.json', successMessage:'Local diagnostics downloaded', failureBehavior:'throw-without-substitution', cancellationBehavior:'abort-before-dispatch', retryBehavior:'none' },
  { id:'import-profile-bundle', label:'Import Profile Bundle', owner:'v118 profile portability', format:'json', extension:'.json', mimeType:'application/json', privacyMode:'configuration-only', startupPath:false, automatic:false, filenamePolicy:'Gringotts_v118_import_profiles_<profile-count>_<timestamp>.json', successMessage:'Sanitized import profiles downloaded', failureBehavior:'throw-without-substitution', cancellationBehavior:'abort-before-dispatch', retryBehavior:'none' },
  { id:'import-dry-run', label:'Import Dry-Run Diagnostic', owner:'v119 profile versioning', format:'json', extension:'.json', mimeType:'application/json', privacyMode:'metadata-only', startupPath:false, automatic:false, filenamePolicy:'Gringotts_v119_import_dry_run_<timestamp>.json', successMessage:'Metadata-only dry-run diagnostic downloaded', failureBehavior:'throw-without-substitution', cancellationBehavior:'abort-before-dispatch', retryBehavior:'none' },
  { id:'import-receipt-audit', label:'Import Receipt Audit', owner:'v120 receipt audit', format:'json', extension:'.json', mimeType:'application/json', privacyMode:'metadata-only', startupPath:false, automatic:false, filenamePolicy:'Gringotts_v120_import_receipt_audit_<timestamp>.json', successMessage:'Sanitized receipt audit downloaded', failureBehavior:'throw-without-substitution', cancellationBehavior:'abort-before-dispatch', retryBehavior:'none' },
  { id:'import-receipt-timeline', label:'Import Receipt Timeline', owner:'v121 receipt integrity', format:'json', extension:'.json', mimeType:'application/json', privacyMode:'metadata-only', startupPath:false, automatic:false, filenamePolicy:'Gringotts_v121_import_receipt_timeline_<timestamp>.json', successMessage:'Sanitized import receipt timeline downloaded', failureBehavior:'throw-without-substitution', cancellationBehavior:'abort-before-dispatch', retryBehavior:'none' },
  { id:'import-receipt-batch', label:'Selected Import Batch Audit', owner:'v121 receipt integrity', format:'json', extension:'.json', mimeType:'application/json', privacyMode:'metadata-only', startupPath:false, automatic:false, filenamePolicy:'Gringotts_v121_import_batch_<timestamp>.json', successMessage:'Sanitized selected batch audit downloaded', failureBehavior:'throw-without-substitution', cancellationBehavior:'abort-before-dispatch', retryBehavior:'none' },
  { id:'account-cleanup-plan', label:'Account Cleanup Plan', owner:'v122 account cleanup export', format:'json', extension:'.json', mimeType:'application/json', privacyMode:'aggregate-only', startupPath:false, automatic:false, filenamePolicy:'Gringotts_v122_account_cleanup_plan_<timestamp>.json', successMessage:'Sanitized account cleanup plan downloaded', failureBehavior:'throw-without-substitution', cancellationBehavior:'abort-before-dispatch', retryBehavior:'none' },
  { id:'close-trend', label:'Aggregate Close Trend', owner:'v125 close trends', format:'json', extension:'.json', mimeType:'application/json', privacyMode:'aggregate-only', startupPath:false, automatic:false, filenamePolicy:'Gringotts_v125_close_trend_<month>_<timestamp>.json', successMessage:'Aggregate close trend downloaded', failureBehavior:'throw-without-substitution', cancellationBehavior:'abort-before-dispatch', retryBehavior:'none' },
  { id:'workflow-review', label:'Workflow Review', owner:'v129 workflow evidence', format:'json', extension:'.json', mimeType:'application/json', privacyMode:'workflow-only', startupPath:false, automatic:false, filenamePolicy:'Gringotts_Workflow_Review_<timestamp>.json', successMessage:'Local workflow review downloaded', failureBehavior:'throw-without-substitution', cancellationBehavior:'abort-before-dispatch', retryBehavior:'none' },
  { id:'decision-record', label:'Decision Record', owner:'v131 decision gate', format:'json', extension:'.json', mimeType:'application/json', privacyMode:'workflow-only', startupPath:false, automatic:false, filenamePolicy:'Gringotts_Decision_Gate_<timestamp>.json', successMessage:'Decision record downloaded', failureBehavior:'throw-without-substitution', cancellationBehavior:'abort-before-dispatch', retryBehavior:'none' }
];

export const EXPORT_CATALOG = Object.freeze(CONTRACTS.map((entry) => Object.freeze({ ...entry })));
export const WORKBOOK_OWNERSHIP = Object.freeze([
  Object.freeze({ id:'base-guided-workbook', owner:'v103–v114 reporting and planning', count:32, sheets:Object.freeze([]) }),
  Object.freeze({ id:'import-receipts', owner:'v115 reporting', count:1, sheets:Object.freeze(['Import Receipts']) }),
  Object.freeze({ id:'receipt-integrity', owner:'v121 reporting', count:2, sheets:Object.freeze(['Receipt Integrity','Batch Lineage']) }),
  Object.freeze({ id:'account-cleanup', owner:'v122 reporting', count:2, sheets:Object.freeze(['Account Inventory','Account Cleanup Plan']) }),
  Object.freeze({ id:'recurring-decisions', owner:'v123 reporting', count:2, sheets:Object.freeze(['Recurring Decisions','Recurring Decision History']) }),
  Object.freeze({ id:'scenario-comparisons', owner:'v124 reporting', count:2, sheets:Object.freeze(['Scenario Comparisons','Scenario Assumptions']) }),
  Object.freeze({ id:'close-trends', owner:'v125 reporting', count:2, sheets:Object.freeze(['Close Trends','Close Drivers']) })
]);

function fail(message) { throw new Error(`Export contract rejected: ${message}`); }
function exactIso(value) {
  const parsed = new Date(value);
  if (!value || Number.isNaN(parsed.valueOf()) || parsed.toISOString() !== value) fail('createdAt must be an exact ISO timestamp');
  return value;
}
function timestamp(value = new Date().toISOString()) { return exactIso(value).replace(/[:.]/g, '-'); }
function date(value, fallback) {
  const text = String(value ?? '').trim();
  return /^\d{4}-\d{2}(?:-\d{2})?$/.test(text) ? text : fallback;
}
function count(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : 0;
}

export function getExportContract(id) {
  const contract = EXPORT_CATALOG.find((entry) => entry.id === id);
  if (!contract) fail(`unknown export id ${id}`);
  return contract;
}

export function buildExportFilename(id, context = {}) {
  const stamp = timestamp(context.createdAt);
  const start = date(context.start, 'range-start');
  const end = date(context.end, 'range-end');
  const month = date(context.month, 'month');
  const names = {
    'vault-workbook': `Gringotts_Budget_Vault_v115_${start}_to_${end}_${stamp}.xlsx`,
    'family-meeting-pack': `Gringotts_Family_Meeting_Pack_v115_${start}_to_${end}_${stamp}.md`,
    'guided-household-plan': `Gringotts_Guided_Household_Plan_v115_${month}_${stamp}.md`,
    'full-vault-backup': `Gringotts_v115_backup_${count(context.transactionCount)}_${stamp}.json`,
    'rules-review': `Gringotts_v115_rules_review_${stamp}.json`,
    'calendar': `Gringotts_v115_calendar_${stamp}.ics`,
    'diagnostics': `Gringotts_v115_diagnostics_${stamp}.json`,
    'import-profile-bundle': `Gringotts_v118_import_profiles_${count(context.profileCount)}_${stamp}.json`,
    'import-dry-run': `Gringotts_v119_import_dry_run_${stamp}.json`,
    'import-receipt-audit': `Gringotts_v120_import_receipt_audit_${stamp}.json`,
    'import-receipt-timeline': `Gringotts_v121_import_receipt_timeline_${stamp}.json`,
    'import-receipt-batch': `Gringotts_v121_import_batch_${stamp}.json`,
    'account-cleanup-plan': `Gringotts_v122_account_cleanup_plan_${stamp}.json`,
    'close-trend': `Gringotts_v125_close_trend_${month}_${stamp}.json`,
    'workflow-review': `Gringotts_Workflow_Review_${stamp}.json`,
    'decision-record': `Gringotts_Decision_Gate_${stamp}.json`
  };
  const filename = names[id];
  if (!filename) fail(`unknown export id ${id}`);
  if (!filename.endsWith(getExportContract(id).extension)) fail(`filename extension mismatch for ${id}`);
  return filename;
}

const COMMON_PRIVATE_KEYS = new Set([
  'transactions','rows','raw','rawrows','sourcefilename','sourcefilenames','sourcefingerprint',
  'sourcefingerprints','destinationstoragekey','vaultcontents','credentials','tokens','routingnumber',
  'accountnumber','fullaccountidentifier','rawaccountlabel','localaccountlabel'
]);
const AGGREGATE_PRIVATE_KEYS = new Set([...COMMON_PRIVATE_KEYS,'merchant','merchants','balance','balances']);
const WORKFLOW_PRIVATE_KEYS = new Set([...AGGREGATE_PRIVATE_KEYS,'accountid','accountids','card','cards','amount','amounts','email','emails','contact','contacts']);
const METADATA_PRIVATE_KEYS = new Set([...COMMON_PRIVATE_KEYS,'merchant','merchants','balance','balances']);
function forbiddenKeys(mode) {
  if (mode === 'aggregate-only') return AGGREGATE_PRIVATE_KEYS;
  if (mode === 'workflow-only') return WORKFLOW_PRIVATE_KEYS;
  if (mode === 'metadata-only' || mode === 'diagnostics-only') return METADATA_PRIVATE_KEYS;
  if (mode === 'configuration-only') return COMMON_PRIVATE_KEYS;
  return null;
}
function inspect(value, forbidden, path = 'payload', seen = new WeakSet()) {
  if (!value || typeof value !== 'object') return;
  if (seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((entry, index) => inspect(entry, forbidden, `${path}[${index}]`, seen));
    return;
  }
  Object.entries(value).forEach(([key, entry]) => {
    const normalized = key.toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (forbidden.has(normalized)) fail(`${path}.${key} is forbidden for this privacy mode`);
    inspect(entry, forbidden, `${path}.${key}`, seen);
  });
}
export function assertExportPayloadSafe(id, payload) {
  const forbidden = forbiddenKeys(getExportContract(id).privacyMode);
  if (forbidden) inspect(payload, forbidden);
  return true;
}
export function validateExportCatalog() {
  if (EXPORT_CATALOG.length !== 16) fail('the retained export catalog must contain exactly sixteen outputs');
  const ids = new Set();
  const policies = new Set();
  EXPORT_CATALOG.forEach((entry) => {
    if (ids.has(entry.id)) fail(`duplicate export id ${entry.id}`);
    ids.add(entry.id);
    if (!entry.extension.startsWith('.') || !entry.mimeType || !entry.owner || !entry.label) fail(`incomplete export contract ${entry.id}`);
    if (entry.automatic !== false || entry.retryBehavior !== 'none') fail(`automatic or retry behavior is forbidden for ${entry.id}`);
    if (policies.has(entry.filenamePolicy)) fail(`duplicate filename policy ${entry.filenamePolicy}`);
    policies.add(entry.filenamePolicy);
  });
  return true;
}
export function validateWorkbookOwnership() {
  const total = WORKBOOK_OWNERSHIP.reduce((sum, group) => sum + group.count, 0);
  if (total !== WORKBOOK_SHEET_CAP) fail(`workbook ownership totals ${total}, expected ${WORKBOOK_SHEET_CAP}`);
  WORKBOOK_OWNERSHIP.forEach((group) => {
    if (!group.id || !group.owner || group.count < 1) fail('workbook ownership entry is incomplete');
    if (group.sheets.length && group.sheets.length !== group.count) fail(`sheet-name count mismatch for ${group.id}`);
  });
  return true;
}
