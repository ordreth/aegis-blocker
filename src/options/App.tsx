import { useEffect, useState, type ComponentType } from "react";
import { Info, ListChecks, Lock, Package, Paintbrush, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MessageKey } from "@/i18n";
import { AboutPanel } from "@/ui/AboutPanel";
import { AuthGate } from "@/ui/AuthGate";
import { BlockPageEditor } from "@/ui/BlockPageEditor";
import { LockBanner } from "@/ui/LockBanner";
import { Logo } from "@/ui/Logo";
import { PacksPanel } from "@/ui/PacksPanel";
import { Section } from "@/ui/primitives";
import { RulesPanel } from "@/ui/RulesPanel";
import { SecurityPanel } from "@/ui/SecurityPanel";
import { SettingsPanel } from "@/ui/SettingsPanel";
import { useAegis } from "@/ui/store";

const TABS: { id: string; label: MessageKey; icon: typeof Info; View: ComponentType }[] = [
  { id: "rules", label: "tab_rules", icon: ListChecks, View: () => <Section><RulesPanel /></Section> },
  { id: "packs", label: "tab_packs", icon: Package, View: PacksPanel },
  { id: "blockpage", label: "tab_blockpage", icon: Paintbrush, View: BlockPageEditor },
  { id: "security", label: "tab_security", icon: Lock, View: SecurityPanel },
  { id: "settings", label: "tab_settings", icon: Settings, View: SettingsPanel },
  { id: "about", label: "tab_about", icon: Info, View: AboutPanel },
];

const fromHash = () => TABS.find((x) => x.id === location.hash.slice(1))?.id ?? "rules";

export function OptionsApp() {
  const { state, t } = useAegis();
  const [tab, setTab] = useState(fromHash);

  useEffect(() => {
    const on = () => setTab(fromHash());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);

  if (!state) return <div aria-busy="true" className="min-h-screen" />;
  if (state.auth.enabled && !state.auth.unlocked) return <div className="min-h-screen"><AuthGate /></div>;

  const active = TABS.find((x) => x.id === tab) ?? TABS[0];
  if (!active) return null;

  return (
    <div className="mx-auto grid min-h-screen max-w-6xl gap-8 px-5 py-8 md:grid-cols-[14rem_minmax(0,1fr)]">
      <aside className="grid content-start gap-6 md:sticky md:top-8 md:self-start">
        <div className="flex items-center gap-3">
          <Logo size={36} />
          <div>
            <h1 className="font-semibold">{t("app_name")}</h1>
            <p className="text-muted-foreground text-xs">{t("tagline")}</p>
          </div>
        </div>
        <nav aria-label={t("app_name")} className="flex gap-1 overflow-x-auto md:grid">
          {TABS.map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href={`#${id}`}
              aria-current={id === active.id ? "page" : undefined}
              className={cn(
                "focus-visible:ring-ring/50 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap outline-none focus-visible:ring-[3px]",
                id === active.id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              <Icon className="size-4" /> {t(label)}
            </a>
          ))}
        </nav>
      </aside>
      <main className="grid min-w-0 content-start gap-5">
        <LockBanner />
        <h2 className="text-2xl font-semibold tracking-tight">{t(active.label)}</h2>
        <active.View />
      </main>
    </div>
  );
}
