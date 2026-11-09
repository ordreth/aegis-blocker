import { useState, type FormEvent } from "react";
import { KeyRound, Lock, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDuration } from "@/i18n";
import { Badge, Field, Section } from "./primitives";
import { LockDialog } from "./LockDialog";
import { RecoveryCodeDialog } from "./RecoveryCodeDialog";
import { useAegis, useNow } from "./store";

function AbsoluteModeCard() {
  const { t, state, locked } = useAegis();
  const [open, setOpen] = useState(false);
  const now = useNow(30_000);
  return (
    <Section title={t("lock_title")} desc={t("lock_desc")}>
      {locked && state?.lockUntil ? (
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="brand" className="text-xs">
            <Lock className="size-3" /> {t("lock_active")} · {t("lock_left", { time: formatDuration(state.lockUntil - now, t) })}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            {t("lock_extend")}
          </Button>
        </div>
      ) : (
        <div>
          <Button onClick={() => setOpen(true)}>
            <Lock /> {t("lock_enable")}
          </Button>
        </div>
      )}
      <p className="text-muted-foreground text-xs leading-relaxed">{t("lock_note")}</p>
      <LockDialog open={open} onOpenChange={setOpen} />
    </Section>
  );
}

function PasswordCard() {
  const { t, state, run, locked, toast } = useAegis();
  const enabled = !!state?.auth.enabled;
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [current, setCurrent] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [mismatch, setMismatch] = useState(false);

  const setup = async (e: FormEvent) => {
    e.preventDefault();
    if (pw !== confirm) return setMismatch(true);
    setMismatch(false);
    const res = await run({ t: "auth.setup", password: pw });
    if (res) setCode(res.recoveryCode);
    setPw("");
    setConfirm("");
  };

  const change = async (e: FormEvent) => {
    e.preventDefault();
    if (pw !== confirm) return setMismatch(true);
    setMismatch(false);
    if (await run({ t: "auth.change", current, next: pw })) toast(t("password_changed"));
    setPw("");
    setConfirm("");
    setCurrent("");
  };

  return (
    <Section
      title={enabled ? t("password_on") : t("password_off")}
      desc={enabled ? undefined : t("password_off_desc")}
    >
      <form onSubmit={enabled ? change : setup} className="grid max-w-sm gap-3">
        {enabled && (
          <Field label={t("current_password")}>
            <Input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          </Field>
        )}
        <Field label={t("new_password")} hint={t("err_weak_password")}>
          <Input type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
        </Field>
        <Field label={t("confirm_password")}>
          <Input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-invalid={mismatch} />
          {mismatch && <p className="text-xs text-red-400">{t("passwords_mismatch")}</p>}
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={pw.length < 8 || !confirm || (enabled && !current)}>
            <KeyRound /> {enabled ? t("change_password") : t("set_password")}
          </Button>
        </div>
      </form>

      {enabled && (
        <div className="flex flex-wrap gap-2 border-t pt-4">
          <Button variant="outline" size="sm" onClick={() => void run({ t: "auth.logout" })}>
            <LogOut /> {t("lock_vault")}
          </Button>
          <DisablePassword disabled={locked} />
        </div>
      )}
      <RecoveryCodeDialog code={code} onClose={() => setCode(null)} />
    </Section>
  );
}

function DisablePassword({ disabled }: { disabled: boolean }) {
  const { t, run } = useAegis();
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  if (!open)
    return (
      <Button variant="ghost" size="sm" disabled={disabled} onClick={() => setOpen(true)}>
        {t("disable_password")}
      </Button>
    );
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (await run({ t: "auth.disable", password: pw })) setOpen(false);
        setPw("");
      }}
    >
      <Input type="password" autoComplete="current-password" className="w-48" placeholder={t("password")} value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
      <Button type="submit" size="sm" variant="destructive" disabled={!pw}>
        <ShieldCheck /> {t("disable_password")}
      </Button>
    </form>
  );
}

export function SecurityPanel() {
  return (
    <div className="grid gap-5">
      <AbsoluteModeCard />
      <PasswordCard />
    </div>
  );
}
