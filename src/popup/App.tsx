import { useState } from "react";
import { ExternalLink, Lock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthGate } from "@/ui/AuthGate";
import { LockBanner } from "@/ui/LockBanner";
import { LockDialog } from "@/ui/LockDialog";
import { Logo } from "@/ui/Logo";
import { QuickBlock } from "@/ui/QuickBlock";
import { RulesPanel } from "@/ui/RulesPanel";
import { useAegis } from "@/ui/store";

export function PopupApp() {
  const { state, t, run, locked } = useAegis();
  const [lockOpen, setLockOpen] = useState(false);

  if (!state) return <div className="h-[420px]" aria-busy="true" aria-label={t("loading")} />;
  if (state.auth.enabled && !state.auth.unlocked) return <AuthGate />;

  return (
    <main className="flex max-h-[600px] min-h-[420px] flex-col">
      <header className="flex items-center gap-2.5 border-b px-4 py-3">
        <Logo size={26} />
        <div className="min-w-0 flex-1">
          <h1 className="text-sm leading-tight font-semibold">{t("app_name")}</h1>
          <p className="text-muted-foreground truncate text-[11px]">{t("tagline")}</p>
        </div>
        {!locked && (
          <Button variant="ghost" size="icon-sm" title={t("lock_enable")} aria-label={t("lock_enable")} onClick={() => setLockOpen(true)}>
            <Lock />
          </Button>
        )}
        {state.auth.enabled && (
          <Button variant="ghost" size="icon-sm" title={t("lock_vault")} aria-label={t("lock_vault")} onClick={() => void run({ t: "auth.logout" })}>
            <LogOut />
          </Button>
        )}
        <Button variant="ghost" size="icon-sm" title={t("open_dashboard")} aria-label={t("open_dashboard")} onClick={() => void chrome.runtime.openOptionsPage()}>
          <ExternalLink />
        </Button>
      </header>
      <div className="custom-scrollbar grid flex-1 content-start gap-4 overflow-y-auto p-4">
        <LockBanner />
        <QuickBlock />
        <RulesPanel compact />
      </div>
      <LockDialog open={lockOpen} onOpenChange={setLockOpen} />
    </main>
  );
}
