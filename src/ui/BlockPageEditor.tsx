import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { MessageKey } from "@/i18n";
import { deleteMedia, putMedia, validateMedia } from "@/shared/media";
import {
  DEFAULT_BLOCK_PAGE,
  MAX_BUTTONS,
  sanitizeBlockPage,
  THEME_COLORS,
} from "@/shared/schema";
import type { BlockPageConfig, BlockTheme } from "@/shared/types";
import { Field, Section, Segmented, ToggleRow } from "./primitives";
import { useAegis } from "./store";

const THEMES = Object.keys(THEME_COLORS) as Exclude<BlockTheme, "custom">[];

function Preview({ config }: { config: BlockPageConfig }) {
  const { t, state } = useAegis();
  const frame = useRef<HTMLIFrameElement>(null);
  const ready = useRef(false);
  const language = state?.settings.language ?? "system";

  const send = () =>
    frame.current?.contentWindow?.postMessage({ type: "aegis-preview", config, language }, location.origin);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin === location.origin && e.source === frame.current?.contentWindow && (e.data as { type?: string })?.type === "aegis-preview-ready") {
        ready.current = true;
        send();
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, language]);

  useEffect(() => {
    if (ready.current) send();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, language]);

  return (
    <div className="grid gap-2">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{t("bp_preview")}</p>
      <iframe
        ref={frame}
        title={t("bp_preview")}
        src={chrome.runtime.getURL("blocked.html?preview=1")}
        className="aspect-16/10 w-full rounded-xl border"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="size-8 cursor-pointer rounded border bg-transparent p-0.5"
      />
      {label}
    </label>
  );
}

