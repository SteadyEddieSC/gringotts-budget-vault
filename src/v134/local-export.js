import {
  assertExportPayloadSafe,
  buildExportFilename,
  getExportContract
} from './export-contracts.js?v=134contracts1';

function bodyFor(format, payload, blobRef) {
  if (format === 'json' && !(payload instanceof blobRef)) return `${JSON.stringify(payload, null, 2)}\n`;
  if (payload instanceof blobRef || typeof payload === 'string' || payload instanceof ArrayBuffer || ArrayBuffer.isView(payload)) return payload;
  return String(payload ?? '');
}

export function executeLocalExport({
  id,
  payload,
  filenameContext = {},
  signal,
  documentRef = globalThis.document,
  urlRef = globalThis.URL,
  blobRef = globalThis.Blob,
  setTimeoutRef = globalThis.setTimeout
}) {
  const contract = getExportContract(id);
  const filename = buildExportFilename(id, filenameContext);
  assertExportPayloadSafe(id, payload);
  if (signal?.aborted) return { status:'cancelled', id, filename, dispatched:false };
  if (!documentRef?.body || typeof documentRef.createElement !== 'function') {
    throw new Error(`Local export failed: document is unavailable for ${contract.label}.`);
  }
  if (!urlRef?.createObjectURL || !urlRef?.revokeObjectURL || typeof blobRef !== 'function') {
    throw new Error(`Local export failed: object URL support is unavailable for ${contract.label}.`);
  }

  const blob = payload instanceof blobRef
    ? payload
    : new blobRef([bodyFor(contract.format, payload, blobRef)], { type:contract.mimeType });
  const anchor = documentRef.createElement('a');
  let objectUrl = '';
  try {
    objectUrl = urlRef.createObjectURL(blob);
    anchor.href = objectUrl;
    anchor.download = filename;
    documentRef.body.append(anchor);
    if (signal?.aborted) {
      anchor.remove();
      urlRef.revokeObjectURL(objectUrl);
      return { status:'cancelled', id, filename, dispatched:false };
    }
    anchor.click();
    anchor.remove();
    setTimeoutRef(() => urlRef.revokeObjectURL(objectUrl), 0);
    return { status:'dispatched', id, filename, mimeType:contract.mimeType, dispatched:true };
  } catch (error) {
    anchor.remove();
    if (objectUrl) urlRef.revokeObjectURL(objectUrl);
    const message = error instanceof Error ? error.message : 'Unknown local export failure.';
    throw new Error(`Local export failed for ${contract.label}: ${message}`);
  }
}

if (typeof window !== 'undefined') {
  Object.assign(window.GringottsV134 || (window.GringottsV134 = {}), {
    catalogLoaded:true,
    executorLoaded:true
  });
}
