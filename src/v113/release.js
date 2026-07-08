import { BUILD } from '../v103/core.js';

export function activateV113() {
  Object.assign(BUILD, {
    version: 'v113',
    name: 'Household Insights IV',
    runtime: 'src/runtime-v111-reporting.js + src/v113',
    cacheBust: '113insights1'
  });
  if (window.GringottsCleanRuntime?.BUILD) Object.assign(window.GringottsCleanRuntime.BUILD, BUILD);
  return BUILD;
}
