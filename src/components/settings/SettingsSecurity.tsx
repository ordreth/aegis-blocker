import { Lock, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { t } from "@/lib/i18n";
import type { AppSettings } from "@/hooks/useSettings";
import { formatDuration } from "@/lib/utils";
import { useSecurity } from "@/hooks";
import { useState } from "react";
import PasswordSetupModal from "../modals/PasswordSetupModal";

interface SettingsSecurityProps {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => void;
}

const SettingsSecurity = ({
  settings,
  updateSetting,
}: SettingsSecurityProps) => {
  const { isSecurityEnabled } = useSecurity(); // Verifica se JÁ tem senha
  const [showSetupModal, setShowSetupModal] = useState(false);

  const handleToggleSecurity = (checked: boolean) => {
    if (checked) {
      setShowSetupModal(true);
    }
  };

  return (
    <Card className="bg-card border-border">
      <PasswordSetupModal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
      />
      <CardHeader>
        <CardTitle>{t("security_config_title")}</CardTitle>
        <CardDescription>{t("security_config_desc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between mb-4 items-end">
            <Label className="flex items-center gap-2 text-base">
              <Clock className="w-4 h-4 text-primary" />
              {t("security_lock_duration")}
            </Label>
            <span className="text-sm font-mono bg-secondary px-2 py-1 rounded text-primary">
              {formatDuration(settings.absoluteModeDurationHours)}
            </span>
          </div>

          <Slider
            min={24}
            max={8760}
            step={24}
            value={[settings.absoluteModeDurationHours]}
            onValueChange={(vals) =>
              updateSetting("absoluteModeDurationHours", vals[0])
            }
            className="cursor-pointer"
          />

          <p className="text-xs text-muted-foreground mt-3">
            {t("security_duration_note")}
          </p>
        </div>

        <Separator className="bg-border" />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base flex items-center gap-2">
              <Lock className="w-3 h-3" /> {t("security_require_password")}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t("security_password_desc")}
            </p>
          </div>

          <Switch
            checked={isSecurityEnabled}
            disabled={isSecurityEnabled}
            onCheckedChange={handleToggleSecurity}
          />
        </div>

        {isSecurityEnabled && (
          <p className="text-xs text-amber-500 mt-2 text-right">
            To disable password protection, use "Reset Vault" on the lock
            screen.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default SettingsSecurity;
