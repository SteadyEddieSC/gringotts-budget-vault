import './boot-v128.js?v=129base3';
import { installWorkflowReviewIntegration, waitForV126Runtime } from './v129/integration.js?v=129integration1';

const RELEASE = Object.freeze({
  version: 'v129',
  name: 'Household Workflow Evidence Review',
  featureFreeze: true,
  primaryDestinations: 6,
  toolsSections: 5,
  workbookSheets: 43
});

async function start() {
  const runtime = await waitForV126Runtime();
  installWorkflowReviewIntegration({ ...runtime, hostRelease: RELEASE });
}

start();