export function BlockPageEditor() {
  const { t, state, run, toast, errorText } = useAegis();
  const saved = state?.blockPage ?? DEFAULT_BLOCK_PAGE;
  const [draft, setDraft] = useState<BlockPageConfig>(saved);
  const [quotesText, setQuotesText] = useState(saved.quotes.join("\n"));
  const staleMedia = useRef<string[]>([]);
  const touched = useRef(false);

  useEffect(() => {
    if (touched.current || !state) return;
    setDraft(state.blockPage);
    setQuotesText(state.blockPage.quotes.join("\n"));
  }, [state]);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);
  const update = (patch: Partial<BlockPageConfig>) => {
    touched.current = true;
    setDraft((d) => ({ ...d, ...patch }));
  };

  const pickTheme = (theme: BlockTheme) =>
    update(theme === "custom" ? { theme } : { theme, colors: { ...THEME_COLORS[theme] } });
  const setColor = (k: keyof BlockPageConfig["colors"], v: string) =>
    update({ theme: "custom", colors: { ...draft.colors, [k]: v } });

  const chooseFile = async (file: File | undefined) => {
    if (!file) return;
    const kind = validateMedia(file);
    if (!kind) return toast(errorText("bad_media"), "error");
    const id = crypto.randomUUID();
    try {
      await putMedia(id, file);
    } catch {
      return toast(errorText("bad_media"), "error");
    }
    if (draft.background.mediaId) staleMedia.current.push(draft.background.mediaId);
    update({ background: { ...draft.background, kind, mediaId: id } });
  };

  const removeMedia = () => {
    if (draft.background.mediaId) staleMedia.current.push(draft.background.mediaId);
    update({ background: { ...draft.background, kind: "none", mediaId: null } });
  };

  const save = async () => {
    const config = sanitizeBlockPage({
      ...draft,
      quotes: quotesText.split("\n"),
    });
    const res = await run({ t: "blockpage.set", config }, "bp_saved");
    if (!res) return;
    touched.current = false;
    setDraft(res);
    await Promise.all(staleMedia.current.filter((id) => id !== res.background.mediaId).map((id) => deleteMedia(id).catch(() => undefined)));
    staleMedia.current = [];
  };

  const reset = () => {
    if (draft.background.mediaId) staleMedia.current.push(draft.background.mediaId);
    touched.current = true;
    setDraft({ ...DEFAULT_BLOCK_PAGE });
    setQuotesText("");
  };

  const previewConfig = useMemo(
    () => sanitizeBlockPage({ ...draft, quotes: quotesText.split("\n") }),
    [draft, quotesText],
  );
  const bg = draft.background;

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
      <div className="grid gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground max-w-xl text-sm">{t("bp_desc")}</p>
          <div className="flex items-center gap-2">
            {dirty && <span className="text-xs text-amber-500">{t("bp_unsaved")}</span>}
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw /> {t("bp_reset")}
            </Button>
            <Button size="sm" onClick={() => void save()} disabled={!dirty && quotesText === saved.quotes.join("\n")}>
              <Save /> {t("save")}
            </Button>
          </div>
        </div>

        <Section title={t("bp_content")}>
          <Field label={t("bp_text_title")}>
            <Input value={draft.title} maxLength={80} placeholder={t("bp_title_ph")} onChange={(e) => update({ title: e.target.value })} />
          </Field>
          <Field label={t("bp_text_message")}>
            <Textarea value={draft.message} maxLength={300} placeholder={t("bp_message_ph")} onChange={(e) => update({ message: e.target.value })} />
          </Field>
          <ToggleRow title={t("bp_show_quote")} control={<Switch checked={draft.showQuote} onCheckedChange={(showQuote) => update({ showQuote })} />} />
          {draft.showQuote && (
            <>
              <Field label={t("bp_quotes")}>
                <Textarea
                  rows={4}
                  value={quotesText}
                  placeholder={t("bp_quotes_ph")}
                  onChange={(e) => {
                    touched.current = true;
                    setQuotesText(e.target.value);
                  }}
                />
              </Field>
              <ToggleRow title={t("bp_rotate")} control={<Switch checked={draft.rotateQuotes} onCheckedChange={(rotateQuotes) => update({ rotateQuotes })} />} />
            </>
          )}
        </Section>

        <Section title={t("bp_look")}>
          <Field label={t("bp_theme")}>
            <div className="flex flex-wrap gap-2">
              {[...THEMES, "custom" as const].map((th) => {
                const c = th === "custom" ? draft.colors : THEME_COLORS[th];
                return (
                  <button
                    key={th}
                    type="button"
                    aria-pressed={draft.theme === th}
                    onClick={() => pickTheme(th)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                      draft.theme === th ? "border-primary ring-primary/40 ring-2" : "hover:bg-accent",
                    )}
                  >
                    <span className="size-4 rounded-full border" style={{ background: `linear-gradient(135deg, ${c.card} 50%, ${c.accent} 50%)` }} />
                    {t(`bp_theme_${th}` as MessageKey)}
                  </button>
                );
              })}
            </div>
          </Field>
          <div className="flex flex-wrap gap-5">
            <ColorInput label={t("bp_color_bg")} value={draft.colors.bg} onChange={(v) => setColor("bg", v)} />
            <ColorInput label={t("bp_color_card")} value={draft.colors.card} onChange={(v) => setColor("card", v)} />
            <ColorInput label={t("bp_color_text")} value={draft.colors.text} onChange={(v) => setColor("text", v)} />
            <ColorInput label={t("bp_color_accent")} value={draft.colors.accent} onChange={(v) => setColor("accent", v)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("bp_layout")}>
              <Segmented value={draft.layout} onChange={(layout) => update({ layout })} options={(["card", "center", "split"] as const).map((v) => ({ value: v, label: t(`bp_layout_${v}` as MessageKey) }))} />
            </Field>
            <Field label={t("bp_shape")}>
              <Segmented value={draft.shape} onChange={(shape) => update({ shape })} options={(["soft", "sharp", "pill"] as const).map((v) => ({ value: v, label: t(`bp_shape_${v}` as MessageKey) }))} />
            </Field>
            <Field label={t("bp_icon")}>
              <Segmented value={draft.icon} onChange={(icon) => update({ icon })} options={(["shield", "lock", "flame", "leaf", "eye", "none"] as const).map((v) => ({ value: v, label: t(`bp_icon_${v}` as MessageKey) }))} />
            </Field>
            <Field label={t("bp_font")}>
              <Segmented value={draft.font} onChange={(font) => update({ font })} options={(["sans", "serif", "mono"] as const).map((v) => ({ value: v, label: t(`bp_font_${v}` as MessageKey) }))} />
            </Field>
          </div>
        </Section>

        <Section title={t("bp_background")} desc={t("bp_media_hint")}>
          <div className="flex flex-wrap items-center gap-3">
            <Segmented
              value={bg.kind === "none" ? "none" : bg.kind}
              onChange={(v) => (v === "none" ? removeMedia() : undefined)}
              options={[
                { value: "none", label: t("bp_bg_none") },
                { value: "image", label: t("bp_bg_image") },
                { value: "video", label: t("bp_bg_video") },
              ]}
            />
            <label className="inline-flex">
              <input
                type="file"
                hidden
                accept="image/png,image/jpeg,image/webp,image/gif,image/avif,video/mp4,video/webm"
                onChange={(e) => {
                  void chooseFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <span className="border-input hover:bg-accent focus-within:ring-ring/50 inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border px-3 text-sm font-medium">
                <ImagePlus className="size-4" /> {t("bp_upload")}
              </span>
            </label>
            {bg.mediaId && (
              <Button variant="ghost" size="sm" onClick={removeMedia}>
                <Trash2 /> {t("bp_remove_media")}
              </Button>
            )}
          </div>
          {bg.mediaId && (
            <div className="grid max-w-sm gap-5">
              <Field label={`${t("bp_overlay")}: ${bg.overlay}%`}>
                <Slider min={0} max={90} value={[bg.overlay]} onValueChange={([v]) => update({ background: { ...bg, overlay: v ?? 0 } })} />
              </Field>
              <Field label={`${t("bp_blur")}: ${bg.blur}px`}>
                <Slider min={0} max={24} value={[bg.blur]} onValueChange={([v]) => update({ background: { ...bg, blur: v ?? 0 } })} />
              </Field>
            </div>
          )}
        </Section>

        <Section title={t("bp_info")}>
          <ToggleRow title={t("bp_show_url")} control={<Switch checked={draft.showUrl} onCheckedChange={(showUrl) => update({ showUrl })} />} />
          <ToggleRow title={t("bp_show_rule")} control={<Switch checked={draft.showRule} onCheckedChange={(showRule) => update({ showRule })} />} />
          <ToggleRow title={t("bp_show_timer")} control={<Switch checked={draft.showLockTimer} onCheckedChange={(showLockTimer) => update({ showLockTimer })} />} />
        </Section>

        <Section title={t("bp_buttons")} desc={t("bp_buttons_desc")}>
          <div className="grid gap-2">
            {draft.buttons.map((b, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  className="w-40"
                  maxLength={40}
                  placeholder={t("bp_button_label")}
                  value={b.label}
                  onChange={(e) => update({ buttons: draft.buttons.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })}
                />
                <Input
                  className="flex-1"
                  type="url"
                  maxLength={500}
                  placeholder={t("bp_button_url")}
                  value={b.url}
                  onChange={(e) => update({ buttons: draft.buttons.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })}
                />
                <Button variant="ghost" size="icon" aria-label={t("delete")} onClick={() => update({ buttons: draft.buttons.filter((_, j) => j !== i) })}>
                  <Trash2 />
                </Button>
              </div>
            ))}
          </div>
          {draft.buttons.length < MAX_BUTTONS && (
            <div>
              <Button variant="outline" size="sm" onClick={() => update({ buttons: [...draft.buttons, { label: "", url: "" }] })}>
                <Plus /> {t("bp_add_button")}
              </Button>
            </div>
          )}
        </Section>

        <Section title={t("bp_redirect")}>
          <ToggleRow
            title={t("bp_redirect_enable")}
            control={<Switch checked={draft.redirect.enabled} onCheckedChange={(enabled) => update({ redirect: { ...draft.redirect, enabled } })} />}
          />
          {draft.redirect.enabled && (
            <div className="grid max-w-md gap-4">
              <Field label={t("bp_redirect_url")}>
                <Input type="url" maxLength={500} placeholder={t("bp_button_url")} value={draft.redirect.url} onChange={(e) => update({ redirect: { ...draft.redirect, url: e.target.value } })} />
              </Field>
              <Field label={`${t("bp_redirect_delay")}: ${draft.redirect.delaySec}`}>
                <Slider min={3} max={120} value={[draft.redirect.delaySec]} onValueChange={([v]) => update({ redirect: { ...draft.redirect, delaySec: v ?? 8 } })} />
              </Field>
            </div>
          )}
        </Section>
      </div>

      <div className="xl:sticky xl:top-6">
        <Preview config={previewConfig} />
      </div>
    </div>
  );
}
