import { beforeEach, describe, expect, it, vi } from "vitest";
import { AegisError } from "@/shared/messages";
import type { Request } from "@/shared/messages";
import { installChrome, type ChromeMock } from "@/test/chrome-mock";
import { checkTab, enforceGuard } from "./engine";
import { handlers } from "./handlers";
import { migrate } from "./migrate";
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
const add = (kind: "domain" | "path" | "keyword" | "regex", pattern: string, extra = {}) =>
  call({ t: "rule.add", input: { kind, pattern, ...extra } });

beforeEach(() => {
  mock = installChrome();
});

describe("rules", () => {
  it("adds rules and mirrors them into declarativeNetRequest", async () => {
    await add("domain", "reddit.com");
    await add("path", "reddit.com/r/programming", { mode: "allow" });
    const [block, allow] = mock.dnr.rules;
    expect(block?.priority).toBe(1);
    expect(block?.action.redirect?.regexSubstitution).toContain("chrome-extension://test-ext/blocked.html?r=");
    expect(allow?.priority).toBe(2);
    expect(allow?.action.type).toBe("allow");
    expect(block?.condition.regexFilter).toContain("reddit\\.com");
  });
  it("rejects duplicates, bad input and unsupported regex", async () => {
    await add("domain", "a.com");
    expect(await code(add("domain", "https://www.a.com/"))).toBe("duplicate");
    expect(await code(add("domain", "not a host"))).toBe("invalid_host");
    expect(await code(add("regex", "(a+)+$"))).toBe("unsafe_regex");
    expect(await code(add("regex", "^https://x.com/(?!ok)"))).toBe("unsafe_regex");
    expect(await code(call({ t: "rule.add", input: null as never }))).toBe("invalid");
  });
  it("skips DNR for title-only keyword rules and honours schedules", async () => {
    await add("keyword", "memes", { scopes: ["title"] });
    expect(mock.dnr.rules).toHaveLength(0);
    await add("domain", "x.com", { schedule: { days: [0, 1, 2, 3, 4, 5, 6], start: 0, end: 0 } });
    expect(mock.dnr.rules).toHaveLength(1);
    expect(mock.alarms.has("aegis:boundary")).toBe(true);
  });
  it("updates and removes rules", async () => {
    const r = (await add("domain", "a.com")) as { id: string };
    await call({ t: "rule.update", id: r.id, patch: { enabled: false } });
    expect(mock.dnr.rules).toHaveLength(0);
    await call({ t: "rule.remove", id: r.id });
    expect((await call({ t: "state" }) as { rules: unknown[] }).rules).toHaveLength(0);
  });
  it("redirects already-open tabs and SPA navigations", async () => {
    mock.tabs.push({ id: 7, url: "https://x.com/home" }, { id: 8, url: "https://ok.com/" });
    await add("domain", "x.com");
    expect(mock.updated).toEqual([{ id: 7, url: "chrome-extension://test-ext/blocked.html?r=1#https://x.com/home" }]);
    await checkTab({ id: 9, url: "https://youtube.com/watch", title: "x" });
    expect(mock.updated).toHaveLength(1);
    await add("path", "youtube.com/shorts");
    await checkTab({ id: 9, url: "https://youtube.com/shorts/abc", title: "x" });
    expect(mock.updated.at(-1)?.id).toBe(9);
  });
  it("imports and exports", async () => {
    const res = (await call({
      t: "rules.import",
      mode: "merge",
      json: JSON.stringify([{ urlPattern: "a.com" }, { urlPattern: "b.com" }, { bad: 1 }]),
    })) as { added: number; skipped: number };
    expect(res).toEqual({ added: 2, skipped: 1 });
    expect(await code(call({ t: "rules.import", mode: "merge", json: "nope" }))).toBe("bad_import");
    expect(JSON.parse((await call({ t: "rules.export" })) as string).rules).toHaveLength(2);
  });
});

