import { ExternalLink, ShieldCheck, TriangleAlert } from "lucide-react";
import pkg from "../../package.json" with { type: "json" };
import { Logo } from "./Logo";
import { Section } from "./primitives";
import { useAegis } from "./store";

export function AboutPanel() {
  const { t } = useAegis();
  return (
    <div className="grid gap-5">
      <Section>
        <div className="flex items-center gap-4">
          <Logo size={56} />
          <div>
            <h2 className="text-lg font-semibold">{t("app_name")}</h2>
            <p className="text-muted-foreground text-sm">{t("tagline")} · {t("about_version", { v: pkg.version })}</p>
            <a
              className="text-primary mt-1 inline-flex items-center gap-1 text-sm underline-offset-4 hover:underline"
              href="https://github.com/ordreth/aegis-blocker"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("about_source")} <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </Section>
      <Section title={<span className="flex items-center gap-2"><ShieldCheck className="text-primary size-4" />{t("about_privacy_title")}</span>} desc={t("about_privacy")}>
        {null}
      </Section>
      <Section title={<span className="flex items-center gap-2"><TriangleAlert className="size-4 text-amber-500" />{t("about_limits_title")}</span>} desc={t("about_limits")}>
        {null}
      </Section>
    </div>
  );
}
