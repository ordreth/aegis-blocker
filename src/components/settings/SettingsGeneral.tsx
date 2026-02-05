import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { AppSettings } from "@/hooks/use-settings";
import { t } from "@/lib/i18n";

interface SettingsGeneralProps {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => void;
}

const SettingsGeneral = ({ settings, updateSetting }: SettingsGeneralProps) => {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>{t("general_behavior_title")}</CardTitle>
        <CardDescription>{t("general_behavior_desc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">{t("setting_double_check")}</Label>
            <p className="text-sm text-muted-foreground">
              {t("setting_double_check_desc")}
            </p>
          </div>
          <Switch
            checked={settings.doubleCheckDelete}
            onCheckedChange={(val) => updateSetting("doubleCheckDelete", val)}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default SettingsGeneral;
