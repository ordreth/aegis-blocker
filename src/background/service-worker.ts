import { AegisError, type Reply, type Request } from "@/shared/messages";
import { handlers, KNOWN } from "./handlers";
import { checkTab, enforceGuard, isAegisAlarm, syncAll } from "./engine";
import { migrate } from "./migrate";
import { K } from "./state";
import { createTabPacer } from "./tab-check";

const isTrustedSender = (sender: chrome.runtime.MessageSender) =>
  sender.id === chrome.runtime.id &&
  (!sender.url || sender.url.startsWith(chrome.runtime.getURL("")));

// Storage is brought up to date before anything reads it. Doing this on every
// start of the worker (not only on install) picks up a migration that was
// interrupted or had to be postponed.
const ready: Promise<void> = migrate()
  .then((migrated) => (migrated ? syncAll() : undefined))
  .catch((err: unknown) => console.error("Aegis: start-up failed", err));

async function dispatch(msg: unknown): Promise<unknown> {
  await ready;
  if (typeof msg !== "object" || msg === null) throw new AegisError("invalid");
  const req = msg as Request;
  if (typeof req.t !== "string" || !KNOWN.has(req.t)) throw new AegisError("invalid");
  const handler = handlers[req.t] as (r: Request) => Promise<unknown>;
  return handler(req);
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!isTrustedSender(sender)) return false;
  dispatch(msg).then(
    (data) => sendResponse({ ok: true, data } satisfies Reply<unknown>),
    (err: unknown) => {
      const code = err instanceof AegisError ? err.code : "internal";
      if (code === "internal") console.error("Aegis:", err);
      sendResponse({ ok: false, error: { code } } satisfies Reply<never>);
    },
  );
  return true;
});

chrome.runtime.onInstalled.addListener(() => {
  void ready.then(() => syncAll());
});

chrome.runtime.onStartup.addListener(() => {
  void ready.then(() => enforceGuard()).then(() => syncAll());
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (isAegisAlarm(alarm.name)) void ready.then(() => syncAll());
});

// Navigations are blocked by the browser's own rules; this covers what those
// cannot see (titles, single-page-app navigations). The tab is read again at
// check time so the decision is always about what it shows now.
const pacer = createTabPacer((tabId) => {
  void ready
    .then(() => chrome.tabs.get(tabId))
    .then(checkTab, () => undefined /* the tab is gone */);
});

chrome.tabs.onUpdated.addListener((id, change) => {
  if (change.url || change.title) pacer.changed(id);
});

chrome.tabs.onRemoved.addListener((id) => pacer.closed(id));

// Any storage change that did not come from this worker while Absolute Mode is
// on is reverted; otherwise the engine just resyncs.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (K.rules in changes || K.lock in changes) {
    void enforceGuard().then(async (changed) => {
      if (changed) await syncAll();
    });
  }
});
