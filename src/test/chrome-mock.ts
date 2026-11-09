import { vi } from "vitest";

function area(initial: Record<string, unknown> = {}) {
  let data: Record<string, unknown> = structuredClone(initial);
  return {
    get: vi.fn(async (keys?: string | string[] | null) => {
      if (keys == null) return structuredClone(data);
      const list = Array.isArray(keys) ? keys : [keys];
      return structuredClone(
        Object.fromEntries(list.filter((k) => k in data).map((k) => [k, data[k]])),
      );
    }),
    set: vi.fn(async (items: Record<string, unknown>) => {
      data = { ...data, ...structuredClone(items) };
    }),
    remove: vi.fn(async (keys: string | string[]) => {
      for (const k of Array.isArray(keys) ? keys : [keys]) delete data[k];
    }),
    clear: vi.fn(async () => {
      data = {};
    }),
    dump: () => data,
  };
}

export interface ChromeMock {
  local: ReturnType<typeof area>;
  session: ReturnType<typeof area>;
  sync: ReturnType<typeof area>;
  dnr: { rules: chrome.declarativeNetRequest.Rule[] };
  tabs: { id: number; url: string; title?: string }[];
  updated: { id: number; url: string }[];
  alarms: Map<string, number>;
}

export function installChrome(seed?: {
  local?: Record<string, unknown>;
  sync?: Record<string, unknown>;
}): ChromeMock {
  const m: ChromeMock = {
    local: area(seed?.local),
    session: area(),
    sync: area(seed?.sync),
    dnr: { rules: [] },
    tabs: [],
    updated: [],
    alarms: new Map(),
  };
  vi.stubGlobal("chrome", {
    runtime: {
      id: "test-ext",
      getURL: (p: string) => `chrome-extension://test-ext/${p}`,
      openOptionsPage: vi.fn(),
    },
    storage: {
      local: m.local,
      session: m.session,
      sync: m.sync,
      onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
    },
    alarms: {
      create: vi.fn(async (name: string, info: { when: number }) => {
        m.alarms.set(name, info.when);
      }),
      clear: vi.fn(async (name: string) => m.alarms.delete(name)),
    },
    tabs: {
      query: vi.fn(async () => m.tabs),
      update: vi.fn(async (id: number, props: { url: string }) => {
        m.updated.push({ id, url: props.url });
      }),
    },
    declarativeNetRequest: {
      getDynamicRules: vi.fn(async () => m.dnr.rules),
      updateDynamicRules: vi.fn(
        async (o: {
          removeRuleIds?: number[];
          addRules?: chrome.declarativeNetRequest.Rule[];
        }) => {
          m.dnr.rules = [
            ...m.dnr.rules.filter((r) => !o.removeRuleIds?.includes(r.id)),
            ...(o.addRules ?? []),
          ];
        },
      ),
      isRegexSupported: vi.fn(async ({ regex }: { regex: string }) => ({
        isSupported: !/\(\?[=!<]|\\[1-9]/.test(regex),
      })),
    },
  });
  return m;
}
