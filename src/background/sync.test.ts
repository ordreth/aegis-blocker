import { beforeEach, describe, expect, it } from "vitest";
import { AegisError } from "@/shared/messages";
import type { Request } from "@/shared/messages";
import type { Rule } from "@/shared/types";
import { installChrome, type ChromeMock } from "@/test/chrome-mock";
import { syncAll } from "./engine";
import { handlers } from "./handlers";

let mock: ChromeMock;
const call = <T extends Request["t"]>(req: Extract<Request, { t: T }>) =>
  (handlers[req.t] as (r: unknown) => Promise<unknown>)(req);
const code = async (p: Promise<unknown>) => {
  try {
    await p;
    return "ok";
  } catch (e) {
    return e instanceof AegisError ? e.code : String(e);
  }
};
const add = (kind: Rule["kind"], pattern: string, extra = {}) =>
  call({ t: "rule.add", input: { kind, pattern, ...extra } }) as Promise<Rule>;
const dnr = () => chrome.declarativeNetRequest;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

beforeEach(() => {
  mock = installChrome();
});

describe("overlapping syncs", () => {

  it("does not let an older sync resurrect a rule that was removed meanwhile", async () => {
    const a = await add("domain", "a.example");
    const b = await add("domain", "b.example");
    const update = dnr().updateDynamicRules as unknown as { getMockImplementation(): (o: unknown) => Promise<void> } & {
      mockImplementationOnce(fn: (o: unknown) => Promise<void>): void;
    };
    const real = update.getMockImplementation();
    update.mockImplementationOnce(async (o) => {
      await wait(40); // the first update is slow to reach the browser
      await real(o);
    });
    const slow = syncAll();
    const removal = call({ t: "rule.remove", id: b.id });
    await Promise.all([slow, removal]);
    expect(mock.dnr.rules.map((r) => r.id)).toEqual([a.n]);
  });
});

describe("a rule the browser refuses", () => {
  const refuse = (needle: string) => {
    const d = dnr() as unknown as {
      isRegexSupported: { mockImplementation(fn: (o: { regex: string }) => Promise<{ isSupported: boolean }>): void };
      updateDynamicRules: {
        getMockImplementation(): (o: { addRules?: chrome.declarativeNetRequest.Rule[] }) => Promise<void>;
        mockImplementation(fn: (o: { addRules?: chrome.declarativeNetRequest.Rule[] }) => Promise<void>): void;
      };
    };
    d.isRegexSupported.mockImplementation(async ({ regex }) => ({ isSupported: !regex.includes(needle) }));
    const real = d.updateDynamicRules.getMockImplementation();
    d.updateDynamicRules.mockImplementation(async (o) => {
      if (o.addRules?.some((r) => r.condition.regexFilter?.includes(needle))) throw new Error("regex exceeds the memory limit");
      await real(o);
    });
  };

  it("does not cost the other rules their redirect with the original address", async () => {
    refuse("toolarge");
    const good = await add("domain", "good.example");
    await add("keyword", "toolarge");
    expect(mock.dnr.rules.map((r) => r.id)).toEqual([good.n]);
    expect(mock.dnr.rules[0]?.action.redirect?.regexSubstitution).toContain("blocked.html?r=");
  });

  it("still schedules and sweeps tabs when the browser rejects every update", async () => {
    (dnr().updateDynamicRules as unknown as { mockImplementation(fn: () => Promise<void>): void }).mockImplementation(async () => {
      throw new Error("internal error");
    });
    mock.tabs.push({ id: 5, url: "https://x.example/feed" });
    expect(await code(add("domain", "x.example", { schedule: { days: [0, 1, 2, 3, 4, 5, 6], start: 0, end: 0 } }))).toBe("ok");
    expect(mock.updated).toHaveLength(1);
    expect(mock.alarms.has("aegis:boundary")).toBe(true);
  });
});
