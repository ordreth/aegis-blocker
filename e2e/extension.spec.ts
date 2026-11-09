/**
 * End-to-end tests against the real built extension in a real Chromium-based browser.
 *
 *   pnpm build && pnpm test:e2e
 *
 * Set AEGIS_CHROME to a Chrome/Chromium binary if it is not on PATH. Chrome >= 137
 * only loads unpacked extensions from the command line with the feature flag below.
 */
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { rmSync } from "node:fs";
import { api, launch } from "./browser";

let server: Server;
let origin: string; // http://localhost:PORT  (blocked by a domain rule)
let other: string; // http://127.0.0.1:PORT (a different host, used for path/keyword rules)
let context: BrowserContext;
let extId: string;
let profile: string;

const html = (title: string) => `<!doctype html><title>${title}</title><h1 id="ok">site</h1>`;

test.beforeAll(async () => {
  server = createServer((req, res) => {
    res.setHeader("content-type", "text/html");
    res.end(html(req.url?.startsWith("/titled") ? "Quiet reading corner" : "Plain site"));
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const port = (server.address() as { port: number }).port;
  origin = `http://localhost:${port}`;
  other = `http://127.0.0.1:${port}`;
  ({ context, extId, profile } = await launch());
});

test.afterAll(async () => {
  await context?.close();
  server?.close();
  if (profile) rmSync(profile, { recursive: true, force: true });
});

const ext = (path: string) => `chrome-extension://${extId}/${path}`;

async function extensionPage(ctx: BrowserContext = context): Promise<Page> {
  const page = await ctx.newPage();
  await page.goto(ext("options.html"));
  return page;
}

test.describe.configure({ mode: "serial" });

test("blocks a path but lets an allowed path through", async () => {
  const admin = await extensionPage();
  expect((await api(admin, { t: "rule.add", input: { kind: "domain", pattern: "localhost" } })).ok).toBe(true);
  expect((await api(admin, { t: "rule.add", input: { kind: "path", pattern: "localhost/study", mode: "allow" } })).ok).toBe(true);

  const page = await context.newPage();
  await page.goto(`${origin}/study/notes`);
  await expect(page.locator("#ok")).toBeVisible(); // allow rule wins

  const blocked = await context.newPage();
  await blocked.goto(`${origin}/feed?x=1#frag`).catch(() => undefined);
  await expect.poll(() => blocked.url()).toContain(`chrome-extension://${extId}/blocked.html`);
  // the original address travels in the fragment so the block page can show it
  expect(new URL(blocked.url()).hash).toBe(`#${origin}/feed?x=1#frag`);
  await expect(blocked.locator("h1")).toHaveText("Access restricted");
});

test("a root dot after the host does not get around a site rule", async () => {
  const dotted = `http://localhost.:${new URL(origin).port}/feed`;
  const page = await context.newPage();
  await page.goto(dotted).catch(() => undefined);
  await expect.poll(() => page.url()).toContain(`chrome-extension://${extId}/blocked.html`);
  expect(new URL(page.url()).hash).toBe(`#${dotted}`);
});

test("catches single-page-app navigations (history.pushState)", async () => {
  const admin = await extensionPage();
  await api(admin, { t: "rule.add", input: { kind: "path", pattern: "127.0.0.1/spa-blocked" } });
  const page = await context.newPage();
  await page.goto(`${other}/fine`);
  await expect(page.locator("#ok")).toBeVisible();
  await page.evaluate(() => history.pushState({}, "", "/spa-blocked/item"));
  await expect.poll(() => page.url(), { timeout: 15_000 }).toContain("blocked.html");
});

test("keyword rules match search terms, other searches pass", async () => {
  const admin = await extensionPage();
  await api(admin, { t: "rule.add", input: { kind: "keyword", pattern: "cat videos" } });
  const fine = await context.newPage();
  await fine.goto(`${other}/search?q=dogs`);
  await expect(fine.locator("#ok")).toBeVisible();
  const page = await context.newPage();
  await page.goto(`${other}/search?q=Cat+Videos`).catch(() => undefined);
  await expect.poll(() => page.url()).toContain(`chrome-extension://${extId}/blocked.html`);
  // a keyword matches in the middle of the address: the redirect must still carry all of it
  expect(new URL(page.url()).hash).toBe(`#${other}/search?q=Cat+Videos`);
});

test("an escaped spelling of a blocked page or word is still blocked", async () => {
  // the browser's own filter does not decode these; the worker catches them on the tab
  const page = await context.newPage();
  await page.goto(`${other}/%73pa-blocked/item`).catch(() => undefined);
  await expect.poll(() => page.url(), { timeout: 15_000 }).toContain(`chrome-extension://${extId}/blocked.html`);

  const word = await context.newPage();
  await word.goto(`${other}/search?q=c%61t+videos`).catch(() => undefined);
  await expect.poll(() => word.url(), { timeout: 15_000 }).toContain(`chrome-extension://${extId}/blocked.html`);
  expect(new URL(word.url()).hash).toBe(`#${other}/search?q=c%61t+videos`);
});

test("regex rules block the addresses they match and nothing else", async () => {
  const admin = await extensionPage();
  expect((await api(admin, { t: "rule.add", input: { kind: "regex", pattern: "media/(clips|reels)/\\d+" } })).ok).toBe(true);

  const fine = await context.newPage();
  await fine.goto(`${other}/media/reels/latest`);
  await expect(fine.locator("#ok")).toBeVisible();

  const page = await context.newPage();
  await page.goto(`${other}/media/Reels/42?from=home`).catch(() => undefined);
  await expect.poll(() => page.url()).toContain(`chrome-extension://${extId}/blocked.html`);
  expect(new URL(page.url()).hash).toBe(`#${other}/media/Reels/42?from=home`);
});

test("the snooze button unblocks the address, and is left out for a page blocked by its title", async () => {
  const admin = await extensionPage();
  expect((await api(admin, { t: "settings.set", patch: { snooze: { enabled: true, waitSeconds: 5, minutes: 1 } } })).ok).toBe(true);
  expect((await api(admin, { t: "rule.add", input: { kind: "keyword", pattern: "quiet reading", scopes: ["title"] } })).ok).toBe(true);

  // blocked for its title only: there is no address to snooze, so no button
  const titled = await context.newPage();
  await titled.goto(`${other}/titled`);
  await expect.poll(() => titled.url(), { timeout: 15_000 }).toContain(`chrome-extension://${extId}/blocked.html`);
  await expect(titled.locator("h1")).toBeVisible();
  await expect(titled.getByRole("button")).toHaveCount(0);

  const page = await context.newPage();
  await page.goto(`${origin}/feed`).catch(() => undefined);
  await expect.poll(() => page.url()).toContain(`chrome-extension://${extId}/blocked.html`);
  const snooze = page.getByRole("button");
  await expect(snooze).toBeDisabled(); // the wait comes first
  await expect(snooze).toBeEnabled({ timeout: 10_000 });
  await snooze.click();
  await expect(page.locator("#ok")).toBeVisible();
  expect(page.url()).toBe(`${origin}/feed`);
});

test("a rule too large for the browser's filter is still enforced and costs the others nothing", async () => {
  const admin = await extensionPage();
  const word = "漫".repeat(150); // 1350 characters once percent-encoded
  const added = await api<{ n: number }>(admin, { t: "rule.add", input: { kind: "keyword", pattern: word, scopes: ["url"] } });
  expect(added.ok).toBe(true);

  const dynamic = await admin.evaluate(() => chrome.declarativeNetRequest.getDynamicRules());
  expect(dynamic.map((r) => r.id)).not.toContain(added.data?.n); // the browser refused it
  const redirects = dynamic.filter((r) => r.action.type === "redirect");
  expect(redirects.length).toBeGreaterThan(1);
  expect(redirects.every((r) => !!r.action.redirect?.regexSubstitution)).toBe(true);

  // the oversized rule is applied by the worker instead
  const page = await context.newPage();
  await page.goto(`${other}/search?q=${encodeURIComponent(word)}`).catch(() => undefined);
  await expect.poll(() => page.url(), { timeout: 15_000 }).toContain(`chrome-extension://${extId}/blocked.html`);

  // and the other rules still hand the full address to the block page
  const kept = await context.newPage();
  await kept.goto(`${other}/media/clips/7`).catch(() => undefined);
  await expect.poll(() => kept.url()).toContain(`chrome-extension://${extId}/blocked.html`);
  expect(new URL(kept.url()).hash).toBe(`#${other}/media/clips/7`);
});

test("Absolute Mode refuses removal and reverts storage tampering", async () => {
  const admin = await extensionPage();
  const state = await api<{ rules: { id: string; pattern: string }[] }>(admin, { t: "state" });
  const rules = state.data?.rules ?? [];
  expect(rules.length).toBeGreaterThan(2);

  expect((await api(admin, { t: "lock.enable", hours: 1 })).ok).toBe(true);
  expect(await api(admin, { t: "rule.remove", id: rules[0]?.id })).toMatchObject({ ok: false, error: { code: "locked" } });
  expect(await api(admin, { t: "rule.add", input: { kind: "domain", pattern: "ok.example", mode: "allow" } })).toMatchObject({ ok: false });

  // the snooze granted in the earlier test ends with the lock
  const snoozed = await context.newPage();
  await snoozed.goto(`${origin}/feed`).catch(() => undefined);
  await expect.poll(() => snoozed.url()).toContain(`chrome-extension://${extId}/blocked.html`);

  // someone edits storage behind the service worker's back (e.g. from DevTools)
  await admin.evaluate(() => chrome.storage.local.set({ "aegis:rules": [] }));
  await expect
    .poll(async () => ((await api<{ rules: unknown[] }>(admin, { t: "state" })).data?.rules ?? []).length, { timeout: 15_000 })
    .toBe(rules.length);

  // UI: no delete buttons while locked
  await admin.reload();
  await expect(admin.getByRole("button", { name: /^Delete/ })).toHaveCount(0);
});

test("the block page follows the owner's customization", async () => {
  const admin = await extensionPage();
  const state = await api<{ blockPage: object }>(admin, { t: "state" });
  const config = { ...state.data?.blockPage, title: "Study time", message: "Back to the books.", layout: "center", theme: "forest", icon: "leaf" };
  expect((await api(admin, { t: "blockpage.set", config })).ok).toBe(true);

  const page = await context.newPage();
  await page.goto(`${origin}/feed`).catch(() => undefined);
  await expect.poll(() => page.url()).toContain("blocked.html");
  await expect(page.locator("h1")).toHaveText("Study time");
  await expect(page.locator("body")).toHaveAttribute("data-layout", "center");
});

test("extension pages cannot reach the network (CSP connect-src 'none')", async () => {
  const admin = await extensionPage();
  const result = await admin.evaluate(async (url) => {
    try {
      await fetch(url, { mode: "no-cors" });
      return "reached";
    } catch {
      return "blocked";
    }
  }, origin);
  expect(result).toBe("blocked");
});

test("a v1 profile is migrated when the worker next starts", async () => {
  interface State {
    auth: { enabled: boolean; unlocked: boolean };
    rules: { kind: string; pattern: string }[] | null;
    settings: { theme: string; language: string; confirmDelete: boolean; lockHours: number };
    lockUntil: number | null;
  }
  const v1 = await launch();
  try {
    // Put the profile in the state v1 left it in: old keys, settings and password in sync storage,
    // leftover dynamic rules, and no schema version.
    const seed = await extensionPage(v1.context);
    await seed.evaluate(async () => {
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("oldpass" + "ab12"));
      const passwordHash = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
      await chrome.storage.local.clear();
      await chrome.storage.local.set({
        block_rules: [
          { id: 1, urlPattern: "localhost" },
          { id: 2, urlPattern: "doomscroll" },
        ],
        aegis_lock_state: { isLocked: true, unlockAt: Date.now() + 3_600_000 },
      });
      await chrome.storage.sync.set({
        aegis_settings: { theme: "light", language: "pt", doubleCheckDelete: false, absoluteModeDurationHours: 48 },
        aegis_security_config: { isEnabled: true, salt: "ab12", passwordHash, recoveryHash: "ff" },
      });
      await chrome.declarativeNetRequest.updateDynamicRules({
        addRules: [
          {
            id: 77,
            priority: 1,
            action: { type: "block" as chrome.declarativeNetRequest.RuleActionType },
            condition: { urlFilter: "legacy-leftover", resourceTypes: ["main_frame" as chrome.declarativeNetRequest.ResourceType] },
          },
        ],
      });
    });

    // Stop the worker; the next message starts a new one, which is when the migration runs.
    const page = seed;
    const cdp = await v1.context.newCDPSession(page);
    await cdp.send("ServiceWorker.enable");
    await cdp.send("ServiceWorker.stopAllWorkers");

    const state = async () => (await api<State>(page, { t: "state" })).data;
    await expect.poll(async () => (await state())?.auth.enabled, { timeout: 15_000 }).toBe(true);
    const locked = await state();
    expect(locked).toMatchObject({
      auth: { enabled: true, unlocked: false },
      rules: null, // hidden until the v1 password is given
      settings: { theme: "light", language: "pt", confirmDelete: false, lockHours: 48 },
    });
    expect(locked?.lockUntil ?? 0).toBeGreaterThan(Date.now());
    expect(await page.evaluate(() => chrome.storage.sync.get(null))).toEqual({});

    expect((await api(page, { t: "auth.login", password: "not the password" })).ok).toBe(false);
    const login = await api<{ recoveryCode?: string }>(page, { t: "auth.login", password: "oldpass" });
    expect(login.data?.recoveryCode).toMatch(/^[A-Z2-9]{4}(-[A-Z2-9]{4}){3}$/); // weak v1 hash upgraded, code rotated

    const open = await state();
    expect(open?.rules?.map((r) => `${r.kind}:${r.pattern}`)).toEqual(["domain:localhost", "keyword:doomscroll"]);
    const ids = await page.evaluate(async () => (await chrome.declarativeNetRequest.getDynamicRules()).map((r) => r.id));
    expect(ids.sort((a, b) => a - b)).toEqual([1, 2]); // the leftover rule is gone

    const blocked = await v1.context.newPage();
    await blocked.goto(`${origin}/feed`).catch(() => undefined);
    await expect.poll(() => blocked.url()).toContain(`chrome-extension://${v1.extId}/blocked.html`);
  } finally {
    await v1.context.close();
    rmSync(v1.profile, { recursive: true, force: true });
  }
});
