import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../src/boot-v126.js',import.meta.url),'utf8');

test('keeps base route replay bounded, observable, and fail-closed', () => {
  assert.match(source,/const MAX_BASE_ROUTE_REPLAYS = 2;/);
  assert.match(source,/for \(let attempt = 1; attempt <= MAX_BASE_ROUTE_REPLAYS; attempt \+= 1\)/);
  assert.match(source,/routeReplayRecoveries \+= 1/);
  assert.match(source,/lastRouteReplayAttempts/);
  assert.match(source,/maxBaseRouteReplays: MAX_BASE_ROUTE_REPLAYS/);
  assert.match(source,/after \$\{MAX_BASE_ROUTE_REPLAYS\} bounded attempts/);
  assert.doesNotMatch(source,/while\s*\(true\)|setInterval\s*\(|location\.reload\s*\(\).*replayRoute/);
});

test('route replay hardening adds no data, network, observer, or service-worker authority', () => {
  const replay = source.slice(source.indexOf('function publishRouteReplay'),source.indexOf('async function navigatePrimaryRoute'));
  assert.doesNotMatch(replay,/localStorage|sessionStorage|indexedDB|document\.cookie/);
  assert.doesNotMatch(replay,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource/);
  assert.doesNotMatch(replay,/new MutationObserver|serviceWorker|CacheStorage|caches\./);
  assert.doesNotMatch(replay,/removeItem|deleteDatabase|\.clear\s*\(/);
});
