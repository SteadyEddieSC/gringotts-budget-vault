export const V127_RELEASE = Object.freeze({
  version: 'v127',
  name: 'UX Polish & Simplification',
  featureFreeze: true,
  primaryDestinations: 6,
  workbookSheets: 43
});

export const ACTION_INTENTS = Object.freeze([
  'primary',
  'preview',
  'export',
  'recovery',
  'destructive',
  'cancel',
  'secondary'
]);

const PATTERNS = Object.freeze({
  destructive: /\b(delete|remove|reset|clear|discard|replace|overwrite|purge|forget|reopen)\b/i,
  recovery: /\b(retry|restore|recover|rescue|rollback|undo)\b/i,
  cancel: /\b(cancel|dismiss|never mind|go back)\b/i,
  export: /\b(export|download|print|copy|calendar file|workbook|backup)\b/i,
  preview: /\b(preview|review|compare|check|validate|inspect|diagnostic|dry run)\b/i,
  primary: /\b(save|apply|add|create|update|continue|confirm|finish|close month|import)\b/i
});

export function normalizeActionLabel(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .replace(/[.…]+$/u, '')
    .trim();
}

export function actionDescriptor(input = {}) {
  const label = normalizeActionLabel(input.label);
  const id = normalizeActionLabel(input.id).replace(/[-_]+/g, ' ');
  const name = normalizeActionLabel(input.name).replace(/[-_]+/g, ' ');
  const href = normalizeActionLabel(input.href).replace(/[-_/?=&.]+/g, ' ');
  return [label, id, name, href].filter(Boolean).join(' ');
}

export function classifyAction(input = {}) {
  const descriptor = actionDescriptor(input);
  if (!descriptor) return 'secondary';
  if (PATTERNS.cancel.test(descriptor)) return 'cancel';
  if (PATTERNS.destructive.test(descriptor)) return 'destructive';
  if (PATTERNS.recovery.test(descriptor)) return 'recovery';
  if (PATTERNS.export.test(descriptor)) return 'export';
  if (PATTERNS.preview.test(descriptor)) return 'preview';
  if (PATTERNS.primary.test(descriptor)) return 'primary';
  return 'secondary';
}

export function actionVerb(intent) {
  return ({
    primary: 'Commit',
    preview: 'Review',
    export: 'Export',
    recovery: 'Recover',
    destructive: 'Destructive',
    cancel: 'Cancel',
    secondary: 'Secondary'
  })[intent] || 'Secondary';
}

export function validateActionPolicy() {
  const expected = new Set(ACTION_INTENTS);
  const examples = [
    [{ label: 'Save plan' }, 'primary'],
    [{ label: 'Preview import' }, 'preview'],
    [{ label: 'Download workbook' }, 'export'],
    [{ label: 'Retry route enhancements' }, 'recovery'],
    [{ label: 'Delete profile' }, 'destructive'],
    [{ label: 'Cancel' }, 'cancel'],
    [{ label: 'More details' }, 'secondary']
  ];
  for (const [input, intent] of examples) {
    if (!expected.has(intent) || classifyAction(input) !== intent) {
      throw new Error(`v127 action policy mismatch for ${input.label}`);
    }
  }
  return true;
}
