import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { t } from "@/lib/i18n";
import type { AppSettings } from "@/hooks/useSettings";

interface SettingsAppearanceProps {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => void;
}

const SettingsAppearance = ({
  settings,
  updateSetting,
}: SettingsAppearanceProps) => {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>{t("appearance_interface_title")}</CardTitle>
        <CardDescription>{t("appearance_interface_desc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>{t("setting_theme")}</Label>
          <Select
            value={settings.theme}
            onValueChange={(val: "system" | "dark" | "light") =>
              updateSetting("theme", val)
            }
          >
            <SelectTrigger className="w-50 bg-background border-input">
              <SelectValue placeholder={t("setting_theme_placeholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">{t("theme_system")}</SelectItem>
              <SelectItem value="dark">{t("theme_dark")}</SelectItem>
              <SelectItem value="light">{t("theme_light")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator className="bg-border" />

        <div className="space-y-2">
          <Label>{t("setting_language")}</Label>
          <Select
            value={settings.language}
            onValueChange={(
              val: "system" | "pt" | "en" | "es" | "de" | "zh_CN",
            ) => updateSetting("language", val)}
          >
            <SelectTrigger className="w-50 bg-background border-input">
              <SelectValue placeholder={t("setting_language_placeholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">{t("theme_system")}</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="pt">Português</SelectItem>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="de">Deutsch</SelectItem>
              <SelectItem value="zh_CN">中文 (Simplified)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-2">
            {t("setting_language_note")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
export default SettingsAppearance;
