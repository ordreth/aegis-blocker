import { Lock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { t } from "@/lib/i18n";
import type { AppSettings } from "@/hooks/useSettings";

interface SettingsSecurityProps {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => void;
}

const SettingsSecurity = () => {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>{t("security_config_title")}</CardTitle>
        <CardDescription>{t("security_config_desc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="opacity-50 pointer-events-none">
          <div className="flex justify-between mb-2">
            <Label>{t("security_lock_duration")}</Label>
            <span className="text-sm font-mono">24 Hours</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary w-[10%]" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {t("security_duration_note")}
          </p>
        </div>

        <Separator className="bg-border" />

        <div className="flex items-center justify-between opacity-50 pointer-events-none">
          <div className="space-y-0.5">
            <Label className="text-base flex items-center gap-2">
              <Lock className="w-3 h-3" /> {t("security_require_password")}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t("security_password_desc")}
            </p>
          </div>
          <Switch disabled checked={false} />
        </div>
      </CardContent>
    </Card>
  );
};
export default SettingsSecurity;
