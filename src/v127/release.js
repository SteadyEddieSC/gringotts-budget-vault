import {
  ACTION_INTENTS, V127_RELEASE, actionVerb, classifyAction, normalizeActionLabel, validateActionPolicy
} from './ux-policy.js';
import { ROADMAP_HORIZON, validateRoadmapHorizon } from './roadmap-horizon.js';

const ACTION_SELECTOR = 'button, a.btn, [role="button"], input[type="button"], input[type="submit"]';
const dialogOpeners = new WeakMap();
let installed = false;
let pendingRouteFocus = null;
let generatedId = 0;

function nextId(prefix) {
  generatedId += 1;
  return `${prefix}-${generatedId}`;
}

function visibleLabel(control) {
  if (!control) return '';
  return normalizeActionLabel(
    control.getAttribute?.('aria-label') ||
    control.textContent ||
    control.value ||
    control.title ||
    ''
  );
}

function controlInput(control) {
  return {
    label: visibleLabel(control),
    id: control.id || '',
    name: control.getAttribute?.('name') || '',
    href: control.getAttribute?.('href') || ''
  };
}

function ensureStatusRegion() {
  let region = document.getElementById('v127Status');
  if (region) return region;
  region = document.createElement('div');
  region.id = 'v127Status';
  region.className = 'v127-status-region';
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', 'polite');
  region.setAttribute('aria-atomic', 'true');
  document.body.append(region);
  return region;
}

export function announceV127(message) {
  const text = normalizeActionLabel(message);
  if (!text) return;
  const region = ensureStatusRegion();
  region.textContent = '';
  queueMicrotask(() => { region.textContent = text; });
}

function enhanceAction(control) {
  if (!(control instanceof Element) || control.matches('[data-tab], [role="tab"]')) return;
  const intent = classifyAction(controlInput(control));
  control.dataset.actionIntent = intent;
  control.dataset.actionVerb = actionVerb(intent);
  for (const candidate of ACTION_INTENTS) control.classList.toggle(`v127-action-${candidate}`, candidate === intent);
  if (!visibleLabel(control) && control.title) control.setAttribute('aria-label', control.title);
  if (intent === 'destructive') {
    control.setAttribute('data-confirmation-intent', 'destructive');
  } else {
    control.removeAttribute('data-confirmation-intent');
  }
}

function nearestHeading(node) {
  const section = node.closest('section, article, .card, main') || document.getElementById('main');
  return section?.querySelector('h1, h2, h3, h4') || null;
}

function enhanceTable(table) {
  if (!(table instanceof HTMLTableElement)) return;
  const caption = normalizeActionLabel(table.caption?.textContent || '');
  const heading = nearestHeading(table);
  const label = caption || normalizeActionLabel(heading?.textContent || '') || 'Household data table';
  const wrapper = table.closest('.table-wrap, .table-scroll, [data-table-region]');
  if (wrapper) {
    wrapper.dataset.v127TableRegion = 'true';
    wrapper.setAttribute('role', 'region');
    wrapper.setAttribute('aria-label', label);
    if (!wrapper.hasAttribute('tabindex')) wrapper.setAttribute('tabindex', '0');
    return;
  }
  table.dataset.v127TableRegion = 'true';
  table.setAttribute('aria-label', label);
  if (!table.hasAttribute('tabindex')) table.setAttribute('tabindex', '0');
}

function enhanceDialog(dialog) {
  if (!(dialog instanceof Element)) return;
  dialog.dataset.v127Dialog = 'true';
  const heading = dialog.querySelector('h1, h2, h3');
  if (heading) {
    if (!heading.id) heading.id = nextId('v127-dialog-title');
    if (!dialog.hasAttribute('aria-labelledby')) dialog.setAttribute('aria-labelledby', heading.id);
  } else if (!dialog.hasAttribute('aria-label')) {
    dialog.setAttribute('aria-label', 'Dialog');
  }
  dialog.querySelectorAll(ACTION_SELECTOR).forEach(enhanceAction);
}

