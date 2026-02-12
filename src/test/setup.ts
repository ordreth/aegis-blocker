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
    query: vi.fn(() => Promise.resolve([])),
    update: vi.fn(),
  },
  declarativeNetRequest: {
    getDynamicRules: vi.fn(() => Promise.resolve([])),
    updateDynamicRules: vi.fn(() => Promise.resolve()),
    RuleActionType: {
      BLOCK: "block",
      REDIRECT: "redirect",
      ALLOW: "allow",
      UPGRADE_SCHEME: "upgradeScheme",
      MODIFY_HEADERS: "modifyHeaders",
      ALLOW_ALL_REQUESTS: "allowAllRequests",
    },
    ResourceType: {
      MAIN_FRAME: "main_frame",
      SUB_FRAME: "sub_frame",
      STYLESHEET: "stylesheet",
      SCRIPT: "script",
      IMAGE: "image",
      FONT: "font",
      OBJECT: "object",
      XMLHTTPREQUEST: "xmlhttprequest",
      PING: "ping",
      CSP_REPORT: "csp_report",
      MEDIA: "media",
      WEBSOCKET: "websocket",
      OTHER: "other",
    },
  },
  alarms: {
    create: vi.fn(),
    clear: vi.fn(),
    onAlarm: {
      addListener: vi.fn(),
    },
  },
};

vi.stubGlobal("chrome", chromeMock);

vi.mock("@/lib/i18n", () => ({
  t: (key: string) => key,
}));
