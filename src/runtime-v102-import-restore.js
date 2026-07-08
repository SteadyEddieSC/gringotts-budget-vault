(function () {
  'use strict';

  const BUILD = {
    version: 'v102',
    name: 'Import Restore Gate',
    storageKey: 'gringottsBudgetVault.latest',
    runtime: 'src/runtime-v102-import-restore.js',
    cacheBust: '102import1'
  };
  const RULE_KEY = 'gringottsRulesIII.preview.v1';
  const CASHFLOW_KEY = 'gringottsCashflowManual.v1';
  const MONTH_KEY = 'gringottsCleanMonth.v1';

  let active = 'dashboard';
  let search = '';
  let selectedMonth = localStorage.getItem(MONTH_KEY) || '';
  let importCandidate = null;
  let importPreview = null;
  let importError = '';
  let importAcknowledged = false;

  const roadmap = [
    ['v103', 'Household Handoff', 'spouse-device setup and restore checklist'],
    ['v104', 'Goals and Sinking Funds', 'large purchase and family goal tracking'],
    ['v105', 'Release Hardening', 'formal smoke tests and rollback notes'],
    ['v106', 'Budget Reports II', 'cleaner category, merchant, cash-flow, and trend reports'],
    ['v107', 'Rules + Export Bridge', 'connect review exports to future rule history'],
    ['v108', 'Mobile Polish II', 'tighten small-screen spacing and downloads'],
    ['v109', 'Calendar Prep II', 'calendar preview refinement and recurring options'],
    ['v110', 'Rule Review Reports', 'family-safe before/after category reports'],
    ['v111', 'Rules Safe Write Study', 'design final guarded edit flow with undo before enabling writes']
  ];

  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
  const num = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
  const money = (value) => num(value).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
  const stamp = () => new Date().toISOString().replace(/[:.]/g, '-');
  const uid = (prefix) => prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);

  function toast(message) {
    let node = $('toast');
    if (!node) {
      node = document.createElement('div');
      node.id = 'toast';
      node.className = 'toast';
      document.body.appendChild(node);
    }
    node.textContent = message;
    node.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => node.classList.remove('show'), 2400);
  }

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function keys() {
    try {
      return Object.keys(localStorage).sort();
    } catch (error) {
      return [];
    }
  }

  function vaults() {
    return keys()
      .filter((key) => key.startsWith('gringottsBudgetVault.') && key !== 'gringottsBudgetVault.meta')
      .map((key) => {
        try {
          const raw = localStorage.getItem(key) || '';
          const obj = JSON.parse(raw);
          const transactions = Array.isArray(obj.transactions) ? obj.transactions.length : 0;
          const last = Date.parse(obj.lastSavedAt || obj.restoredAt || obj.updatedAt || obj.createdAt || 0) || 0;
          return { key, obj, bytes: raw.length, transactions, last, status: 'readable' };
        } catch (error) {
          return { key, obj: null, bytes: 0, transactions: 0, last: 0, status: 'error' };
        }
      })
      .sort((a, b) => b.transactions - a.transactions || b.last - a.last);
  }

  function best() {
    return vaults()[0] || null;
  }

  function state() {
    const candidate = best();
    if (candidate && candidate.obj) {
      return {
        ...candidate.obj,
        transactions: Array.isArray(candidate.obj.transactions) ? candidate.obj.transactions : [],
        _activeKey: candidate.key
      };
    }
    return { transactions: [], _activeKey: 'none' };
  }

  function txs() {
    return state().transactions || [];
  }

  function dte(transaction) {
    return String(
      transaction.date ||
      transaction.posted_datetime ||
      transaction.authorized_date ||
      transaction.datetime ||
      ''
    ).slice(0, 10);
  }

  function name(transaction) {
    return transaction.merchant || transaction.merchant_name || transaction.name || transaction.description || 'Unknown';
  }

  function cat(transaction) {
    return transaction.category || transaction.personal_finance_category_primary || transaction.primaryCategory || 'Other';
  }

  function acct(transaction) {
    return transaction.account || transaction.accountName || transaction.account_name || transaction.official_name || transaction.account_id || '';
  }

  function text(transaction) {
    return [name(transaction), cat(transaction), acct(transaction), transaction.description, transaction.category_detailed]
      .join(' ')
      .toLowerCase();
  }

  function monthOf(transaction) {
    const date = dte(transaction);
    return date && date.length >= 7 ? date.slice(0, 7) : '';
  }

  function months() {
    return [...new Set(txs().map(monthOf).filter(Boolean))].sort();
  }

  function ensureMonth() {
    const available = months();
    if (!selectedMonth || !available.includes(selectedMonth)) {
      selectedMonth = available[available.length - 1] || new Date().toISOString().slice(0, 7);
    }
    localStorage.setItem(MONTH_KEY, selectedMonth);
    return selectedMonth;
  }

  function metrics(yearMonth) {
    let income = 0;
    let spend = 0;
    let count = 0;
    txs().forEach((transaction) => {
      if (monthOf(transaction) !== yearMonth) return;
      count += 1;
      const amount = num(transaction.amount);
      if (amount < 0) income += Math.abs(amount);
      else spend += Math.abs(amount);
    });
    return { income, spend, net: income - spend, count };
  }

  function download(nameValue, body, type) {
    const anchor = document.createElement('a');
    const blob = new Blob([body], { type: type || 'application/json' });
    anchor.href = URL.createObjectURL(blob);
    anchor.download = nameValue;
    document.body.appendChild(anchor);
    anchor.click();
    setTimeout(() => {
      URL.revokeObjectURL(anchor.href);
      anchor.remove();
    }, 0);
  }

  function downloadJson(nameValue, object) {
    download(nameValue, JSON.stringify(object, null, 2), 'application/json');
  }

  function backup() {
    const candidate = best();
    if (!candidate || !candidate.obj || candidate.transactions < 1) {
      toast('No populated readable vault is available to back up');
      return false;
    }
    downloadJson('Gringotts_v102_backup_' + candidate.transactions + '_' + stamp() + '.json', candidate.obj);
    toast('Current vault backup downloaded');
    return true;
  }

  function ruleData() {
    const stored = read(RULE_KEY, { rules: [], createdAt: new Date().toISOString() });
    let rules = Array.isArray(stored.rules) ? stored.rules : [];
    rules = rules
      .map((rule, index) => ({
        ...rule,
        priority: Number.isFinite(Number(rule.priority)) ? Number(rule.priority) : index + 1
      }))
      .sort((a, b) => a.priority - b.priority);
    return {
      rules,
      createdAt: stored.createdAt || new Date().toISOString(),
      updatedAt: stored.updatedAt || ''
    };
  }

  function saveRules(data) {
    save(RULE_KEY, {
      rules: (data.rules || []).map((rule, index) => ({ ...rule, priority: index + 1 })),
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  function enabledRules() {
    return ruleData().rules.filter((rule) => rule.on !== false && String(rule.find || '').trim() && String(rule.to || '').trim());
  }

  function hay(rule, transaction) {
    return (
      rule.scope === 'name' ? name(transaction) :
      rule.scope === 'current' ? cat(transaction) :
      rule.scope === 'account' ? acct(transaction) :
      text(transaction)
    ).toLowerCase();
  }

  function isHit(rule, transaction) {
    return hay(rule, transaction).includes(String(rule.find || '').toLowerCase());
  }

  function matchesFor(transaction) {
    return enabledRules().filter((rule) => isHit(rule, transaction));
  }

  function suggestions() {
    const output = [];
    txs().forEach((transaction, row) => {
      const matches = matchesFor(transaction);
      if (!matches.length) return;
      const chosen = matches[0];
      const from = cat(transaction);
      const to = chosen.to;
      if (from === to && matches.length === 1) return;
      output.push({
        row,
        date: dte(transaction),
        name: name(transaction),
        amount: num(transaction.amount),
        from,
        to,
        chosenRule: chosen.label || chosen.find,
        matchCount: matches.length,
        allMatches: matches.map((rule) => ({ id: rule.id, label: rule.label || rule.find, to: rule.to, priority: rule.priority }))
      });
    });
    return output;
  }

  function conflicts() {
    return suggestions().filter((item) => item.matchCount > 1);
  }

  function reviewPackage() {
    return {
      generatedAt: new Date().toISOString(),
      runtime: BUILD,
      vault: { key: best()?.key || 'none', transactions: txs().length },
      rules: { count: ruleData().rules.length, enabled: enabledRules().length },
      summary: { suggestions: suggestions().length, conflicts: conflicts().length },
      conflicts: conflicts(),
      suggestions: suggestions(),
      boundary: 'v102 preserves the v101 rules preview and conflict review. It does not edit transaction rows.'
    };
  }

  function addRule() {
    const find = $('findText').value.trim();
    const to = $('toText').value.trim();
    const label = $('labelText').value.trim();
    const scope = $('scopeText').value;
    if (!find || !to) {
      toast('Find text and suggested category are required');
      return;
    }
    const data = ruleData();
    data.rules.push({
      id: uid('r'),
      label: label || find + ' -> ' + to,
      find,
      to,
      scope,
      on: true,
      createdAt: new Date().toISOString(),
      priority: data.rules.length + 1
    });
    saveRules(data);
    toast('Rule saved');
    render();
  }

  function deleteRule(id) {
    const data = ruleData();
    data.rules = data.rules.filter((rule) => rule.id !== id);
    saveRules(data);
    render();
  }

  function toggleRule(id) {
    const data = ruleData();
    data.rules = data.rules.map((rule) => rule.id === id ? { ...rule, on: rule.on === false } : rule);
    saveRules(data);
    render();
  }

  function moveRule(id, direction) {
    const data = ruleData();
    const index = data.rules.findIndex((rule) => rule.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= data.rules.length) return;
    const item = data.rules[index];
    data.rules[index] = data.rules[target];
    data.rules[target] = item;
    saveRules(data);
    render();
  }

  function cashflow() {
    return read(CASHFLOW_KEY, { bills: [], paydays: [] });
  }

  function saveCashflow(value) {
    save(CASHFLOW_KEY, value);
  }

  function addBill() {
    const data = cashflow();
    const billName = $('billName').value.trim();
    const date = $('billDate').value;
    if (!billName || !date) {
      toast('Bill name and date are required');
      return;
    }
    data.bills.unshift({ id: uid('b'), name: billName, amount: num($('billAmount').value), dueDate: date });
    saveCashflow(data);
    render();
  }

  function addPayday() {
    const data = cashflow();
    const paydayName = $('payName').value.trim();
    const date = $('payDate').value;
    if (!paydayName || !date) {
      toast('Payday name and date are required');
      return;
    }
    data.paydays.unshift({ id: uid('p'), name: paydayName, amount: num($('payAmount').value), date });
    saveCashflow(data);
    render();
  }

  function calendarEvents() {
    const data = cashflow();
    const output = [];
    (data.bills || []).forEach((item) => {
      if (item.dueDate) output.push({ type: 'bill', date: item.dueDate, title: item.name, amount: item.amount });
    });
    (data.paydays || []).forEach((item) => {
      if (item.date) output.push({ type: 'payday', date: item.date, title: item.name, amount: item.amount });
    });
    return output.sort((a, b) => a.date.localeCompare(b.date));
  }

  function ics() {
    const crlf = '\r\n';
    const generated = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Gringotts//v102//EN',
      ...calendarEvents().flatMap((event, index) => [
        'BEGIN:VEVENT',
        'UID:v102-' + index + '@gringotts',
        'DTSTAMP:' + generated,
        'DTSTART;VALUE=DATE:' + event.date.replaceAll('-', ''),
        'SUMMARY:' + String(event.title).replace(/[;,]/g, ' '),
        'DESCRIPTION:' + event.type + ' ' + money(event.amount),
        'END:VEVENT'
      ]),
      'END:VCALENDAR'
    ].join(crlf);
  }

  function sourceLabel(vault) {
    if (!vault || vault.source == null) return 'Not provided';
    if (typeof vault.source === 'string') return vault.source;
    if (typeof vault.source === 'object') {
      return vault.source.fileName || vault.source.institution || vault.source.version || vault.source.schema || 'Metadata object present';
    }
    return String(vault.source);
  }

  function previewVaultObject(vault, fileName) {
    if (!vault || typeof vault !== 'object' || Array.isArray(vault)) {
      throw new Error('The selected JSON must contain a Gringotts vault object.');
    }
    if (!Array.isArray(vault.transactions)) {
      throw new Error('The selected vault does not contain a transactions array.');
    }
    if (vault.transactions.length < 1) {
      throw new Error('Restore blocked: the selected vault contains zero transactions.');
    }
    const dates = vault.transactions.map(dte).filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value)).sort();
    return {
      fileName: fileName || 'Selected JSON file',
      transactionCount: vault.transactions.length,
      earliestDate: dates[0] || 'Not available',
      latestDate: dates[dates.length - 1] || 'Not available',
      source: sourceLabel(vault),
      version: vault.version || vault.appVersion || vault.schemaVersion || 'Not provided',
      declaredStorageKey: vault.storageKey || 'Not provided',
      destinationKey: BUILD.storageKey
    };
  }

  async function selectRestoreFile(file) {
    importCandidate = null;
    importPreview = null;
    importError = '';
    importAcknowledged = false;
    if (!file) {
      render();
      return;
    }
    try {
      const raw = await file.text();
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (error) {
        throw new Error('Malformed JSON: the selected file could not be parsed.');
      }
      const preview = previewVaultObject(parsed, file.name);
      importCandidate = parsed;
      importPreview = preview;
      toast('Valid local vault preview ready');
    } catch (error) {
      importError = error && error.message ? error.message : 'The selected file could not be validated.';
      toast(importError);
    }
    render();
  }

  function restoreVault() {
    if (!importCandidate || !importPreview || importPreview.transactionCount < 1) {
      toast('Select and preview a valid populated vault first');
      return;
    }
    if (!importAcknowledged) {
      toast('Acknowledge the backup and preview gate first');
      return;
    }

    const current = best();
    const currentMessage = current && current.transactions > 0
      ? 'This will replace the data stored at ' + BUILD.storageKey + '. The best current vault contains ' + current.transactions + ' transactions.'
      : 'No populated current vault was detected, but the destination key will still be written.';
    const confirmed = window.confirm(
      'Confirm Gringotts vault restore\n\n' +
      currentMessage + '\n\n' +
      'Selected file: ' + importPreview.fileName + '\n' +
      'Transactions: ' + importPreview.transactionCount + '\n' +
      'Date range: ' + importPreview.earliestDate + ' through ' + importPreview.latestDate + '\n' +
      'Destination: ' + BUILD.storageKey + '\n\n' +
      'This action does not upload the file. Continue?'
    );
    if (!confirmed) {
      toast('Restore canceled; no vault data changed');
      return;
    }

    const now = new Date().toISOString();
    const restored = {
      ...importCandidate,
      transactions: importCandidate.transactions,
      storageKey: BUILD.storageKey,
      restoredAt: now,
      lastSavedAt: now
    };

    if (!Array.isArray(restored.transactions) || restored.transactions.length < 1) {
      toast('Restore blocked because the prepared vault is empty');
      return;
    }

    try {
      localStorage.setItem(BUILD.storageKey, JSON.stringify(restored));
      const verify = JSON.parse(localStorage.getItem(BUILD.storageKey) || 'null');
      if (!verify || !Array.isArray(verify.transactions) || verify.transactions.length !== restored.transactions.length) {
        throw new Error('Restore verification failed.');
      }
      toast('Restore verified. Reloading Gringotts Budget Vault…');
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      toast(error && error.message ? error.message : 'Restore failed; the app was not reloaded');
    }
  }

  function shellProof() {
    const loaded = window.GringottsCleanRuntime?.BUILD?.runtime || BUILD.runtime;
    return { title: document.title, expected: BUILD.runtime, loaded, ok: loaded === BUILD.runtime };
  }

  function debugReport() {
    return {
      runtime: BUILD,
      shellProof: shellProof(),
      vault: {
        key: best()?.key || 'none',
        transactions: txs().length,
        candidates: vaults().map((item) => ({ key: item.key, transactions: item.transactions, status: item.status }))
      },
      rules: {
        count: ruleData().rules.length,
        enabled: enabledRules().length,
        suggestions: suggestions().length,
        conflicts: conflicts().length
      },
      privacy: 'Local browser storage only. Import files are parsed locally and are never uploaded by this runtime.'
    };
  }

  async function serviceWorkerStatus() {
    let registrations = 0;
    let controller = false;
    try {
      if ('serviceWorker' in navigator) registrations = (await navigator.serviceWorker.getRegistrations()).length;
      controller = Boolean(navigator.serviceWorker?.controller);
    } catch (error) {
      // Diagnostics only; no registration or cache behavior is added.
    }
    return { registrations, controller };
  }

  function dashboardView() {
    const month = ensureMonth();
    const monthMetrics = metrics(month);
    const candidate = best();
    return `
      <section class="section active">
        <div class="section-title-row"><div><h2>Vault Dashboard</h2><p>v102 adds a guarded, local-only restore workflow while preserving rules review and planning.</p></div><span class="pill">${esc(month)}</span></div>
        <div class="kpi-grid">
          <article class="kpi"><strong>${txs().length}</strong><span>Transactions</span></article>
          <article class="kpi"><strong>${money(monthMetrics.income)}</strong><span>Monthly income</span></article>
          <article class="kpi"><strong>${money(monthMetrics.spend)}</strong><span>Monthly spending</span></article>
          <article class="kpi"><strong>${money(monthMetrics.net)}</strong><span>Monthly net</span></article>
        </div>
        <div class="grid two">
          <article class="card"><h3>Runtime proof</h3><div class="summary-box">Loaded runtime: ${esc(BUILD.runtime)}\nBest vault: ${esc(candidate?.key || 'none')}\nBest-vault transactions: ${candidate?.transactions || 0}\nDestination key: ${esc(BUILD.storageKey)}</div></article>
          <article class="card"><h3>Safe restore status</h3><p>Import files stay in this browser. A populated transaction array, preview, acknowledgment, and explicit confirmation are required before restore.</p><div class="button-row"><button class="btn primary" id="openImport">Open Import / Restore</button><button class="btn secondary" id="dashboardBackup">Download Backup</button></div></article>
        </div>
      </section>`;
  }

  function ledgerView() {
    const query = search.toLowerCase();
    const rows = txs().filter((transaction) => !query || [dte(transaction), name(transaction), cat(transaction), acct(transaction), String(transaction.amount)].join(' ').toLowerCase().includes(query)).slice(0, 500);
    return `
      <section class="section active">
        <div class="section-title-row"><div><h2>Ledger</h2><p>Showing up to 500 matching rows from the best-populated local vault.</p></div><span class="pill">${rows.length} shown</span></div>
        <input id="q" class="search" placeholder="Search date, merchant, category, or account" value="${esc(search)}">
        <div class="table-wrap"><table class="ledger"><thead><tr><th>Date</th><th>Name</th><th>Account</th><th>Category</th><th>Amount</th></tr></thead><tbody>${rows.map((transaction) => `<tr><td>${esc(dte(transaction))}</td><td>${esc(name(transaction))}</td><td>${esc(acct(transaction))}</td><td>${esc(cat(transaction))}</td><td class="${num(transaction.amount) < 0 ? 'amount-income' : 'amount-outflow'}">${money(transaction.amount)}</td></tr>`).join('')}</tbody></table></div>
      </section>`;
  }

  function planningView() {
    const data = cashflow();
    return `
      <section class="section active">
        <div class="section-title-row"><div><h2>Planning</h2><p>Keep bills and paydays in separate local planning storage.</p></div><span class="pill">${(data.bills || []).length + (data.paydays || []).length} dates</span></div>
        <article class="card"><h3>Add bill or payday</h3><div class="grid two"><div><input id="billName" placeholder="Bill name"><input id="billAmount" type="number" step="0.01" placeholder="Amount"><input id="billDate" type="date"><button id="addBill" class="btn primary">Add bill</button></div><div><input id="payName" placeholder="Payday name"><input id="payAmount" type="number" step="0.01" placeholder="Amount"><input id="payDate" type="date"><button id="addPay" class="btn primary">Add payday</button></div></div></article>
        <article class="card"><h3>Saved planning dates</h3><div class="list">${[
          ...(data.bills || []).map((item) => ({ label: 'Bill', name: item.name, date: item.dueDate, amount: item.amount })),
          ...(data.paydays || []).map((item) => ({ label: 'Payday', name: item.name, date: item.date, amount: item.amount }))
        ].sort((a, b) => String(a.date).localeCompare(String(b.date))).map((item) => `<div class="list-item"><span><strong>${esc(item.label)}: ${esc(item.name)}</strong><br><small>${esc(item.date)}</small></span><span>${money(item.amount)}</span></div>`).join('') || '<p>No saved planning dates.</p>'}</div></article>
      </section>`;
  }

  function rulesView() {
    const data = ruleData();
    const proposed = suggestions();
    const collisionRows = conflicts();
    return `
      <section class="section active">
        <div class="section-title-row"><div><h2>Rules IV Review</h2><p>Priority, preview, and conflict review remain read-only for transaction rows.</p></div><span class="pill">${collisionRows.length} conflicts</span></div>
        <article class="card"><h3>Add rule</h3><input id="labelText" placeholder="Label"><input id="findText" placeholder="Find text"><input id="toText" placeholder="Suggested category"><select id="scopeText"><option value="all">All text</option><option value="name">Name only</option><option value="current">Current category</option><option value="account">Account</option></select><button id="addRule" class="btn primary">Save rule</button></article>
        <article class="card"><h3>Rules priority</h3><div class="list">${data.rules.map((rule) => `<div class="list-item"><span><strong>${esc(rule.priority)}. ${esc(rule.label)}</strong><br><small>${esc(rule.find)} → ${esc(rule.to)} • ${rule.on === false ? 'off' : 'on'}</small></span><span><button class="btn secondary" data-up="${esc(rule.id)}">Up</button><button class="btn secondary" data-down="${esc(rule.id)}">Down</button><button class="btn secondary" data-toggle="${esc(rule.id)}">Toggle</button><button class="btn danger" data-del="${esc(rule.id)}">Delete</button></span></div>`).join('') || '<p>No rules yet.</p>'}</div></article>
        <article class="card"><h3>Conflict review</h3><div class="button-row"><button id="exportReview" class="btn primary">Download review package</button><button id="backupRules" class="btn secondary">Download full backup</button></div><p>${proposed.length} suggestions and ${collisionRows.length} conflicts. Transaction rows are not edited.</p><div class="table-wrap"><table class="ledger"><thead><tr><th>Date</th><th>Name</th><th>From</th><th>Chosen</th><th>Matches</th></tr></thead><tbody>${proposed.slice(0, 120).map((item) => `<tr><td>${esc(item.date)}</td><td>${esc(item.name)}</td><td>${esc(item.from)}</td><td>${esc(item.to)}</td><td>${item.matchCount}</td></tr>`).join('')}</tbody></table></div></article>
      </section>`;
  }

  function calendarView() {
    const events = calendarEvents();
    return `
      <section class="section active">
        <div class="section-title-row"><div><h2>Calendar</h2><p>Export locally saved bills and paydays as an ICS calendar file.</p></div><span class="pill">${events.length} events</span></div>
        <article class="card"><div class="button-row"><button id="downloadIcs" class="btn primary">Download ICS</button><button id="copyIcs" class="btn secondary">Copy ICS</button></div></article>
        <article class="card"><h3>Upcoming saved dates</h3><div class="list">${events.map((event) => `<div class="list-item"><span><strong>${esc(event.title)}</strong><br><small>${esc(event.type)} • ${esc(event.date)}</small></span><span>${money(event.amount)}</span></div>`).join('') || '<p>No bills or paydays have been added.</p>'}</div></article>
      </section>`;
  }

  function importRestoreView() {
    const current = best();
    const valid = Boolean(importCandidate && importPreview && importPreview.transactionCount > 0);
    return `
      <section class="section active">
        <div class="section-title-row"><div><h2>Import / Restore</h2><p>Select a Gringotts-compatible JSON vault. The file is parsed locally and is never uploaded.</p></div><span class="pill">Local-only</span></div>
        <article class="card warning-card"><h3>Backup first</h3><p><strong>Strong warning:</strong> download the current populated vault before restoring whenever a backup is available. Restore writes only to <code>${esc(BUILD.storageKey)}</code> and never silently overwrites populated data.</p><div class="summary-box compact">Current best vault: ${esc(current?.key || 'none')}\nCurrent transactions: ${current?.transactions || 0}\nRestore destination: ${esc(BUILD.storageKey)}</div><div class="button-row"><button id="importBackup" class="btn primary">Download Current Backup</button></div></article>
        <article class="card"><h3>1. Choose local JSON file</h3><label class="file-drop" for="restoreFile"><span><strong>Choose Gringotts JSON vault</strong><br>Nothing is uploaded or transmitted.</span><input id="restoreFile" type="file" accept="application/json,.json"></label>${importError ? `<div class="error-box" role="alert">${esc(importError)}</div>` : ''}</article>
        <article class="card"><h3>2. Review restore preview</h3>${valid ? `<div class="grid two"><div class="summary-box compact">File: ${esc(importPreview.fileName)}\nTransactions: ${importPreview.transactionCount}\nEarliest date: ${esc(importPreview.earliestDate)}\nLatest date: ${esc(importPreview.latestDate)}</div><div class="summary-box compact">Source: ${esc(importPreview.source)}\nVersion: ${esc(importPreview.version)}\nDeclared key: ${esc(importPreview.declaredStorageKey)}\nDestination key: ${esc(importPreview.destinationKey)}</div></div>` : '<p>No valid populated vault has been previewed.</p>'}</article>
        <article class="card"><h3>3. Acknowledge and restore</h3><label class="ack-row"><input id="restoreAck" type="checkbox" ${importAcknowledged ? 'checked' : ''} ${valid ? '' : 'disabled'}><span>I downloaded a current backup and reviewed the restore preview.</span></label><p class="muted-note">Checking this box also confirms that you intentionally accept proceeding if you chose to skip the backup.</p><button id="restoreVault" class="btn danger restore-button" ${valid && importAcknowledged ? '' : 'disabled'}>Confirm Restore to ${esc(BUILD.storageKey)}</button></article>
      </section>`;
  }

  function exportsView() {
    return `
      <section class="section active">
        <div class="section-title-row"><div><h2>Exports</h2><p>Every export is a separate user-triggered local download.</p></div><span class="pill">No uploads</span></div>
        <div class="grid two">
          <article class="card"><h3>Full vault backup</h3><p>Download the complete best-populated vault as JSON.</p><button id="exportBackup" class="btn primary">Download full backup</button></article>
          <article class="card"><h3>Rules review package</h3><p>Download suggestions and conflicts without editing transactions.</p><button id="exportRules" class="btn secondary">Download review package</button></article>
          <article class="card"><h3>Calendar ICS</h3><p>Download locally saved bills and paydays.</p><button id="exportIcs" class="btn secondary">Download calendar</button></article>
          <article class="card"><h3>Diagnostics report</h3><p>Download runtime and storage-key proof without transaction rows.</p><button id="exportDebug" class="btn secondary">Download diagnostics</button></article>
        </div>
      </section>`;
  }

  async function diagnosticsView() {
    const status = await serviceWorkerStatus();
    const candidate = best();
    return `
      <section class="section active">
        <div class="section-title-row"><div><h2>Diagnostics</h2><p>Runtime proof, best-vault selection, and local-only status.</p></div><span class="pill">${shellProof().ok ? 'Runtime verified' : 'Check runtime'}</span></div>
        <article class="card"><div class="summary-box">Release: ${esc(BUILD.version + ' ' + BUILD.name)}\nLoaded runtime: ${esc(BUILD.runtime)}\nExpected runtime: ${esc(BUILD.runtime)}\nRuntime match: ${shellProof().ok ? 'yes' : 'no'}\nBest vault: ${esc(candidate?.key || 'none')}\nTransactions: ${candidate?.transactions || 0}\nVault candidates: ${vaults().length}\nRestore destination: ${esc(BUILD.storageKey)}\nService worker registrations: ${status.registrations}\nService worker controller: ${status.controller ? 'yes' : 'no'}\nImport handling: local browser only\nOffline cache added: no</div><div class="button-row"><button id="copyDebug" class="btn secondary">Copy debug</button><button id="downloadDebug" class="btn secondary">Download debug</button></div></article>
      </section>`;
  }

  function roadmapView() {
    return `
      <section class="section active">
        <div class="section-title-row"><div><h2>Roadmap</h2><p>Planned releases after the v102 Import Restore Gate.</p></div><span class="pill">v103+</span></div>
        <div class="roadmap">${roadmap.map((item) => `<article class="roadmap-item"><h3>${esc(item[0])} — ${esc(item[1])}</h3><p>${esc(item[2])}</p></article>`).join('')}</div>
      </section>`;
  }

  function viewForActive() {
    if (active === 'dashboard') return dashboardView();
    if (active === 'ledger') return ledgerView();
    if (active === 'planning') return planningView();
    if (active === 'rules') return rulesView();
    if (active === 'calendar') return calendarView();
    if (active === 'import') return importRestoreView();
    if (active === 'exports') return exportsView();
    if (active === 'roadmap') return roadmapView();
    return '';
  }

  function installRuntimeStyles() {
    if ($('gringotts-v102-styles')) return;
    const style = document.createElement('style');
    style.id = 'gringotts-v102-styles';
    style.textContent = `
      .input{width:100%;box-sizing:border-box;border:1px solid var(--line,#334155);border-radius:12px;background:#0b1220;color:#fff;padding:.72rem;margin:.35rem 0 .8rem}
      .compact{min-height:0}.warning-card{border-color:#a16207;background:linear-gradient(180deg,rgba(95,57,12,.55),rgba(15,23,42,.96))}
      .error-box{border:1px solid #fb7185;background:rgba(127,29,29,.28);color:#fecdd3;border-radius:14px;padding:1rem}
      .ack-row{display:flex!important;grid-template-columns:auto 1fr!important;align-items:flex-start;gap:.75rem;color:var(--text)!important;margin:1rem 0}
      .ack-row input{width:auto;margin-top:.25rem;accent-color:var(--gold)}.muted-note{color:var(--muted)}
      .restore-button{width:100%;margin-top:.5rem}.btn:disabled,input:disabled{opacity:.45;cursor:not-allowed}.button-row .btn{flex:1 1 160px}
      .grid.four{grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}
    `;
    document.head.appendChild(style);
  }

  function shell() {
    return `
      <a class="skip-link" href="#main">Skip to content</a>
      <div class="app-shell">
        <header class="topbar">
          <div class="brand"><div class="crest" aria-hidden="true">G</div><div><h1>Gringotts Budget Vault</h1><p><strong>Mischief Managed. Money Manged</strong></p></div></div>
          <div class="topbar-actions"><button id="topBackup" class="btn secondary">Download Backup</button><span class="pill">${esc(BUILD.version)}</span></div>
        </header>
        <nav class="tabs" aria-label="Primary">
          ${[
            ['dashboard', 'Dashboard'], ['ledger', 'Ledger'], ['planning', 'Planning'], ['rules', 'Rules'],
            ['calendar', 'Calendar'], ['import', 'Import / Restore'], ['exports', 'Exports'],
            ['diagnostics', 'Diagnostics'], ['roadmap', 'Roadmap']
          ].map(([id, label]) => `<button class="tab ${active === id ? 'active' : ''}" data-tab="${id}">${label}</button>`).join('')}
        </nav>
        <main id="main"></main>
      </div>
      <div id="toast" class="toast" role="status" aria-live="polite"></div>`;
  }

  function bindCommon() {
    document.querySelectorAll('[data-tab]').forEach((button) => {
      button.addEventListener('click', () => {
        active = button.dataset.tab;
        render();
      });
    });
    $('topBackup')?.addEventListener('click', backup);
  }

  function bindView() {
    $('openImport')?.addEventListener('click', () => { active = 'import'; render(); });
    $('dashboardBackup')?.addEventListener('click', backup);
    $('q')?.addEventListener('input', (event) => { search = event.target.value; render(); });
    $('addBill')?.addEventListener('click', addBill);
    $('addPay')?.addEventListener('click', addPayday);
    $('addRule')?.addEventListener('click', addRule);
    document.querySelectorAll('[data-up]').forEach((button) => button.addEventListener('click', () => moveRule(button.dataset.up, -1)));
    document.querySelectorAll('[data-down]').forEach((button) => button.addEventListener('click', () => moveRule(button.dataset.down, 1)));
    document.querySelectorAll('[data-toggle]').forEach((button) => button.addEventListener('click', () => toggleRule(button.dataset.toggle)));
    document.querySelectorAll('[data-del]').forEach((button) => button.addEventListener('click', () => deleteRule(button.dataset.del)));
    $('exportReview')?.addEventListener('click', () => downloadJson('Gringotts_v102_rules_review_' + stamp() + '.json', reviewPackage()));
    $('backupRules')?.addEventListener('click', backup);
    $('downloadIcs')?.addEventListener('click', () => download('Gringotts_v102_calendar_' + stamp() + '.ics', ics(), 'text/calendar'));
    $('copyIcs')?.addEventListener('click', async () => { await navigator.clipboard.writeText(ics()); toast('ICS copied'); });
    $('importBackup')?.addEventListener('click', backup);
    $('restoreFile')?.addEventListener('change', (event) => selectRestoreFile(event.target.files?.[0]));
    $('restoreAck')?.addEventListener('change', (event) => { importAcknowledged = event.target.checked; const button = $('restoreVault'); if (button) button.disabled = !(importCandidate && importPreview && importAcknowledged); });
    $('restoreVault')?.addEventListener('click', restoreVault);
    $('exportBackup')?.addEventListener('click', backup);
    $('exportRules')?.addEventListener('click', () => downloadJson('Gringotts_v102_rules_review_' + stamp() + '.json', reviewPackage()));
    $('exportIcs')?.addEventListener('click', () => download('Gringotts_v102_calendar_' + stamp() + '.ics', ics(), 'text/calendar'));
    $('exportDebug')?.addEventListener('click', () => downloadJson('Gringotts_v102_diagnostics_' + stamp() + '.json', debugReport()));
    $('copyDebug')?.addEventListener('click', async () => { await navigator.clipboard.writeText(JSON.stringify(debugReport(), null, 2)); toast('Diagnostics copied'); });
    $('downloadDebug')?.addEventListener('click', () => downloadJson('Gringotts_v102_diagnostics_' + stamp() + '.json', debugReport()));
  }

  async function render() {
    installRuntimeStyles();
    document.title = 'Gringotts Budget Vault v102';
    document.body.innerHTML = shell();
    bindCommon();
    const main = $('main');
    main.innerHTML = active === 'diagnostics' ? await diagnosticsView() : viewForActive();
    bindView();
  }

  window.GringottsCleanRuntime = {
    BUILD,
    vaults,
    best,
    previewVaultObject,
    debugReport
  };

  render();
})();