describe("Absolute Mode", () => {
  let id: string;
  beforeEach(async () => {
    id = ((await add("domain", "x.com")) as { id: string }).id;
    await call({ t: "lock.enable", hours: 2 });
  });
  it("forbids removing, editing, weakening and snoozing", async () => {
    expect(await code(call({ t: "rule.remove", id }))).toBe("locked");
    expect(await code(call({ t: "rule.update", id, patch: { enabled: false } }))).toBe("locked");
    expect(await code(call({ t: "rule.update", id, patch: { pattern: "y.com" } }))).toBe("locked");
    expect(await code(add("domain", "ok.com", { mode: "allow" }))).toBe("locked");
    expect(await code(call({ t: "rules.import", mode: "replace", json: "[]" }))).toBe("locked");
    expect(await code(call({ t: "settings.set", patch: { lockHours: 1 } }))).toBe("locked");
    expect(await code(call({ t: "settings.set", patch: { snooze: { enabled: true, waitSeconds: 5, minutes: 60 } } }))).toBe("locked");
    expect(await code(call({ t: "blocked.snooze", n: 1, url: "https://x.com/" }))).toBe("locked");
  });
  it("still allows adding blocks, cosmetic settings, note edits and extending", async () => {
    expect(await code(add("domain", "tiktok.com"))).toBe("ok");
    expect(await code(call({ t: "settings.set", patch: { theme: "light" } }))).toBe("ok");
    expect(await code(call({ t: "rule.update", id, patch: { note: "study" } }))).toBe("ok");
    const before = ((await call({ t: "state" })) as { lockUntil: number }).lockUntil;
    await call({ t: "lock.enable", hours: 1 });
    expect(((await call({ t: "state" })) as { lockUntil: number }).lockUntil).toBe(before);
    await call({ t: "lock.enable", hours: 100 });
    expect(((await call({ t: "state" })) as { lockUntil: number }).lockUntil).toBeGreaterThan(before);
  });
  it("reverts storage tampering made behind the service worker's back", async () => {
    await mock.local.set({ [K.rules]: [] });
    await mock.local.remove(K.lock);
    expect(await enforceGuard()).toBe(true);
    const state = (await call({ t: "state" })) as { rules: unknown[]; lockUntil: number | null };
    expect(state.rules).toHaveLength(1);
    expect(state.lockUntil).not.toBeNull();
  });
  it("releases when the timer ends", async () => {
    vi.useFakeTimers({ now: Date.now() + 3 * 3_600_000, toFake: ["Date"] });
    try {
      expect(await code(call({ t: "rule.remove", id }))).toBe("ok");
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("password", () => {
  it("hides data until unlocked, throttles brute force, and recovery respects the lock", async () => {
    await add("domain", "x.com");
    const { recoveryCode } = (await call({ t: "auth.setup", password: "hunter2hunter2" })) as { recoveryCode: string };
    expect(recoveryCode).toMatch(/^[A-Z2-9]{4}(-[A-Z2-9]{4}){3}$/);
    await call({ t: "auth.logout" });

    let s = (await call({ t: "state" })) as { rules: unknown; auth: { unlocked: boolean } };
    expect(s.rules).toBeNull();
    expect(await code(add("domain", "y.com"))).toBe("auth_required");
    expect(await code(call({ t: "rules.export" }))).toBe("auth_required");

    for (let i = 0; i < 5; i++) expect(await code(call({ t: "auth.login", password: "nope-nope" }))).toBe("wrong_password");
    expect(await code(call({ t: "auth.login", password: "hunter2hunter2" }))).toBe("throttled");

    mock.local.dump()[K.throttle] = { fails: 0, until: 0 };
    await call({ t: "auth.login", password: "hunter2hunter2" });
    s = (await call({ t: "state" })) as typeof s;
    expect(s.auth.unlocked).toBe(true);
    expect(s.rules).toHaveLength(1);

    await call({ t: "lock.enable", hours: 1 });
    await call({ t: "auth.logout" });
    expect(await code(call({ t: "auth.recover", code: recoveryCode }))).toBe("locked");
    await call({ t: "auth.login", password: "hunter2hunter2" });
    expect(await code(call({ t: "auth.disable", password: "hunter2hunter2" }))).toBe("locked");
  });
  it("recovery code removes the password when not locked; short passwords are refused", async () => {
    expect(await code(call({ t: "auth.setup", password: "short" }))).toBe("weak_password");
    const { recoveryCode } = (await call({ t: "auth.setup", password: "a-long-enough-pw" })) as { recoveryCode: string };
    await call({ t: "auth.logout" });
    expect(await code(call({ t: "auth.recover", code: "AAAA-BBBB-CCCC-DDDD" }))).toBe("wrong_password");
    await call({ t: "auth.recover", code: recoveryCode.toLowerCase() });
    expect(((await call({ t: "state" })) as { auth: { enabled: boolean } }).auth.enabled).toBe(false);
  });
  it("changes the password", async () => {
    await call({ t: "auth.setup", password: "first-password" });
    expect(await code(call({ t: "auth.change", current: "wrong-one", next: "second-password" }))).toBe("wrong_password");
    await call({ t: "auth.change", current: "first-password", next: "second-password" });
    await call({ t: "auth.logout" });
    expect(await code(call({ t: "auth.login", password: "first-password" }))).toBe("wrong_password");
    expect(await code(call({ t: "auth.login", password: "second-password" }))).toBe("ok");
  });
});

describe("blocked page", () => {
  it("snoozes a rule only when enabled and unlocked, then resumes", async () => {
    await add("domain", "x.com");
    expect(await code(call({ t: "blocked.snooze", n: 1, url: "https://x.com/" }))).toBe("locked"); // disabled by default
    await call({ t: "settings.set", patch: { snooze: { enabled: true, waitSeconds: 10, minutes: 5 } } });
    expect(((await call({ t: "blocked.info", n: 1 })) as { snooze: unknown }).snooze).not.toBeNull();
    expect(await code(call({ t: "blocked.snooze", n: 1, url: "https://evil.io/" }))).toBe("forbidden");
    await call({ t: "blocked.snooze", n: 1, url: "https://x.com/page" });
    expect(mock.dnr.rules).toHaveLength(0);
    expect(mock.alarms.has("aegis:snooze")).toBe(true);
  });
  it("reveals the matched pattern only if the owner opted in", async () => {
    await add("domain", "x.com");
    expect(((await call({ t: "blocked.info", n: 1 })) as { pattern: unknown }).pattern).toBeNull();
    const cfg = ((await call({ t: "state" })) as { blockPage: object }).blockPage;
    await call({ t: "blockpage.set", config: { ...cfg, showRule: true } as never });
    expect(((await call({ t: "blocked.info", n: 1 })) as { pattern: unknown }).pattern).toBe("x.com");
  });
  it("refuses a redirect target that is itself blocked", async () => {
    await add("domain", "x.com");
    const cfg = ((await call({ t: "state" })) as { blockPage: object }).blockPage;
    const bad = { ...cfg, redirect: { enabled: true, url: "https://x.com/", delaySec: 5 } };
    expect(await code(call({ t: "blockpage.set", config: bad as never }))).toBe("redirect_loop");
  });
});

describe("migration from v1", () => {
  it("converts rules, lock, settings and password, and wipes chrome.storage.sync", async () => {
    const m = installChrome({
      local: {
        block_rules: [
          { id: 1, urlPattern: "reddit.com/r/memes", matchType: "contains", createdAt: 1 },
          { id: 2, urlPattern: "twitter.com", matchType: "contains", createdAt: 2 },
          { id: 3, urlPattern: "doomscroll", matchType: "contains", createdAt: 3 },
        ],
        aegis_lock_state: { isLocked: true, unlockAt: Date.now() + 3_600_000 },
      },
      sync: {
        aegis_settings: { theme: "light", language: "zh_CN", doubleCheckDelete: false, absoluteModeDurationHours: 48 },
        aegis_security_config: { isEnabled: true, salt: "ab12", passwordHash: "", recoveryHash: "ff" },
      },
    });
    // real legacy hash for "oldpass"
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("oldpass" + "ab12"));
    const hash = Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
    (m.sync.dump().aegis_security_config as { passwordHash: string }).passwordHash = hash;

    await migrate();
    const s = (await call({ t: "state" })) as {
      rules: { kind: string; pattern: string }[] | null;
      settings: { theme: string; language: string; confirmDelete: boolean; lockHours: number };
      lockUntil: number | null;
      auth: { enabled: boolean };
    };
    expect(s.auth.enabled).toBe(true);
    expect(m.sync.dump()).toEqual({});
    expect(m.local.dump().block_rules).toBeUndefined();
    expect(s.lockUntil).not.toBeNull();
    expect(s.settings).toMatchObject({ theme: "light", language: "zh", confirmDelete: false, lockHours: 48 });

    expect(await code(call({ t: "auth.login", password: "wrong" }))).toBe("wrong_password");
    const res = (await call({ t: "auth.login", password: "oldpass" })) as { recoveryCode?: string };
    expect(res.recoveryCode).toBeDefined(); // hash upgraded + recovery rotated
    const after = (await call({ t: "state" })) as typeof s;
    expect(after.rules?.map((r) => `${r.kind}:${r.pattern}`)).toEqual([
      "path:reddit.com/r/memes",
      "domain:twitter.com",
      "keyword:doomscroll",
    ]);
    expect((m.local.dump()[K.auth] as { password: { kdf: string } }).password.kdf).toBe("pbkdf2-sha256");
  });
});
