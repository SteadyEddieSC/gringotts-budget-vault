# v127 — UX Polish & Simplification

## Summary

v127 continues the v126 feature freeze and improves the clarity, feedback, focus behavior, responsive layout, and accessibility of the existing six-destination household-finance workflow.

## Interaction language

- classifies controls as primary, preview, export, recovery, destructive, cancel, or secondary;
- applies a consistent visual hierarchy without changing the underlying financial behavior;
- exposes action intent and verb metadata for protected browser tests and future maintenance;
- keeps navigation tabs outside the action classifier.

## Feedback and focus

- adds one polite, atomic status region;
- announces completed route readiness and requested export, recovery, or destructive-review actions;
- moves focus to the rendered route heading after deliberate primary navigation when focus has not moved elsewhere;
- restores focus to the opener after supported dialog close or cancellation;
- labels supported dialogs from their visible heading.

## Progressive disclosure and responsive behavior

- standardizes existing `details` controls;
- marks advanced diagnostic surfaces without hiding critical recovery boundaries;
- labels keyboard-reachable table regions while retaining native table semantics;
- improves touch targets, mobile action rows, dialog constraints, roadmap layout, focus visibility, and reduced-motion behavior.

## Roadmap

The repository and in-app roadmap now cover ten releases from v127 through v136. v128 is the next planned release. v129–v136 are directional and evidence-gated.

## Preserved boundaries

v127 introduces no:

- new household-finance feature or primary destination;
- second runtime or additional `MutationObserver`;
- browser-local storage domain or write;
- transaction, close-history, goal, debt, scenario, recurring-decision, import-receipt, or cleanup-plan mutation;
- workbook sheet beyond the existing 43-sheet cap;
- analytics endpoint, remote parser, service worker, institution connection, or external financial action.

`gringottsBudgetVault.latest`, stable v105 rescue, guarded import and restore, backup-first broad writes, immutable close history, and the v126 coordinator/dispatcher remain unchanged.

## Validation

Promotion requires the exact final head to pass parser/static checks, browser-free policy and roadmap contracts, Chromium, Firefox, desktop WebKit, Android Chromium, iPad WebKit, iPhone WebKit, keyboard and visual contracts, axe, Lighthouse, public-repository security, supply-chain checks, CodeQL, Cloudflare preview, and unresolved-thread verification.
