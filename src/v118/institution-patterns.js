const clean = (value) => String(value ?? '').trim();
const normalize = (value) => clean(value).toLowerCase().normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const PATTERNS = [
  {
    id: 'fictional-card-activity',
    label: 'Card activity with transaction and post dates',
    required: ['transaction date', 'post date', 'description', 'amount'],
    confidence: 'high'
  },
  {
    id: 'fictional-credit-union-ledger',
    label: 'Deposit and withdrawal account ledger',
    required: ['description', 'withdrawal', 'deposit'],
    anyDate: ['date', 'posting date', 'posted date'],
    confidence: 'high'
  },
  {
    id: 'fictional-digital-wallet',
    label: 'Digital wallet activity export',
    required: ['activity date', 'name', 'net amount', 'status', 'transaction id'],
    confidence: 'high'
  }
];

function sourceHeaders(value) {
  if (Array.isArray(value?.headers)) return value.headers;
  if (value?.mapping && typeof value.mapping === 'object') return Object.values(value.mapping).filter(Boolean);
  return [];
}

export function detectInstitutionPattern(value) {
  const headers = new Set(sourceHeaders(value).map(normalize));
  for (const pattern of PATTERNS) {
    const required = pattern.required.every((header) => headers.has(header));
    const dateSatisfied = !pattern.anyDate || pattern.anyDate.some((header) => headers.has(header));
    if (required && dateSatisfied) return { ...pattern, matchedHeaders: [...headers] };
  }
  const schemaLabel = clean(value?.schema?.label || value?.schemaLabel || value?.schemaId || 'Generic export pattern');
  return {
    id: 'generic-export-pattern',
    label: schemaLabel,
    confidence: 'derived',
    matchedHeaders: [...headers]
  };
}

export function institutionPatternCatalog() {
  return PATTERNS.map((pattern) => ({ id: pattern.id, label: pattern.label, confidence: pattern.confidence }));
}
