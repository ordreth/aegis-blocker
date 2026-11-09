// Renders the real UI (React components + the block page renderer) to static HTML
// for the Chrome Web Store screenshots. Run with:  pnpm assets
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { it, vi } from "vitest";
import { handlers } from "@/background/handlers";
import { renderBlockPage } from "@/blocked/render";
import { createT } from "@/i18n";
import { OptionsApp } from "@/options/App";
import { PopupApp } from "@/popup/App";
import { sanitizeBlockPage } from "@/shared/schema";
import type { AppState, BlockPageConfig } from "@/shared/types";
import { installChrome } from "@/test/chrome-mock";
import { AegisContext, type Ctx } from "@/ui/store";

const OUT = "store-assets/.build";
const call = (req: { t: keyof typeof handlers } & Record<string, unknown>) =>
  (handlers[req.t] as (r: unknown) => Promise<unknown>)(req);

const svgUri = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
const BG = {
  aurora: svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000"><defs><filter id="b"><feGaussianBlur stdDeviation="90"/></filter></defs><rect width="1600" height="1000" fill="#0b1020"/><g filter="url(#b)"><circle cx="300" cy="250" r="330" fill="#5b4bff"/><circle cx="1250" cy="200" r="280" fill="#d99543"/><circle cx="900" cy="820" r="360" fill="#18a0c9"/></g></svg>`),
  mountains: svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16324a"/><stop offset="1" stop-color="#e9b872"/></linearGradient></defs><rect width="1600" height="1000" fill="url(#s)"/><circle cx="1180" cy="330" r="90" fill="#fff3d6" opacity=".9"/><path d="M0 760 330 430 560 640 820 360 1120 700 1360 520 1600 760V1000H0z" fill="#0f2233"/><path d="M0 860 260 650 520 820 840 600 1180 850 1420 700 1600 860V1000H0z" fill="#081521"/></svg>`),
  waves: svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice"><rect width="1600" height="1000" fill="#2a1220"/><path d="M0 600C300 500 500 720 800 620S1300 480 1600 600V1000H0z" fill="#fb7185" opacity=".55"/><path d="M0 720C260 640 520 820 820 730S1320 620 1600 720V1000H0z" fill="#f59e0b" opacity=".5"/><path d="M0 840C300 780 560 900 860 840S1340 760 1600 840V1000H0z" fill="#7c3aed" opacity=".6"/></svg>`),
};

const img = (overlay: number, blur = 0): BlockPageConfig["background"] => ({ kind: "image", mediaId: "x", overlay, blur });
const none: BlockPageConfig["background"] = { kind: "none", mediaId: null, overlay: 0, blur: 0 };

const GALLERY: Record<string, { cfg: Partial<BlockPageConfig>; media?: string }> = {
  aegis: { cfg: { theme: "aegis", layout: "card", icon: "shield", background: img(45) }, media: BG.aurora },
  midnight: { cfg: { theme: "midnight", layout: "center", icon: "eye", title: "Eyes on the goal", message: "Your future self is cheering for you.", background: img(30, 2) }, media: BG.aurora },
  paper: { cfg: { theme: "paper", layout: "split", font: "serif", icon: "leaf", title: "Breathe. Back to the page.", message: "The feed will still be there when you are done.", background: none, buttons: [{ label: "Open my study notes", url: "https://example.com/notes" }, { label: "Pomodoro", url: "https://example.com/timer" }] } },
  forest: { cfg: { theme: "forest", layout: "card", shape: "pill", icon: "leaf", title: "Stay in the flow", background: img(50, 1) }, media: BG.mountains },
  ocean: { cfg: { theme: "ocean", layout: "center", icon: "lock", title: "Deep work in progress", message: "Absolute Mode is protecting this session.", background: none } },
  sunset: { cfg: { theme: "sunset", layout: "split", icon: "flame", title: "Not now.", message: "Finish what you started.", background: img(20) }, media: BG.waves },
  mono: { cfg: { theme: "mono", layout: "card", shape: "sharp", font: "mono", icon: "none", title: "BLOCKED", message: "Get back to work.", showQuote: false, background: none } },
};

function findCss(): string {
  const dir = "dist/assets";
  if (!existsSync(dir)) throw new Error("Run `pnpm build` first (the screenshots reuse the extension CSS).");
  const css = readdirSync(dir)
    .filter((f) => f.endsWith(".css") && !f.startsWith("blocked"))
    .map((f) => join(dir, f))
    .sort((a, b) => statSync(b).size - statSync(a).size)[0];
  if (!css) throw new Error("No CSS in dist/assets");
  return css;
}

