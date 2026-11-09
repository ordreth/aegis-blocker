import "./blocked.css";
import { createT, resolveLocale } from "@/i18n";
import { normalizeHttpUrl } from "@/shared/patterns";
import { AegisError } from "@/shared/messages";
import { DEFAULT_BLOCK_PAGE } from "@/shared/schema";
import { sanitizeBlockPage } from "@/shared/schema";
import type { Settings } from "@/shared/types";
import { send } from "@/ui/client";
import { renderBlockPage } from "./render";

const root = document.getElementById("app") as HTMLElement;
const params = new URLSearchParams(location.search);
const preview = params.get("preview") === "1";
const n = Number(params.get("r") ?? 0);
const hashUrl = decodeSafe(location.hash.slice(1));
const original = normalizeHttpUrl(hashUrl);

function decodeSafe(s: string) {
  try {
    return /^https?%3A/i.test(s) ? decodeURIComponent(s) : s;
  } catch {
    return s;
  }
}

let language: Settings["language"] = "system";
let stop: (() => void) | undefined;

async function draw(config: unknown, url: string | null, info: Parameters<typeof renderBlockPage>[2]["info"]) {
  stop?.();
  const t = createT(resolveLocale(language));
  document.documentElement.lang = resolveLocale(language) === "zh" ? "zh-CN" : resolveLocale(language);
  document.title = t("bk_title");
  stop = await renderBlockPage(root, sanitizeBlockPage(config), {
    t,
    url,
    info,
    preview,
    onSnooze: async () => {
      try {
        await send({ t: "blocked.snooze", n, url: url ?? "" });
        return true;
      } catch (e) {
        if (!(e instanceof AegisError)) console.error(e);
        return false;
      }
    },
    onLeave: (u) => location.replace(u),
  });
}

async function boot() {
  // A website could frame this page (it is web-accessible) and trick a click on the
  // snooze/redirect buttons. Only the editor's inert preview may be framed.
  if (!preview && window.top !== window) return;
  if (preview) {
    window.addEventListener("message", (e) => {
      if (e.origin !== location.origin || e.source !== parent) return;
      const d = e.data as { type?: string; config?: unknown; language?: Settings["language"] } | null;
      if (d?.type !== "aegis-preview") return;
      if (d.language) language = d.language;
      void draw(d.config, "https://distracting-site.example/feed", {
        pattern: "distracting-site.example",
        lockUntil: Date.now() + 5 * 3_600_000,
        snooze: null,
        canRedirect: true,
      });
    });
    parent.postMessage({ type: "aegis-preview-ready" }, location.origin);
    void draw(DEFAULT_BLOCK_PAGE, null, null);
    return;
  }
  try {
    const state = await send({ t: "state" });
    language = state.settings.language;
    const info = await send({ t: "blocked.info", n, ...(original ? { url: original } : {}) });
    await draw(state.blockPage, original, info);
  } catch (e) {
    console.error(e);
    await draw(DEFAULT_BLOCK_PAGE, original, null);
  }
}

void boot();
