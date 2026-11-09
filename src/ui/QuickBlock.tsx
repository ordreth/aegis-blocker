import { ShieldBan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentSite } from "./hooks";
import { useAegis } from "./store";

export function QuickBlock() {
  const { t, run, state, locked } = useAegis();
  const site = useCurrentSite();
  if (!site) return null;
  const rules = state?.rules ?? [];
  const covered = rules.some((r) => r.mode === "block" && r.kind === "domain" && r.pattern === site.host);
  if (covered) return null;

  return (
    <div className="border-primary/30 bg-primary/10 grid gap-2 rounded-xl border p-3">
      <p className="text-muted-foreground text-xs">{t("quick_block_desc")}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          className="max-w-full"
          onClick={() => void run({ t: "rule.add", input: { kind: "domain", pattern: site.host } })}
        >
          <ShieldBan /> <span className="truncate">{t("quick_block", { site: site.host })}</span>
        </Button>
        {site.path && (
          <Button
            size="sm"
            variant="outline"
            title={site.path}
            onClick={() => void run({ t: "rule.add", input: { kind: "path", pattern: site.path as string } })}
          >
            {t("quick_page")}
          </Button>
        )}
      </div>
      {locked && <p className="text-muted-foreground text-[11px]">{t("lock_active")}</p>}
    </div>
  );
}
