import { useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "./Logo";
import { Field } from "./primitives";
import { RecoveryCodeDialog } from "./RecoveryCodeDialog";
import { useAegis, useNow } from "./store";

export function AuthGate() {
  const { t, run, state } = useAegis();
  const [mode, setMode] = useState<"login" | "recover">("login");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [newCode, setNewCode] = useState<string | null>(null);
  const now = useNow();
  const retryAt = state?.auth.retryAt ?? null;
  const wait = retryAt && retryAt > now ? Math.ceil((retryAt - now) / 1000) : 0;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!value || busy) return;
    setBusy(true);
    if (mode === "login") {
      const res = await run({ t: "auth.login", password: value });
      if (res?.recoveryCode) setNewCode(res.recoveryCode);
    } else {
      await run({ t: "auth.recover", code: value });
    }
    setValue("");
    setBusy(false);
  };

  return (
    <main className="bg-background flex min-h-full items-center justify-center p-6">
      <form onSubmit={submit} className="grid w-full max-w-xs gap-5 text-center">
        <Logo size={56} className="mx-auto" />
        <div className="grid gap-1">
          <h1 className="text-xl font-semibold">
            {mode === "login" ? t("vault_title") : t("recovery_title")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {mode === "login" ? t("vault_desc") : t("recovery_desc")}
          </p>
        </div>
        <Field label={mode === "login" ? t("password") : t("recovery_code")} className="text-left">
          <Input
            autoFocus
            type={mode === "login" ? "password" : "text"}
            autoComplete={mode === "login" ? "current-password" : "off"}
            spellCheck={false}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={256}
          />
        </Field>
        {wait > 0 && <p className="text-sm text-amber-500">{t("throttled", { s: wait })}</p>}
        <Button type="submit" disabled={!value || busy || wait > 0}>
          <KeyRound /> {mode === "login" ? t("unlock") : t("recovery_use")}
        </Button>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
          onClick={() => {
            setValue("");
            setMode(mode === "login" ? "recover" : "login");
          }}
        >
          {mode === "login" ? t("forgot") : t("back")}
        </button>
      </form>
      <RecoveryCodeDialog code={newCode} upgrade onClose={() => setNewCode(null)} />
    </main>
  );
}
