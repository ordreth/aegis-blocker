import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { defaultScopes, parseAs, parseInput } from "@/shared/patterns";
import { minutesToTime, timeToMinutes } from "@/shared/schedule";
import type { MessageKey } from "@/i18n";
import type { Rule, RuleKind, RuleMode, RuleScope, Schedule } from "@/shared/types";
import { Field, Segmented } from "./primitives";
import { useAegis } from "./store";

const KINDS: RuleKind[] = ["domain", "path", "keyword", "regex"];

export function RuleDialog({
  open,
  onOpenChange,
  rule,
  initialPattern = "",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: Rule | null;
  initialPattern?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {/* Mounted only while open, so the form state starts fresh every time. */}
        <RuleForm rule={rule ?? null} initialPattern={initialPattern} onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  );
}

function RuleForm({
  rule,
  initialPattern,
  onOpenChange,
}: {
  rule: Rule | null;
  initialPattern: string;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, run, errorText } = useAegis();
  const [pattern, setPattern] = useState(rule ? displayPattern(rule) : initialPattern);
  const [kind, setKind] = useState<"auto" | RuleKind>(rule ? rule.kind : "auto");
  const [mode, setMode] = useState<RuleMode>(rule?.mode ?? "block");
  const [scopes, setScopes] = useState<RuleScope[]>(rule?.scopes ?? ["url"]);
  const [scheduled, setScheduled] = useState(!!rule?.schedule);
  const [days, setDays] = useState<number[]>(rule?.schedule?.days ?? [1, 2, 3, 4, 5]);
  const [from, setFrom] = useState(minutesToTime(rule?.schedule?.start ?? 540));
  const [to, setTo] = useState(minutesToTime(rule?.schedule?.end ?? 1020));
  const [note, setNote] = useState(rule?.note ?? "");
  const [busy, setBusy] = useState(false);

  const parsed = useMemo(
    () => (pattern.trim() ? (kind === "auto" ? parseInput(pattern) : parseAs(kind, pattern)) : null),
    [pattern, kind],
  );
  const effectiveKind = parsed?.ok ? parsed.kind : kind === "auto" ? null : kind;
  const textual = effectiveKind === "keyword" || effectiveKind === "regex";
  const error = parsed && !parsed.ok ? errorText(parsed.reason) : null;

  const submit = async () => {
    if (!parsed?.ok) return;
    const start = timeToMinutes(from) ?? 0;
    const end = timeToMinutes(to) ?? 0;
    const schedule: Schedule | null = scheduled && days.length ? { days, start, end } : null;
    const payload = {
      kind: parsed.kind,
      pattern: parsed.pattern,
      mode,
      scopes: textual && scopes.length ? scopes : defaultScopes(parsed.kind),
      schedule,
      note,
    };
    setBusy(true);
    const res = rule
      ? await run({ t: "rule.update", id: rule.id, patch: payload })
      : await run({ t: "rule.add", input: payload });
    setBusy(false);
    if (res) onOpenChange(false);
  };

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  return (
    <>
        <DialogHeader>
          <DialogTitle>{t("rule_edit_title")}</DialogTitle>
          <DialogDescription>{t("allow_note")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <Field label={t("field_pattern")} hint={effectiveKind ? t(`kind_${effectiveKind}_hint` as MessageKey) : undefined}>
            <Input
              autoFocus
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder={t("add_placeholder")}
              spellCheck={false}
              aria-invalid={!!error}
              maxLength={200}
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            {textual && mode === "block" && (
              <p className="text-muted-foreground text-xs leading-relaxed">{t("probe_note")}</p>
            )}
          </Field>

          <Segmented
            label={t("field_pattern")}
            value={kind}
            onChange={setKind}
            options={[
              { value: "auto", label: "Auto" },
              ...KINDS.map((k) => ({ value: k, label: t(`kind_${k}` as MessageKey) })),
            ]}
          />

          <Field label={t("field_mode")} hint={mode === "allow" ? t("mode_allow_hint") : undefined}>
            <Segmented
              value={mode}
              onChange={setMode}
              options={[
                { value: "block", label: t("mode_block") },
                { value: "allow", label: t("mode_allow") },
              ]}
            />
          </Field>

          {textual && (
            <Field label={t("field_scopes")}>
              <div className="flex gap-4">
                {(["url", "title"] as RuleScope[]).map((s) => (
                  <label key={s} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={scopes.includes(s)}
                      onCheckedChange={() => setScopes((l) => (toggle(l, s).length ? toggle(l, s) : l))}
                    />
                    {t(`scope_${s}` as MessageKey)}
                  </label>
                ))}
              </div>
            </Field>
          )}

          <Field label={t("field_schedule")}>
            <div className="flex items-center gap-3">
              <Switch checked={scheduled} onCheckedChange={setScheduled} aria-label={t("schedule_custom")} />
              <span className="text-sm">{scheduled ? t("schedule_custom") : t("schedule_always")}</span>
            </div>
            {scheduled && (
              <div className="grid gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={days.includes(d)}
                      onClick={() => setDays((l) => toggle(l, d))}
                      className={cn(
                        "h-8 min-w-10 rounded-md border px-2 text-xs font-medium transition-colors",
                        days.includes(d)
                          ? "border-primary bg-primary/15 text-primary"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {t(`days_${d}` as MessageKey)}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">{t("time_from")}</span>
                  <Input type="time" value={from} onChange={(e) => setFrom(e.target.value)} className="w-32" />
                  <span className="text-muted-foreground">{t("time_to")}</span>
                  <Input type="time" value={to} onChange={(e) => setTo(e.target.value)} className="w-32" />
                </div>
              </div>
            )}
          </Field>

          <Field label={t("field_note")}>
            <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={submit} disabled={!parsed?.ok || busy || (scheduled && days.length === 0)}>
            {t("save")}
          </Button>
        </DialogFooter>
    </>
  );
}

/** Regex rules are shown as /pattern/ so they round-trip through parseInput. */
export const displayPattern = (r: Pick<Rule, "kind" | "pattern">) =>
  r.kind === "regex" ? `/${r.pattern}/` : r.pattern;
