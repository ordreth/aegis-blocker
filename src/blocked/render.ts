import type { MessageKey, TFunction } from "@/i18n";
import { formatDuration } from "@/i18n";
import { isHttpUrl } from "@/shared/patterns";
import { getMedia } from "@/shared/media";
import type { BlockedInfo } from "@/shared/messages";
import type { BlockPageConfig } from "@/shared/types";

export interface RenderContext {
  t: TFunction;
  /** Address that was blocked (already validated as http/https). */
  url: string | null;
  info: BlockedInfo | null;
  preview: boolean;
  onSnooze?: () => Promise<boolean>;
  onLeave?: (url: string) => void;
}

const SVG = "http://www.w3.org/2000/svg";
const ICONS: Record<Exclude<BlockPageConfig["icon"], "none">, string[]> = {
  shield: ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10", "M12 8v4", "M12 16h.01"],
  lock: ["M7 11V7a5 5 0 0 1 10 0v4", "M5 11h14v10H5z", "M12 15v2"],
  flame: ["M8.500 14.500A2.500 2.500 0 0 0 11 12c0-1.400-.5-2-1-3-1.070-2.140-.22-4.050 2-6 .5 2.500 2 4.900 4 6.500 2 1.600 3 3.500 3 5.500a7 7 0 1 1-14 0c0-1.150.43-2.290 1-3a2.500 2.500 0 0 0 2.500 2.500z"],
  leaf: ["M11 20A7 7 0 0 1 9.800 6.100C15.500 5 17 4.480 19 2c1 2 2 4.180 2 8 0 5.500-4.780 10-10 10Z", "M2 21c0-3 1.850-5.360 5.080-6C9.500 14.520 12 13 13 12"],
  eye: ["M2 12s3.500-7 10-7 10 7 10 7-3.500 7-10 7S2 12 2 12z", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"],
};

const el = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls?: string,
  text?: string,
): HTMLElementTagNameMap[K] => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};

function icon(name: keyof typeof ICONS): HTMLElement {
  const badge = el("div", "badge");
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.8");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  for (const d of ICONS[name]) {
    const p = document.createElementNS(SVG, "path");
    p.setAttribute("d", d);
    svg.append(p);
  }
  badge.append(svg);
  return badge;
}

const pickQuote = (cfg: BlockPageConfig, t: TFunction): string => {
  const pool = cfg.quotes.length
    ? cfg.quotes
    : (["bk_q1", "bk_q2", "bk_q3", "bk_q4", "bk_q5"] as MessageKey[]).map((k) => t(k));
  const i = cfg.rotateQuotes ? Math.floor(Math.random() * pool.length) : 0;
  return pool[i] ?? "";
};

