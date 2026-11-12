import '@testing-library/jest-dom';

// Mock Web Worker if not available in jsdom environment
if (typeof window !== 'undefined' && !window.Worker) {
  class MockWorker {
    url: string;
    onmessage: ((event: MessageEvent) => void) | null = null;
    onerror: ((event: ErrorEvent) => void) | null = null;

    constructor(stringUrl: string) {
      this.url = stringUrl;
    }

    postMessage(_msg: any) {
      // Mock echo / no-op
    }

    terminate() {}
  }

  window.Worker = MockWorker as any;
}
