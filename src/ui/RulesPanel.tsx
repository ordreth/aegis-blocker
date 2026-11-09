import { useMemo, useRef, useState, type FormEvent } from "react";
import {
  Code2,
  Download,
  FileText,
  Globe,
  Lock,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Type,
  Upload,
  Clock,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { parseInput } from "@/shared/patterns";
import { minutesToTime } from "@/shared/schedule";
import type { MessageKey } from "@/i18n";
import type { Rule, RuleKind, RuleMode } from "@/shared/types";
import { Badge, Segmented } from "./primitives";
import { displayPattern, RuleDialog } from "./RuleDialog";
import { useAegis } from "./store";

const KIND_ICON: Record<RuleKind, typeof Globe> = {
  domain: Globe,
  path: FileText,
  keyword: Type,
  regex: Code2,
};

function AddRule({ onAdvanced }: { onAdvanced: (pattern: string) => void }) {
  const { t, run, errorText } = useAegis();
  const [value, setValue] = useState("");
  const [mode, setMode] = useState<RuleMode>("block");
  const [error, setError] = useState<string | null>(null);

  const parsed = useMemo(() => (value.trim() ? parseInput(value) : null), [value]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!parsed) return;
    if (!parsed.ok) return setError(errorText(parsed.reason));
    setError(null);
    const res = await run({
      t: "rule.add",
      input: { kind: parsed.kind, pattern: parsed.pattern, mode },
    });
    if (res) setValue("");
  };

  return (
    <form onSubmit={submit} className="grid gap-2" noValidate>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            placeholder={t("add_placeholder")}
            aria-label={t("add_placeholder")}
            aria-invalid={!!error}
            spellCheck={false}
            autoComplete="off"
            maxLength={200}
          />
        </div>
        <Button type="submit" disabled={!parsed?.ok}>
          <Plus /> {t("add")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          title={t("rule_edit_title")}
          aria-label={t("rule_edit_title")}
          onClick={() => onAdvanced(value)}
        >
          <SlidersHorizontal />
        </Button>
      </div>
      <div className="flex min-h-6 flex-wrap items-center justify-between gap-2 text-xs">
        <span className={cn("text-muted-foreground", error && "text-red-400")}>
          {error ??
            (parsed?.ok
              ? `${t("detected")} ${t(`kind_${parsed.kind}` as MessageKey)} — ${t(`kind_${parsed.kind}_hint` as MessageKey)}`
              : " ")}
        </span>
        <Segmented
          className="p-0.5"
          value={mode}
          onChange={setMode}
          options={[
            { value: "block", label: t("mode_block") },
            { value: "allow", label: t("mode_allow"), title: t("mode_allow_hint") },
          ]}
        />
      </div>
    </form>
  );
}

function scheduleLabel(r: Rule, t: ReturnType<typeof useAegis>["t"]) {
  const s = r.schedule;
  if (!s) return null;
  const days = s.days.length === 7 ? "" : `${s.days.map((d) => t(`days_${d}` as MessageKey)).join(" ")} `;
  return `${days}${minutesToTime(s.start)}–${minutesToTime(s.end)}`;
}

function RuleRow({ rule, onEdit, onDelete }: { rule: Rule; onEdit: () => void; onDelete: () => void }) {
  const { t, run, locked } = useAegis();
  const Icon = KIND_ICON[rule.kind];
  const sched = scheduleLabel(rule, t);
  return (
    <li
      className={cn(
        "group flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors",
        !rule.enabled && "opacity-60",
      )}
    >
      <Icon className="text-muted-foreground size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-mono text-sm" title={displayPattern(rule)}>
            {displayPattern(rule)}
          </span>
          {rule.mode === "allow" && (
            <Badge tone="ok">
              <ShieldCheck className="size-3" /> {t("mode_allow")}
            </Badge>
          )}
          {!rule.enabled && <Badge>{t("rule_paused")}</Badge>}
        </div>
        {(sched || rule.note || (rule.scopes.includes("title") && rule.kind !== "domain" && rule.kind !== "path")) && (
          <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-3 text-xs">
            {sched && (
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" /> {sched}
              </span>
            )}
            {(rule.kind === "keyword" || rule.kind === "regex") && rule.scopes.includes("title") && (
              <span>{rule.scopes.length > 1 ? `${t("scope_url")} + ${t("scope_title")}` : t("scope_title")}</span>
            )}
            {rule.note && <span className="truncate">{rule.note}</span>}
          </div>
        )}
      </div>
      <Switch
        size="sm"
        checked={rule.enabled}
        disabled={locked}
        aria-label={rule.pattern}
        onCheckedChange={(enabled) => void run({ t: "rule.update", id: rule.id, patch: { enabled } })}
      />
      {locked ? (
        <Lock className="text-muted-foreground size-4" aria-label={t("lock_active")} />
      ) : (
        <div className="flex items-center">
          <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label={t("edit")}>
            <Pencil />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onDelete} aria-label={`${t("delete")} ${rule.pattern}`}>
            <Trash2 />
          </Button>
        </div>
      )}
    </li>
  );
}