const FONT = `@font-face{font-family:"Inter";src:url(inter.woff2) format("woff2");font-weight:100 900}`;
const HEAD = (extra = "") =>
  `<!doctype html><html lang="en" class="dark"><head><meta charset="utf-8"><link rel="stylesheet" href="app.css"><style>${FONT}html,body{margin:0;font-family:Inter,system-ui,sans-serif}${extra}</style></head>`;

async function blockHtml(cfg: Partial<BlockPageConfig>, mediaUrl?: string): Promise<string> {
  document.documentElement.removeAttribute("style");
  document.body.removeAttribute("data-layout");
  document.body.innerHTML = '<div id="app"></div>';
  await renderBlockPage(document.getElementById("app") as HTMLElement, sanitizeBlockPage(cfg), {
    t: createT("en"),
    url: "https://distracting-site.example/feed",
    info: { pattern: "distracting-site.example", lockUntil: null, snooze: null, canRedirect: true },
    preview: true,
    ...(mediaUrl ? { mediaUrl } : {}),
  });
  const css = readFileSync("src/blocked/blocked.css", "utf8");
  const style = document.documentElement.getAttribute("style") ?? "";
  return `<!doctype html><html lang="en" style="${style}"><head><meta charset="utf-8"><style>${FONT}${css}body{font-family:Inter,system-ui,sans-serif}body[data-font=serif]{font-family:Georgia,serif}body[data-font=mono]{font-family:ui-monospace,monospace}.panel{animation:none!important}</style></head>${document.body.outerHTML}</html>`;
}

