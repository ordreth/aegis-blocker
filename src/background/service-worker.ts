import { AegisError, type Reply, type Request } from "@/shared/messages";
import { handlers, KNOWN } from "./handlers";
import { checkTab, enforceGuard, isAegisAlarm, syncAll } from "./engine";
import { migrate } from "./migrate";
import { K } from "./state";

const isTrustedSender = (sender: chrome.runtime.MessageSender) =>
  sender.id === chrome.runtime.id &&
  (!sender.url || sender.url.startsWith(chrome.runtime.getURL("")));

async function dispatch(msg: unknown): Promise<unknown> {
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
  void (async () => {
    await migrate();
    await syncAll();
  })();
});

chrome.runtime.onStartup.addListener(() => {
  void enforceGuard().then(() => syncAll());
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (isAegisAlarm(alarm.name)) void syncAll();
});

chrome.tabs.onUpdated.addListener((_id, change, tab) => {
  if (change.url || change.title) void checkTab(tab);
});

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