export function RulesPanel({ compact = false }: { compact?: boolean }) {
  const { t, run, state, toast, errorText, locked } = useAegis();
  const stateRules = state?.rules;
  const rules = useMemo(() => stateRules ?? [], [stateRules]);
  const [filter, setFilter] = useState<"all" | RuleMode>("all");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Rule | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogPattern, setDialogPattern] = useState("");
  const [deleting, setDeleting] = useState<Rule | null>(null);
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const file = useRef<HTMLInputElement>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rules.filter(
      (r) => (filter === "all" || r.mode === filter) && (!q || r.pattern.toLowerCase().includes(q) || r.note.toLowerCase().includes(q)),
    );
  }, [rules, filter, query]);

  const openDialog = (rule: Rule | null, pattern = "") => {
    setEditing(rule);
    setDialogPattern(pattern);
    setDialogOpen(true);
  };

  const requestDelete = (r: Rule) => {
    if (state?.settings.confirmDelete) setDeleting(r);
    else void run({ t: "rule.remove", id: r.id });
  };

  const doExport = async () => {
    const json = await run({ t: "rules.export" });
    if (!json) return;
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "aegis-rules.json" });
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const doImport = async (f: File | undefined) => {
    if (!f) return;
    if (f.size > 1_000_000) return toast(errorText("bad_import"), "error");
    const res = await run({ t: "rules.import", json: await f.text(), mode: importMode });
    if (res) toast(t("import_result", res));
    if (file.current) file.current.value = "";
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
      <AddRule onAdvanced={(p) => openDialog(null, p)} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">
          {t("rules_title")} <span className="text-muted-foreground font-normal">· {t("rules_count", { n: rules.length })}</span>
        </h2>
        <div className="flex items-center gap-1">
          {!compact && !locked && (
            <Segmented
              className="mr-1 p-0.5"
              value={importMode}
              onChange={setImportMode}
              options={[
                { value: "merge", label: t("import_merge") },
                { value: "replace", label: t("import_replace") },
              ]}
            />
          )}
          <input
            ref={file}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => void doImport(e.target.files?.[0])}
          />
          <Button variant="ghost" size="sm" onClick={() => file.current?.click()}>
            <Upload /> {!compact && t("import")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void doExport()} disabled={!rules.length}>
            <Download /> {!compact && t("export")}
          </Button>
        </div>
      </div>

      {rules.length > 5 || filter !== "all" || query ? (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-40 flex-1">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search")} className="pl-8" />
          </div>
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: t("rules_filter_all") },
              { value: "block", label: t("rules_filter_block") },
              { value: "allow", label: t("rules_filter_allow") },
            ]}
          />
        </div>
      ) : null}

      {rules.length === 0 ? (
        <div className="text-muted-foreground grid place-items-center gap-1 rounded-xl border border-dashed px-6 py-10 text-center">
          <ShieldCheck className="text-primary/70 mb-1 size-8" />
          <p className="text-foreground text-sm font-medium">{t("rules_empty_title")}</p>
          <p className="max-w-xs text-xs leading-relaxed">{t("rules_empty_desc")}</p>
        </div>
      ) : visible.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-sm">{t("rules_no_results")}</p>
      ) : (
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-2">
          {visible.map((r) => (
            <RuleRow key={r.id} rule={r} onEdit={() => openDialog(r)} onDelete={() => requestDelete(r)} />
          ))}
        </ul>
      )}

      <RuleDialog open={dialogOpen} onOpenChange={setDialogOpen} rule={editing} initialPattern={dialogPattern} />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete_title")}</AlertDialogTitle>
            <AlertDialogDescription>
              <code className="text-foreground">{deleting && displayPattern(deleting)}</code> — {t("delete_desc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) void run({ t: "rule.remove", id: deleting.id });
                setDeleting(null);
              }}
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
