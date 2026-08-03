import './boot-v128.js?v=130base1';
import { installWorkflowReviewIntegration, waitForV126Runtime } from './v129/integration.js?v=130workflow1';
import { installV130Performance } from './v130/runtime-health.js?v=130hardening1';

const RELEASE = Object.freeze({
  version: 'v130',
  name: 'Performance & Maintenance Hardening',
  featureFreeze: true,
  primaryDestinations: 6,
  toolsSections: 5,
  workbookSheets: 43
});

async function start() {
  const runtime = await waitForV126Runtime();
  installWorkflowReviewIntegration({ ...runtime, hostRelease: RELEASE });
  installV130Performance(runtime);
}

start();