function renderList(title, items) {
  const section = document.createElement('section');
  section.className = 'roadmap-card-section';
  const heading = document.createElement('h4');
  heading.textContent = title;
  const list = document.createElement('ul');
  for (const item of items) {
    const li = document.createElement('li');
    li.textContent = item;
    list.append(li);
  }
  section.append(heading, list);
  return section;
}

function roadmapCard(entry) {
  const card = document.createElement('article');
  card.className = 'roadmap-horizon-card';
  card.dataset.roadmapVersion = entry.version;
  card.dataset.roadmapStatus = entry.status;

  const header = document.createElement('div');
  header.className = 'roadmap-card-header';
  const title = document.createElement('h3');
  title.textContent = `${entry.version} — ${entry.title}`;
  const status = document.createElement('span');
  status.className = 'badge';
  status.textContent = entry.status === 'current' ? 'Current release' : entry.status === 'planned' ? 'Next planned' : 'Directional';
  header.append(title, status);

  const purpose = document.createElement('p');
  purpose.textContent = entry.purpose;

  const details = document.createElement('details');
  details.className = 'v127-roadmap-details';
  const summary = document.createElement('summary');
  summary.textContent = 'Scope, dependencies, and safeguards';
  details.append(
    summary,
    renderList('Scope', entry.scope),
    renderList('Dependencies', entry.dependencies),
    renderList('Safeguards', entry.safeguards)
  );

  const outcome = document.createElement('p');
  outcome.className = 'muted-note';
  outcome.textContent = `Expected outcome: ${entry.outcome}`;
  card.append(header, purpose, details, outcome);
  return card;
}

function enhanceRoadmap(root) {
  const page = root.querySelector?.('.v126-roadmap-page, .roadmap-page') ||
    (root.matches?.('.v126-roadmap-page, .roadmap-page') ? root : null);
  if (!page) return;
  const horizon = page.querySelector('.roadmap-horizon');
  if (!horizon || horizon.dataset.v127Roadmap === 'true') return;
  horizon.dataset.v127Roadmap = 'true';
  horizon.replaceChildren(...ROADMAP_HORIZON.map(roadmapCard));
  page.classList.add('v127-roadmap-page');
  const heading = page.querySelector('h1, h2');
  if (heading && /roadmap/i.test(heading.textContent || '')) heading.textContent = 'v127–v136 Reliability Roadmap';
}

function enhanceProgressiveDisclosure(root) {
  root.querySelectorAll?.('details').forEach((details) => {
    details.classList.add('v127-disclosure');
    const summary = details.querySelector(':scope > summary');
    if (summary && !normalizeActionLabel(summary.textContent)) summary.textContent = 'More details';
  });
  root.querySelectorAll?.('.v126-runtime-health-card, [data-diagnostics], .diagnostics-card').forEach((section) => {
    section.dataset.v127Disclosure = 'advanced';
  });
}

function enhanceCurrentSurface(root = document) {
  root.querySelectorAll?.(ACTION_SELECTOR).forEach(enhanceAction);
  root.querySelectorAll?.('table').forEach(enhanceTable);
  root.querySelectorAll?.('dialog, [role="dialog"]').forEach(enhanceDialog);
  enhanceProgressiveDisclosure(root);
  enhanceRoadmap(root);
}

function routeLabel(route) {
  return ({ dashboard: 'Dashboard', money: 'Money', calendar: 'Calendar', reports: 'Reports', activity: 'Activity', tools: 'Tools' })[route] || 'Page';
}

function focusRouteHeading(route) {
  const request = pendingRouteFocus;
  pendingRouteFocus = null;
  if (!request || request.route !== route) return;
  const active = document.activeElement;
  if (active && active !== document.body && active !== request.control && !active.matches?.('[data-tab], [role="tab"]')) return;
  const heading = document.querySelector('#main h1, #main h2');
  if (!heading) return;
  const hadTabIndex = heading.hasAttribute('tabindex');
  if (!hadTabIndex) heading.setAttribute('tabindex', '-1');
  heading.focus({ preventScroll: false });
  if (!hadTabIndex) heading.addEventListener('blur', () => heading.removeAttribute('tabindex'), { once: true });
}

