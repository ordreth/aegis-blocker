/**
 * End-to-end tests that drive the real popup and dashboard the way a person would,
 * in a real Chromium-based browser.   pnpm build && pnpm test:e2e
 */
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { rmSync } from "node:fs";
import { api, launch } from "./browser";

let server: Server;
let origin: string;
let context: BrowserContext;
let extId: string;
let profile: string;

const PASSWORD = "correct horse battery";
// a 1x1 PNG
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

test.beforeAll(async () => {
  server = createServer((_req, res) => {
    res.setHeader("content-type", "text/html");
    res.end(`<!doctype html><title>Plain site</title><h1 id="ok">site</h1>`);
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  origin = `http://localhost:${(server.address() as { port: number }).port}`;
  ({ context, extId, profile } = await launch());
});

test.afterAll(async () => {
  await context?.close();
  server?.close();
  if (profile) rmSync(profile, { recursive: true, force: true });
});

const blockPage = () => `chrome-extension://${extId}/blocked.html`;

async function open(path: string): Promise<Page> {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extId}/${path}`);
  return page;
}

async function visitBlockedSite(): Promise<Page> {
  const site = await context.newPage();
  await site.goto(`${origin}/feed`).catch(() => undefined);
  await expect.poll(() => site.url()).toContain(blockPage());
  return site;
}

/** Number of files kept for the block page background. */
const storedMedia = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<number>((done, fail) => {
        const open = indexedDB.open("aegis-media", 1);
        open.onerror = () => fail(open.error);
        open.onsuccess = () => {
          const keys = open.result.transaction("files").objectStore("files").getAllKeys();
          keys.onerror = () => fail(keys.error);
          keys.onsuccess = () => {
            open.result.close();
            done(keys.result.length);
          };
        };
      }),
  );

test.describe.configure({ mode: "serial" });

test("popup: a site typed into the box gets blocked", async () => {
  const popup = await open("popup.html");
  await expect(popup.getByText("Nothing blocked yet")).toBeVisible();
  const box = popup.getByPlaceholder(/reddit\.com\/r\/memes/);
  const add = popup.getByRole("button", { name: "Add", exact: true });

  await box.fill("tt"); // would match every address
  await expect(add).toBeDisabled();

  await box.fill("localhost");
  await expect(popup.getByText(/Detected: Site/)).toBeVisible();
  await add.click();
  await expect(popup.getByTitle("localhost")).toBeVisible();

  const site = await visitBlockedSite();
  await expect(site.locator("h1")).toHaveText("Access restricted");
});

test("dashboard: a password puts everything behind the lock screen", async () => {
  const page = await open("options.html#security");
  await page.getByLabel("New password", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirm password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Set password" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.locator("code")).toHaveText(/^[A-Z2-9]{4}(-[A-Z2-9]{4}){3}$/);
  const done = dialog.getByRole("button", { name: "Done" });
  await expect(done).toBeDisabled(); // not before the code is acknowledged
  await dialog.getByRole("checkbox").click();
  await done.click();
  await expect(dialog).toBeHidden();

  await page.getByRole("button", { name: "Lock now" }).click();
  await expect(page.getByRole("heading", { name: "Aegis is locked" })).toBeVisible();
  // while locked the worker gives nothing away, whatever the page asks
  expect((await api<{ rules: unknown }>(page, { t: "state" })).data?.rules).toBeNull();
  expect(await api(page, { t: "rules.export" })).toMatchObject({ ok: false, error: { code: "auth_required" } });

  const password = page.getByLabel("Password", { exact: true });
  await password.fill("not the password");
  await page.getByRole("button", { name: "Unlock" }).click();
  await expect(page.getByText("Wrong password or code.")).toBeVisible();

  await password.fill(PASSWORD);
  await page.getByRole("button", { name: "Unlock" }).click();
  await expect(page.getByRole("heading", { name: "Lock & security" })).toBeVisible();
});

test("designer: an uploaded background reaches the block page and leftovers are deleted", async () => {
  const page = await open("options.html#blockpage");
  const upload = (name: string) => page.setInputFiles('input[type="file"]', { name, mimeType: "image/png", buffer: PNG });
  const removeFile = page.getByRole("button", { name: "Remove file" });

  await upload("first.png");
  await expect(removeFile).toBeVisible();
  // the draft is abandoned without saving: its upload is now a leftover
  await page.reload();
  expect(await storedMedia(page)).toBe(1);

  await page.getByLabel("Title", { exact: true }).fill("Deep work");
  await upload("second.png");
  await expect(removeFile).toBeVisible();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Block page saved.")).toBeVisible();
  await expect.poll(() => storedMedia(page)).toBe(1); // only the saved background is kept

  const site = await visitBlockedSite();
  await expect(site.locator("h1")).toHaveText("Deep work");
  await expect
    .poll(() => site.locator("img.media").evaluate((img) => (img as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);
});

test("dashboard: Absolute Mode takes away the ways to undo a rule", async () => {
  const page = await open("options.html#security");
  await page.getByRole("button", { name: "Activate Absolute Mode" }).click();
  await page.getByRole("dialog").getByRole("button", { name: /^Lock for/ }).click();
  await expect(page.getByText(/Absolute Mode is active/).first()).toBeVisible();

  await page.goto(`chrome-extension://${extId}/options.html#rules`);
  await expect(page.getByTitle("localhost")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Delete/ })).toHaveCount(0);

  const rules = (await api<{ rules: { id: string }[] }>(page, { t: "state" })).data?.rules ?? [];
  expect(rules).toHaveLength(1);
  expect(await api(page, { t: "rule.remove", id: rules[0]?.id })).toMatchObject({ ok: false, error: { code: "locked" } });
  expect(await api(page, { t: "auth.disable", password: PASSWORD })).toMatchObject({ ok: false, error: { code: "locked" } });
  expect(await api(page, { t: "auth.recover", code: "AAAA-BBBB-CCCC-DDDD" })).toMatchObject({ ok: false, error: { code: "locked" } });

  await visitBlockedSite();
});