/** Renders the block page into `root`. Only textContent is used for user text. Returns a cleanup. */
export async function renderBlockPage(
  root: HTMLElement,
  cfg: BlockPageConfig,
  ctx: RenderContext,
): Promise<() => void> {
  const { t } = ctx;
  const cleanups: (() => void)[] = [];
  root.replaceChildren();

  const body = document.body;
  body.dataset.layout = cfg.layout;
  body.dataset.shape = cfg.shape;
  body.dataset.font = cfg.font;
  const s = document.documentElement.style;
  s.setProperty("--bg", cfg.colors.bg);
  s.setProperty("--card", cfg.colors.card);
  s.setProperty("--text", cfg.colors.text);
  s.setProperty("--accent", cfg.colors.accent);

  const stage = el("div", "stage");

  // background media
  const bg = cfg.background;
  if (bg.kind !== "none" && bg.mediaId) {
    try {
      const blob = await getMedia(bg.mediaId);
      if (blob) {
        const url = URL.createObjectURL(blob);
        cleanups.push(() => URL.revokeObjectURL(url));
        const media = bg.kind === "video" ? el("video", "media") : el("img", "media");
        if (media instanceof HTMLVideoElement) {
          Object.assign(media, { src: url, autoplay: true, muted: true, loop: true, playsInline: true });
          media.setAttribute("aria-hidden", "true");
        } else if (media instanceof HTMLImageElement) {
          Object.assign(media, { src: url, alt: "" });
        }
        if (bg.blur) media.style.filter = `blur(${bg.blur}px)`;
        if (bg.blur) media.style.transform = "scale(1.08)";
        const scrim = el("div", "scrim");
        scrim.style.opacity = String(bg.overlay / 100);
        stage.append(media, scrim);
      }
    } catch {
      /* media missing: fall back to plain background */
    }
  }
  if (cfg.layout === "split" && !stage.querySelector(".media")) {
    const fill = el("div", "media");
    fill.style.background = `radial-gradient(circle at 30% 20%, color-mix(in srgb, var(--accent) 35%, var(--bg)), var(--bg) 70%)`;
    stage.append(fill);
  }

  const panel = el("main", "panel");
  if (cfg.icon !== "none") panel.append(icon(cfg.icon));
  panel.append(el("h1", undefined, cfg.title || t("bk_title")));
  panel.append(el("p", "message", cfg.message || t("bk_message")));

  if (cfg.showQuote) {
    const q = pickQuote(cfg, t);
    if (q) panel.append(el("p", "quote", `“${q}”`));
  }

  const meta = el("div", "meta");
  if (cfg.showUrl && ctx.url) {
    const chip = el("span", "chip", ctx.url.replace(/^https?:\/\//, "").slice(0, 80));
    chip.title = t("bk_blocked");
    meta.append(chip);
  }
  if (cfg.showRule && ctx.info?.pattern) meta.append(el("span", "chip", `${t("bk_rule")}: ${ctx.info.pattern}`));
  const lockUntil = ctx.info?.lockUntil ?? null;
  if (cfg.showLockTimer && lockUntil && lockUntil > Date.now()) {
    const chip = el("span", "chip accent");
    const tick = () => (chip.textContent = t("bk_locked_until", { time: formatDuration(lockUntil - Date.now(), t) }));
    tick();
    const id = setInterval(tick, 30_000);
    cleanups.push(() => clearInterval(id));
    meta.append(chip);
  }
  if (meta.childElementCount) panel.append(meta);

  const buttons = el("div", "buttons");
  for (const b of cfg.buttons) {
    if (!isHttpUrl(b.url)) continue;
    const a = el("a", "btn", b.label);
    a.href = b.url;
    a.rel = "noopener noreferrer";
    buttons.append(a);
  }

  const status = el("p", "status");
  status.setAttribute("aria-live", "polite");

  // temptation delay
  const snooze = ctx.info?.snooze;
  if (snooze && !ctx.preview && ctx.url && ctx.onSnooze) {
    const btn = el("button", "btn ghost");
    btn.type = "button";
    btn.disabled = true;
    let left = snooze.waitSeconds;
    const paint = () => {
      btn.textContent = left > 0 ? t("bk_snooze_wait", { n: left }) : t("bk_snooze", { n: snooze.minutes });
      btn.disabled = left > 0;
    };
    paint();
    const id = setInterval(() => {
      left -= 1;
      paint();
      if (left <= 0) clearInterval(id);
    }, 1000);
    cleanups.push(() => clearInterval(id));
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      if (await ctx.onSnooze?.()) ctx.onLeave?.(ctx.url as string);
      else paint();
    });
    buttons.append(btn);
  }

  // automatic redirect
  if (cfg.redirect.enabled && isHttpUrl(cfg.redirect.url)) {
    let left = cfg.redirect.delaySec;
    const stay = el("button", "btn ghost", t("bk_stay"));
    stay.type = "button";
    const paint = () => (status.textContent = t("bk_redirecting", { n: left }));
    paint();
    const id = setInterval(() => {
      left -= 1;
      if (left <= 0) {
        clearInterval(id);
        if (!ctx.preview) ctx.onLeave?.(cfg.redirect.url);
      } else paint();
    }, 1000);
    cleanups.push(() => clearInterval(id));
    stay.addEventListener("click", () => {
      clearInterval(id);
      status.textContent = "";
      stay.remove();
    });
    buttons.append(stay);
  }

  if (buttons.childElementCount) panel.append(buttons);
  panel.append(status);
  stage.append(panel);
  root.append(stage);

  return () => cleanups.forEach((fn) => fn());
}
