import {
  account, best, category, downloadJson, dte, enabledRules, flow, getMonth, invalidateVaultCache,
  owner, reportAmount, stamp, txName, txs, txText
} from '../v103/core.js';

export const REVIEW_RECOVERY_KEY = 'gringottsReviewRecovery.v1';
let editingEnabled = false;
let sessionVaultKey = '';
let recoveryStored = false;

const safeClone = (value) => {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
};

function clean(value) {
  return String(value ?? '').trim();
}

function categoryNeedsCleanup(transaction) {
  const value = clean(category(transaction)).toLowerCase();
  return !value || value === 'other' || value === 'uncategorized';
}

export function reviewReasons(transaction) {
  const reasons = [];
  if (transaction.reviewed === false) reasons.push('Not reviewed');
  if (categoryNeedsCleanup(transaction)) reasons.push('Category needs cleanup');
  if (transaction.review_required === true) reasons.push('Source marked review required');
  return reasons;
}

export function reviewQueue(month = getMonth()) {
  const rules = enabledRules();
  const ruleMatches = (transaction) => rules.filter((rule) => {
    const haystack = (rule.scope === 'name' ? txName(transaction) : rule.scope === 'current' ? category(transaction) : rule.scope === 'account' ? account(transaction) : txText(transaction)).toLowerCase();
    return haystack.includes(String(rule.find || '').toLowerCase());
  });
  return txs().map((transaction, rowIndex) => {
    const reasons = reviewReasons(transaction);
    const matches = ruleMatches(transaction);
    return {
      rowIndex,
      transaction,
      reasons,
      matches,
      date: dte(transaction),
      name: txName(transaction),
      amount: reportAmount(transaction),
      flow: flow(transaction),
      category: category(transaction),
      account: account(transaction),
      owner: owner(transaction),
      notes: transaction.notes || transaction.note || ''
    };
  }).filter((item) => item.date.startsWith(month) && item.reasons.length)
    .sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name));
}

export function reviewOptions() {
  const rows = txs();
  const unique = (values) => [...new Set(values.map(clean).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  return {
    categories: unique(rows.map(category)),
    accounts: unique(rows.map(account)),
    owners: unique(rows.map(owner).filter((value) => value !== 'Unassigned'))
  };
}

export function reviewSession() {
  return { editingEnabled, sessionVaultKey, recoveryStored };
}

export function beginReviewSession(notify = () => {}) {
  const candidate = best();
  if (!candidate?.obj || candidate.transactions < 1) {
    notify('No populated readable vault is available for review');
    return false;
  }
  try {
    localStorage.setItem(REVIEW_RECOVERY_KEY, JSON.stringify({
      createdAt: new Date().toISOString(),
      vaultKey: candidate.key,
      transactionCount: candidate.transactions,
      vault: candidate.obj
    }));
    recoveryStored = true;
  } catch {
    recoveryStored = false;
  }
  downloadJson(`Gringotts_v107_pre_review_backup_${candidate.transactions}_${stamp()}.json`, candidate.obj);
  editingEnabled = true;
  sessionVaultKey = candidate.key;
  notify(recoveryStored ? 'Review editing enabled; backup and recovery snapshot created' : 'Review editing enabled; backup downloaded');
  return true;
}

function writeVault(candidate, vault) {
  if (!Array.isArray(vault.transactions) || vault.transactions.length < 1) {
    throw new Error('Review save blocked because the prepared vault is empty');
  }
  vault.lastSavedAt = new Date().toISOString();
  vault.reviewUpdatedAt = vault.lastSavedAt;
  localStorage.setItem(candidate.key, JSON.stringify(vault));
  const verify = JSON.parse(localStorage.getItem(candidate.key) || 'null');
  if (!verify || !Array.isArray(verify.transactions) || verify.transactions.length !== vault.transactions.length) {
    throw new Error('Review save verification failed');
  }
  invalidateVaultCache();
  return verify;
}

export function saveTransactionReview(rowIndex, changes, markReviewed, notify = () => {}) {
  const candidate = best();
  if (!editingEnabled || !candidate?.obj || candidate.key !== sessionVaultKey) {
    notify('Enable safe editing for the current vault first');
    return false;
  }
  const index = Number(rowIndex);
  if (!Number.isInteger(index) || index < 0 || index >= candidate.transactions) {
    notify('The selected transaction could not be located');
    return false;
  }
  const nextCategory = clean(changes.category);
  if (markReviewed && (!nextCategory || /^(other|uncategorized)$/i.test(nextCategory))) {
    notify('Choose a specific category before marking this transaction reviewed');
    return false;
  }
  try {
    const vault = safeClone(candidate.obj);
    const transaction = vault.transactions[index];
    transaction.category = nextCategory || category(transaction);
    transaction.owner = clean(changes.owner);
    transaction.account = clean(changes.account);
    transaction.notes = clean(changes.notes);
    transaction.reviewed = Boolean(markReviewed);
    transaction.reviewedAt = markReviewed ? new Date().toISOString() : transaction.reviewedAt || '';
    transaction.reviewSource = 'Gringotts v107 Review Queue';
    writeVault(candidate, vault);
    notify(markReviewed ? 'Transaction saved and marked reviewed' : 'Review progress saved');
    return true;
  } catch (error) {
    notify(error?.message || 'The transaction review could not be saved');
    return false;
  }
}

export function batchMarkCategorizedReviewed(month = getMonth(), notify = () => {}) {
  const candidate = best();
  if (!editingEnabled || !candidate?.obj || candidate.key !== sessionVaultKey) {
    notify('Enable safe editing for the current vault first');
    return 0;
  }
  const eligible = reviewQueue(month).filter((item) => !categoryNeedsCleanup(item.transaction));
  if (!eligible.length) {
    notify('No categorized review rows are eligible for the batch action');
    return 0;
  }
  try {
    const vault = safeClone(candidate.obj);
    const reviewedAt = new Date().toISOString();
    eligible.forEach((item) => {
      const transaction = vault.transactions[item.rowIndex];
      transaction.reviewed = true;
      transaction.reviewedAt = reviewedAt;
      transaction.reviewSource = 'Gringotts v107 categorized batch review';
    });
    writeVault(candidate, vault);
    notify(`${eligible.length} categorized transaction${eligible.length === 1 ? '' : 's'} marked reviewed`);
    return eligible.length;
  } catch (error) {
    notify(error?.message || 'The batch review could not be saved');
    return 0;
  }
}
