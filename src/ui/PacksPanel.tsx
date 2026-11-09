import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PACKS } from "@/shared/packs";
import type { MessageKey } from "@/i18n";
import { Section } from "./primitives";
import { useAegis } from "./store";

export function PacksPanel() {
  const { t, run, toast } = useAegis();
  return (
    <Section title={t("packs_title")} desc={t("packs_desc")}>
      <ul className="grid gap-3 sm:grid-cols-2">
        {PACKS.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">{t(`pack_${p.id}` as MessageKey)}</p>
              <p className="text-muted-foreground truncate text-xs" title={p.rules.map((r) => r.pattern).join(", ")}>
                {t("sites", { n: p.rules.length })} · {p.rules.slice(0, 3).map((r) => r.pattern).join(", ")}…
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                const res = await run({ t: "rule.addMany", inputs: p.rules });
                if (res) toast(t("pack_added", { n: res.added }));
              }}
            >
              <Plus /> {t("pack_add")}
            </Button>
          </li>
        ))}
      </ul>
    </Section>
  );
}
