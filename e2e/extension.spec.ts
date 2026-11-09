/**
 * End-to-end tests against the real built extension in a real Chromium-based browser.
 *
 *   pnpm build && pnpm test:e2e
 *
 * Set AEGIS_CHROME to a Chrome/Chromium binary if it is not on PATH. Chrome >= 137
 * only loads unpacked extensions from the command line with the feature flag below.
 */
import { chromium, expect, test, type BrowserContext, type Page } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

let server: Server;
let origin: string; // http://localhost:PORT  (blocked by a domain rule)
let other: string; // http://127.0.0.1:PORT (a different host, used for path/keyword rules)
let context: BrowserContext;
let extId: string;
let profile: string;

const PAGE = `<!doctype html><title>Plain site</title><h1 id="ok">site</h1>`;

test.beforeAll(async () => {
  server = createServer((_req, res) => {
    res.setHeader("content-type", "text/html");
    res.end(PAGE);
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const port = (server.address() as { port: number }).port;
  origin = `http://localhost:${port}`;
  other = `http://127.0.0.1:${port}`;

  const dist = resolve("dist");
  profile = mkdtempSync(join(tmpdir(), "aegis-e2e-"));
  context = await chromium.launchPersistentContext(profile, {
    executablePath: process.env.AEGIS_CHROME,
    channel: process.env.AEGIS_CHROME ? undefined : "chrome",
    headless: false,
    args: [
      `--disable-extensions-except=${dist}`,
      `--load-extension=${dist}`,
      "--disable-features=DisableLoadExtensionCommandLineSwitch",
      "--headless=new",
      "--no-first-run",
    ],
  });
  const sw = context.serviceWorkers()[0] ?? (await context.waitForEvent("serviceworker"));
  extId = new URL(sw.url()).host;
});

test.afterAll(async () => {
  await context?.close();
  server?.close();
  if (profile) rmSync(profile, { recursive: true, force: true });
});

const ext = (path: string) => `chrome-extension://${extId}/${path}`;

async function api<T = unknown>(page: Page, req: Record<string, unknown>): Promise<{ ok: boolean; data?: T; error?: { code: string } }> {
  return page.evaluate((r) => chrome.runtime.sendMessage(r), req);
}

async function extensionPage(): Promise<Page> {
  const page = await context.newPage();
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

test("Absolute Mode refuses removal and reverts storage tampering", async () => {
  const admin = await extensionPage();
  const state = await api<{ rules: { id: string; pattern: string }[] }>(admin, { t: "state" });
  const rules = state.data?.rules ?? [];
  expect(rules.length).toBeGreaterThan(2);

  expect((await api(admin, { t: "lock.enable", hours: 1 })).ok).toBe(true);
  expect(await api(admin, { t: "rule.remove", id: rules[0]?.id })).toMatchObject({ ok: false, error: { code: "locked" } });
  expect(await api(admin, { t: "rule.add", input: { kind: "domain", pattern: "ok.example", mode: "allow" } })).toMatchObject({ ok: false });

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
