import { getMonth, read, save } from '../v103/core.js';
import { activeGoals, goalProgress, vaultHealth } from '../v108/goals.js';
import {
  cashForecast, closeReadiness, debtAnalysis, forecastSettings, monthCloseStatus, planningEvents
} from '../v110/planning.js';
import { selectedMonthInsights } from '../v113/insights.js';

export const GUIDED_PLAN_KEY = 'gringottsGuidedPlan.v1';

const STATUSES = new Set(['not-started', 'planned', 'done', 'dismissed']);
const PRIORITY_RANK = { urgent: 4, high: 3, medium: 2, routine: 1 };
const DAY_MS = 86_400_000;
const clean = (value, limit = 500) => String(value ?? '').trim().slice(0, limit);
const roundMoney = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(clean(value, 10));

function parseDate(value) {
  return new Date(`${value}T00:00:00Z`);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function daysUntil(value, from) {
  if (!validDate(value) || !validDate(from)) return null;
  return Math.round((parseDate(value) - parseDate(from)) / DAY_MS);
}

function fnv1a(value) {
  let hash = 2166136261;
  const text = String(value ?? '');
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function actionId(area, source) {
  return `plan_${area.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${fnv1a(source)}`;
}

function guidedPlanStore() {
  const stored = read(GUIDED_PLAN_KEY, { items: {}, history: [], updatedAt: '' });
  const items = stored?.items && typeof stored.items === 'object' && !Array.isArray(stored.items) ? stored.items : {};
  return {
    items,
    history: Array.isArray(stored?.history) ? stored.history.filter((entry) => entry && typeof entry === 'object').slice(0, 250) : [],
    updatedAt: clean(stored?.updatedAt, 40)
  };
}

export function guidedPlanData() {
  return guidedPlanStore();
}

function normalizedState(value = {}) {
  return {
    status: STATUSES.has(value?.status) ? value.status : 'not-started',
    owner: clean(value?.owner, 80),
    targetDate: validDate(value?.targetDate) ? value.targetDate : '',
    notes: clean(value?.notes, 800),
    title: clean(value?.title, 160),
    area: clean(value?.area, 80),
    createdAt: clean(value?.createdAt, 40),
    updatedAt: clean(value?.updatedAt, 40),
    lastSeenAt: clean(value?.lastSeenAt, 40)
  };
}

function addAction(list, payload) {
  const id = actionId(payload.area, payload.source);
  if (list.some((item) => item.id === id)) return;
  list.push({
    id,
    priority: PRIORITY_RANK[payload.priority] ? payload.priority : 'medium',
    area: clean(payload.area, 80),
    title: clean(payload.title, 160),
    why: clean(payload.why, 600),
    nextStep: clean(payload.nextStep, 600),
    evidence: clean(payload.evidence, 600),
    source: clean(payload.source, 300),
    destination: payload.destination || { tab: 'activity', section: 'plan', label: 'Stay on Plan' },
    suggestedDate: validDate(payload.suggestedDate) ? payload.suggestedDate : ''
  });
}

function goalActions(actions, asOfDate) {
  const goals = activeGoals();
  if (!goals.length) {
    addAction(actions, {
      priority: 'medium', area: 'Goals', source: 'create-first-goal',
      title: 'Create one household goal or sinking fund',
      why: 'No active savings, sinking-fund, emergency, or debt-payoff goal is currently configured.',
      nextStep: 'Choose one meaningful target, enter its current amount, and add a realistic monthly contribution.',
      evidence: 'Active goals: 0.',
      destination: { tab: 'money', section: 'goals', label: 'Open Goals & Health' }
    });
    return;
  }

  goals.forEach((goal) => {
    const progress = goalProgress(goal);
    if (progress.remaining <= 0) return;
    const dueDays = daysUntil(goal.dueDate, asOfDate);
    const monthly = Math.max(0, Number(goal.monthlyContribution || 0));
    if (dueDays !== null && dueDays < 0) {
      addAction(actions, {
        priority: 'urgent', area: 'Goals', source: `overdue:${goal.id}`,
        title: `Revisit the overdue ${goal.name} goal`,
        why: `${goal.name} still needs ${roundMoney(progress.remaining).toFixed(2)} and its due date has passed.`,
        nextStep: 'Update the due date, contribution plan, target, or current amount so the goal reflects the household decision.',
        evidence: `Due ${goal.dueDate}; funded ${Math.round(progress.percent * 100)}%.`,
        destination: { tab: 'money', section: 'goals', label: 'Open Goals & Health' }
      });
      return;
    }
    if (dueDays !== null && dueDays >= 0) {
      const monthsRemaining = Math.max(1, Math.ceil(dueDays / 30.4375));
      const requiredMonthly = roundMoney(progress.remaining / monthsRemaining);
      if (monthly + 0.01 < requiredMonthly) {
        addAction(actions, {
          priority: dueDays <= 90 ? 'high' : 'medium', area: 'Goals', source: `pace:${goal.id}`,
          title: `Review the contribution pace for ${goal.name}`,
          why: `The saved monthly contribution is ${monthly.toFixed(2)}, while a simple straight-line pace is about ${requiredMonthly.toFixed(2)} per month.`,
          nextStep: 'Choose whether to raise the contribution, move the due date, reduce the target, or accept a slower pace.',
          evidence: `${roundMoney(progress.remaining).toFixed(2)} remaining across about ${monthsRemaining} month${monthsRemaining === 1 ? '' : 's'}.`,
          suggestedDate: dueDays <= 30 ? asOfDate : '',
          destination: { tab: 'money', section: 'goals', label: 'Open Goals & Health' }
        });
      }
    }
  });
}

function closeAndQualityActions(actions, month, health) {
  const close = monthCloseStatus(month);
  const readiness = closeReadiness(month);
  if (close.drifted) {
    addAction(actions, {
      priority: 'urgent', area: 'Month close', source: `drift:${month}`,
      title: `Reopen and reconcile ${month}`,
      why: 'The closed-month transaction signature no longer matches the stored close revision.',
      nextStep: 'Review the post-close changes, reopen with a specific reason, reconcile every account, and create a new close revision.',
      evidence: `Current signature ${close.currentSignature}; stored close signature ${close.closeEvent?.snapshot?.transactionSignature || 'unavailable'}.`,
      destination: { tab: 'money', section: 'close', label: 'Open Close & Forecast' }
    });
  } else if (!close.closed && readiness.ready) {
    addAction(actions, {
      priority: 'medium', area: 'Month close', source: `ready:${month}`,
      title: `Close ${month} while it is reconciled`,
      why: 'No close blocker remains, but the selected month has not yet been closed.',
      nextStep: 'Review the final totals and create the immutable close revision.',
      evidence: `${readiness.metrics.count} transactions; ${readiness.accounts.length} reconciled account${readiness.accounts.length === 1 ? '' : 's'}.`,
      destination: { tab: 'money', section: 'close', label: 'Open Close & Forecast' }
    });
  } else if (!close.closed && readiness.blockers.length) {
    addAction(actions, {
      priority: readiness.metrics.pending || readiness.metrics.review ? 'high' : 'medium', area: 'Month close', source: `blocked:${month}`,
      title: `Clear the ${month} close blockers`,
      why: readiness.blockers[0],
      nextStep: 'Work through each visible blocker, then reconcile and close the month.',
      evidence: `${readiness.blockers.length} blocker${readiness.blockers.length === 1 ? '' : 's'} remain.`,
      destination: { tab: 'money', section: 'close', label: 'Open Close & Forecast' }
    });
  }

  if (health.facts.review > 0) {
    addAction(actions, {
      priority: 'high', area: 'Data quality', source: `review:${month}`,
      title: `Review ${health.facts.review} selected-month transaction${health.facts.review === 1 ? '' : 's'}`,
      why: 'Unreviewed or nonspecific categories reduce the reliability of category trends, reports, and month close.',
      nextStep: 'Use the Review Queue to confirm category, owner, account, and notes.',
      evidence: `Vault Health review queue count: ${health.facts.review}.`,
      destination: { tab: 'activity', section: 'review', label: 'Open Review Queue' }
    });
  }
  if (health.facts.pending > 0) {
    addAction(actions, {
      priority: 'medium', area: 'Data quality', source: `pending:${month}`,
      title: `Recheck ${health.facts.pending} pending transaction${health.facts.pending === 1 ? '' : 's'}`,
      why: 'Pending transactions are provisional and are excluded from unusual-spending comparisons and month close.',
      nextStep: 'After the institution posts the transactions, confirm amounts, categories, and duplicate handling.',
      evidence: `Pending rows in ${month}: ${health.facts.pending}.`,
      destination: { tab: 'activity', section: 'ledger', label: 'Open Transactions' }
    });
  }
}

function forecastActions(actions, forecast) {
  const eventCount = planningEvents().length;
  if (!eventCount) {
    addAction(actions, {
      priority: 'high', area: 'Cash flow', source: 'configure-schedule',
      title: 'Add recurring bills and paydays before relying on the forecast',
      why: 'The forecast has no saved bill or payday schedule, so projected balances cannot represent normal household cash timing.',
      nextStep: 'Add the major recurring bills and income dates, then confirm starting cash and the minimum buffer.',
      evidence: 'Saved planning events: 0.',
      destination: { tab: 'money', section: 'planning', label: 'Open Bills & Paydays' }
    });
  }
  if (forecast.negativeDays.length) {
    const first = forecast.negativeDays[0];
    addAction(actions, {
      priority: 'urgent', area: 'Cash flow', source: `negative:${forecast.start}:${first.date}`,
      title: `Resolve the forecasted negative balance beginning ${first.date}`,
      why: `The current schedule projects ${roundMoney(first.balance).toFixed(2)} on the first negative-balance day.`,
      nextStep: 'Verify starting cash and dates, then adjust bill timing, flexible spending, planned transfers, or income assumptions.',
      evidence: `${forecast.negativeDays.length} negative day${forecast.negativeDays.length === 1 ? '' : 's'} through ${forecast.end}.`,
      suggestedDate: first.date,
      destination: { tab: 'money', section: 'close', label: 'Open Close & Forecast' }
    });
  } else if (forecast.pressureDays.length) {
    const first = forecast.pressureDays[0];
    addAction(actions, {
      priority: 'high', area: 'Cash flow', source: `buffer:${forecast.start}:${first.date}`,
      title: `Plan for the first below-buffer date on ${first.date}`,
      why: `Projected cash falls to ${roundMoney(first.balance).toFixed(2)}, below the selected ${roundMoney(forecast.settings.minimumBuffer).toFixed(2)} buffer.`,
      nextStep: 'Confirm the schedule and decide whether to reduce flexible spending, move a bill, or hold additional cash.',
      evidence: `${forecast.pressureDays.length} below-buffer day${forecast.pressureDays.length === 1 ? '' : 's'} through ${forecast.end}.`,
      suggestedDate: first.date,
      destination: { tab: 'money', section: 'close', label: 'Open Close & Forecast' }
    });
  }
}

function debtActions(actions, debt) {
  const priority = debt.priority[0];
  debt.priority.filter((item) => item.promoActive && item.promoMonths <= 6 && item.promoGap > 0).slice(0, 3).forEach((item) => {
    addAction(actions, {
      priority: 'urgent', area: 'Debt', source: `promo-gap:${item.id}`,
      title: `Decide how to close the ${item.name} promotional payoff gap`,
      why: `The simple payoff pace is ${roundMoney(item.promoPayoffNeeded).toFixed(2)} per month, ${roundMoney(item.promoGap).toFixed(2)} above the saved target payment.`,
      nextStep: 'Raise the target payment, plan a lump sum, move the payoff date, or document why the balance will remain after the promotion.',
      evidence: `${item.promoMonths} month${item.promoMonths === 1 ? '' : 's'} remain; balance ${roundMoney(item.balance).toFixed(2)}.`,
      suggestedDate: item.promoEnd,
      destination: { tab: 'money', section: 'close', label: 'Open Debt Plan' }
    });
  });
  if (priority && !actions.some((item) => item.source === `promo-gap:${priority.id}`) && priority.balance > 0 && priority.effectiveApr >= 15) {
    addAction(actions, {
      priority: 'high', area: 'Debt', source: `priority:${priority.id}`,
      title: `Confirm ${priority.name} as the current debt priority`,
      why: `It is ranked first by the saved promotion and APR rules at ${priority.effectiveApr}% effective APR.`,
      nextStep: 'Confirm the target payment and whether available monthly extra debt money should remain focused here.',
      evidence: `Balance ${roundMoney(priority.balance).toFixed(2)}; target payment ${roundMoney(priority.targetPayment).toFixed(2)}; estimated monthly interest ${roundMoney(priority.monthlyInterest).toFixed(2)}.`,
      destination: { tab: 'money', section: 'close', label: 'Open Debt Plan' }
    });
  }
}

function insightActions(actions, insights) {
  insights.signals.filter((item) => item.severity === 'high').slice(0, 3).forEach((item) => {
    addAction(actions, {
      priority: 'high', area: 'Insights', source: `signal:${item.id}`,
      title: `Decide whether ${item.title.toLowerCase()}`,
      why: item.summary,
      nextStep: item.type === 'category-spike'
        ? 'Confirm whether the increase was planned and decide whether the next-period category plan should change.'
        : 'Confirm that the charge is expected, correctly categorized, and not a duplicate or new recurring cost.',
      evidence: item.method,
      destination: { tab: 'activity', section: 'insights', label: 'Open Household Insights' }
    });
  });
  const increased = insights.recurring.filter((item) => item.annualIncrease > 0);
  if (increased.length) {
    const annual = roundMoney(increased.reduce((sum, item) => sum + item.annualIncrease, 0));
    addAction(actions, {
      priority: annual >= 120 ? 'high' : 'medium', area: 'Recurring costs', source: `increases:${increased.map((item) => item.key).sort().join('|')}`,
      title: `Review ${increased.length} recurring price increase${increased.length === 1 ? '' : 's'}`,
      why: `The detected increases annualize to approximately ${annual.toFixed(2)} if the latest amounts continue monthly.`,
      nextStep: 'Confirm each increase and choose whether to keep, renegotiate, replace, or cancel the service.',
      evidence: increased.slice(0, 4).map((item) => `${item.name}: +${item.delta.toFixed(2)}`).join('; '),
      destination: { tab: 'activity', section: 'insights', label: 'Open Household Insights' }
    });
  }
}

function generatedActions(month = getMonth()) {
  const settings = forecastSettings();
  const asOfDate = validDate(settings.asOfDate) ? settings.asOfDate : todayIso();
  const health = vaultHealth(month);
  const forecast = cashForecast(settings);
  const debt = debtAnalysis(asOfDate);
  const insights = selectedMonthInsights(month);
  const actions = [];

  closeAndQualityActions(actions, month, health);
  forecastActions(actions, forecast);
  debtActions(actions, debt);
  goalActions(actions, asOfDate);
  insightActions(actions, insights);

  if (!actions.length) {
    addAction(actions, {
      priority: 'routine', area: 'Household review', source: `routine:${month}`,
      title: 'Hold the monthly household planning review',
      why: 'No automatic urgent, high, or medium planning action was generated from the current local data.',
      nextStep: 'Review upcoming purchases, goals, debt priorities, recurring costs, and the next forecast horizon together.',
      evidence: `Vault Health ${health.score} (${health.label}); no threshold-based planning exception generated.`,
      destination: { tab: 'reports', section: '', label: 'Open Reports Center' }
    });
  }

  return actions.sort((left, right) => PRIORITY_RANK[right.priority] - PRIORITY_RANK[left.priority] || left.area.localeCompare(right.area) || left.title.localeCompare(right.title)).slice(0, 16);
}

export function guidedPlanModel(month = getMonth()) {
  const generated = generatedActions(month);
  const store = guidedPlanStore();
  const now = new Date().toISOString();
  const actions = generated.map((action) => {
    const state = normalizedState(store.items[action.id]);
    return {
      ...action,
      state: {
        ...state,
        targetDate: state.targetDate || action.suggestedDate,
        lastSeenAt: now
      }
    };
  });
  const currentIds = new Set(actions.map((item) => item.id));
  const recentResolved = Object.entries(store.items)
    .filter(([id, value]) => !currentIds.has(id) && ['done', 'dismissed'].includes(value?.status))
    .map(([id, value]) => ({ id, ...normalizedState(value) }))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, 12);
  const counts = {
    total: actions.length,
    urgent: actions.filter((item) => item.priority === 'urgent' && !['done', 'dismissed'].includes(item.state.status)).length,
    high: actions.filter((item) => item.priority === 'high' && !['done', 'dismissed'].includes(item.state.status)).length,
    notStarted: actions.filter((item) => item.state.status === 'not-started').length,
    planned: actions.filter((item) => item.state.status === 'planned').length,
    done: actions.filter((item) => item.state.status === 'done').length,
    dismissed: actions.filter((item) => item.state.status === 'dismissed').length
  };
  counts.open = counts.notStarted + counts.planned;
  counts.resolved = counts.done + counts.dismissed;
  counts.percentResolved = counts.total ? Math.round(counts.resolved / counts.total * 100) : 100;
  return {
    generatedAt: now,
    month,
    actions,
    active: actions.filter((item) => !['done', 'dismissed'].includes(item.state.status)),
    resolved: actions.filter((item) => ['done', 'dismissed'].includes(item.state.status)),
    recentResolved,
    counts,
    storageKey: GUIDED_PLAN_KEY,
    methodology: [
      'The checklist is generated from local Vault Health, month-close readiness, forecast pressure, debt priorities, goals, and Household Insights.',
      'Priority is deterministic and explainable; it is not professional financial advice and does not predict fraud or guarantee savings.',
      'Viewing the plan never writes data. Only an explicit Save Plan Item action stores checklist status, owner, target date, and notes.',
      'Planning state is stored separately and never changes transactions, categories, budgets, goals, debt balances, forecast settings, or close history.'
    ]
  };
}

export function saveGuidedPlanItem(id, payload, month = getMonth()) {
  const item = generatedActions(month).find((candidate) => candidate.id === id);
  if (!item) throw new Error('This planning item is no longer generated from the current data. Refresh the plan and try again.');
  const store = guidedPlanStore();
  const previous = normalizedState(store.items[id]);
  const status = STATUSES.has(payload?.status) ? payload.status : previous.status;
  const targetDate = clean(payload?.targetDate, 10);
  if (targetDate && !validDate(targetDate)) throw new Error('Choose a valid planning target date or leave it blank.');
  const now = new Date().toISOString();
  const next = {
    status,
    owner: clean(payload?.owner, 80),
    targetDate,
    notes: clean(payload?.notes, 800),
    title: item.title,
    area: item.area,
    createdAt: previous.createdAt || now,
    updatedAt: now,
    lastSeenAt: now
  };
  const changed = ['status', 'owner', 'targetDate', 'notes'].some((key) => previous[key] !== next[key]);
  store.items[id] = next;
  if (changed) {
    store.history.unshift({
      id: `plan_event_${fnv1a(`${id}|${now}|${status}`)}`,
      itemId: id,
      title: item.title,
      area: item.area,
      fromStatus: previous.status,
      toStatus: status,
      owner: next.owner,
      targetDate: next.targetDate,
      notes: next.notes,
      recordedAt: now
    });
    store.history = store.history.slice(0, 250);
  }
  store.updatedAt = now;
  save(GUIDED_PLAN_KEY, store);
  const verified = normalizedState(guidedPlanStore().items[id]);
  if (verified.status !== next.status || verified.owner !== next.owner || verified.targetDate !== next.targetDate || verified.notes !== next.notes) {
    throw new Error('Planning-item read-back verification failed.');
  }
  return verified;
}

export function guidedPlanningSheetsV114(month = getMonth()) {
  const model = guidedPlanModel(month);
  const store = guidedPlanStore();
  return [
    {
      name: 'Guided Plan',
      rows: [
        ['Guided Household Planning', month],
        ['Generated', model.generatedAt],
        ['Open Items', model.counts.open],
        ['Urgent Open', model.counts.urgent],
        ['High Open', model.counts.high],
        ['Resolved Current Items', model.counts.resolved],
        ['Percent Resolved', model.counts.percentResolved / 100],
        [],
        ['Priority', 'Area', 'Title', 'Status', 'Owner', 'Target Date', 'Why', 'Recommended Next Step', 'Evidence', 'Destination', 'Notes', 'Updated At'],
        ...model.actions.map((item) => [item.priority, item.area, item.title, item.state.status, item.state.owner, item.state.targetDate, item.why, item.nextStep, item.evidence, item.destination.label, item.state.notes, item.state.updatedAt])
      ]
    },
    {
      name: 'Planning History',
      rows: [
        ['Recorded At', 'Area', 'Item', 'From Status', 'To Status', 'Owner', 'Target Date', 'Notes'],
        ...store.history.map((entry) => [entry.recordedAt, entry.area, entry.title, entry.fromStatus, entry.toStatus, entry.owner, entry.targetDate, entry.notes])
      ]
    }
  ];
}
