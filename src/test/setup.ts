// Test setup for Vitest
// Provides mock localStorage for Node test runner

if (typeof window === 'undefined' || !globalThis.localStorage) {
  const store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const key in store) delete store[key];
    },
    length: Object.keys(store).length,
    key: (index: number) => Object.keys(store)[index] || null,
  };
}
