const ACTION_TYPES = new Set(['click', 'change', 'input']);

function setGlobalObserver(value) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'MutationObserver');
  try {
    Object.defineProperty(globalThis, 'MutationObserver', {
      configurable: true,
      writable: true,
      value
    });
  } catch {
    globalThis.MutationObserver = value;
  }
  return descriptor;
}

function restoreGlobalObserver(descriptor, fallback) {
  try {
    if (descriptor) Object.defineProperty(globalThis, 'MutationObserver', descriptor);
    else globalThis.MutationObserver = fallback;
  } catch {
    globalThis.MutationObserver = fallback;
  }
}

export async function installLegacyLayer({
  name,
  dispatcher,
  priority = 0,
  documentRef = globalThis.document,
  install
}) {
  if (!name || !dispatcher || typeof install !== 'function') {
    throw new Error('Legacy layer installation requires a name, dispatcher, and install function.');
  }

  const originalAddEventListener = documentRef.addEventListener;
  const OriginalMutationObserver = globalThis.MutationObserver;
  const originalObserverDescriptor = setGlobalObserver(class V126SuppressedObserver {
    constructor(callback) {
      this.callback = callback;
      this.suppressedBy = 'v126-runtime-coordinator';
    }
    observe() {}
    disconnect() {}
    takeRecords() { return []; }
  });

  let capturedActions = 0;
  let delegatedListeners = 0;
  let sequence = 0;

  documentRef.addEventListener = function v126CaptureLegacyListener(type, listener, options) {
    if (ACTION_TYPES.has(type) && typeof listener === 'function') {
      sequence += 1;
      dispatcher.register(type, `${name}:${type}:${sequence}`, listener, priority);
      capturedActions += 1;
      return;
    }
    delegatedListeners += 1;
    return originalAddEventListener.call(documentRef, type, listener, options);
  };

  try {
    const result = await install();
    return {
      name,
      result,
      capturedActions,
      delegatedListeners,
      observerSuppressed: true
    };
  } finally {
    documentRef.addEventListener = originalAddEventListener;
    restoreGlobalObserver(originalObserverDescriptor, OriginalMutationObserver);
  }
}
