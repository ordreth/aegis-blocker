/** Shared by the end-to-end specs: a real browser with the built extension loaded. */
import { chromium, type BrowserContext, type Page } from "@playwright/test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

export interface Browser {
  context: BrowserContext;
  extId: string;
  profile: string;
}

/** A browser with a fresh profile and the built extension loaded. */
export async function launch(): Promise<Browser> {
  const dist = resolve("dist");
  const profile = mkdtempSync(join(tmpdir(), "aegis-e2e-"));
  const context = await chromium.launchPersistentContext(profile, {
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
  return { context, extId: new URL(sw.url()).host, profile };
}

/** Sends a request to the service worker the way the extension's own pages do. */
export async function api<T = unknown>(page: Page, req: Record<string, unknown>): Promise<{ ok: boolean; data?: T; error?: { code: string } }> {
  return page.evaluate((r) => chrome.runtime.sendMessage(r), req);
}