function updateReleaseMetadata() {
  const build = window.GringottsCleanRuntime?.BUILD;
  if (build) {
    Object.assign(build, {
      version: V127_RELEASE.version,
      name: V127_RELEASE.name,
      runtime: `${build.runtime || 'v126 runtime'} + v127 interaction policy and surface polish`,
      cacheBust: '127ux1'
    });
  }
  document.title = `Gringotts Budget Vault ${V127_RELEASE.version}`;
  const version = document.querySelector('.version-text');
  if (version) version.textContent = V127_RELEASE.version;
}

function handleRouteReady(event) {
  updateReleaseMetadata();
  enhanceCurrentSurface(document.getElementById('main') || document);
  const route = event.detail?.route || window.GringottsV126?.coordinator?.route || '';
  focusRouteHeading(route);
  announceV127(`${routeLabel(route)} ready`);
}

function handleRouteFailure() {
  enhanceCurrentSurface(document.getElementById('main') || document);
  announceV127('Page enhancements failed. The base page and browser-local data remain available.');
}

function rememberPotentialDialogOpener(event) {
  const control = event.target.closest?.(ACTION_SELECTOR);
  if (!control) return;
  queueMicrotask(() => {
    document.querySelectorAll('dialog[open], [role="dialog"][aria-modal="true"]:not([hidden])').forEach((dialog) => {
      if (!dialogOpeners.has(dialog)) dialogOpeners.set(dialog, control);
      enhanceDialog(dialog);
    });
  });
}

function restoreDialogFocus(event) {
  const dialog = event.target.closest?.('dialog, [role="dialog"]') || event.target;
  const opener = dialogOpeners.get(dialog);
  if (opener?.isConnected) opener.focus({ preventScroll: true });
  dialogOpeners.delete(dialog);
}

function handleActionFeedback(event) {
  const control = event.target.closest?.(ACTION_SELECTOR);
  if (!control || control.matches('[data-tab], [role="tab"]')) return;
  enhanceAction(control);
  const intent = control.dataset.actionIntent;
  if (intent === 'export') announceV127('Preparing the local export');
  else if (intent === 'recovery') announceV127('Recovery action requested');
  else if (intent === 'destructive') announceV127('Review the confirmation before continuing');
}

function rememberRouteFocus(event) {
  const control = event.target.closest?.('[data-tab], [role="tab"]');
  const route = control?.dataset.tab;
  if (control && route) pendingRouteFocus = { route, control };
}

export function installV127UxPolish() {
  if (installed) return window.GringottsV127;
  validateActionPolicy();
  validateRoadmapHorizon();
  installed = true;
  ensureStatusRegion();
  window.addEventListener('click', rememberRouteFocus, true);
  window.addEventListener('click', rememberPotentialDialogOpener, true);
  window.addEventListener('click', handleActionFeedback, true);
  document.addEventListener('close', restoreDialogFocus, true);
  document.addEventListener('cancel', restoreDialogFocus, true);
  document.addEventListener('gringotts:v126-route-ready', handleRouteReady);
  document.addEventListener('gringotts:v126-route-failed', handleRouteFailure);

  Object.assign(window.GringottsV127 || (window.GringottsV127 = {}), {
    release: V127_RELEASE.version,
    name: V127_RELEASE.name,
    featureFreeze: true,
    actionIntents: ACTION_INTENTS,
    roadmap: ROADMAP_HORIZON,
    enhance: enhanceCurrentSurface,
    announce: announceV127,
    snapshot() {
      return {
        release: V127_RELEASE.version,
        actionsClassified: document.querySelectorAll('[data-action-intent]').length,
        tableRegions: document.querySelectorAll('[data-v127-table-region]').length,
        dialogsLabeled: document.querySelectorAll('[data-v127-dialog]').length,
        roadmapReleases: ROADMAP_HORIZON.length,
        observerAdded: false,
        storageWritesAdded: false,
        primaryDestinations: V127_RELEASE.primaryDestinations,
        workbookSheets: V127_RELEASE.workbookSheets
      };
    }
  });

  const start = () => {
    updateReleaseMetadata();
    enhanceCurrentSurface(document);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else queueMicrotask(start);
  return window.GringottsV127;
}