it("builds the store scenes", async () => {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  copyFileSync(findCss(), join(OUT, "app.css"));
  copyFileSync("node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2", join(OUT, "inter.woff2"));

  vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  installChrome();
  const rules = [
    { kind: "path", pattern: "youtube.com/shorts" },
    { kind: "path", pattern: "instagram.com/reels" },
    { kind: "path", pattern: "reddit.com/r/memes" },
    { kind: "path", pattern: "reddit.com/r/programming", mode: "allow", note: "study" },
    { kind: "domain", pattern: "x.com" },
    { kind: "domain", pattern: "tiktok.com", schedule: { days: [1, 2, 3, 4, 5], start: 540, end: 1020 } },
    { kind: "keyword", pattern: "celebrity gossip", scopes: ["url", "title"] },
    { kind: "regex", pattern: "(doomscroll|rage[-_ ]?bait)" },
  ];
  for (const input of rules) await call({ t: "rule.add", input });

  const t = createT("en");
  const mk = (state: AppState): Ctx => ({
    state,
    t,
    locale: "en",
    locked: !!state.lockUntil,
    refresh: async () => undefined,
    run: (async () => undefined) as Ctx["run"],
    toast: () => undefined,
    errorText: (c) => c,
  });
  const normal = (await call({ t: "state" })) as AppState;
  const ui = (node: React.ReactNode, state: AppState) =>
    renderToStaticMarkup(<AegisContext.Provider value={mk(state)}>{node}</AegisContext.Provider>);

  const sizes: Record<string, [number, number]> = {};
  const write = (name: string, html: string, w: number, h: number) => {
    writeFileSync(join(OUT, `${name}.html`), html);
    sizes[name] = [w, h];
  };

  // ---- block pages ---------------------------------------------------------
  for (const [name, g] of Object.entries(GALLERY)) {
    write(`blockpage__${name}`, await blockHtml(g.cfg, g.media), 1280, 800);
  }
  const hero = GALLERY.aegis as (typeof GALLERY)[string];
  write(
    "screenshots__06-your-block-page",
    await blockHtml(
      { ...hero.cfg, title: "Back to what matters", buttons: [{ label: "Open my study notes", url: "https://example.com/notes" }] },
      BG.aurora,
    ),
    1280,
    800,
  );
  writeFileSync(join(OUT, "_preview.html"), await blockHtml({ ...GALLERY.paper?.cfg }));
  writeFileSync(join(OUT, "_block-aegis.html"), await blockHtml(hero.cfg, BG.aurora));

  // ---- popup fragment ------------------------------------------------------
  writeFileSync(
    join(OUT, "_popup.html"),
    `${HEAD("html{background:#0d0d0d}html,body{overflow:hidden}body{width:420px;background:var(--background);color:var(--foreground)}")}<body>${ui(<PopupApp />, normal)}</body></html>`,
  );

  // ---- dashboard pages -----------------------------------------------------
  const realGetUrl = chrome.runtime.getURL;
  (chrome.runtime as { getURL: (p: string) => string }).getURL = (p) =>
    p.startsWith("blocked.html?preview") ? "_preview.html" : realGetUrl(p);
  const dash = (hash: string, state: AppState) => {
    window.location.hash = hash;
    return `${HEAD("body{background:var(--background);color:var(--foreground);overflow:hidden}")}<body><div id="root">${ui(<OptionsApp />, state)}</div></body></html>`;
  };
  write("screenshots__02-dashboard-rules", dash("#rules", normal), 1280, 800);
  write("screenshots__03-quick-packs", dash("#packs", normal), 1280, 800);
  write("screenshots__04-block-page-designer", dash("#blockpage", normal), 1280, 800);
  await call({ t: "lock.enable", hours: 24 });
  const locked = (await call({ t: "state" })) as AppState;
  write("screenshots__05-absolute-mode", dash("#security", locked), 1280, 800);

  // ---- composed scenes -----------------------------------------------------
  const bgCss = `body{background:radial-gradient(1200px 600px at 78% 12%,rgba(217,149,67,.22),transparent 60%),radial-gradient(900px 500px at 5% 95%,rgba(91,75,255,.18),transparent 60%),#0a0c12;color:#f5f7fa;overflow:hidden}
  .logo{width:var(--s,72px);height:var(--s,72px)}h1{margin:0;letter-spacing:-.03em;line-height:1.05}.sub{color:#a9b4c6}
  .chip{display:inline-flex;gap:8px;align-items:center;padding:8px 14px;border-radius:999px;font-size:15px;font-weight:600;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06)}
  .ok{color:#34d399}.no{color:#fb7185}.frame{border-radius:18px;border:1px solid rgba(255,255,255,.14);box-shadow:0 40px 90px -30px rgba(0,0,0,.8);overflow:hidden;background:#0d0d0d}
  iframe{border:0;display:block}`;
  const logo = (s: number) =>
    readFileSync("scripts/assets/icon.svg", "utf8").replace("<svg ", `<svg class="logo" style="--s:${s}px" `);

  write(
    "screenshots__01-block-precisely",
    `${HEAD(bgCss)}<body>
    <div style="position:absolute;left:84px;top:96px;width:560px">
      <div style="display:flex;gap:16px;align-items:center;margin-bottom:34px">${logo(64)}<b style="font-size:26px">Aegis Blocker</b></div>
      <h1 style="font-size:58px">Block the distraction,<br>not the whole internet.</h1>
      <p class="sub" style="font-size:21px;line-height:1.5;margin:26px 0 34px">Block sites, single pages, words and patterns — and always allow the parts you need.</p>
      <div style="display:grid;gap:12px;justify-items:start">
        <span class="chip"><span class="no">✕</span> reddit.com/r/memes</span>
        <span class="chip"><span class="ok">✓</span> reddit.com/r/programming</span>
        <span class="chip"><span class="no">✕</span> youtube.com/shorts</span>
      </div>
    </div>
    <div class="frame" style="position:absolute;right:92px;top:70px;width:420px;transform:scale(1.2);transform-origin:top right"><iframe src="_popup.html" width="420" height="560" scrolling="no"></iframe></div>
  </body></html>`,
    1280,
    800,
  );

  write(
    "promo__small-440x280",
    `${HEAD(bgCss)}<body><div style="position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:24px;align-content:center">
    ${logo(88)}<h1 style="font-size:40px;margin-top:14px">Aegis Blocker</h1><p class="sub" style="font-size:18px;margin:8px 0 0">Focus. Block. Stay private.</p></div></body></html>`,
    440,
    280,
  );

  write(
    "promo__marquee-1400x560",
    `${HEAD(bgCss)}<body>
    <div style="position:absolute;left:80px;top:96px;width:640px">
      <div style="display:flex;gap:16px;align-items:center;margin-bottom:26px">${logo(60)}<b style="font-size:26px">Aegis Blocker</b></div>
      <h1 style="font-size:54px">Your shield against<br>distraction.</h1>
      <p class="sub" style="font-size:21px;line-height:1.5;margin:22px 0 28px">Granular, strict and 100% local. No servers. No tracking.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap"><span class="chip">Sites &amp; pages</span><span class="chip">Words &amp; regex</span><span class="chip">Absolute Mode</span><span class="chip">Custom block page</span></div>
    </div>
    <div class="frame" style="position:absolute;left:760px;top:60px;width:420px;transform:scale(.8);transform-origin:top left"><iframe src="_popup.html" width="420" height="560" scrolling="no"></iframe></div>
    <div class="frame" style="position:absolute;left:1010px;top:250px;width:640px;height:400px"><iframe src="_block-aegis.html" width="1280" height="800" style="transform:scale(.5);transform-origin:top left"></iframe></div>
  </body></html>`,
    1400,
    560,
  );

  writeFileSync(join(OUT, "sizes.json"), JSON.stringify(sizes, null, 2));
}, 120_000);
