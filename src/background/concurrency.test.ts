import { beforeEach, describe, expect, it } from "vitest";
import { AegisError } from "@/shared/messages";
import type { Request } from "@/shared/messages";
import type { Rule } from "@/shared/types";
import { installChrome, type ChromeMock } from "@/test/chrome-mock";
import { handlers } from "./handlers";
import { K } from "./state";

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

beforeEach(() => {
  mock = installChrome();
});

describe("concurrent requests", () => {
  it("cannot outrun the brute-force back-off with parallel guesses", { timeout: 30_000 }, async () => {
    await call({ t: "auth.setup", password: "correct horse" });
    await call({ t: "auth.logout" });
    const guesses = Array.from({ length: 9 }, (_, i) => code(call({ t: "auth.login", password: `guess-${i}` })));
    const results = await Promise.all(guesses);
    expect(results.filter((r) => r === "wrong_password")).toHaveLength(5);
    expect(results.filter((r) => r === "throttled")).toHaveLength(4);
    expect(mock.local.dump()[K.throttle]).toMatchObject({ fails: 5 });
  });

  it("keeps both rules when two are added at the same time", async () => {
    await Promise.all([add("domain", "a.example"), add("domain", "b.example"), add("keyword", "third one")]);
    const rules = mock.local.dump()[K.rules] as Rule[];
    expect(rules.map((r) => r.pattern).sort()).toEqual(["a.example", "b.example", "third one"]);
    expect(new Set(rules.map((r) => r.n)).size).toBe(3);
    expect(mock.dnr.rules.map((r) => r.id).sort()).toEqual(rules.map((r) => r.n).sort());
  });
});
