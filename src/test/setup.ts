import { vi } from "vitest";

const chromeMock = {
  runtime: {
    getURL: vi.fn((path) => `chrome-extension://mock-id/${path}`),
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
    },
    sync: {
      get: vi.fn(),
      set: vi.fn(),
    },
    session: {
      get: vi.fn(),
      set: vi.fn(),
    },
  },
  tabs: {
    query: vi.fn(),
  },
  declarativeNetRequest: {
    updateDynamicRules: vi.fn(),
  },
};

vi.stubGlobal("chrome", chromeMock);
