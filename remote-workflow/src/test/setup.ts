import '@testing-library/jest-dom/vitest';
import { expect } from 'vitest';
import * as matchers from 'vitest-axe/matchers';

expect.extend(matchers);

// jsdom does not implement BroadcastChannel
if (typeof globalThis.BroadcastChannel === 'undefined') {
  class MockBroadcastChannel {
    name: string;
    onmessage: ((ev: MessageEvent) => void) | null = null;
    constructor(name: string) {
      this.name = name;
    }
    postMessage() {}
    close() {}
  }
  globalThis.BroadcastChannel = MockBroadcastChannel as unknown as typeof BroadcastChannel;
}

// jsdom may not have crypto.randomUUID
if (typeof globalThis.crypto?.randomUUID !== 'function') {
  Object.defineProperty(globalThis.crypto, 'randomUUID', {
    value: () => Math.random().toString(36).slice(2),
  });
}

// Suppress jsdom "Not implemented" noise (e.g. HTMLCanvasElement.getContext)
// and React Router v7 future flag warnings — neither affects test correctness.
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args: Parameters<typeof console.error>) => {
  if (typeof args[0] === 'string' && args[0].includes('Not implemented:')) return;
  originalConsoleError(...args);
};

console.warn = (...args: Parameters<typeof console.warn>) => {
  if (typeof args[0] === 'string' && args[0].includes('React Router Future Flag Warning')) return;
  originalConsoleWarn(...args);
};
